import { useCallback } from "react";
import { useSlides } from "@/hooks/useSlides";
import { useSlideStore } from "@/stores/slideStore";
import { imagesApi } from "@/api/images";
import Button from "@/components/common/Button";

export default function ImagePreview() {
  const {
    selectedSlide,
    selectedSlideId,
    currentImages,
    hasCurrentImage,
    currentImage,
    isGenerating,
    generateImage,
    selectImage,
  } = useSlides();
  const slug = useSlideStore((s) => s.slug);

  const handleGenerate = useCallback(() => {
    if (selectedSlideId) {
      generateImage(selectedSlideId);
    }
  }, [selectedSlideId, generateImage]);

  if (!selectedSlide) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-sm">Select a slide to preview</p>
        </div>
      </div>
    );
  }

  const displayImageUrl =
    currentImage && slug
      ? imagesApi.getImageUrl(slug, selectedSlide.sid, currentImage.filename)
      : null;

  // Determine button label
  let buttonLabel = "Generate Image";
  if (displayImageUrl && !selectedSlide.has_matching_image) {
    buttonLabel = "Regenerate";
  } else if (displayImageUrl && selectedSlide.has_matching_image) {
    buttonLabel = "New Variant";
  }

  // Prompt summary (lines after first)
  const promptLines = selectedSlide.content.split("\n").slice(1).join(" ").trim();

  return (
    <div className="flex flex-col h-full">
      {/* Main image area */}
      <div className="flex-1 flex items-center justify-center min-h-0 p-3">
        <div className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex items-center justify-center">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={selectedSlide.content.split("\n")[0]}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-8">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">
                {hasCurrentImage ? "Image mismatch" : "No image yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Left: variant thumbnails + prompt summary */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* Variant thumbnails inline */}
            {currentImages.length > 1 && (
              <div className="flex gap-1.5 flex-shrink-0">
                {currentImages.map((img) => {
                  const url = slug ? imagesApi.getImageUrl(slug, selectedSlide.sid, img.filename) : "";
                  const isSelected = img.filename === currentImage?.filename;
                  return (
                    <div
                      key={img.filename}
                      onClick={() => selectImage(img.filename)}
                      className={`w-9 h-6 rounded overflow-hidden border cursor-pointer transition-all flex-shrink-0
                        ${isSelected
                          ? "border-blue-500 ring-1 ring-blue-300"
                          : "border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  );
                })}
              </div>
            )}
            {/* Prompt summary */}
            {promptLines ? (
              <p className="text-xs text-gray-400 truncate">
                {promptLines}
              </p>
            ) : (
              <p className="text-xs text-gray-300 italic">
                No prompt — double-click slide to add
              </p>
            )}
          </div>

          {/* Right: generate button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={isGenerating}
            className="!text-xs !px-3 !py-1.5 flex-shrink-0"
          >
            {isGenerating ? "Generating..." : buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
