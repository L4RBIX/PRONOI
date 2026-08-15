import { useId } from "react";
import { cn } from "@/lib/utils";
import { GradientBackground } from "./GradientBackground";
import { GradientPalette } from "./shaders";
import { ORB_BLOB_HEIGHT, ORB_BLOB_RADIUS, ORB_BLOB_Y, ORB_GLYPHS, ORB_VIEWBOX, type OrbState } from "./orbGlyphs";

/**
 * Faithful port of handhold.io's own "Orb" component: a circular clip of the
 * same GradientBackground shader used elsewhere on the site, overlaid with an
 * 8-blob black glyph (the same glyph the live site's agent avatar uses),
 * whose exact positions differ per `state`. Used decoratively (no live
 * audio) for the "Create your own agent" section, matching the live site's
 * own decorative usage exactly (same state/palette/seed per orb).
 */
export function Orb({
  state,
  palette,
  seed = 0,
  className,
}: {
  state: OrbState;
  palette: GradientPalette;
  seed?: number;
  className?: string;
}) {
  const blobs = ORB_GLYPHS[state];
  const clipId = useId();
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-full shadow-xs", className)}>
      <GradientBackground palette={palette} seed={seed} className="absolute inset-0 h-full w-full" />
      <svg viewBox={ORB_VIEWBOX} className="relative h-full w-full">
        <defs>
          <clipPath id={clipId}>
            <circle r={50} />
          </clipPath>
        </defs>
        <circle r={50} fill="none" />
        <g clipPath={`url(#${clipId})`}>
          {blobs.map((blob, i) => (
            <g key={i} transform={`translate(${blob.cx} ${blob.cy})`}>
              <rect
                width={Math.max(0, blob.width)}
                x={-blob.width / 2}
                y={ORB_BLOB_Y}
                height={ORB_BLOB_HEIGHT}
                rx={ORB_BLOB_RADIUS}
                ry={ORB_BLOB_RADIUS}
                fill="black"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
