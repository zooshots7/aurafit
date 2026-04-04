"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";

interface PhotoUploaderProps {
  photos: File[];
  onChange: (files: File[]) => void;
}

const MAX_FILES = 10;

export default function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const files = photos;
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [previewUrls]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = MAX_FILES - files.length;
      const newFiles = [...files, ...acceptedFiles.slice(0, remaining)];
      onChange(newFiles);
    },
    [files, onChange]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: MAX_FILES - files.length,
    disabled: files.length >= MAX_FILES,
  });

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? "border-gold bg-gold/5" : "border-charcoal/20 hover:border-gold/60"}
          ${files.length >= MAX_FILES ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <Upload
          size={32}
          className={`mx-auto mb-3 ${isDragActive ? "text-gold" : "text-charcoal/30"}`}
        />
        <p className="font-body text-sm text-charcoal/70 mb-1">
          {isDragActive
            ? "Drop your photos here"
            : "Drag & drop photos, or click to browse"}
        </p>
        <p className="font-body text-xs text-charcoal/40 max-w-sm mx-auto leading-relaxed">
          Include a front-facing shot, side view, and face close-up for best results
        </p>
      </div>

      {/* Counter */}
      <p className="font-body text-xs text-charcoal/50 mt-3 text-right">
        {files.length} of {MAX_FILES} photos
      </p>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden bg-cream">
              {previewUrls[index] && (
                <Image
                  src={previewUrls[index]}
                  alt={`Upload ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 20vw, 33vw"
                  className="object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
