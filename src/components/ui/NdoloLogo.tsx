import React from 'react';

interface NdoloLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * NdoloStitch Logo — Needle & Thread with Cameroonian motif.
 * The needle points diagonally, thread loops in the shape of a kente-inspired curve.
 * Colours: Savanna green (primary) + warm gold (accent) echoing the Cameroonian flag palette.
 */
export function NdoloLogo({ className = '', showText = true, size = 'md' }: NdoloLogoProps) {
  const dims = { sm: 28, md: 36, lg: 48 }[size];
  const textSize = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Circular background — kente-inspired ring */}
        <circle cx="20" cy="20" r="19" fill="#558B2F" />
        <circle cx="20" cy="20" r="19" fill="none" stroke="#F9A825" strokeWidth="1.5" strokeDasharray="4 2" />

        {/* Needle body — diagonal, thick */}
        <rect
          x="11"
          y="7"
          width="3.5"
          height="18"
          rx="1.75"
          fill="#F9A825"
          transform="rotate(15 11 7)"
        />

        {/* Needle eye — the hole at the top */}
        <ellipse
          cx="13.5"
          cy="10"
          rx="1"
          ry="1.6"
          fill="#558B2F"
          transform="rotate(15 13.5 10)"
        />

        {/* Thread — loops elegantly below the needle, gold colour */}
        <path
          d="M16 18 C18 22, 22 20, 24 24 C26 28, 22 32, 18 30 C14 28, 13 24, 16 22"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Small star / asterisk — Cameroonian flag motif */}
        <path
          d="M29 11 L30 9 L31 11 L33 11 L31.5 12.5 L32 14.5 L30 13.5 L28 14.5 L28.5 12.5 L27 11 Z"
          fill="#F9A825"
          opacity="0.9"
        />
      </svg>

      {showText && (
        <span className={`font-bold text-primary ${textSize}`}>
          ndolostitch
        </span>
      )}
    </div>
  );
}

export default NdoloLogo;
