import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark"; // light text for dark backgrounds, dark text for light backgrounds
  showTagline?: boolean;
}

/**
 * Renders the official, custom SVG symbol of Autoflow (cursive looping gradient ribbon ending in a blue arrow).
 */
export function LogoIcon({ className = "w-12 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 110 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="autoflow-official-grad" x1="0%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stopColor="#10b981" /> {/* Teal/Green starting point */}
          <stop offset="35%" stopColor="#0ea5e9" /> {/* Bright Cyan */}
          <stop offset="70%" stopColor="#2563eb" /> {/* Solid Blue */}
          <stop offset="100%" stopColor="#1d4ed8" /> {/* Darker Blue */}
        </linearGradient>
      </defs>
      
      {/* The precise looping ribbon path matching the Autoflow logo style */}
      <path
        d="M 12 55 C 10 40, 24 22, 38 25 C 50 28, 48 46, 36 51 C 24 56, 18 42, 18 36 C 18 24, 38 18, 54 26 L 85 18"
        stroke="url(#autoflow-official-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Arrowhead pointing up-right, perfectly aligned with the stem */}
      <path
        d="M 74 25 L 91 16 L 85 33 L 81 27 Z"
        fill="#1d4ed8"
      />
    </svg>
  );
}

/**
 * Renders the full brand logo (Symbol + "autoflow" + "AUTOMATION SOLUTIONS").
 */
export default function Logo({ className = "h-11", variant = "light", showTagline = true }: LogoProps) {
  // Variant "light" means light background, so text should be dark navy.
  // Variant "dark" means dark background, so text should be white.
  const textColor = variant === "dark" ? "text-white" : "text-[#0f2a4a]";
  const taglineColor = variant === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Logo symbol */}
      <LogoIcon className="h-full w-auto aspect-[11/7] shrink-0" />
      
      {/* Text brand matching the official Autoflow typography */}
      <div className="flex flex-col justify-center">
        <h1 className={`font-sans font-bold text-[22px] tracking-tight leading-none ${textColor}`}>
          autoflow
        </h1>
        {showTagline && (
          <span className={`text-[8.5px] font-sans tracking-[0.18em] uppercase font-bold mt-1 leading-none ${taglineColor}`}>
            AUTOMATION SOLUTIONS
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Returns a data URL of the SVG logo icon to be embedded directly into QR code generators.
 */
export function getLogoSvgDataUrl(): string {
  const svgString = `
    <svg viewBox="0 0 110 70" fill="none" xmlns="http://www.w3.org/2000/svg" width="110" height="70">
      <defs>
        <linearGradient id="qr-autoflow-grad" x1="0%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="35%" stop-color="#0ea5e9" />
          <stop offset="70%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <path
        d="M 12 55 C 10 40, 24 22, 38 25 C 50 28, 48 46, 36 51 C 24 56, 18 42, 18 36 C 18 24, 38 18, 54 26 L 85 18"
        stroke="url(#qr-autoflow-grad)"
        stroke-width="7"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M 74 25 L 91 16 L 85 33 L 81 27 Z"
        fill="#1d4ed8"
      />
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}
