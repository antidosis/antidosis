"use client";

import { FileUpload } from "./file-upload";
import { X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  maxImages?: number;
  label?: string;
}

export function ImageGallery({ images, onChange, folder = "needs", maxImages = 5, label }: ImageGalleryProps) {
  function addImage(url: string) {
    if (images.length < maxImages) {
      onChange([...images, url]);
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a]">{label}</p>}
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="h-20 w-20 object-cover border border-[#2a2a2a]" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute -top-1 -right-1 p-0.5 bg-[#0c0c0c] border border-[#2a2a2a] text-[#7a6b4a] hover:text-[#c97c7c]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <FileUpload folder={folder} onUpload={addImage}>$ add_image</FileUpload>
        )}
      </div>
      {images.length > 0 && (
        <p className="text-[11px] text-[#7cb87c]">
          {images.length} image{images.length !== 1 ? "s" : ""} attached
        </p>
      )}
    </div>
  );
}
