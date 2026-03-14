"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { getMuxPlaybackUrl } from "@/lib/films/playback";
import { MAX_VIDEO_UPLOAD_BYTES, VIDEO_UPLOAD_LIMIT_MESSAGE } from "@/lib/films/upload";

type FilmVideoUploadProps = {
  filmId?: string;
  initialMuxPlaybackId?: string | null;
};

type UploadPhase = "idle" | "uploading" | "processing" | "ready" | "error";

export function FilmVideoUpload({
  filmId,
  initialMuxPlaybackId,
}: FilmVideoUploadProps) {
  const [phase, setPhase] = useState<UploadPhase>(initialMuxPlaybackId ? "ready" : "idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [muxPlaybackId, setMuxPlaybackId] = useState(initialMuxPlaybackId ?? null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const playbackUrl = useMemo(
    () => (muxPlaybackId ? getMuxPlaybackUrl(muxPlaybackId) : null),
    [muxPlaybackId],
  );

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");

    if (!filmId) {
      setError("Save the draft first, then attach a video.");
      return;
    }

    if (!file) {
      return;
    }

    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setPhase("error");
      setError(VIDEO_UPLOAD_LIMIT_MESSAGE);
      return;
    }

    try {
      const uploadInit = await fetch(`/api/films/${filmId}/video-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileSize: file.size,
        }),
      });

      const uploadPayload = (await uploadInit.json()) as {
        error?: string;
        uploadId?: string;
        uploadUrl?: string;
      };

      if (!uploadInit.ok || !uploadPayload.uploadId || !uploadPayload.uploadUrl) {
        throw new Error(uploadPayload.error || "Upload could not be initialized.");
      }

      setPhase("uploading");
      setProgress(0);

      await uploadFileToMux(uploadPayload.uploadUrl, file, setProgress);

      setPhase("processing");
      await pollUntilReady(filmId, uploadPayload.uploadId, (payload) => {
        if (payload.muxPlaybackId) {
          setMuxPlaybackId(payload.muxPlaybackId);
        }

        if (payload.assetStatus === "ready" && payload.muxPlaybackId) {
          setPhase("ready");
          return true;
        }

        if (payload.uploadStatus === "errored") {
          throw new Error("Mux reported an upload error.");
        }

        return false;
      });
    } catch (uploadError) {
      setPhase("error");
      setError(uploadError instanceof Error ? uploadError.message : "Video upload failed.");
    }
  }

  return (
    <section className="rounded-[24px] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="display-kicker">Video</p>
          <h2 className="title-md mt-3 text-foreground">Attach video when the cut is ready</h2>
          <p className="body-sm mt-3">
            Upload goes directly to Mux from the browser. When processing finishes, Mux generates a thumbnail automatically unless you provide a custom poster image.
          </p>
        </div>

        <div className="inline-flex">
          <Button
            type="button"
            size="lg"
            disabled={!filmId || phase === "uploading" || phase === "processing"}
            onClick={() => inputRef.current?.click()}
          >
            Upload Cut
          </Button>
        </div>
      </div>

      {!filmId ? (
        <p className="body-sm mt-5 text-muted-foreground">
          Save the release page first. Once the draft exists, you can attach a Mux asset here.
        </p>
      ) : null}

      {phase === "uploading" ? (
        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="body-sm mt-3 text-muted-foreground">{progress}% uploaded</p>
        </div>
      ) : null}

      {phase === "processing" ? (
        <p className="body-sm mt-5 text-muted-foreground">
          Upload complete. Mux is preparing the asset for playback.
        </p>
      ) : null}

      {error ? (
        <div className="mt-5 whitespace-pre-line rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {playbackUrl ? (
        <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-black/40">
          <video
            className="aspect-video w-full bg-black"
            controls
            playsInline
            preload="metadata"
            src={playbackUrl}
          />
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={!filmId || phase === "uploading" || phase === "processing"}
      />
    </section>
  );
}

async function uploadFileToMux(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error("Video upload did not complete successfully."));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during video upload."));
    });

    xhr.send(file);
  });
}

async function pollUntilReady(
  filmId: string,
  uploadId: string,
  onPoll: (payload: {
    uploadStatus: string;
    assetStatus: string | null;
    muxPlaybackId: string | null;
  }) => boolean,
) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await wait(2000);

    const response = await fetch(`/api/films/${filmId}/video-upload?uploadId=${uploadId}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      error?: string;
      uploadStatus: string;
      assetStatus: string | null;
      muxPlaybackId: string | null;
    };

    if (!response.ok) {
      throw new Error(payload.error || "Upload status could not be read.");
    }

    if (payload.assetStatus === "errored") {
      throw new Error("Mux could not process this video.");
    }

    if (onPoll(payload)) {
      return;
    }
  }

  throw new Error("Video processing timed out. Check back in a moment.");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
