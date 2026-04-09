interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 24, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Back-left layer */}
      <rect
        x="8"
        y="14"
        width="22"
        height="22"
        rx="4"
        transform="rotate(-45 19 25)"
        fill="oklch(0.72 0.12 195)"
        opacity="0.45"
      />
      {/* Back-right layer */}
      <rect
        x="18"
        y="14"
        width="22"
        height="22"
        rx="4"
        transform="rotate(-45 29 25)"
        fill="oklch(0.65 0.14 195)"
        opacity="0.5"
      />
      {/* Front center layer */}
      <rect
        x="13"
        y="11"
        width="22"
        height="22"
        rx="4"
        transform="rotate(-45 24 22)"
        fill="oklch(0.50 0.16 195)"
        opacity="0.85"
      />
      {/* Amber focal point */}
      <circle cx="24" cy="22" r="3.5" fill="oklch(0.75 0.15 75)" />
    </svg>
  );
}
