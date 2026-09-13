import { Megaphone } from "lucide-react";

// Recreates the reference Hope UI dashboard's "Hello Devs!" welcome banner —
// same layout/typography, but the wavy background is redrawn with our own
// CSS gradients + blobs rather than reusing the template's proprietary PNG art.
export function WelcomeBanner({ name }: { name?: string }) {
  return (
    <div className="hopeui-gradient relative -mx-6 -mt-6 overflow-hidden px-8 py-10 text-primary-foreground">
      <div
        className="pointer-events-none absolute -top-16 right-10 h-56 w-56 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 -bottom-24 h-64 w-64 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 right-40 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-white">Hello{name ? `, ${name}` : ""}!</h1>
          <p className="mt-2 text-white/80">Here&apos;s what&apos;s happening with your content today.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
        >
          <Megaphone className="h-4 w-4" />
          Announcements
        </button>
      </div>
    </div>
  );
}
