"use client";

import { useState, useRef } from "react";

import { Upload, X, Loader2 } from "lucide-react";

import { compressImage } from "@/lib/image-compress";
import { cn } from "@/lib/utils";

import { Button } from "./button";

interface FileUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  onUpload,
  folder = "general",
  accept = "image/*",
  className,
  children,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Compress large photos client-side to stay under the platform body cap
      const upload = await compressImage(file);
      const formData = new FormData();
      formData.append("file", upload);
      formData.append("folder", folder);

      const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) onUpload(data.url);
      else {
        console.error("Upload failed:", data.error);
        setPreview(null);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setPreview(null);
    }
    setUploading(false);
  }

  function clearPreview() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-16 w-16 object-cover border border-[#2a2420] rounded-md"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0806]/60 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-[#f5a623]" />
            </div>
          )}
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -top-1 -right-1 p-1 bg-[#12100e] border border-[#2a2420] text-[#7a6b5a] hover:text-[#e8d5a3] hover:border-[#f5a623] rounded-md transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Upload className="h-4 w-4 mr-1.5" />
          )}
          {children || "upload"}
        </Button>
      )}
    </div>
  );
}
