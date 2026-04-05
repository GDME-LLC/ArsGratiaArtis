"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, FileUp, Import, Layers, Link2, RefreshCw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkflowImportPicker } from "@/components/workflows/workflow-import-picker";
import { WORKFLOW_STAGES } from "@/lib/constants/process";
import type { CreatorIntegration, IntegrationPlatform, WorkflowAsset, WorkflowAssetSourceType } from "@/types";

const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "video/mp4",
  "video/quicktime",
  "video/webm",
].join(",");

type WorkflowAssetManagerProps = {
  draftId: string;
};

type Tab = "link" | "upload" | "import";

const emptyLinkForm = { label: "", url: "", sourceType: "generic" as WorkflowAssetSourceType, stage: "", notes: "" };
const emptyUploadForm = { label: "", sourceType: "generic" as WorkflowAssetSourceType, stage: "", notes: "" };

export function WorkflowAssetManager({ draftId }: WorkflowAssetManagerProps) {
  const [assets, setAssets] = useState<WorkflowAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("link");
  const [groupByStage, setGroupByStage] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<CreatorIntegration[]>([]);
  const [importPlatform, setImportPlatform] = useState<IntegrationPlatform | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState(emptyLinkForm);
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const [assetsRes, integrationsRes] = await Promise.all([
          fetch(`/api/workflows/${draftId}?_sub=assets`, { cache: "no-store" }),
          fetch("/api/profile?_sub=integrations", { cache: "no-store" }),
        ]);

        const assetsPayload = (await assetsRes.json()) as { assets?: WorkflowAsset[]; error?: string };
        const integrationsPayload = (await integrationsRes.json()) as { integrations?: CreatorIntegration[]; error?: string };

        if (!mounted) {
          return;
        }

        if (!assetsRes.ok || !assetsPayload.assets) {
          setError(assetsPayload.error ?? "Could not load assets.");
          return;
        }

        setAssets(assetsPayload.assets);

        if (integrationsRes.ok && integrationsPayload.integrations) {
          setConnectedIntegrations(integrationsPayload.integrations);
          if (integrationsPayload.integrations.length > 0) {
            setImportPlatform(integrationsPayload.integrations[0].platform);
            const first = integrationsPayload.integrations[0];
            if (first.lastSyncedAt) setSyncedAt(first.lastSyncedAt);
          }
        }
      } catch {
        if (mounted) {
          setError("Network error loading assets.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [draftId]);

  function clearMessages() {
    setError(null);
    setSuccessMsg(null);
  }

  const handleSync = useCallback(async () => {
    if (!importPlatform || isSyncing) return;
    setIsSyncing(true);
    setError(null);

    try {
      const res = await fetch("/api/workflows?_sub=integration-sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: importPlatform }),
      });

      const payload = (await res.json()) as { ok?: boolean; syncedAt?: string; error?: string };

      if (!res.ok) {
        setError(payload.error ?? "Sync failed. Please try again.");
        return;
      }

      if (payload.syncedAt) setSyncedAt(payload.syncedAt);
      setSuccessMsg("Platform sync complete.");
    } catch {
      setError("Network error during sync.");
    } finally {
      setIsSyncing(false);
    }
  }, [importPlatform, isSyncing]);

  async function handleAddLink(event: React.FormEvent) {
    event.preventDefault();
    clearMessages();

    if (!linkForm.label.trim() || !linkForm.url.trim()) {
      setError("Label and URL are required.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/workflows/${draftId}?_sub=assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: linkForm.label.trim(),
          url: linkForm.url.trim(),
          source_type: linkForm.sourceType,
          stage: linkForm.stage.trim() || null,
          notes: linkForm.notes.trim() || null,
        }),
      });

      const payload = (await res.json()) as { asset?: WorkflowAsset; error?: string };

      if (!res.ok || !payload.asset) {
        setError(payload.error ?? "Link could not be added.");
        return;
      }

      setAssets((current) => [...current, payload.asset as WorkflowAsset]);
      setLinkForm(emptyLinkForm);
      setSuccessMsg("Link added to project assets.");
    } catch {
      setError("Network error while adding link.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    clearMessages();

    if (!uploadFile) {
      setError("Select a file to upload.");
      return;
    }

    if (!uploadForm.label.trim()) {
      setError("Asset label is required.");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("draftId", draftId);
      formData.append("label", uploadForm.label.trim());
      formData.append("sourceType", uploadForm.sourceType);

      if (uploadForm.stage.trim()) {
        formData.append("stage", uploadForm.stage.trim());
      }

      if (uploadForm.notes.trim()) {
        formData.append("notes", uploadForm.notes.trim());
      }

      const res = await fetch("/api/uploads/image?_sub=workflow-asset", {
        method: "POST",
        body: formData,
      });

      const payload = (await res.json()) as { asset?: WorkflowAsset; error?: string };

      if (!res.ok || !payload.asset) {
        setError(payload.error ?? "File could not be uploaded.");
        return;
      }

      setAssets((current) => [...current, payload.asset as WorkflowAsset]);
      setUploadForm(emptyUploadForm);
      setUploadFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccessMsg("File uploaded and added to project assets.");
    } catch {
      setError("Network error while uploading file.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(asset: WorkflowAsset) {
    clearMessages();
    setDeletingId(asset.id);

    try {
      const res = await fetch(`/api/workflows/${draftId}?_sub=assets&_assetId=${encodeURIComponent(asset.id)}`, {
        method: "DELETE",
      });

      const payload = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "Asset could not be removed.");
        return;
      }

      setAssets((current) => current.filter((a) => a.id !== asset.id));
    } catch {
      setError("Network error while removing asset.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="display-kicker">Project Assets</p>
        {isLoading ? <span className="text-xs text-muted-foreground">Loading...</span> : null}
      </div>

      <p className="body-sm mt-2">
        Attach Runway or ElevenLabs project links and upload exported files. Assets carry through to Creator Studio.
      </p>

      <div className="mt-4 flex rounded-xl border border-white/10 bg-black/20 p-0.5 gap-0.5">
        <button
          type="button"
          onClick={() => { clearMessages(); setActiveTab("link"); }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs uppercase tracking-[0.14em] transition ${activeTab === "link" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
        >
          <Link2 className="h-3 w-3" />
          Link
        </button>
        <button
          type="button"
          onClick={() => { clearMessages(); setActiveTab("upload"); }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs uppercase tracking-[0.14em] transition ${activeTab === "upload" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
        >
          <FileUp className="h-3 w-3" />
          Upload
        </button>
        {connectedIntegrations.length > 0 ? (
          <button
            type="button"
            onClick={() => { clearMessages(); setActiveTab("import"); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs uppercase tracking-[0.14em] transition ${activeTab === "import" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
          >
            <Import className="h-3 w-3" />
            Import
          </button>
        ) : null}
      </div>

      {activeTab === "link" ? (
        <form onSubmit={handleAddLink} className="mt-4 grid gap-2.5">
          <label className="grid gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Label</span>
            <input
              value={linkForm.label}
              onChange={(e) => setLinkForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Runway project scene 2"
              className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 text-xs text-foreground outline-none transition focus:border-white/34"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">URL</span>
            <input
              type="url"
              value={linkForm.url}
              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://app.runway.com/..."
              className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 text-xs text-foreground outline-none transition focus:border-white/34"
            />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="grid gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Source</span>
              <select
                value={linkForm.sourceType}
                onChange={(e) => setLinkForm((f) => ({ ...f, sourceType: e.target.value as WorkflowAssetSourceType }))}
                className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 text-xs text-foreground outline-none transition focus:border-white/34"
              >
                <option value="runway">Runway</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="generic">Other</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stage</span>
              <select
                value={linkForm.stage}
                onChange={(e) => setLinkForm((f) => ({ ...f, stage: e.target.value }))}
                className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 text-xs text-foreground outline-none transition focus:border-white/34"
              >
                <option value="">— None —</option>
                {WORKFLOW_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <Button type="submit" variant="ghost" disabled={isSaving} className="mt-1 w-full">
            {isSaving ? "Adding..." : "Add Link"}
          </Button>
        </form>
      ) : activeTab === "upload" ? (
        <form onSubmit={handleUpload} className="mt-4 grid gap-2.5">
          <label className="grid gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 py-2 text-xs text-foreground outline-none transition focus:border-white/34 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-0.5 file:text-[10px] file:text-foreground/80"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Label</span>
            <input
              value={uploadForm.label}
              onChange={(e) => setUploadForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. ElevenLabs VO take 1"
              className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 text-xs text-foreground outline-none transition focus:border-white/34"
            />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="grid gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Source</span>
              <select
                value={uploadForm.sourceType}
                onChange={(e) => setUploadForm((f) => ({ ...f, sourceType: e.target.value as WorkflowAssetSourceType }))}
                className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 text-xs text-foreground outline-none transition focus:border-white/34"
              >
                <option value="runway">Runway</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="generic">Other</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stage</span>
              <select
                value={uploadForm.stage}
                onChange={(e) => setUploadForm((f) => ({ ...f, stage: e.target.value }))}
                className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 text-xs text-foreground outline-none transition focus:border-white/34"
              >
                <option value="">— None —</option>
                {WORKFLOW_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <Button type="submit" variant="ghost" disabled={isSaving || !uploadFile} className="mt-1 w-full">
            {isSaving ? "Uploading..." : "Upload File"}
          </Button>
        </form>
      ) : activeTab === "import" ? (
        <div className="mt-4">
          {connectedIntegrations.length > 1 ? (
            <div className="mb-3 flex rounded-xl border border-white/10 bg-black/20 p-0.5 gap-0.5">
              {connectedIntegrations.map((integration) => (
                <button
                  key={integration.platform}
                  type="button"
                  onClick={() => setImportPlatform(integration.platform)}
                  className={`flex-1 rounded-[10px] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition ${importPlatform === integration.platform ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  {integration.platform === "runway" ? "Runway" : "ElevenLabs"}
                </button>
              ))}
            </div>
          ) : null}
          {importPlatform ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSync}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-white/24 hover:text-foreground disabled:opacity-40"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
                {syncedAt ? (
                  <span className="text-[10px] text-muted-foreground/50">
                    Synced {new Date(syncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : null}
              </div>
              <WorkflowImportPicker
                key={`${draftId}-${importPlatform}`}
                draftId={draftId}
                platform={importPlatform}
                onImported={(asset) => setAssets((current) => [...current, asset])}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {successMsg ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/16 bg-black/30 px-3 py-2.5 text-xs text-foreground/88">
          <span className="flex-1">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {assets.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{assets.length} asset{assets.length !== 1 ? "s" : ""}</p>
            <button
              type="button"
              onClick={() => setGroupByStage((v) => !v)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] uppercase tracking-[0.12em] transition ${groupByStage ? "border-white/20 bg-white/10 text-foreground" : "border-white/8 text-muted-foreground hover:border-white/16 hover:text-foreground/70"}`}
            >
              <Layers className="h-2.5 w-2.5" />
              By Stage
            </button>
          </div>

          {groupByStage ? (
            (() => {
              const stageMap = new Map<string, WorkflowAsset[]>();
              const untagged: WorkflowAsset[] = [];
              for (const asset of assets) {
                if (!asset.stage) { untagged.push(asset); continue; }
                const g = stageMap.get(asset.stage) ?? [];
                g.push(asset);
                stageMap.set(asset.stage, g);
              }
              const orderedStages = WORKFLOW_STAGES.filter((s) => stageMap.has(s));
              const unknownStages = [...stageMap.keys()].filter((s) => !WORKFLOW_STAGES.includes(s as never));
              const allGroups: Array<[string, WorkflowAsset[]]> = [
                ...orderedStages.map((s): [string, WorkflowAsset[]] => [s, stageMap.get(s)!]),
                ...unknownStages.map((s): [string, WorkflowAsset[]] => [s, stageMap.get(s)!]),
                ...(untagged.length > 0 ? [["Untagged", untagged] as [string, WorkflowAsset[]]] : []),
              ];
              return (
                <div className="space-y-4">
                  {allGroups.map(([stage, stageAssets]) => (
                    <div key={stage}>
                      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">{stage}</p>
                      <div className="space-y-1.5">
                        {stageAssets.map((asset) => (
                          <AssetRow key={asset.id} asset={asset} deletingId={deletingId} onDelete={handleDelete} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            assets.map((asset) => (
              <AssetRow key={asset.id} asset={asset} deletingId={deletingId} onDelete={handleDelete} />
            ))
          )}
        </div>
      ) : (
        !isLoading ? (
          <p className="mt-4 text-xs text-muted-foreground">No assets attached yet. Add a link or upload an exported file above.</p>
        ) : null
      )}
    </article>
  );
}

type AssetRowProps = {
  asset: WorkflowAsset;
  deletingId: string | null;
  onDelete: (asset: WorkflowAsset) => Promise<void>;
};

function AssetRow({ asset, deletingId, onDelete }: AssetRowProps) {
  function getMimeCategory(mimeType: string | null) {
    if (!mimeType) return null;
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType.startsWith("video/")) return "Video";
    return null;
  }

  const SOURCE_TYPE_LABELS: Record<WorkflowAssetSourceType, string> = {
    runway: "Runway",
    elevenlabs: "ElevenLabs",
    generic: "Other",
  };

  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{asset.label}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>{SOURCE_TYPE_LABELS[asset.sourceType]}</span>
          {asset.stage ? <span>· {asset.stage}</span> : null}
          {asset.assetType === "import" ? <span>· Imported</span> : null}
          {asset.assetType === "upload" && asset.mimeType ? (
            <span>· {getMimeCategory(asset.mimeType)}</span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {asset.url ? (
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition"
            title="Open asset"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
        <button
          type="button"
          disabled={deletingId === asset.id}
          onClick={() => onDelete(asset)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive transition disabled:opacity-40"
          title="Remove asset"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
