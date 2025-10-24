import { memo } from "react";

interface LogoMarkProps {
  size?: number;
}

const LogoMark = ({ size = 48 }: LogoMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role="img"
    aria-label="Focus Flow logo"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="ff-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="35%" stopColor="#6366f1" />
        <stop offset="70%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <radialGradient id="ff-logo-glow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>

    <g>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#ff-logo-bg)" />
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#ff-logo-glow)" />
    </g>

    <path
      d="M22 21c0-4.418 3.582-8 8-8h4c5.523 0 10 4.477 10 10 0 5.402-4.272 9.79-9.66 9.996l-.34.004H30v-6h4c1.657 0 3-1.343 3-3 0-1.594-1.246-2.897-2.818-2.995L34 21h-4v22h6c4.418 0 8 3.582 8 8H26c-4.418 0-8-3.582-8-8V21Z"
      fill="white"
      fillOpacity="0.92"
    />
    <path
      d="M20 43h-4c0 7.732 6.268 14 14 14h16c0-7.18-5.693-13-12.818-13.986L32 43h-6v-6h-6v6Z"
      fill="rgba(15,23,42,0.18)"
    />
  </svg>
);

export default memo(LogoMark);
