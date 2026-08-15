import Image from "next/image";

// Flat, transparent icon marks supplied directly by the user (no glare, no
// backing tile) — a black version for light surfaces and a white version
// for dark surfaces, swapped via `theme`.
const MARK_ON_LIGHT = { src: "/pronoi/mark-onlight.png", width: 491, height: 418 };
const MARK_ON_DARK = { src: "/pronoi/mark-ondark.png", width: 480, height: 397 };

export type PronoiLogoTheme = "onLight" | "onDark";

/** PRONOI mark. `theme="onLight"` (default) is black, for light backgrounds; `theme="onDark"` is white, for dark backgrounds. */
export function PronoiMarkIcon({ className, theme = "onLight" }: { className?: string; theme?: PronoiLogoTheme }) {
  const mark = theme === "onDark" ? MARK_ON_DARK : MARK_ON_LIGHT;
  return (
    <Image
      src={mark.src}
      alt="PRONOI"
      width={mark.width}
      height={mark.height}
      className={className ?? "h-6 w-auto"}
      priority
    />
  );
}

/** Logo lockup: mark + wordmark, matching the site's existing header/footer sizing conventions. */
export function PronoiLogo({
  className,
  markClassName,
  theme = "onLight",
}: {
  className?: string;
  markClassName?: string;
  theme?: PronoiLogoTheme;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <PronoiMarkIcon className={markClassName ?? "h-6 w-auto"} theme={theme} />
      <span className="font-heading text-xl leading-none tracking-tight">PRONOI</span>
    </span>
  );
}
