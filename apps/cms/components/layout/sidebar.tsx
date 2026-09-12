"use client";

import {
  LayoutDashboard,
  Newspaper,
  Palette,
  Blocks,
  FileStack,
  Compass,
  Building2,
  MonitorSmartphone,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [{ href: "/articles", label: "Articles", icon: Newspaper }],
  },
  {
    label: "Design",
    items: [
      { href: "/themes", label: "Themes", icon: Palette },
      { href: "/components", label: "Components", icon: Blocks },
      { href: "/pages", label: "Pages", icon: FileStack },
      { href: "/navigation", label: "Navigation", icon: Compass },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/pwa-targets", label: "PWA Targets", icon: MonitorSmartphone },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          H
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Hook CMS</div>
          <div className="text-[11px] text-sidebar-foreground/60">Theme-driven platform</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-2 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 px-3 text-[10px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary/15 text-white"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary transition-opacity",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-white"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
