import { create } from "zustand";

interface PlayerState {
  isPlaying: boolean;
  currentIndex: number;
  interval: number;
  timerId: ReturnType<typeof setInterval> | null;

  startPlayback: (startIndex?: number) => void;
  stopPlayback: () => void;
  nextSlide: (totalSlides: number) => void;
  prevSlide: () => void;
  setSlideIndex: (index: number) => void;
  setIntervalMs: (ms: number) => void;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  isPlaying: false,
  currentIndex: 0,
  interval: 3000,
  timerId: null,

  startPlayback: (startIndex?: number) => {
    const state = get();
    if (state.timerId) {
      clearInterval(state.timerId);
    }
    set({ isPlaying: true, currentIndex: startIndex ?? 0 });
  },

  stopPlayback: () => {
    const { timerId } = get();
    if (timerId) {
      clearInterval(timerId);
    }
    set({ isPlaying: false, timerId: null });
  },

  nextSlide: (totalSlides: number) => {
    set((s) => ({
      currentIndex: totalSlides > 0 ? (s.currentIndex + 1) % totalSlides : 0,
    }));
  },

  prevSlide: () => {
    set((s) => ({
      currentIndex: s.currentIndex > 0 ? s.currentIndex - 1 : 0,
    }));
  },

  setSlideIndex: (index: number) => {
    set({ currentIndex: index });
  },

  setIntervalMs: (ms: number) => {
    set({ interval: ms });
  },
}));
