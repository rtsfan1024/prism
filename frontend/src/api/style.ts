import type {
  GetStyleResponse,
  GenerateStyleResponse,
  SelectStyleResponse,
} from "@/types";
import { get, post, put } from "./index";

export const styleApi = {
  getStyle(slug: string, signal?: AbortSignal): Promise<GetStyleResponse> {
    return get<GetStyleResponse>(`/api/slides/${slug}/style`, signal);
  },

  generateStyleCandidates(
    slug: string,
    prompt: string,
    signal?: AbortSignal,
  ): Promise<GenerateStyleResponse> {
    return post<GenerateStyleResponse>(
      `/api/slides/${slug}/style/generate`,
      { prompt },
      signal,
    );
  },

  selectStyle(
    slug: string,
    prompt: string,
    selectedImage: string,
    signal?: AbortSignal,
  ): Promise<SelectStyleResponse> {
    return put<SelectStyleResponse>(
      `/api/slides/${slug}/style`,
      { prompt, selected_image: selectedImage },
      signal,
    );
  },
};
