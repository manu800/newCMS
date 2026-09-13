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
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          H
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-accent-foreground">Hook CMS</div>
          <div className="text-[11px] text-sidebar-foreground/60">Theme-driven platform</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-2 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-3 text-base font-medium text-foreground">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-base font-normal transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_10px_20px_-10px_rgba(58,87,232,0.5)]"
                        : "text-sidebar-foreground hover:text-sidebar-primary"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground group-hover:text-sidebar-primary"
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
