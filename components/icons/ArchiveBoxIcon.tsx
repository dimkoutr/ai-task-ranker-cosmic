
import React from 'react';

interface IconProps {
  className?: string;
}

export const ArchiveBoxIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M2.25 5.257V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V5.257A4.503 4.503 0 0018.23 3H5.77A4.503 4.503 0 002.25 5.257zM4.5 6A.75.75 0 015.25 6.75v.75a.75.75 0 01-1.5 0V6.75A.75.75 0 014.5 6zM5.25 9.75A.75.75 0 004.5 10.5v3A.75.75 0 005.25 14.25h13.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75H5.25zM10.5 10.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-.75z" clipRule="evenodd" />
    <path d="M3.98 3.269A3.002 3.002 0 016.75 2.25h10.5c1.223 0 2.27.708 2.77 1.731L21 5.25H3l.98-1.981z" />
  </svg>
);