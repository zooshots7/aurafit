from __future__ import annotations

from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import datetime


class Gender(str, Enum):
    men = "men"
    women = "women"
    nonbinary = "nonbinary"


class FaceShape(str, Enum):
    oval = "oval"
    round = "round"
    square = "square"
    heart = "heart"
    oblong = "oblong"
    diamond = "diamond"


class ColorSeason(str, Enum):
    spring_light = "spring_light"
    spring_warm = "spring_warm"
    spring_clear = "spring_clear"
    summer_light = "summer_light"
    summer_cool = "summer_cool"
    summer_soft = "summer_soft"
    autumn_soft = "autumn_soft"
    autumn_warm = "autumn_warm"
    autumn_deep = "autumn_deep"
    winter_deep = "winter_deep"
    winter_cool = "winter_cool"
    winter_clear = "winter_clear"


class RecommendationCategory(str, Enum):
    clothing = "clothing"
    jewellery = "jewellery"
    makeup = "makeup"
    footwear = "footwear"
    accessories = "accessories"
    grooming = "grooming"
    hair = "hair"


class RecommendationSubCategory(str, Enum):
    western = "western"
    indian = "indian"
    fusion = "fusion"
    general = "general"


class RecommendationSource(str, Enum):
    rule = "rule"
    ai = "ai"
    hybrid = "hybrid"


# --- Analysis Models ---

class SkinTone(BaseModel):
    fitzpatrick: str
    undertone: str  # warm, cool, neutral, olive
    label: str
    hex_color: str


class BodyType(BaseModel):
    shape: str  # rectangle, inverted-triangle, triangle, hourglass, oval, pear
    build: str  # slim, athletic, average, broad
    height_category: str  # petite, average, tall


class Proportions(BaseModel):
    shoulder_hip_ratio: Optional[str] = None  # balanced, broad-shoulder, wide-hip
    torso_leg_ratio: Optional[str] = None  # long-torso, balanced, long-legs


class ColorRecommendation(BaseModel):
    name: str
    hex: str
    category: str = "best"  # best, good, avoid
    reason: Optional[str] = None


class StyleProfile(BaseModel):
    job_id: str
    gender: Gender
    skin_tone: SkinTone
    body_type: BodyType
    proportions: Optional[Proportions] = None
    face_shape: Optional[FaceShape] = None
    color_season: Optional[ColorSeason] = None
    eye_color: Optional[str] = None
    style_vibes: list[str]
    color_palette: list[ColorRecommendation]
    wardrobe_tips: list[str]
    confidence_score: float = 0.85


# --- Outfit Models ---

class OutfitItem(BaseModel):
    name: str
    price_usd: float
    buy_url: str
    image_url: str
    brand: str
    category: str


class OutfitRecommendation(BaseModel):
    id: str
    name: str
    description: str
    why_it_works: str
    items: list[OutfitItem]
    total_price_usd: float
    style_tags: list[str]
    image_url: str
    recommendation_category: RecommendationCategory = RecommendationCategory.clothing
    sub_category: RecommendationSubCategory = RecommendationSubCategory.western
    source: RecommendationSource = RecommendationSource.ai
    confidence: float = 0.85


# --- Request/Response Models ---

class SessionCreate(BaseModel):
    gender: Gender = Gender.men
    age_range: Optional[str] = None  # 18-25, 26-35, 36-45, 46-55, 55+
    occasion: Optional[list[str]] = None
    goals: Optional[list[str]] = None
    budget_min: float = 50
    budget_max: float = 300
    style_preferences: list[str] = []
    wear_type: str = "all"  # western, indian, fusion, all


class SessionResponse(BaseModel):
    session_id: str
    status: str
    created_at: Optional[datetime] = None


class AnalysisResponse(BaseModel):
    status: str
    profile: Optional[StyleProfile] = None
    recommendations: Optional[dict[str, list[OutfitRecommendation]]] = None


class RecommendationRequest(BaseModel):
    profile: StyleProfile
    budget_min: float = 50
    budget_max: float = 300
    style_preferences: list[str] = []
    wear_type: str = "all"
    occasion: Optional[list[str]] = None
    goals: Optional[list[str]] = None


class AnalyzeRequest(BaseModel):
    gender: Gender
    budget_min: float = 50
    budget_max: float = 300
    style_preferences: list[str] = []
