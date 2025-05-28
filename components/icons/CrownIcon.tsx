
import React from 'react';

interface IconProps {
  className?: string;
}

export const CrownIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5h3.75a.75.75 0 01.75.75V8.25a.75.75 0 01-.75.75h-.75v.75a3 3 0 11-6 0v-.75H7a.75.75 0 01-.75-.75V5.25A.75.75 0 017 4.5h3.75V2.75A.75.75 0 0110 2zM8.5 9H7.75V5.25H7L10 2.25 13 5.25h-.75V9h-.75v.75a1.5 1.5 0 11-3 0V9z" clipRule="evenodd" />
    <path d="M4.5 12.5A2.5 2.5 0 002 15v.75c0 1.07.93 1.913 2.001 2.186A28.47 28.47 0 0010 18.5a28.47 28.47 0 005.999-.564A2.251 2.251 0 0018 15.75V15a2.5 2.5 0 00-2.5-2.5h-11z" />
  </svg>
);
