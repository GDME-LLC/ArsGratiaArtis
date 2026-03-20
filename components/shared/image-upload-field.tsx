"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { createCroppedImageFile } from "@/lib/media/crop-client";
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_MAX_BYTES,
  getImageUploadError,
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

type PendingCrop = {
  file: File;
  sourceUrl: string;
};

const previewClassNames: Record<NonNullable<ImageUploadFieldProps["aspectRatio"]>, string> = {
  poster: "aspect-[2/3]",
  square: "aspect-square",
  banner: "aspect-[16/5]",
};

const cropAspectRatios: Record<NonNullable<ImageUploadFieldProps["aspectRatio"]>, number> = {
  poster: 2 / 3,
  square: 1,
  banner: 16 / 5,
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
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      if (pendingCrop?.sourceUrl) {
        URL.revokeObjectURL(pendingCrop.sourceUrl);
      }
    };
  }, [localPreviewUrl, pendingCrop]);

  function resetPendingCrop() {
    setPendingCrop((current) => {
      if (current?.sourceUrl) {
        URL.revokeObjectURL(current.sourceUrl);
      }

      return null;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsPreparingCrop(false);
  }

  function setPreviewUrl(nextPreviewUrl: string | null) {
    setLocalPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return nextPreviewUrl;
    });
  }

  async function uploadFile(file: File, previewUrl: string) {
    setError("");
    setIsUploading(true);
    setPreviewUrl(previewUrl);

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

  function beginCrop(file: File) {
    const uploadError = getImageUploadError(file.type, file.size);

    if (uploadError) {
      setError(uploadError);
      return;
    }

    setError("");
    resetPendingCrop();
    setPendingCrop({
      file,
      sourceUrl: URL.createObjectURL(file),
    });
  }

  async function handleFileSelection(fileList: FileList | null) {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    beginCrop(file);
  }

  async function handleCropSave() {
    if (!pendingCrop || !croppedAreaPixels) {
      setError("Adjust the crop before saving the image.");
      return;
    }

    setError("");
    setIsPreparingCrop(true);

    try {
      const croppedFile = await createCroppedImageFile({
        src: pendingCrop.sourceUrl,
        crop: croppedAreaPixels,
        fileName: pendingCrop.file.name,
        fileType: pendingCrop.file.type,
      });
      const previewUrl = URL.createObjectURL(croppedFile);

      resetPendingCrop();
      await uploadFile(croppedFile, previewUrl);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Image crop failed.");
      setIsPreparingCrop(false);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    resetPendingCrop();
    setError("");
    onChange("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const previewUrl = localPreviewUrl || value;
  const isBusy = isUploading || isPreparingCrop;

  return (
    <>
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
                {previewUrl ? "Image ready. Choose another file to crop and replace it." : "Choose a file or drop one here."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {helperText ?? "JPG, PNG, or WebP. Up to 10 MB."}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Crop, zoom, and reposition before upload. Max {Math.round(IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024))} MB
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={previewUrl ? "ghost" : "default"}
            size="lg"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Uploading..." : isPreparingCrop ? "Preparing..." : previewUrl ? "Replace Image" : "Choose File"}
          </Button>
          {previewUrl ? (
            <Button type="button" variant="ghost" size="lg" disabled={isBusy} onClick={handleRemove}>
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

      {pendingCrop ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[hsl(var(--surface-2))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex flex-col gap-6 p-4 sm:p-6">
              <div className="space-y-2">
                <p className="display-kicker">Adjust Image</p>
                <h2 className="headline-sm text-foreground">Crop {label.toLowerCase()}</h2>
                <p className="text-sm text-muted-foreground">
                  Drag to reposition and use zoom to frame the final crop before upload.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/50" style={{ height: "min(58vh, 460px)" }}>
                  <Cropper
                    image={pendingCrop.sourceUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={cropAspectRatios[aspectRatio]}
                    objectFit="contain"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div>
                    <p className="display-kicker text-[0.62rem] text-foreground/90">Crop Preset</p>
                    <p className="mt-2 text-sm text-foreground">
                      {aspectRatio === "square"
                        ? "Square avatar"
                        : aspectRatio === "banner"
                          ? "Cinematic banner"
                          : "Portrait poster"}
                    </p>
                  </div>

                  <label className="grid gap-3">
                    <span className="display-kicker text-[0.62rem] text-foreground/90">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="accent-[hsl(var(--primary))]"
                    />
                    <span className="text-sm text-muted-foreground">{zoom.toFixed(2)}x</span>
                  </label>

                  <p className="text-sm text-muted-foreground">
                    The saved crop keeps the current aspect ratio so it fits the live UI cleanly on both desktop and mobile.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" size="lg" disabled={isPreparingCrop} onClick={resetPendingCrop}>
                  Cancel
                </Button>
                <Button type="button" size="lg" disabled={isPreparingCrop} onClick={() => void handleCropSave()}>
                  {isPreparingCrop ? "Saving Crop..." : "Save Cropped Image"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
