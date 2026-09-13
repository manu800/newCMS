export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="hopeui-gradient relative -mx-6 -mt-6 -mb-10 overflow-hidden px-6 pt-8 pb-16">
      <div
        className="pointer-events-none absolute -top-6 right-24 h-28 w-28 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-4 right-4 h-16 w-16 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 -bottom-16 h-32 w-32 rounded-full bg-white/10"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">{title}</h1>
          {description && (
            <div className="mt-1.5 text-sm text-white/80 [&_a]:text-white [&_a]:underline">{description}</div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 [&_button]:shadow-[0_2px_10px_rgba(0,0,0,0.25)] [&_button]:ring-1 [&_button]:ring-white/30">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
