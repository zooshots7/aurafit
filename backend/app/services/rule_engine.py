from __future__ import annotations

import os
import yaml
from pathlib import Path
from typing import Any, Optional


class RuleEngine:
    """Loads YAML rule files and matches them against analysis profiles.

    Rules use a 'when/then' structure:
        rules:
          - when:
              body_shape: hourglass
              gender: women
            then:
              best: [fitted, A-line, wrap]
              why: "Defines your natural waist"
              alternatives: [belted blazers]
    """

    def __init__(self, rules_dir: str | Path | None = None):
        if rules_dir is None:
            rules_dir = Path(__file__).parent.parent / "rules"
        self.rules_dir = Path(rules_dir)
        self.rules: dict[str, list[dict]] = {}
        self._index: dict[str, dict[str, list[dict]]] = {}
        self._loaded = False

    def load(self):
        """Load all YAML rule files from the rules directory."""
        self.rules.clear()
        self._index.clear()

        if not self.rules_dir.exists():
            self._loaded = True
            return

        for yaml_path in self.rules_dir.rglob("*.yaml"):
            rel_path = yaml_path.relative_to(self.rules_dir)
            category = str(rel_path.with_suffix(""))  # e.g. "body/women_body_shapes"

            try:
                with open(yaml_path, "r") as f:
                    data = yaml.safe_load(f)
            except Exception:
                continue

            if not data or "rules" not in data:
                continue

            file_rules = data["rules"]
            self.rules[category] = file_rules

            # Build index: for each condition key+value, store the rules that match
            for rule in file_rules:
                when = rule.get("when", {})
                for key, value in when.items():
                    if key not in self._index:
                        self._index[key] = {}
                    str_val = str(value).lower()
                    if str_val not in self._index[key]:
                        self._index[key][str_val] = []
                    self._index[key][str_val].append(rule)

        self._loaded = True

    def match(self, conditions: dict[str, str]) -> list[dict]:
        """Find all rules that match the given conditions.

        A rule matches if ALL of its 'when' conditions are satisfied
        by the provided conditions dict.
        """
        if not self._loaded:
            self.load()

        # Normalize condition values
        normalized = {k: str(v).lower() for k, v in conditions.items() if v}

        # Find candidate rules from any matching condition
        candidates = set()
        for key, value in normalized.items():
            if key in self._index and value in self._index[key]:
                for rule in self._index[key][value]:
                    candidates.add(id(rule))

        # Filter: only keep rules where ALL 'when' conditions match
        matched = []
        seen = set()
        for category_rules in self.rules.values():
            for rule in category_rules:
                rule_id = id(rule)
                if rule_id in seen:
                    continue
                seen.add(rule_id)

                if rule_id not in candidates:
                    continue

                when = rule.get("when", {})
                if all(
                    normalized.get(k) == str(v).lower()
                    for k, v in when.items()
                ):
                    matched.append(rule)

        return matched

    def match_by_category(self, conditions: dict[str, str], category_prefix: str) -> list[dict]:
        """Match rules only from files under a specific category path.

        E.g., category_prefix="indian" matches rules from indian/*.yaml
        """
        if not self._loaded:
            self.load()

        normalized = {k: str(v).lower() for k, v in conditions.items() if v}
        matched = []

        for category, rules in self.rules.items():
            if not category.startswith(category_prefix):
                continue

            for rule in rules:
                when = rule.get("when", {})
                if all(
                    normalized.get(k) == str(v).lower()
                    for k, v in when.items()
                ):
                    matched.append(rule)

        return matched

    def get_all_categories(self) -> list[str]:
        """Return all loaded rule category paths."""
        if not self._loaded:
            self.load()
        return list(self.rules.keys())

    def get_rules_for_category(self, category: str) -> list[dict]:
        """Return all rules in a specific category file."""
        if not self._loaded:
            self.load()
        return self.rules.get(category, [])


# Singleton instance
rule_engine = RuleEngine()
