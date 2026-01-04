/**
 * OrangeCat Icon - Cute Cat in Pirate Hat
 *
 * Minimalist, cute SVG icon of a cat wearing a pirate hat.
 * Modular component that can be used standalone or within Logo.
 *
 * Created: 2025-12-27
 * Last Modified: 2025-12-27
 * Last Modified Summary: Created minimalist cute cat in pirate hat icon
 */

import React from 'react';

export interface CatIconProps {
  /** Custom className for sizing and styling (e.g., w-8 h-8) */
  className?: string;
  /** Custom color for the cat (default: orange) */
  catColor?: string;
  /** Custom color for the hat (default: black) */
  hatColor?: string;
}

/**
 * Cute minimalist cat in pirate hat icon
 * 
 * Size is controlled via className (e.g., w-8 h-8, w-12 h-12).
 * The SVG scales to 100% of its container.
 */
export function CatIcon({
  className = '',
  catColor = '#FF6B00', // Bitcoin orange
  hatColor = '#1A1A1A', // Dark gray/black
}: CatIconProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OrangeCat - Cute cat in pirate hat"
    >
      {/* Cat Head - rounded face */}
      <ellipse
        cx="20"
        cy="22"
        rx="12"
        ry="11"
        fill="#FFF3E6"
        stroke={catColor}
        strokeWidth="1.5"
      />

      {/* Cat Ears */}
      <polygon
        points="8,14 12,6 15,16"
        fill={catColor}
        stroke={catColor}
        strokeWidth="1"
      />
      <polygon
        points="32,14 28,6 25,16"
        fill={catColor}
        stroke={catColor}
        strokeWidth="1"
      />

      {/* Pirate Hat - Base */}
      <ellipse
        cx="20"
        cy="8"
        rx="14"
        ry="3"
        fill={hatColor}
      />

      {/* Pirate Hat - Crown */}
      <path
        d="M 6 8 Q 20 2 34 8 L 34 11 Q 20 5 6 11 Z"
        fill={hatColor}
      />

      {/* Hat Band/Decoration */}
      <ellipse
        cx="20"
        cy="9.5"
        rx="12"
        ry="1.5"
        fill="#FFD700"
        opacity="0.8"
      />

      {/* Skull on Hat (minimalist) */}
      <circle
        cx="20"
        cy="9.5"
        r="2.5"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <circle
        cx="18.5"
        cy="9"
        r="0.8"
        fill={hatColor}
      />
      <circle
        cx="21.5"
        cy="9"
        r="0.8"
        fill={hatColor}
      />
      <path
        d="M 19 10.5 Q 20 11 21 10.5"
        stroke={hatColor}
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Cat Eyes - cute and friendly */}
      <ellipse
        cx="16"
        cy="21"
        rx="2"
        ry="2.5"
        fill="#1A1A1A"
      />
      <ellipse
        cx="24"
        cy="21"
        rx="2"
        ry="2.5"
        fill="#1A1A1A"
      />
      {/* Eye highlights */}
      <circle
        cx="16.5"
        cy="20.5"
        r="0.6"
        fill="#FFFFFF"
      />
      <circle
        cx="24.5"
        cy="20.5"
        r="0.6"
        fill="#FFFFFF"
      />

      {/* Cat Nose - small triangle */}
      <path
        d="M 20 25 L 18.5 27 L 21.5 27 Z"
        fill={catColor}
      />

      {/* Cat Smile - cute curved line */}
      <path
        d="M 18 28 Q 20 30 22 28"
        stroke={catColor}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Whiskers - minimalist */}
      <line
        x1="6"
        y1="24"
        x2="14"
        y2="24"
        stroke={catColor}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="26"
        x2="14"
        y2="26"
        stroke={catColor}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="24"
        x2="26"
        y2="24"
        stroke={catColor}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="26"
        x2="26"
        y2="26"
        stroke={catColor}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default CatIcon;

