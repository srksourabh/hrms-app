/**
 * <SaudiBackdrop />
 *
 * A purely-CSS, fully-themed, RTL-aware hero backdrop representing a
 * stylized Saudi Arabian cityscape at golden hour. Layers:
 *
 *   1. Sky gradient — night → sunset orange → sand haze at horizon
 *   2. Ateeqah / Najdi architecture silhouettes (geometric Najdi triangles)
 *   3. Riyadh / Jeddah modern skyline (Kingdom Tower + Burj Al-Khalifa
 *      silhouette as a tribute to the wider Gulf)
 *   4. Dunes — three layered shapes for depth
 *   5. Gold glow behind the skyline
 *   6. A subtle field of stars (radial gradients, very low opacity)
 *
 * No external image assets — every shape is an inline SVG so it
 * scales, theming-vars work, and the package stays asset-free.
 *
 * Use it as a full-bleed background. Children are layered on top with
 * `relative z-10`. The component owns its own `position: absolute; inset: 0`
 * layers; the parent should be `position: relative; overflow: hidden;`.
 *
 * Variants:
 *   - "riyadh" (default) — Kingdom Tower + Najdi architecture
 *   - "jeddah" — Al-Balad old town + Red Sea coast silhouette
 *   - "neom" — futuristic The Line silhouette
 *   - "desert" — pure dunes, no skyline
 */

import * as React from "react";

export type BackdropVariant = "riyadh" | "jeddah" | "neom" | "desert";

interface SaudiBackdropProps {
  variant?: BackdropVariant;
  /** When true, dim the scene by 50% (useful for putting busy content on top). */
  dim?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SaudiBackdrop({
  variant = "riyadh",
  dim = false,
  className = "",
  children,
}: SaudiBackdropProps) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      aria-hidden={!children ? "true" : undefined}
    >
      {/* Layer 1: sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, " +
            "hsl(var(--hero-sky-top)) 0%, " +
            "hsl(220 50% 18%) 35%, " +
            "hsl(var(--hero-sky-mid)) 70%, " +
            "hsl(var(--hero-sky-low)) 100%)",
        }}
      />

      {/* Layer 2: stars (only on riyadh / neom where night sky is visible) */}
      {(variant === "riyadh" || variant === "neom") && <StarsLayer />}

      {/* Layer 3: warm sun/moon glow behind skyline */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "55%",
          width: "420px",
          height: "420px",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, hsl(var(--hero-glow) / 0.55) 0%, hsl(var(--hero-glow) / 0.15) 35%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Layer 4: skyline silhouette (variant-specific) */}
      <SkylineLayer variant={variant} />

      {/* Layer 5: dunes (foreground, layered for depth) */}
      <DunesLayer variant={variant} />

      {/* Layer 6: dim overlay for content readability */}
      {dim && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--saudi-night) / 0.4) 0%, hsl(var(--saudi-night) / 0.6) 100%)",
          }}
        />
      )}

      {/* Optional content layered on top */}
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}

