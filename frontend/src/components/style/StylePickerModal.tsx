import { useState, useCallback, useEffect } from "react";
import { useSlideStore } from "@/stores/slideStore";
import { styleApi } from "@/api/style";
import type { StyleCandidate } from "@/types";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function StylePickerModal() {
  const slug = useSlideStore((s) => s.slug);
  const style = useSlideStore((s) => s.style);
  const setStyle = useSlideStore((s) => s.setStyle);
  const isOpen = useSlideStore((s) => s.isStyleModalOpen);
  const openStyleModal = useSlideStore((s) => s.openStyleModal);
  const closeStyleModal = useSlideStore((s) => s.closeStyleModal);

  const [prompt, setPrompt] = useState("");
  const [candidates, setCandidates] = useState<StyleCandidate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-open when project has no style
  useEffect(() => {
    if (slug && style === null) {
      openStyleModal();
    }
  }, [slug, style, openStyleModal]);

  // Sync prompt with current style when modal opens
  useEffect(() => {
    if (isOpen && style) {
      setPrompt(style.prompt);
    }
  }, [isOpen, style]);

  const handleGenerate = useCallback(async () => {
    if (!slug || !prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setCandidates([]);
    try {
      const resp = await styleApi.generateStyleCandidates(slug, prompt.trim());
      setCandidates(resp.candidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate style");
    } finally {
      setIsGenerating(false);
    }
  }, [slug, prompt]);

  const handleSelect = useCallback(
    async (candidate: StyleCandidate) => {
      if (!slug) return;
      setIsSelecting(true);
      setError(null);
      try {
        const resp = await styleApi.selectStyle(slug, prompt.trim(), candidate.filename);
        setStyle(resp.style);
        closeStyleModal();
        setCandidates([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save style");
      } finally {
        setIsSelecting(false);
      }
    },
    [slug, prompt, setStyle, closeStyleModal],
  );

  const handleClose = useCallback(() => {
    // Only allow close if style is already set
    if (style) {
      closeStyleModal();
      setCandidates([]);
      setError(null);
    }
  }, [style, closeStyleModal]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Choose Presentation Style"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Current style preview */}
        {style && slug && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <img
              src={`/api/slides/${slug}/style/${style.image}`}
              alt="Current style"
              className="w-24 h-16 object-cover rounded-md border border-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Current Style
              </p>
              <p className="text-sm text-gray-700 truncate">{style.prompt}</p>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          {style
            ? "Enter a new style description to change the visual style."
            : "Describe the visual style for your presentation images. The AI will generate two candidate styles for you to choose from."}
        </p>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="e.g., Watercolor with soft tones, flat illustration style..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && prompt.trim() && !isGenerating) {
                  handleGenerate();
                }
              }}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={!prompt.trim() || isGenerating}
          >
            Generate
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-500">
              Generating style candidates...
            </span>
          </div>
        )}

        {candidates.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.filename}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors"
              >
                <img
                  src={candidate.url}
                  alt={candidate.filename}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleSelect(candidate)}
                    isLoading={isSelecting}
                    disabled={isSelecting}
                  >
                    Use This Style
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
