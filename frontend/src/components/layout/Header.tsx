import { useState, useCallback, useRef, useEffect } from "react";
import { useSlideStore } from "@/stores/slideStore";
import { usePlayerStore } from "@/stores/playerStore";
import Button from "@/components/common/Button";

export default function Header() {
  const title = useSlideStore((s) => s.title);
  const updateTitle = useSlideStore((s) => s.updateTitle);
  const cost = useSlideStore((s) => s.cost);
  const exitProject = useSlideStore((s) => s.exitProject);
  const openStyleModal = useSlideStore((s) => s.openStyleModal);
  const startPlayback = usePlayerStore((s) => s.startPlayback);
  const slides = useSlideStore((s) => s.slides);

  const [localTitle, setLocalTitle] = useState(title);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalTitle(title);
    }
  }, [title]);

  const handleBlur = useCallback(() => {
    isFocused.current = false;
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== title) {
      updateTitle(trimmed);
    } else {
      setLocalTitle(title);
    }
  }, [localTitle, title, updateTitle]);

  const handleFocus = useCallback(() => {
    isFocused.current = true;
  }, []);

  const handlePlay = useCallback(() => {
    if (slides.length > 0) {
      startPlayback(0);
    }
  }, [slides.length, startPlayback]);

  return (
    <header className="flex items-center justify-between h-12 px-4 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Left: back + logo + title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={exitProject}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Back to projects"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-bold text-blue-600 select-none flex-shrink-0">
          Prism
        </span>
        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="text-sm font-medium text-gray-800 border-b border-transparent
            hover:border-gray-300 focus:border-blue-500 focus:outline-none
            bg-transparent px-1 py-0.5 transition-colors min-w-0 flex-1 truncate"
          placeholder="Project title..."
        />
      </div>

      {/* Right: cost + style + play */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 font-medium">
          ${cost.toFixed(2)}
        </span>
        <button
          onClick={openStyleModal}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md
            border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors font-medium text-gray-600"
          title="View or change style"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          STYLE
        </button>
        <Button
          variant="primary"
          size="sm"
          onClick={handlePlay}
          disabled={slides.length === 0}
          className="!px-3 !py-1 !text-xs"
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Play
        </Button>
      </div>
    </header>
  );
}
