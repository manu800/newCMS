"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ContentItemForm } from "@/components/content/content-item-form";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import type { ContentItem, ContentModel } from "@cms-pwa/shared-types";

export function EditContentItemClient({ contentType, id }: { contentType: string; id: string }) {
  const { current } = useProperty();
  const [model, setModel] = useState<ContentModel | null>(null);
  const [item, setItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (!current) return;
    api
      .get<ContentModel>(`/content-models/active?property_id=${current.id}&content_type=${contentType}`)
      .then(setModel)
      .catch(() => toast.error("Failed to load content model"));
    api
      .get<ContentItem>(`/content-items/${id}`)
      .then(setItem)
      .catch(() => toast.error("Failed to load item"));
  }, [current?.id, contentType, id]);

  if (!model || !item || !current) {
    return (
      <div>
        <PageHeader title="Edit item" />
        <div className="relative z-10">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Edit ${model.name}`} />
      <div className="relative z-10">
        <ContentItemForm model={model} propertyId={current.id} initial={item} />
      </div>
    </div>
  );
}
