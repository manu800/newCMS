export function SectionHeading({ title, style }: { title?: string; style?: React.CSSProperties }) {
  if (!title) return null;
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-4 w-1 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
      <h2 className="text-lg" style={{ fontWeight: "var(--font-heading-weight)", ...style }}>
        {title}
      </h2>
    </div>
  );
}
