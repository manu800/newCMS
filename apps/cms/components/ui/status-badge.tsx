import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Solid, bold color pills — legible both in table rows (white background)
// and inside the PageHeader gradient banner, so no separate "onDark" style
// is needed.
const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-600 text-white",
  active: "bg-emerald-600 text-white",
  draft: "bg-amber-500 text-white",
  inactive: "bg-slate-500 text-white",
};

const FALLBACK_STYLE = "bg-slate-500 text-white";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
  /** @deprecated no longer needed — the solid style already works on any background. */
  onDark?: boolean;
}) {
  return <Badge className={cn("capitalize", STATUS_STYLES[status] ?? FALLBACK_STYLE, className)}>{status}</Badge>;
}
