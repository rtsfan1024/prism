import { useMemo, useCallback } from "react";
import { useSlideStore } from "@/stores/slideStore";
import type { Slide } from "@/types";

export function useSlides() {
  const slides = useSlideStore((s) => s.slides);
  const selectedSlideId = useSlideStore((s) => s.selectedSlideId);
  const isLoading = useSlideStore((s) => s.isLoading);
  const currentImages = useSlideStore((s) => s.currentImages);
  const isGenerating = useSlideStore((s) => s.isGenerating);

  const selectedSlide: Slide | undefined = useMemo(
    () => slides.find((s) => s.sid === selectedSlideId),
    [slides, selectedSlideId],
  );

  const selectedSlideIndex = useMemo(
    () => slides.findIndex((s) => s.sid === selectedSlideId),
    [slides, selectedSlideId],
  );

  const selectedImageFilename = useSlideStore((s) => s.selectedImageFilename);

  const hasCurrentImage = useMemo(
    () => currentImages.some((img) => img.is_current),
    [currentImages],
  );

  const currentImage = useMemo(
    () =>
      currentImages.find((img) => img.filename === selectedImageFilename) ??
      currentImages.find((img) => img.is_current) ??
      currentImages[0] ??
      null,
    [currentImages, selectedImageFilename],
  );

  const selectSlide = useCallback(
    (sid: string) => useSlideStore.getState().selectSlide(sid),
    [],
  );

  const createSlide = useCallback(
    (content: string, position?: number) =>
      useSlideStore.getState().createSlide(content, position),
    [],
  );

  const updateSlide = useCallback(
    (sid: string, content: string) =>
      useSlideStore.getState().updateSlide(sid, content),
    [],
  );

  const deleteSlide = useCallback(
    (sid: string) => useSlideStore.getState().deleteSlide(sid),
    [],
  );

  const reorderSlides = useCallback(
    (slideIds: string[]) => useSlideStore.getState().reorderSlides(slideIds),
    [],
  );

  const generateImage = useCallback(
    (sid: string) => useSlideStore.getState().generateImage(sid),
    [],
  );

  const selectImage = useCallback(
    (filename: string) => useSlideStore.getState().selectImage(filename),
    [],
  );

  return {
    slides,
    selectedSlide,
    selectedSlideId,
    selectedSlideIndex,
    isLoading,
    currentImages,
    isGenerating,
    hasCurrentImage,
    currentImage,
    selectImage,
    selectSlide,
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    generateImage,
  };
}
