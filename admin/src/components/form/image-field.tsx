"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadImage, apiError } from "@/lib/api";
import { toast } from "sonner";

/**
 * Single image uploader. Uploads straight to the backend /upload (Cloudinary)
 * and returns the resulting URL through onChange.
 */
export function ImageField({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      toast.error(apiError(err, "Upload failed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-1.5">{label}</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative w-32 h-32 rounded-md overflow-hidden border group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-90 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-32 h-32 rounded-md border border-dashed flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-xs">{uploading ? "Uploading…" : "Upload"}</span>
        </button>
      )}
    </div>
  );
}
