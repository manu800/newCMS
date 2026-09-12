import Link from "next/link";
import { Search } from "lucide-react";

import { containerDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

export function Header({ section, navigation, property }: PwaComponentProps) {
  const transparent = section.variant === "transparent";
  const showSearch = section.props?.showSearch !== false;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur"
      style={{
        backgroundColor: transparent ? "transparent" : "color-mix(in srgb, var(--color-surface) 92%, transparent)",
        boxShadow: transparent ? "none" : "var(--shadow-sm)",
        ...containerDesignStyle(section.resolved_design),
      }}
    >
      <Link href="/" className="text-lg font-bold" style={{ color: "var(--color-primary)", fontWeight: "var(--font-heading-weight)" }}>
        {property?.name ?? "Hook"}
      </Link>
      <nav className="hidden gap-6 text-sm md:flex" style={{ color: "var(--color-muted)" }}>
        {(navigation?.top ?? []).map((item) => (
          <Link key={item.id} href={item.url} className="relative py-1 transition-colors hover:text-[var(--color-primary)]">
            {item.label}
          </Link>
        ))}
      </nav>
      {showSearch && (
        <Link
          href="/search"
          aria-label="Search"
          className="rounded-full p-2 transition-colors hover:bg-[var(--color-primary)]/10"
        >
          <Search className="h-5 w-5" style={{ color: "var(--color-muted)" }} />
        </Link>
      )}
    </header>
  );
}
