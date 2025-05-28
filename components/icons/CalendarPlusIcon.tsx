import React from 'react';

interface IconProps {
  className?: string;
}

export const CalendarPlusIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Calendar outline and top bar from Heroicons CalendarDaysIcon */}
    <path
      fillRule="evenodd"
      d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5h10.5a.75.75 0 000-1.5H4.75a.75.75 0 000 1.5z"
      clipRule="evenodd"
    />
    {/* Solid Plus icon path from Heroicons (20x20 version), scaled and translated */}
    {/* Original path: d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5V4.75z" */}
    {/* Scaled by 0.5, translated by (0, 3) to center at (10, 13) */}
    <path
      d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5V4.75z"
      transform="scale(0.55) translate(0, 5.5)"
      transform-origin="10 10"
    />
  </svg>
);