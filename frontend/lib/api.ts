import axios from "axios";

const defaultBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "/api");

const api = axios.create({
  baseURL: defaultBaseURL,
});

// --- Analysis Models ---

export interface SkinTone {
  fitzpatrick: string;
  undertone: string;
  label: string;
  hex_color: string;
}

export interface BodyType {
  shape: string;
  build: string;
  height_category: string;
}

export interface Proportions {
  shoulder_hip_ratio?: string;
  torso_leg_ratio?: string;
}

export interface ColorRecommendation {
  name: string;
  hex: string;
  category?: string;
  reason?: string;
}

export interface StyleProfile {
  job_id: string;
  gender: string;
  skin_tone: SkinTone;
  body_type: BodyType;
  proportions?: Proportions;
  face_shape?: string;
  color_season?: string;
  eye_color?: string;
  style_vibes: string[];
  color_palette: ColorRecommendation[];
  wardrobe_tips: string[];
  confidence_score?: number;
}

// --- Outfit Models ---

export interface OutfitItem {
  name: string;
  price_usd: number;
  buy_url: string;
  image_url: string;
  brand: string;
  category: string;
}

export interface OutfitRecommendation {
  id: string;
  name: string;
  description: string;
  why_it_works: string;
  items: OutfitItem[];
  total_price_usd: number;
  style_tags: string[];
  image_url: string;
  recommendation_category?: string;
  sub_category?: string;
  source?: string;
  confidence?: number;
}

export interface AnalysisResultPayload {
  job_id: string;
  status: string;
  profile?: StyleProfile;
  recommendations?: Record<string, OutfitRecommendation[]>;
}

// --- API Functions ---

export async function analyzePhotos(
  photos: File[],
  gender: string,
  budgetMin: number,
  budgetMax: number,
  stylePreferences: string[],
  wearType: string = "all",
  occasion: string[] = [],
  goals: string[] = [],
  ageRange: string = ""
): Promise<AnalysisResultPayload> {
  const formData = new FormData();
  photos.forEach((photo) => formData.append("photos", photo));
  formData.append("gender", gender);
  formData.append("budget_min", budgetMin.toString());
  formData.append("budget_max", budgetMax.toString());
  formData.append("style_preferences", stylePreferences.join(","));
  formData.append("wear_type", wearType);
  formData.append("occasion", occasion.join(","));
  formData.append("goals", goals.join(","));
  formData.append("age_range", ageRange);

  const { data } = await api.post("/analyze", formData);
  return data;
}

export async function getProfile(jobId: string): Promise<{
  status: string;
  profile?: StyleProfile;
  recommendations?: Record<string, OutfitRecommendation[]>;
}> {
  const { data } = await api.get(`/profile/${jobId}`);
  return data;
}

export default api;