function StarsLayer() {
  // 30 pseudo-random stars using radial gradients; positions chosen for visual
  // balance, not a true RNG (no need for hydration mismatch).
  const stars = [
    [8, 12, 1.5], [18, 8, 1], [25, 22, 1.8], [33, 15, 1.2], [42, 6, 0.8],
    [55, 18, 1.5], [62, 10, 1], [70, 25, 1.3], [78, 14, 0.9], [85, 8, 1.6],
    [92, 20, 1.1], [12, 30, 0.7], [22, 35, 1], [38, 28, 0.8], [48, 32, 1.4],
    [65, 28, 1.2], [75, 38, 0.9], [88, 32, 1.1], [5, 22, 0.6], [95, 5, 1.3],
    [50, 4, 0.8], [30, 3, 0.7], [60, 6, 0.6], [80, 30, 0.8], [15, 18, 0.5],
    [70, 4, 0.7], [40, 22, 0.6], [55, 28, 0.5], [25, 28, 0.6], [85, 25, 0.5],
  ] as const;
  return (
    <div className="absolute inset-x-0 top-0 h-2/3">
      {stars.map(([x, y, r], i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${r}px`,
            height: `${r}px`,
            background: "white",
            boxShadow: `0 0 ${r * 3}px hsl(0 0% 100% / 0.6)`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

function SkylineLayer({ variant }: { variant: BackdropVariant }) {
  // Each variant produces a different SVG silhouette. All anchored to the
  // bottom of the parent so they "stand" on the dunes.
  return (
    <div
      className="absolute inset-x-0"
      style={{ bottom: "32%", height: "30%" }}
      aria-hidden="true"
    >
      <SkylineSVG variant={variant} />
    </div>
  );
}

function SkylineSVG({ variant }: { variant: BackdropVariant }) {
  const color = "hsl(var(--hero-skyline))";
  if (variant === "riyadh") {
    // Kingdom Tower (the distinctive "skyscapper" with a hole near the top)
    // flanked by Najdi-style geometric towers (triangular tops, characteristic
    // of Salmani architecture). Anchored at y=100 (bottom of viewBox).
    return (
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* Najdi-style left cluster: triangle-topped buildings */}
        <polygon points="40,180 80,140 120,180" fill={color} />
        <rect x="44" y="180" width="72" height="120" fill={color} />
        <polygon points="120,180 160,130 200,180" fill={color} />
        <rect x="124" y="180" width="72" height="120" fill={color} />
        <polygon points="200,200 235,160 270,200" fill={color} />
        <rect x="204" y="200" width="62" height="100" fill={color} />

        {/* Mid-ground varied towers */}
        <rect x="280" y="170" width="40" height="130" fill={color} />
        <rect x="325" y="155" width="55" height="145" fill={color} />
        <rect x="385" y="180" width="35" height="120" fill={color} />
        <rect x="425" y="140" width="65" height="160" fill={color} />

        {/* Kingdom Tower: tall, distinctive with a hole at the top */}
        <rect x="510" y="40" width="42" height="260" fill={color} />
        <ellipse cx="531" cy="48" rx="20" ry="9" fill={color} />
        <rect x="525" y="58" width="12" height="20" fill="hsl(var(--hero-sky-low))" />
        <polygon points="510,40 552,40 531,4" fill={color} />

        {/* Right cluster: more Najdi + modern mix */}
        <rect x="565" y="120" width="50" height="180" fill={color} />
        <polygon points="615,140 645,100 675,140" fill={color} />
        <rect x="619" y="140" width="52" height="160" fill={color} />
        <rect x="680" y="170" width="40" height="130" fill={color} />
        <rect x="725" y="155" width="55" height="145" fill={color} />
        <polygon points="785,180 825,140 865,180" fill={color} />
        <rect x="789" y="180" width="72" height="120" fill={color} />
        <polygon points="865,200 905,160 945,200" fill={color} />
        <rect x="869" y="200" width="72" height="100" fill={color} />
        <rect x="950" y="180" width="40" height="120" fill={color} />
        <rect x="995" y="160" width="50" height="140" fill={color} />
        <rect x="1050" y="180" width="60" height="120" fill={color} />
        <rect x="1115" y="195" width="60" height="105" fill={color} />

        {/* Window lights (warm yellow) */}
        {Array.from({ length: 40 }).map((_, i) => {
          const x = 30 + i * 28;
          const y = 180 + ((i * 17) % 80);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="2"
              height="2"
              fill="hsl(var(--hero-glow) / 0.6)"
            />
          );
        })}
      </svg>
    );
  }

  if (variant === "jeddah") {
    // Al-Balad old town (low-rise coral buildings with mashrabiya windows)
    // + Jeddah Tower (would be the world's tallest, drawn as a tall slim
    // triangle in the background to suggest the future skyline)
    return (
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* Far background: Jeddah Tower silhouette */}
        <polygon points="700,300 730,30 760,300" fill={color} opacity="0.5" />

        {/* Coral-stone low-rise cluster (Al-Balad) */}
        <rect x="0" y="220" width="100" height="80" fill={color} />
        <rect x="100" y="200" width="80" height="100" fill={color} />
        <rect x="180" y="230" width="90" height="70" fill={color} />
        <polygon points="270,210 310,180 350,210 350,300 270,300" fill={color} />
        <rect x="350" y="220" width="80" height="80" fill={color} />
        <rect x="430" y="200" width="100" height="100" fill={color} />
        {/* Roshan / mashrabiya windows (small lit squares) */}
        {Array.from({ length: 60 }).map((_, i) => {
          const x = 5 + (i * 19) % 1180;
          const y = 200 + ((i * 13) % 80);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="2"
              height="2"
              fill="hsl(var(--hero-glow) / 0.5)"
            />
          );
        })}
        {/* Mid-ground taller buildings */}
        <rect x="540" y="160" width="50" height="140" fill={color} />
        <rect x="595" y="140" width="60" height="160" fill={color} />
        <rect x="660" y="170" width="50" height="130" fill={color} />
        <rect x="800" y="150" width="55" height="150" fill={color} />
        <rect x="860" y="175" width="45" height="125" fill={color} />
        <rect x="910" y="155" width="60" height="145" fill={color} />
        <rect x="975" y="170" width="50" height="130" fill={color} />
        <rect x="1030" y="155" width="60" height="145" fill={color} />
        <rect x="1095" y="180" width="60" height="120" fill={color} />
      </svg>
    );
  }

  if (variant === "neom") {
    // NEOM "The Line" — futuristic, very linear, mirrored
    return (
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* The Line: a single monumental horizontal structure */}
        <rect x="0" y="180" width="1200" height="14" fill={color} />
        <rect x="100" y="200" width="1000" height="100" fill={color} />
        {/* Mirrored upper portion (vertical mirror) */}
        <rect x="100" y="60" width="1000" height="120" fill={color} opacity="0.85" />
        {/* Vertical fins (signature look) */}
        {Array.from({ length: 30 }).map((_, i) => {
          const x = 110 + i * 33;
          return <line key={i} x1={x} y1="60" x2={x} y2="180" stroke="hsl(var(--hero-sky-low))" strokeWidth="1" opacity="0.6" />;
        })}
        {/* Subtle end caps */}
        <polygon points="0,180 100,200 100,300 0,300" fill={color} />
        <polygon points="1200,180 1100,200 1100,300 1200,300" fill={color} />
        <polygon points="0,180 100,160 100,60 0,60" fill={color} opacity="0.85" />
        <polygon points="1200,180 1100,160 1100,60 1200,60" fill={color} opacity="0.85" />
      </svg>
    );
  }

  // desert: no skyline, only dunes
  return null;
}

function DunesLayer({ variant: _variant }: { variant: BackdropVariant }) {
  // Three layered dune silhouettes. Each is a smooth path. Sand-far is
  // lighter and more distant; sand-near is darker and closer to the viewer.
  const sandFar = "hsl(var(--hero-sand-far))";
  const sandNear = "hsl(var(--hero-sand-near))";
  return (
    <div className="absolute inset-x-0 bottom-0 h-1/3" aria-hidden="true">
      <svg
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* Far dunes */}
        <path
          d="M0,140 C150,80 300,140 450,110 C600,80 750,150 900,100 C1050,60 1150,120 1200,90 L1200,200 L0,200 Z"
          fill={sandFar}
        />
        {/* Mid dunes */}
        <path
          d="M0,170 C200,130 400,180 600,150 C800,120 1000,180 1200,150 L1200,200 L0,200 Z"
          fill={sandFar}
          opacity="0.85"
        />
        {/* Near dunes */}
        <path
          d="M0,180 C100,160 250,190 400,170 C550,150 700,190 850,180 C1000,170 1150,200 1200,180 L1200,200 L0,200 Z"
          fill={sandNear}
        />
      </svg>
    </div>
  );
}

/**
 * <SaudiPallette />
 *
 * Standalone palmette motif for decorative section dividers.
 * Renders the SVG once; consumers place it in a centered container.
 */
export function SaudiPalmette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 24"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      {/* Central diamond */}
      <polygon points="60,0 72,12 60,24 48,12" />
      {/* Left leaves */}
      <path d="M48,12 C36,6 24,8 12,12 C24,16 36,18 48,12 Z" />
      {/* Right leaves */}
      <path d="M72,12 C84,6 96,8 108,12 C96,16 84,18 72,12 Z" />
      {/* End dots */}
      <circle cx="6" cy="12" r="2" />
      <circle cx="114" cy="12" r="2" />
    </svg>
  );
}

/**
 * <SaudiFlag />
 *
 * Stylized Saudi flag mark for branding placements. Pure SVG, no raster
 * asset. The shahada is rendered as a stylized horizontal line (the full
 * Arabic text is not included for licensing/clarity reasons).
 */
export function SaudiFlagMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-label="Saudi Arabia flag"
      role="img"
    >
      <rect width="60" height="40" fill="hsl(var(--saudi-green))" rx="3" />
      {/* Simplified sword (below shahada) */}
      <rect x="14" y="26" width="32" height="2" fill="hsl(var(--saudi-honor))" />
      <polygon points="46,26 50,27 46,28" fill="hsl(var(--saudi-honor))" />
      <rect x="14" y="24" width="4" height="6" fill="hsl(var(--saudi-honor))" />
      {/* Shahada area (white horizontal bar representing the inscription) */}
      <rect x="8" y="10" width="44" height="2" fill="hsl(var(--saudi-honor))" opacity="0.95" />
      <rect x="8" y="14" width="44" height="2" fill="hsl(var(--saudi-honor))" opacity="0.85" />
    </svg>
  );
}
