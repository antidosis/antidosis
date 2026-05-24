import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";

/* ═══════════════════════════════════════════════════════════════
   IMAGE LIGHTBOX — Full-screen image viewer
   Pinch-zoom ready, swipe navigation, tap to dismiss.
   ═══════════════════════════════════════════════════════════════ */

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const goNext = useCallback(() => {
    hapticImpact("light");
    setCurrent((i) => Math.min(i + 1, images.length - 1));
  }, [images.length]);

  const goPrev = useCallback(() => {
    hapticImpact("light");
    setCurrent((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) goNext();
    if (isRightSwipe) goPrev();
  };

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-mono text-xs text-[var(--leather)]">
          {current + 1} / {images.length}
        </span>
        <button
          onClick={() => {
            hapticImpact("light");
            onClose();
          }}
          className="p-2 rounded-full bg-white/10 text-white tap-highlight-none"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative">
        <img
          src={images[current]}
          alt={`${current + 1} / ${images.length}`}
          className="max-w-full max-h-full object-contain"
        />

        {/* Nav arrows (desktop) */}
        {current > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 p-2 rounded-full bg-black/50 text-white tap-highlight-none"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {current < images.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 p-2 rounded-full bg-black/50 text-white tap-highlight-none"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {images.map((url, idx) => (
            <button
              key={idx}
              onClick={() => {
                hapticImpact("light");
                setCurrent(idx);
              }}
              className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                idx === current ? "border-[var(--sun)]" : "border-transparent"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
