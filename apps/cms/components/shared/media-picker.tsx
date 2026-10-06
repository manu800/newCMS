"use client";

import { FileAudio, Film, ImageIcon, Music, Play, Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaDropzone } from "@/components/shared/media-dropzone";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Asset } from "@cms-pwa/shared-types";

const MEDIA_HINT = { image: "JPG, PNG, WEBP or GIF", video: "MP4, WEBM or MOV", audio: "MP3, WAV or M4A" } as const;

const TYPE_ICON = { image: ImageIcon, video: Film, audio: FileAudio } as const;
const TYPE_LABEL = { image: "image", video: "video", audio: "audio" } as const;

/** A "Browse Library" button that opens a Media Library asset grid (filtered
 * to one type) in a dialog — picking one calls onSelect with its URL, so any
 * image/video/audio field can reuse an already-uploaded asset instead of
 * requiring a pasted URL. */
export function MediaPicker({
  type,
  value,
  onSelect,
  suggestedName,
}: {
  type: "image" | "video" | "audio";
  value?: string;
  onSelect: (asset: Asset) => void;
  /** Falls back to this (e.g. the article's headline) when the upload name
   * prompt is left blank. */
  suggestedName?: string;
}) {
  const { current } = useProperty();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [search, setSearch] = useState("");
  const Icon = TYPE_ICON[type];

  useEffect(() => {
    if (!open || !current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssets(null);
    api
      .get<Asset[]>(`/assets?property_id=${current.id}`)
      .then((all) => setAssets(all.filter((a) => a.type === type)))
      .catch(() => setAssets([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current?.id, type]);

  const filtered = (assets ?? []).filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        Browse Library
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select {TYPE_LABEL[type]} from Media Library</DialogTitle>
          </DialogHeader>

          <MediaDropzone
            kind={type}
            hint={MEDIA_HINT[type]}
            onUploaded={(asset) => {
              onSelect(asset);
              setOpen(false);
            }}
            suggestedName={suggestedName}
          />

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="pl-8"
            />
          </div>

          {assets === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {assets.length === 0
                ? `No ${TYPE_LABEL[type]} assets yet — upload one in Media Library first.`
                : "No assets match your search."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {filtered.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset);
                    setOpen(false);
                  }}
                  className={cn(
                    "group overflow-hidden rounded-lg border text-left transition-colors hover:border-primary",
                    value === asset.url && "border-primary ring-2 ring-primary/30"
                  )}
                >
                  <div className="relative flex h-20 w-full items-center justify-center overflow-hidden bg-muted">
                    {asset.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                    ) : asset.type === "video" ? (
                      <>
                        <video src={asset.url} preload="metadata" muted className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                            <Play className="h-3 w-3 translate-x-0.5 fill-current" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Music className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="truncate p-1.5 text-xs font-medium">{asset.name}</p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
