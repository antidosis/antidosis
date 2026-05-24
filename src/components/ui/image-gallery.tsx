"use client";

import { X } from "lucide-react";

import { FileUpload } from "./file-upload";

interface ImageGalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  maxImages?: number;
  label?: string;
}

export function ImageGallery({
  images,
  onChange,
  folder = "needs",
  maxImages = 5,
  label,
}: ImageGalleryProps) {
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
      {label && (
        <p className="text-xs font-medium uppercase tracking-wide text-[#b8a078]">{label}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative">
            <img
              src={url}
              alt=""
              className="h-20 w-20 object-cover border border-[#2a2420] rounded-md"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute -top-1 -right-1 p-1 bg-[#12100e] border border-[#2a2420] text-[#7a6b5a] hover:text-[#ff5252] hover:border-[#ff5252]/30 rounded-md transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <FileUpload folder={folder} onUpload={addImage}>
            add_image
          </FileUpload>
        )}
      </div>
      {images.length > 0 && (
        <p className="text-xs text-[#00e676]">
          {images.length} image{images.length !== 1 ? "s" : ""} attached
        </p>
      )}
    </div>
  );
}
