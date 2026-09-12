"use client";

import { Compass, Film, Flame, Home, Play, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { containerDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  fire: Flame,
  play: Play,
  search: Search,
  film: Film,
};

export function BottomNavigation({ section, navigation }: PwaComponentProps) {
  const pathname = usePathname();
  const items = navigation?.bottom ?? [];
  const floating = section.variant === "floating";

  if (items.length === 0) return null;

  return (
    <nav
      className={floating ? "fixed inset-x-4 bottom-4 z-40 flex justify-around rounded-full px-4 py-3" : "fixed inset-x-0 bottom-0 z-40 flex justify-around border-t py-2"}
      style={{
        backgroundColor: "var(--color-background)",
        boxShadow: "var(--shadow-lg)",
        borderRadius: floating ? "var(--radius-large)" : 0,
        ...containerDesignStyle(section.resolved_design),
      }}
    >
      {items.map((item) => {
        const Icon = (item.icon && ICONS[item.icon]) || Compass;
        const active = pathname === item.url;
        return (
          <Link
            key={item.id}
            href={item.url}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] transition-colors"
            style={{
              color: active ? "var(--color-primary)" : "var(--color-muted)",
              backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
            }}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
