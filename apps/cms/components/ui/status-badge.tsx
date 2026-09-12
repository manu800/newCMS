import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-700",
  active: "bg-emerald-500/10 text-emerald-700",
  draft: "bg-amber-500/10 text-amber-700",
  inactive: "bg-slate-500/10 text-slate-600",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge className={cn("capitalize", STATUS_STYLES[status] ?? "bg-slate-500/10 text-slate-600", className)}>
      {status}
    </Badge>
  );
}
