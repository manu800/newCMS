import type { NavItem, ResolvedSection } from "@cms-pwa/shared-types";

export interface PwaComponentProps {
  section: ResolvedSection;
  navigation?: { top: NavItem[]; bottom: NavItem[]; sidebar: NavItem[] };
  property?: { name: string; slug: string; logo?: string };
}
