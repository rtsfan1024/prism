import { useRef, useEffect, useMemo } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { useSlideStore } from "@/stores/slideStore";
import { imagesApi } from "@/api/images";
import { useKeyboard } from "@/hooks/useKeyboard";

export default function FullscreenPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const interval = usePlayerStore((s) => s.interval);
  const nextSlide = usePlayerStore((s) => s.nextSlide);
  const prevSlide = usePlayerStore((s) => s.prevSlide);
  const stopPlayback = usePlayerStore((s) => s.stopPlayback);
  const setSlideIndex = usePlayerStore((s) => s.setSlideIndex);

  const slides = useSlideStore((s) => s.slides);
  const slug = useSlideStore((s) => s.slug);

  const totalSlides = slides.length;

  const keyMap = useMemo(
    () => ({
      ArrowRight: () => nextSlide(totalSlides),
      ArrowLeft: () => prevSlide(),
      Escape: () => stopPlayback(),
    }),
    [nextSlide, prevSlide, stopPlayback, totalSlides],
  );

  useKeyboard(keyMap, isPlaying);

  // Request fullscreen
  useEffect(() => {
    if (isPlaying && containerRef.current) {
      const el = containerRef.current;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          // Fullscreen not available, continue without it
        });
      }
    }
  }, [isPlaying]);

  // Handle fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isPlaying) {
        stopPlayback();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isPlaying, stopPlayback]);

  // Auto-advance timer
  useEffect(() => {
    if (isPlaying && totalSlides > 0) {
      intervalRef.current = setInterval(() => {
        nextSlide(totalSlides);
      }, interval);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, interval, totalSlides, nextSlide]);

  const currentSlide = slides[currentIndex];
  const currentImageUrl =
    currentSlide && slug
      ? imagesApi.getImageUrl(slug, currentSlide.sid, `${currentSlide.content_hash}.jpg`)
      : null;

  if (!isPlaying) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      {/* Slide content */}
      {currentSlide ? (
        <div className="flex-1 flex items-center justify-center w-full p-8">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={currentSlide.content}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <p className="text-white text-2xl text-center max-w-2xl">
              {currentSlide.content}
            </p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white text-xl">No slides</p>
        </div>
      )}

      {/* Bottom controls */}
      <div className="w-full px-8 pb-6">
        {/* Slide text overlay */}
        {currentSlide && (
          <p className="text-white/80 text-sm text-center mb-4 truncate">
            {currentSlide.content}
          </p>
        )}

        {/* Progress bar */}
        <div className="flex gap-1.5 justify-center mb-3">
          {slides.map((slide, idx) => (
            <button
              key={slide.sid}
              onClick={() => setSlideIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-8 bg-white"
                  : "w-3 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Navigation hint */}
        <div className="flex justify-center gap-6 text-white/40 text-xs">
          <span>← Previous</span>
          <span>→ Next</span>
          <span>ESC Exit</span>
        </div>
      </div>
    </div>
  );
}
