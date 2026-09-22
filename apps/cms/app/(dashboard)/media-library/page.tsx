"use client";

import { Check, Copy, FileAudio, Film, ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { FolderSelect } from "@/components/shared/folder-select";
import { TagMultiSelect } from "@/components/shared/tag-multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import type { Asset, AssetUsage } from "@cms-pwa/shared-types";

const TYPE_ICON = { image: ImageIcon, video: Film, audio: FileAudio } as const;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const { current } = useProperty();
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "audio">("all");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCredit, setUploadCredit] = useState("");
  const [uploadFolder, setUploadFolder] = useState("uploads");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState<Asset | null>(null);
  const [editName, setEditName] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editCredit, setEditCredit] = useState("");
  const [editFolder, setEditFolder] = useState("uploads");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [usage, setUsage] = useState<AssetUsage | null>(null);

  const load = () => {
    if (!current) return;
    api.get<Asset[]>(`/assets?property_id=${current.id}`).then(setAssets).catch(() => setAssets([]));
  };

  useEffect(load, [current?.id]);

  const filtered = (assets ?? []).filter((a) => filter === "all" || a.type === filter);

  const openUpload = () => {
    setFile(null);
    setUploadName("");
    setUploadAlt("");
    setUploadCaption("");
    setUploadCredit("");
    setUploadFolder("uploads");
    setUploadTags([]);
    setUploadOpen(true);
  };

  const upload = async () => {
    if (!current || !file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("property_id", current.id);
    if (uploadName) formData.append("name", uploadName);
    if (uploadTags.length) formData.append("tags", uploadTags.join(","));
    if (uploadAlt) formData.append("alt_text", uploadAlt);
    if (uploadCaption) formData.append("caption", uploadCaption);
    if (uploadCredit) formData.append("credit", uploadCredit);
    formData.append("folder", uploadFolder);
    try {
      await api.upload("/assets/upload", formData);
      toast.success("Asset uploaded");
      setUploadOpen(false);
      load();
    } catch {
      toast.error("Failed to upload — only image, video, and audio files are supported (max 50MB).");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (asset: Asset) => {
    setEditName(asset.name);
    setEditAlt(asset.alt_text ?? "");
    setEditCaption(asset.caption ?? "");
    setEditCredit(asset.credit ?? "");
    setEditFolder(asset.folder || "uploads");
    setEditTags(asset.tags);
    setUsage(null);
    setEditing(asset);
    api.get<AssetUsage>(`/assets/${asset.id}/usage`).then(setUsage).catch(() => setUsage({ count: 0, items: [] }));
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await api.put(`/assets/${editing.id}`, {
        name: editName,
        tags: editTags,
        alt_text: editAlt,
        caption: editCaption,
        credit: editCredit,
        folder: editFolder,
      });
      toast.success("Asset updated");
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to update asset");
    }
  };

  const remove = async (asset: Asset) => {
    if (!confirm(`Delete "${asset.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/assets/${asset.id}`);
      toast.success("Asset deleted");
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Images, videos, and audio you've uploaded. Click an asset to edit its details."
        actions={
          <Button onClick={openUpload}>
            <Upload className="mr-1 h-4 w-4" /> Add Asset
          </Button>
        }
      />

      <div className="relative z-10 space-y-4 rounded-lg border-0 bg-card p-4 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        <Tabs value={filter} onValueChange={(v: string) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All {assets ? `(${assets.length})` : ""}</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
        </Tabs>

        {assets === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {assets.length === 0 ? "No assets yet — add one to reuse it across the CMS." : "No assets of this type."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {filtered.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onOpen={() => openEdit(asset)} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>File</Label>
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f && !uploadName) setUploadName(f.name);
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              />
              <p className="text-xs text-muted-foreground">Images, videos, or audio — up to 50MB.</p>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alt text</Label>
              <Input value={uploadAlt} onChange={(e) => setUploadAlt(e.target.value)} />
              <p className="text-xs text-muted-foreground">Required for accessibility and image SEO</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Caption</Label>
                <Input value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Credit</Label>
                <Input value={uploadCredit} onChange={(e) => setUploadCredit(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagMultiSelect value={uploadTags} onChange={setUploadTags} />
            </div>
            <div className="space-y-2">
              <Label>Folder</Label>
              <FolderSelect value={uploadFolder} onChange={setUploadFolder} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upload} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open: boolean) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Asset details</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {editing.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editing.url}
                  alt={editing.name}
                  className="h-56 w-full rounded-md border object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
                  {editing.type} · {formatSize(editing.size)}
                </div>
              )}

              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Alt text</Label>
                <Input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} />
                <p className="text-xs text-muted-foreground">Required for accessibility and image SEO</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Credit</Label>
                  <Input value={editCredit} onChange={(e) => setEditCredit(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagMultiSelect value={editTags} onChange={setEditTags} />
              </div>

              <div className="space-y-2">
                <Label>Folder</Label>
                <FolderSelect value={editFolder} onChange={setEditFolder} />
              </div>

              <div className="space-y-1.5">
                <Label>Used by</Label>
                {usage === null ? (
                  <p className="text-sm text-muted-foreground">Checking…</p>
                ) : usage.count === 0 ? (
                  <p className="text-sm text-muted-foreground">Not referenced by any item</p>
                ) : (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {usage.items.map((item, i) => (
                      <li key={i}>
                        <Badge variant="outline" className="mr-1.5 text-[10px] capitalize">
                          {item.type}
                        </Badge>
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="justify-between sm:justify-between">
            <Button variant="outline" className="text-destructive" onClick={() => editing && remove(editing)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete asset
            </Button>
            <Button onClick={saveEdit}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssetCard({ asset, onOpen }: { asset: Asset; onOpen: () => void }) {
  const [copied, setCopied] = useState(false);
  const Icon = TYPE_ICON[asset.type];

  const copyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — ignore
    }
  };

  return (
    <div className="group overflow-hidden rounded-lg border bg-card">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="relative flex h-28 w-full cursor-pointer items-center justify-center bg-muted"
        title="Click to view details"
      >
        {asset.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
        <button
          type="button"
          onClick={copyUrl}
          title="Copy URL"
          className="absolute top-1.5 right-1.5 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium">{asset.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {asset.tags.slice(0, 2).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              {t}
            </Badge>
          ))}
          <span>{formatSize(asset.size)}</span>
        </div>
      </div>
    </div>
  );
}
