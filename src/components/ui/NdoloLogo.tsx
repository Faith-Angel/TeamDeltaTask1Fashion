import React from 'react';

interface NdoloLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * NdoloStitch Logo
 * A fashion-forward sewing needle with thread through the eye.
 * Cameroonian palette: savanna green + gold + white thread.
 * The needle sits at ~45°, thread enters the eye and flows in an elegant S-curve.
 */
export function NdoloLogo({ className = '', showText = true, size = 'md' }: NdoloLogoProps) {
  const dims = { sm: 32, md: 40, lg: 52 }[size];
  const textSize = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }[size];
  const fontStyle = { sm: 'tracking-tight', md: 'tracking-tight', lg: 'tracking-tight' }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`} role="img" aria-label="NdoloStitch logo">
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* ── Deep green circle background ── */}
        <circle cx="22" cy="22" r="21" fill="#3E6B1F" />

        {/* ── Subtle inner ring — elegance detail ── */}
        <circle cx="22" cy="22" r="19.5" fill="none" stroke="#4A7C25" strokeWidth="1" />

        {/* ══ NEEDLE — drawn at ~135° (top-right to bottom-left diagonal) ══
            The needle body is a slim rounded rectangle.
            Top = the eye end (blunt, with hole).
            Bottom = the sharp point.
        */}

        {/* Needle body — slim gold bar, rotated 135° */}
        <rect
          x="20.25" y="7"
          width="3.5" height="22"
          rx="1.75"
          fill="#F9A825"
          transform="rotate(40 22 22)"
        />

        {/* Needle highlight — thin lighter stripe down the middle */}
        <rect
          x="21.4" y="7.5"
          width="1.2" height="20"
          rx="0.6"
          fill="#FDD835"
          opacity="0.6"
          transform="rotate(40 22 22)"
        />

        {/* Needle tip — sharp pointed end (bottom-left of the rotated needle) */}
        {/* Covered by the rounded rect above — the rx handles the tip elegantly */}

        {/* ══ NEEDLE EYE — the hole at the blunt top end ══
            After rotate(40°), the "top" of the needle is at roughly (28, 10).
            The eye is a small ellipse cut into the needle.
        */}
        <ellipse
          cx="28.2" cy="11.5"
          rx="1.1" ry="1.8"
          fill="#3E6B1F"
          transform="rotate(40 28.2 11.5)"
        />

        {/* ══ THREAD — enters through the eye, flows in an elegant S-curve ══
            Starts at the eye (~28, 10), loops up and to the right (tail above eye),
            then flows down through the eye, arcs left and down in a graceful
            tailor's-thread curve, ending with a small loop at the bottom.
        */}

        {/* Thread tail above the eye (the short end above) */}
        <path
          d="M 30 8.5 C 32 7, 34 8, 33 10"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Main thread — from eye, flowing down-left in an S-curve */}
        <path
          d="M 27.5 13 C 25 17, 28 21, 23 25 C 18 29, 14 27, 13 32"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />

        {/* Thread loop at the bottom — elegant finishing loop */}
        <path
          d="M 13 32 C 11 34, 10 37, 13 37 C 16 37, 16 34, 14 33"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* ══ CAMEROONIAN STAR — 5-pointed, top-right corner ══ */}
        <path
          d="M 34 8 L 34.9 10.7 L 37.7 10.7 L 35.5 12.4 L 36.3 15.1 L 34 13.5 L 31.7 15.1 L 32.5 12.4 L 30.3 10.7 L 33.1 10.7 Z"
          fill="#F9A825"
          opacity="0.95"
        />
      </svg>

      {showText && (
        <span className={`font-bold text-primary ${textSize} ${fontStyle} select-none`}>
          ndolostitch
        </span>
      )}
    </div>
  );
}

export default NdoloLogo;
