import type { NavItem, ResolvedSection } from "@cms-pwa/shared-types";

import { componentRegistry } from "./component-registry";

export function SectionRenderer({
  section,
  navigation,
  property,
}: {
  section: ResolvedSection;
  navigation?: { top: NavItem[]; bottom: NavItem[]; sidebar: NavItem[] };
  property?: { name: string; slug: string; logo?: string };
}) {
  const Component = componentRegistry[section.type];
  if (!Component) return null;
  if (section.resolved_design?.hidden) return null;

  return (
    <div
      style={{
        paddingTop: section.config?.spacing?.top ?? 0,
        paddingBottom: section.config?.spacing?.bottom ?? 0,
      }}
    >
      <Component section={section} navigation={navigation} property={property} />
    </div>
  );
}
