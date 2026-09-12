"use client";

import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api-client";
import type { VersionRecord } from "@cms-pwa/shared-types";

export function VersionHistoryDialog({
  entityType,
  entityId,
  onRestored,
}: {
  entityType: "theme" | "page" | "navigation" | "component";
  entityId: string;
  onRestored: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionRecord[] | null>(null);

  useEffect(() => {
    if (open) {
      api.get<VersionRecord[]>(`/versions/${entityType}/${entityId}`).then(setVersions).catch(() => setVersions([]));
    }
  }, [open, entityType, entityId]);

  const restore = async (version: number) => {
    try {
      await api.post(`/versions/${entityType}/${entityId}/${version}/restore`);
      toast.success(`Restored version ${version}`);
      setOpen(false);
      onRestored();
    } catch {
      toast.error("Failed to restore version");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" /> Version History
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          {versions === null ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions saved yet.</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Version {v.version}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString()} {v.created_by ? `by ${v.created_by}` : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => restore(v.version)}>
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
