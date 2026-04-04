from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.db import (
    SessionModel,
    PhotoModel,
    AnalysisResultModel,
    RecommendationModel,
    ColorPaletteModel,
)
from app.models.schemas import (
    Gender,
    SessionCreate,
    SessionResponse,
    AnalysisResponse,
    RecommendationCategory,
)
from app.services.analyzer import analyze_photos
from app.services.recommender import get_recommendations
from app.services.rule_engine import rule_engine
from app.database import is_db_available

router = APIRouter()

UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory fallback when DB is unavailable (mock mode)
_memory_store: dict[str, dict] = {}


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "mock_mode": settings.mock_mode,
        "rule_categories": rule_engine.get_all_categories(),
    }


@router.post("/analyze")
async def analyze(
    photos: list[UploadFile] = File(...),
    gender: str = Form("men"),
    budget_min: float = Form(50),
    budget_max: float = Form(300),
    style_preferences: str = Form(""),
    wear_type: str = Form("all"),
    occasion: str = Form(""),
    goals: str = Form(""),
    age_range: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
    if len(photos) < 1:
        raise HTTPException(status_code=400, detail="Upload at least 1 photo")
    if len(photos) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 photos allowed")

    # Parse form data
    try:
        gender_enum = Gender(gender.lower())
    except ValueError:
        gender_enum = Gender.men

    prefs = [s.strip() for s in style_preferences.split(",") if s.strip()]
    occasion_list = [s.strip() for s in occasion.split(",") if s.strip()] if occasion else []
    goals_list = [s.strip() for s in goals.split(",") if s.strip()] if goals else []

    session_id = uuid.uuid4()

    # Save uploaded files
    saved_paths: list[str] = []
    job_dir = UPLOAD_DIR / str(session_id)
    job_dir.mkdir(exist_ok=True)

    for photo in photos:
        file_path = job_dir / photo.filename
        content = await photo.read()
        file_path.write_bytes(content)
        saved_paths.append(str(file_path))

    # Run analysis
    profile = await analyze_photos(saved_paths, str(session_id), gender_enum)

    # Generate recommendations
    recs_by_category = await get_recommendations(
        profile, budget_min, budget_max, prefs, wear_type, occasion_list, goals_list
    )
    serialized_profile = profile.model_dump(mode="json")
    serialized_recs = {
        cat_key: [r.model_dump(mode="json") for r in recs]
        for cat_key, recs in recs_by_category.items()
    }

    if db is not None and is_db_available():
        # Persist to database
        db_session = SessionModel(
            id=session_id, gender=gender_enum.value, age_range=age_range or None,
            occasion=occasion_list or None, goals=goals_list or None,
            budget_min=budget_min, budget_max=budget_max,
            style_preferences=prefs or None, wear_type=wear_type, status="complete",
        )
        db.add(db_session)

        for p in saved_paths:
            db.add(PhotoModel(session_id=session_id, file_path=p))

        db.add(AnalysisResultModel(
            session_id=session_id,
            body_shape=profile.body_type.shape, body_build=profile.body_type.build,
            height_category=profile.body_type.height_category,
            shoulder_hip_ratio=profile.proportions.shoulder_hip_ratio if profile.proportions else None,
            torso_leg_ratio=profile.proportions.torso_leg_ratio if profile.proportions else None,
            skin_fitzpatrick=profile.skin_tone.fitzpatrick, skin_undertone=profile.skin_tone.undertone,
            skin_label=profile.skin_tone.label, skin_hex=profile.skin_tone.hex_color,
            face_shape=profile.face_shape.value if profile.face_shape else None,
            eye_color=profile.eye_color,
            color_season=profile.color_season.value if profile.color_season else None,
            style_vibes=profile.style_vibes, wardrobe_tips=profile.wardrobe_tips,
            confidence_score=profile.confidence_score,
        ))

        for color in profile.color_palette:
            db.add(ColorPaletteModel(
                session_id=session_id, color_name=color.name,
                hex_value=color.hex, category=color.category, reason=color.reason,
            ))

        for cat_key, recs in recs_by_category.items():
            for rec in recs:
                db.add(RecommendationModel(
                    session_id=session_id,
                    category=rec.recommendation_category.value,
                    sub_category=rec.sub_category.value if hasattr(rec.sub_category, 'value') else rec.sub_category,
                    title=rec.name, description=rec.description, why_it_works=rec.why_it_works,
                    items=[item.model_dump() for item in rec.items],
                    style_tags=rec.style_tags, image_url=rec.image_url,
                    total_price_usd=rec.total_price_usd,
                    source=rec.source.value if hasattr(rec.source, 'value') else rec.source,
                    confidence=rec.confidence,
                ))

        await db.commit()
    else:
        # In-memory fallback (no DB)
        _memory_store[str(session_id)] = {
            "status": "complete",
            "profile": serialized_profile,
            "recommendations": serialized_recs,
        }

    return {
        "job_id": str(session_id),
        "status": "complete",
        "profile": serialized_profile,
        "recommendations": serialized_recs,
    }


@router.get("/profile/{job_id}")
async def get_profile(job_id: str, db: AsyncSession = Depends(get_db)):
    # Check in-memory store first (no-DB fallback)
    if job_id in _memory_store:
        return _memory_store[job_id]

    if db is None or not is_db_available():
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        session_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    # Fetch session
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_uuid))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "complete":
        return {"status": "processing"}

    # Fetch analysis
    result = await db.execute(
        select(AnalysisResultModel).where(AnalysisResultModel.session_id == session_uuid)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        return {"status": "processing"}

    # Fetch colors
    result = await db.execute(
        select(ColorPaletteModel).where(ColorPaletteModel.session_id == session_uuid)
    )
    colors = result.scalars().all()

    # Build profile response
    from app.models.schemas import (
        StyleProfile, SkinTone, BodyType, Proportions,
        ColorRecommendation, FaceShape, ColorSeason,
    )

    face_shape = None
    if analysis.face_shape:
        try:
            face_shape = FaceShape(analysis.face_shape)
        except ValueError:
            pass

    color_season = None
    if analysis.color_season:
        try:
            color_season = ColorSeason(analysis.color_season)
        except ValueError:
            pass

    profile = StyleProfile(
        job_id=job_id,
        gender=Gender(session.gender),
        skin_tone=SkinTone(
            fitzpatrick=analysis.skin_fitzpatrick,
            undertone=analysis.skin_undertone,
            label=analysis.skin_label,
            hex_color=analysis.skin_hex,
        ),
        body_type=BodyType(
            shape=analysis.body_shape,
            build=analysis.body_build,
            height_category=analysis.height_category,
        ),
        proportions=Proportions(
            shoulder_hip_ratio=analysis.shoulder_hip_ratio,
            torso_leg_ratio=analysis.torso_leg_ratio,
        ),
        face_shape=face_shape,
        color_season=color_season,
        eye_color=analysis.eye_color,
        style_vibes=analysis.style_vibes or [],
        color_palette=[
            ColorRecommendation(
                name=c.color_name,
                hex=c.hex_value,
                category=c.category,
                reason=c.reason,
            )
            for c in colors
        ],
        wardrobe_tips=analysis.wardrobe_tips or [],
        confidence_score=analysis.confidence_score,
    )

    # Fetch recommendations
    result = await db.execute(
        select(RecommendationModel).where(RecommendationModel.session_id == session_uuid)
    )
    recs = result.scalars().all()

    from app.models.schemas import OutfitRecommendation, OutfitItem

    recommendations: dict[str, list] = {}
    for rec in recs:
        items = []
        if rec.items:
            for item_data in rec.items:
                items.append(OutfitItem(**item_data))

        outfit_rec = OutfitRecommendation(
            id=str(rec.id),
            name=rec.title,
            description=rec.description,
            why_it_works=rec.why_it_works,
            items=items,
            total_price_usd=rec.total_price_usd or 0,
            style_tags=rec.style_tags or [],
            image_url=rec.image_url or "",
            recommendation_category=rec.category,
            sub_category=rec.sub_category,
            source=rec.source,
            confidence=rec.confidence,
        )

        if rec.sub_category not in recommendations:
            recommendations[rec.sub_category] = []
        recommendations[rec.sub_category].append(outfit_rec.model_dump())

    return {
        "status": "complete",
        "profile": profile.model_dump(),
        "recommendations": recommendations,
    }


@router.get("/report/{job_id}")
async def get_report(job_id: str, db: AsyncSession = Depends(get_db)):
    """Generate and return a PDF style report for a completed session."""
    try:
        session_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    # Fetch session
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_uuid))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "complete":
        raise HTTPException(status_code=400, detail="Analysis not yet complete")

    # Fetch analysis
    result = await db.execute(
        select(AnalysisResultModel).where(AnalysisResultModel.session_id == session_uuid)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=400, detail="Analysis not yet complete")

    # Fetch colors
    result = await db.execute(
        select(ColorPaletteModel).where(ColorPaletteModel.session_id == session_uuid)
    )
    db_colors = result.scalars().all()

    # Build profile
    from app.models.schemas import (
        StyleProfile, SkinTone, BodyType, Proportions,
        ColorRecommendation, FaceShape, ColorSeason,
        OutfitRecommendation, OutfitItem,
    )

    face_shape = None
    if analysis.face_shape:
        try:
            face_shape = FaceShape(analysis.face_shape)
        except ValueError:
            pass

    color_season = None
    if analysis.color_season:
        try:
            color_season = ColorSeason(analysis.color_season)
        except ValueError:
            pass

    profile = StyleProfile(
        job_id=job_id,
        gender=Gender(session.gender),
        skin_tone=SkinTone(
            fitzpatrick=analysis.skin_fitzpatrick,
            undertone=analysis.skin_undertone,
            label=analysis.skin_label,
            hex_color=analysis.skin_hex,
        ),
        body_type=BodyType(
            shape=analysis.body_shape,
            build=analysis.body_build,
            height_category=analysis.height_category,
        ),
        proportions=Proportions(
            shoulder_hip_ratio=analysis.shoulder_hip_ratio,
            torso_leg_ratio=analysis.torso_leg_ratio,
        ),
        face_shape=face_shape,
        color_season=color_season,
        eye_color=analysis.eye_color,
        style_vibes=analysis.style_vibes or [],
        color_palette=[
            ColorRecommendation(
                name=c.color_name,
                hex=c.hex_value,
                category=c.category,
                reason=c.reason,
            )
            for c in db_colors
        ],
        wardrobe_tips=analysis.wardrobe_tips or [],
        confidence_score=analysis.confidence_score,
    )

    # Fetch recommendations
    result = await db.execute(
        select(RecommendationModel).where(RecommendationModel.session_id == session_uuid)
    )
    recs = result.scalars().all()

    recommendations: dict[str, list[OutfitRecommendation]] = {}
    for rec in recs:
        items = []
        if rec.items:
            for item_data in rec.items:
                items.append(OutfitItem(**item_data))

        outfit_rec = OutfitRecommendation(
            id=str(rec.id),
            name=rec.title,
            description=rec.description,
            why_it_works=rec.why_it_works,
            items=items,
            total_price_usd=rec.total_price_usd or 0,
            style_tags=rec.style_tags or [],
            image_url=rec.image_url or "",
            recommendation_category=rec.category,
            sub_category=rec.sub_category,
            source=rec.source,
            confidence=rec.confidence,
        )

        if rec.sub_category not in recommendations:
            recommendations[rec.sub_category] = []
        recommendations[rec.sub_category].append(outfit_rec)

    # Generate PDF
    from app.services.report_generator import generate_report
    pdf_bytes = generate_report(profile, recommendations)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=aurafit-style-report-{job_id[:8]}.pdf"},
    )


@router.get("/rules/categories")
async def get_rule_categories():
    return {"categories": rule_engine.get_all_categories()}
