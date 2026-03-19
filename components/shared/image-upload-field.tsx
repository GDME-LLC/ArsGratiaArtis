"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_MAX_BYTES,
  type MediaEntityType,
  type MediaField,
} from "@/lib/media/storage";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  entityType: MediaEntityType;
  field: MediaField;
  value: string;
  onChange: (nextValue: string) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  filmId?: string;
  label: string;
  helperText?: string;
  aspectRatio?: "poster" | "square" | "banner";
};

type UploadResponse = {
  url?: string;
  error?: string;
};

const previewClassNames: Record<NonNullable<ImageUploadFieldProps["aspectRatio"]>, string> = {
  poster: "aspect-[2/3]",
  square: "aspect-square",
  banner: "aspect-[16/5]",
};

export function ImageUploadField({
  entityType,
  field,
  value,
  onChange,
  onUploadingChange,
  filmId,
  label,
  helperText,
  aspectRatio = "poster",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  async function uploadFile(file: File) {
    setError("");
    setIsUploading(true);

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("entityType", entityType);
      body.append("field", field);

      if (filmId) {
        body.append("filmId", filmId);
      }

      if (value) {
        body.append("existingUrl", value);
      }

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body,
      });

      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Upload failed.");
        return;
      }

      onChange(payload.url);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFileSelection(fileList: FileList | null) {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    await uploadFile(file);
  }

  function handleRemove() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }

    setError("");
    onChange("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const previewUrl = localPreviewUrl || value;

  return (
    <div className="grid gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFileSelection(event.dataTransfer.files);
        }}
        className={cn(
          "group rounded-[22px] border border-white/10 bg-black/20 p-4 transition outline-none",
          "focus-visible:border-primary/60 focus-visible:bg-white/[0.07]",
          dragActive ? "border-primary/60 bg-white/[0.07]" : "hover:border-white/20 hover:bg-white/[0.06]",
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div
            className={cn(
              "overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] md:w-[180px]",
              previewClassNames[aspectRatio],
            )}
          >
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={`${label} preview`}
                  className="h-full w-full object-cover"
                />
              </>
            ) : (
              <div className="flex h-full items-end bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)),radial-gradient(circle_at_top,rgba(199,166,106,0.1),transparent_38%)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {label}
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="display-kicker text-[0.65rem] text-foreground/90">{label}</p>
            <p className="mt-3 text-sm text-foreground">
              {previewUrl ? "Image ready. Choose another file to replace it." : "Choose a file or drop one here."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {helperText ?? "JPG, PNG, or WebP. Up to 10 MB."}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Max {Math.round(IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024))} MB
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={previewUrl ? "ghost" : "default"}
          size="lg"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading..." : previewUrl ? "Replace Image" : "Choose File"}
        </Button>
        {previewUrl ? (
          <Button type="button" variant="ghost" size="lg" disabled={isUploading} onClick={handleRemove}>
            Remove
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          void handleFileSelection(event.target.files);
        }}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
