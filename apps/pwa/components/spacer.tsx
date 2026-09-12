import type { PwaComponentProps } from "./types";

const SIZE_MAP: Record<string, number> = { small: 12, medium: 24, large: 48 };

export function Spacer({ section }: PwaComponentProps) {
  const height = (section.props?.height as number) || SIZE_MAP[section.variant ?? "medium"] || 24;
  return <div style={{ height }} />;
}
