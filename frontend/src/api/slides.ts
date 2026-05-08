import type {
  ProjectResponse,
  ProjectSummary,
  Slide,
  CreateSlideRequest,
  UpdateSlideRequest,
  ReorderSlidesRequest,
} from "@/types";
import { get, post, put, del } from "./index";

export const slidesApi = {
  listProjects(signal?: AbortSignal): Promise<ProjectSummary[]> {
    return get<ProjectSummary[]>("/api/slides/projects", signal);
  },

  getProject(slug: string, signal?: AbortSignal): Promise<ProjectResponse> {
    return get<ProjectResponse>(`/api/slides/${slug}`, signal);
  },

  createSlide(
    slug: string,
    data: CreateSlideRequest,
    signal?: AbortSignal,
  ): Promise<Slide> {
    return post<Slide>(`/api/slides/${slug}`, data, signal);
  },

  updateSlide(
    slug: string,
    sid: string,
    data: UpdateSlideRequest,
    signal?: AbortSignal,
  ): Promise<Slide> {
    return put<Slide>(`/api/slides/${slug}/${sid}`, data, signal);
  },

  deleteSlide(
    slug: string,
    sid: string,
    signal?: AbortSignal,
  ): Promise<{ success: boolean; message: string }> {
    return del(`/api/slides/${slug}/${sid}`, signal);
  },

  reorderSlides(
    slug: string,
    slideIds: string[],
    signal?: AbortSignal,
  ): Promise<{ success: boolean; slides: Slide[] }> {
    const body: ReorderSlidesRequest = { slide_ids: slideIds };
    return put(`/api/slides/${slug}/reorder`, body, signal);
  },

  updateTitle(
    slug: string,
    title: string,
    signal?: AbortSignal,
  ): Promise<{ success: boolean; title: string }> {
    return put(`/api/slides/${slug}/title`, { title }, signal);
  },
};
