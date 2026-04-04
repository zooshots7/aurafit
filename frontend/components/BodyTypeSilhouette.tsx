"use client";

interface BodyTypeSilhouetteProps {
  shape: string;
  build: string;
}

function SilhouetteSVG({ shape }: { shape: string }) {
  const normalized = shape.toLowerCase().replace(/[\s_-]+/g, "-");

  const common = {
    stroke: "#1A1A1A",
    strokeWidth: 1.5,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  // Head + neck are shared across all shapes
  const head = (
    <>
      <ellipse cx="50" cy="16" rx="10" ry="12" {...common} />
      <line x1="50" y1="28" x2="50" y2="34" {...common} />
    </>
  );

  const silhouettes: Record<string, React.ReactNode> = {
    rectangle: (
      <>
        {head}
        {/* Shoulders */}
        <line x1="32" y1="34" x2="68" y2="34" {...common} />
        {/* Torso - straight sides */}
        <line x1="32" y1="34" x2="33" y2="70" {...common} />
        <line x1="68" y1="34" x2="67" y2="70" {...common} />
        {/* Waist line */}
        <line x1="33" y1="70" x2="67" y2="70" {...common} />
        {/* Hips - same width */}
        <line x1="33" y1="70" x2="33" y2="78" {...common} />
        <line x1="67" y1="70" x2="67" y2="78" {...common} />
        {/* Legs */}
        <line x1="33" y1="78" x2="36" y2="110" {...common} />
        <line x1="67" y1="78" x2="64" y2="110" {...common} />
        <line x1="45" y1="78" x2="44" y2="110" {...common} />
        <line x1="55" y1="78" x2="56" y2="110" {...common} />
      </>
    ),
    "inverted-triangle": (
      <>
        {head}
        {/* Wide shoulders */}
        <line x1="26" y1="34" x2="74" y2="34" {...common} />
        {/* Torso - tapers inward */}
        <line x1="26" y1="34" x2="37" y2="70" {...common} />
        <line x1="74" y1="34" x2="63" y2="70" {...common} />
        {/* Waist */}
        <line x1="37" y1="70" x2="63" y2="70" {...common} />
        {/* Narrower hips */}
        <line x1="37" y1="70" x2="36" y2="78" {...common} />
        <line x1="63" y1="70" x2="64" y2="78" {...common} />
        {/* Legs */}
        <line x1="36" y1="78" x2="38" y2="110" {...common} />
        <line x1="64" y1="78" x2="62" y2="110" {...common} />
        <line x1="46" y1="78" x2="45" y2="110" {...common} />
        <line x1="54" y1="78" x2="55" y2="110" {...common} />
      </>
    ),
    triangle: (
      <>
        {head}
        {/* Narrow shoulders */}
        <line x1="36" y1="34" x2="64" y2="34" {...common} />
        {/* Torso - widens */}
        <line x1="36" y1="34" x2="30" y2="70" {...common} />
        <line x1="64" y1="34" x2="70" y2="70" {...common} />
        {/* Waist */}
        <line x1="30" y1="70" x2="70" y2="70" {...common} />
        {/* Wide hips */}
        <line x1="30" y1="70" x2="28" y2="78" {...common} />
        <line x1="70" y1="70" x2="72" y2="78" {...common} />
        {/* Legs */}
        <line x1="28" y1="78" x2="36" y2="110" {...common} />
        <line x1="72" y1="78" x2="64" y2="110" {...common} />
        <line x1="43" y1="78" x2="44" y2="110" {...common} />
        <line x1="57" y1="78" x2="56" y2="110" {...common} />
      </>
    ),
    hourglass: (
      <>
        {head}
        {/* Shoulders */}
        <line x1="30" y1="34" x2="70" y2="34" {...common} />
        {/* Torso - curves in at waist */}
        <path d="M30,34 Q32,52 40,64 Q42,68 38,70" {...common} />
        <path d="M70,34 Q68,52 60,64 Q58,68 62,70" {...common} />
        {/* Waist */}
        <line x1="38" y1="70" x2="62" y2="70" {...common} />
        {/* Hips flare out */}
        <path d="M38,70 Q32,74 30,78" {...common} />
        <path d="M62,70 Q68,74 70,78" {...common} />
        {/* Legs */}
        <line x1="30" y1="78" x2="36" y2="110" {...common} />
        <line x1="70" y1="78" x2="64" y2="110" {...common} />
        <line x1="44" y1="78" x2="44" y2="110" {...common} />
        <line x1="56" y1="78" x2="56" y2="110" {...common} />
      </>
    ),
    oval: (
      <>
        {head}
        {/* Shoulders */}
        <line x1="33" y1="34" x2="67" y2="34" {...common} />
        {/* Torso - rounded/wider at midsection */}
        <path d="M33,34 Q26,50 28,64 Q29,70 34,74" {...common} />
        <path d="M67,34 Q74,50 72,64 Q71,70 66,74" {...common} />
        {/* Waist/hip area */}
        <line x1="34" y1="74" x2="66" y2="74" {...common} />
        {/* Lower body */}
        <line x1="34" y1="74" x2="34" y2="80" {...common} />
        <line x1="66" y1="74" x2="66" y2="80" {...common} />
        {/* Legs */}
        <line x1="34" y1="80" x2="38" y2="110" {...common} />
        <line x1="66" y1="80" x2="62" y2="110" {...common} />
        <line x1="45" y1="80" x2="45" y2="110" {...common} />
        <line x1="55" y1="80" x2="55" y2="110" {...common} />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 100 120" className="w-24 h-auto" aria-label={`${shape} body type silhouette`}>
      {silhouettes[normalized] || silhouettes["rectangle"]}
    </svg>
  );
}

export default function BodyTypeSilhouette({ shape, build }: BodyTypeSilhouetteProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <SilhouetteSVG shape={shape} />
      <span className="inline-block bg-cream-dark text-charcoal text-xs font-body font-medium rounded-full px-3 py-1 capitalize">
        {shape} {build ? `\u00b7 ${build}` : ""}
      </span>
    </div>
  );
}
