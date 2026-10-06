"use client";

import { Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProperty } from "@/hooks/use-property";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Asset } from "@cms-pwa/shared-types";

const ACCEPT: Record<"image" | "video" | "audio", string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
};

/** A real drag-and-drop (or click-to-browse) upload target — doubles as the
 * empty-state placeholder for an image/video/audio field, so adding a new
 * file no longer requires a trip to the separate Media Library page first. */
export function MediaDropzone({
  kind,
  hint,
  onUploaded,
  suggestedName,
}: {
  kind: "image" | "video" | "audio";
  hint: string;
  onUploaded: (asset: Asset) => void;
  /** Falls back to this (e.g. the article's headline) when the user leaves
   * the name prompt blank, instead of the raw uploaded file name. */
  suggestedName?: string;
}) {
  const { current } = useProperty();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File, name: string) => {
    if (!current) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("property_id", current.id);
      formData.append("name", name);
      const asset = await api.upload<Asset>("/assets/upload", formData);
      onUploaded(asset);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to upload file — only image, video, and audio are supported (max 50MB).");
    } finally {
      setUploading(false);
    }
  };

  const pickFile = (file: File) => {
    setPendingFile(file);
    setName("");
  };

  const confirmUpload = () => {
    if (!pendingFile) return;
    const finalName = name.trim() || suggestedName?.trim() || pendingFile.name;
    const file = pendingFile;
    setPendingFile(null);
    upload(file, finalName);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) pickFile(file);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed py-8 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/40 hover:bg-muted/60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pickFile(file);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Uploading…</p>
        </>
      ) : (
        <>
          <UploadCloud className={cn("h-6 w-6", dragging ? "text-primary" : "text-muted-foreground/60")} />
          <p className="text-xs font-medium text-muted-foreground">
            Drop {kind === "audio" ? "an" : "a"} {kind} here, or <span className="text-primary">click to browse</span>
          </p>
          <p className="text-[11px] text-muted-foreground/70">{hint} — up to 50MB</p>
        </>
      )}

      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && setPendingFile(null)}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Name this {kind}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="media-upload-name">Name</Label>
            <Input
              id="media-upload-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={suggestedName || pendingFile?.name}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmUpload();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use {suggestedName ? `"${suggestedName}"` : "the file's own name"}.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingFile(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
