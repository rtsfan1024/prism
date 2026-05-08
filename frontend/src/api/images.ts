import type { SlideImagesResponse, GenerateImageResponse } from "@/types";
import { get, post } from "./index";

export const imagesApi = {
  getSlideImages(
    slug: string,
    sid: string,
    signal?: AbortSignal,
  ): Promise<SlideImagesResponse> {
    return get<SlideImagesResponse>(`/api/slides/${slug}/${sid}/images`, signal);
  },

  generateImage(
    slug: string,
    sid: string,
    signal?: AbortSignal,
  ): Promise<GenerateImageResponse> {
    return post<GenerateImageResponse>(
      `/api/slides/${slug}/${sid}/generate`,
      undefined,
      signal,
    );
  },

  getImageUrl(slug: string, sid: string, filename: string): string {
    return `/api/slides/${slug}/${sid}/images/${filename}`;
  },
};
