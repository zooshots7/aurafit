from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)
from reportlab.graphics.shapes import Drawing, Circle, Rect, String
from reportlab.graphics import renderPDF

from app.models.schemas import StyleProfile, OutfitRecommendation


# --- Color Palette ---
BRAND_GOLD = colors.HexColor("#755b00")
BRAND_SAGE = colors.HexColor("#49663c")
BRAND_WARM_GRAY = colors.HexColor("#645d58")
BRAND_BG = colors.HexColor("#fcf9f8")
DARK_TEXT = colors.HexColor("#1c1b1b")
LIGHT_TEXT = colors.HexColor("#6f6c6a")
DIVIDER = colors.HexColor("#e5e2e1")


def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        "BrandTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        textColor=BRAND_GOLD,
        alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "BrandSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        textColor=LIGHT_TEXT,
        alignment=TA_CENTER,
        spaceAfter=24,
    ))
    styles.add(ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        textColor=BRAND_GOLD,
        spaceBefore=20,
        spaceAfter=10,
        borderWidth=0,
        borderPadding=0,
    ))
    styles.add(ParagraphStyle(
        "SubHeader",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=DARK_TEXT,
        spaceBefore=12,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=DARK_TEXT,
        leading=14,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "TipText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=LIGHT_TEXT,
        leading=13,
        leftIndent=12,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "SmallLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=LIGHT_TEXT,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        textColor=LIGHT_TEXT,
        alignment=TA_CENTER,
    ))
    return styles


def _color_swatch_drawing(hex_color: str, label: str, size: float = 28) -> Drawing:
    """Create a small color swatch circle with label."""
    d = Drawing(size + 60, size + 4)
    d.add(Circle(size / 2, size / 2 + 2, size / 2, fillColor=colors.HexColor(hex_color), strokeColor=colors.HexColor("#dddddd"), strokeWidth=0.5))
    d.add(String(size + 6, size / 2 - 2, label, fontName="Helvetica", fontSize=7, fillColor=LIGHT_TEXT))
    return d


def _divider():
    return HRFlowable(width="100%", thickness=0.5, color=DIVIDER, spaceAfter=10, spaceBefore=10)


def _header_footer(canvas, doc):
    """Add page header/footer to every page."""
    canvas.saveState()
    # Footer
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(LIGHT_TEXT)
    canvas.drawCentredString(A4[0] / 2, 20 * mm, f"AuraFit Style Report  |  Generated {datetime.now(timezone.utc).strftime('%B %d, %Y')}  |  Confidential")
    canvas.drawRightString(A4[0] - 20 * mm, 20 * mm, f"Page {doc.page}")
    # Top line
    canvas.setStrokeColor(BRAND_GOLD)
    canvas.setLineWidth(2)
    canvas.line(20 * mm, A4[1] - 15 * mm, A4[0] - 20 * mm, A4[1] - 15 * mm)
    canvas.restoreState()


