// ---- Slide ----

export interface Slide {
  sid: string;
  content: string;
  content_hash: string;
  created_at: string;
  updated_at: string;
  has_matching_image: boolean;
  image_count: number;
}

export interface CreateSlideRequest {
  title?: string;
  content: string;
  position?: number;
}

export interface UpdateSlideRequest {
  content: string;
}

export interface ReorderSlidesRequest {
  slide_ids: string[];
}

// ---- Project ----

export interface ProjectSummary {
  slug: string;
  title: string;
  slide_count: number;
  total_cost: number;
}

export interface Style {
  prompt: string;
  image: string;
  image_url?: string;
}

export interface ProjectResponse {
  slug: string;
  title: string;
  style: Style | null;
  slides: Slide[];
}

// ---- Image ----

export interface ImageInfo {
  filename: string;
  content_hash: string;
  url: string;
  is_current: boolean;
  created_at: string;
}

export interface SlideImagesResponse {
  sid: string;
  current_content_hash: string;
  images: ImageInfo[];
}

export interface GenerateImageResponse {
  image: ImageInfo;
  generation_cost: number;
}

// ---- Style ----

export interface StyleCandidate {
  filename: string;
  url: string;
}

export interface GenerateStyleResponse {
  candidates: StyleCandidate[];
  generation_cost: number;
}

export interface StyleDetail {
  prompt: string;
  image: string;
  image_url: string;
}

export interface GetStyleResponse {
  has_style: boolean;
  style: StyleDetail | null;
}

export interface SelectStyleRequest {
  prompt: string;
  selected_image: string;
}

export interface SelectStyleResponse {
  success: boolean;
  style: StyleDetail;
}

// ---- Cost ----

export interface CostResponse {
  slug: string;
  total_cost: number;
  currency: string;
  breakdown: {
    slide_images: number;
    style_images: number;
  };
  image_count: number;
  cost_per_image: number;
}

// ---- Generic API ----

export interface ApiError {
  detail: string;
  status: number;
}