def generate_report(
    profile: StyleProfile,
    recommendations: dict[str, list[OutfitRecommendation]],
) -> bytes:
    """Generate a branded PDF styling report and return as bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=25 * mm,
        bottomMargin=30 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = _build_styles()
    story = []

    # === COVER / TITLE ===
    story.append(Spacer(1, 40))
    story.append(Paragraph("AuraFit", styles["BrandTitle"]))
    story.append(Paragraph("Your Personal Style Report", styles["BrandSubtitle"]))
    story.append(Spacer(1, 12))
    story.append(_divider())
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        f"Prepared for a <b>{profile.gender.value.title()}</b> profile  •  "
        f"Confidence: <b>{int((profile.confidence_score or 0.85) * 100)}%</b>",
        styles["BodyText"],
    ))
    story.append(Spacer(1, 30))

    # === SECTION 1: ANALYSIS OVERVIEW ===
    story.append(Paragraph("1. Your Style Profile", styles["SectionHeader"]))
    story.append(_divider())

    # Skin tone
    story.append(Paragraph("Skin Tone", styles["SubHeader"]))
    skin_data = [
        ["Fitzpatrick Scale", f"Type {profile.skin_tone.fitzpatrick}"],
        ["Undertone", profile.skin_tone.undertone.title()],
        ["Description", profile.skin_tone.label],
        ["Hex Approximation", profile.skin_tone.hex_color],
    ]
    skin_table = Table(skin_data, colWidths=[140, 300])
    skin_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), LIGHT_TEXT),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK_TEXT),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, DIVIDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(skin_table)
    story.append(Spacer(1, 12))

    # Body type
    story.append(Paragraph("Body Architecture", styles["SubHeader"]))
    body_data = [
        ["Shape", profile.body_type.shape.replace("-", " ").title()],
        ["Build", profile.body_type.build.title()],
        ["Height Category", profile.body_type.height_category.title()],
    ]
    if profile.proportions:
        if profile.proportions.shoulder_hip_ratio:
            body_data.append(["Shoulder-Hip Ratio", profile.proportions.shoulder_hip_ratio.replace("-", " ").title()])
        if profile.proportions.torso_leg_ratio:
            body_data.append(["Torso-Leg Ratio", profile.proportions.torso_leg_ratio.replace("-", " ").title()])

    body_table = Table(body_data, colWidths=[140, 300])
    body_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), LIGHT_TEXT),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK_TEXT),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, DIVIDER),
    ]))
    story.append(body_table)
    story.append(Spacer(1, 12))

    # Face shape & color season
    if profile.face_shape or profile.color_season:
        story.append(Paragraph("Additional Analysis", styles["SubHeader"]))
        extra_data = []
        if profile.face_shape:
            face_val = profile.face_shape.value if hasattr(profile.face_shape, 'value') else profile.face_shape
            extra_data.append(["Face Shape", face_val.title()])
        if profile.color_season:
            season_val = profile.color_season.value if hasattr(profile.color_season, 'value') else profile.color_season
            extra_data.append(["Color Season", season_val.replace("_", " ").title()])
        if profile.eye_color:
            extra_data.append(["Eye Color", profile.eye_color.title()])

        extra_table = Table(extra_data, colWidths=[140, 300])
        extra_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), LIGHT_TEXT),
            ("TEXTCOLOR", (1, 0), (1, -1), DARK_TEXT),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -2), 0.3, DIVIDER),
        ]))
        story.append(extra_table)
        story.append(Spacer(1, 12))

    # === SECTION 2: COLOR PALETTE ===
    story.append(Paragraph("2. Your Color Palette", styles["SectionHeader"]))
    story.append(_divider())

    for color in profile.color_palette:
        reason_text = f" — {color.reason}" if color.reason else ""
        cat_label = f"[{color.category.upper()}]" if color.category else ""
        story.append(Paragraph(
            f"<b>{color.name}</b> ({color.hex}) {cat_label}{reason_text}",
            styles["BodyText"],
        ))
    story.append(Spacer(1, 12))

    # === SECTION 3: STYLE VIBES ===
    story.append(Paragraph("3. Your Style Identity", styles["SectionHeader"]))
    story.append(_divider())
    vibes_text = "  •  ".join(profile.style_vibes)
    story.append(Paragraph(vibes_text, styles["BodyText"]))
    story.append(Spacer(1, 12))

    # === SECTION 4: WARDROBE INTELLIGENCE ===
    story.append(Paragraph("4. Wardrobe Intelligence", styles["SectionHeader"]))
    story.append(_divider())

    for i, tip in enumerate(profile.wardrobe_tips, 1):
        story.append(Paragraph(f"{i}. {tip}", styles["TipText"]))
    story.append(Spacer(1, 8))

    # === SECTION 5: RECOMMENDATIONS ===
    story.append(PageBreak())
    story.append(Paragraph("5. Curated Recommendations", styles["SectionHeader"]))
    story.append(_divider())

    category_labels = {
        "western": "Western Wear",
        "indian": "Indian Wear",
        "fusion": "Fusion Wear",
        "accessories": "Accessories",
        "footwear": "Footwear",
        "grooming": "Grooming",
        "general": "General",
    }

    for cat_key, recs in recommendations.items():
        if not recs:
            continue

        cat_label = category_labels.get(cat_key, cat_key.title())
        story.append(Paragraph(cat_label, styles["SubHeader"]))
        story.append(Spacer(1, 4))

        for rec in recs:
            # Outfit name and description
            source_label = {"rule": "Expert Rule", "ai": "AI Styled", "hybrid": "Hybrid"}.get(
                rec.source.value if hasattr(rec.source, 'value') else str(rec.source), "AI"
            )
            story.append(Paragraph(
                f"<b>{rec.name}</b>  <font size=7 color='#755b00'>[{source_label}]</font>",
                styles["BodyText"],
            ))
            story.append(Paragraph(rec.description, styles["TipText"]))
            story.append(Paragraph(f"<i>Why it works: {rec.why_it_works}</i>", styles["TipText"]))

            # Items table
            if rec.items:
                item_data = [["Item", "Brand", "Price"]]
                for item in rec.items:
                    item_data.append([item.name, item.brand, f"${item.price_usd:.0f}"])

                item_table = Table(item_data, colWidths=[240, 100, 60])
                item_table.setStyle(TableStyle([
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("TEXTCOLOR", (0, 0), (-1, 0), BRAND_GOLD),
                    ("TEXTCOLOR", (0, 1), (-1, -1), DARK_TEXT),
                    ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.5, BRAND_GOLD),
                    ("LINEBELOW", (0, 1), (-1, -2), 0.2, DIVIDER),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#faf5e8")),
                ]))
                story.append(item_table)

                if rec.total_price_usd > 0:
                    story.append(Paragraph(
                        f"<b>Total: ${rec.total_price_usd:.0f}</b>",
                        ParagraphStyle("Total", parent=styles["BodyText"], fontSize=9, alignment=TA_RIGHT),
                    ))

            # Tags
            if rec.style_tags:
                tags_text = "  ".join(f"#{tag}" for tag in rec.style_tags)
                story.append(Paragraph(tags_text, ParagraphStyle(
                    "Tags", parent=styles["TipText"], fontSize=7, textColor=BRAND_SAGE,
                )))

            story.append(Spacer(1, 12))

    # === FOOTER NOTE ===
    story.append(Spacer(1, 30))
    story.append(_divider())
    story.append(Paragraph(
        "This report was generated by AuraFit's AI-powered styling engine. "
        "Recommendations are personalized based on your body shape, proportions, skin tone, "
        "and color analysis. Rule-based recommendations are marked as 'Expert Rule' and are based on "
        "established styling principles. AI-generated recommendations are marked as 'AI Styled'.",
        styles["Footer"],
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "AuraFit celebrates all body types. Our recommendations focus on what flatters and enhances — "
        "never on restriction. Your style, your rules.",
        styles["Footer"],
    ))

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    buffer.seek(0)
    return buffer.read()
