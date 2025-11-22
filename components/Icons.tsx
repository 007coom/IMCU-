
import React from 'react';

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

export const IconBiohazard: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" className="opacity-20" />
    <path d="M12 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M12 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
    <path d="M18.5 12a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
    <path d="M5.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z" />
    <path d="M12 8.5V15.5" />
    <path d="M15.03 10.25l-3.03 5.25" />
    <path d="M8.97 10.25l3.03 5.25" />
  </svg>
);

export const IconRadioactive: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
    <path d="M12 12L4.93 20.5" />
    <path d="M12 12L19.07 20.5" />
    <path d="M12 12V3.5" />
    <path d="M16.5 4.5a9 9 0 1 1-9 0" />
  </svg>
);

export const IconCircuit: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 9h-2" />
    <path d="M6 15h-2" />
    <path d="M18 9h2" />
    <path d="M18 15h2" />
  </svg>
);

export const IconDatabase: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M21 12v-3" />
    <path d="M3 12v-3" />
  </svg>
);

export const IconLock: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const IconEye: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="3" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21" />
  </svg>
);

export const IconSatellite: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 7a5 5 0 1 0-6.546 2.973" />
    <path d="m17 3-5 5" />
    <path d="m14 8-1-1" />
    <path d="m3 11 3 3" />
    <path d="m9 17 4 4" />
    <path d="m21 3-9 9" />
    <path d="m12 12 3 3" />
  </svg>
);

export const IconDna: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 15c6.667-6 13.333 0 20-6" />
    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
    <path d="M17 6l-2.5-2.5" />
    <path d="M14 8l-1-1" />
    <path d="M7 18l2.5 2.5" />
    <path d="M3.5 14.5l.5 .5" />
    <path d="M20 9l.5 .5" />
    <path d="M6.5 12.5l1 1.5" />
    <path d="M16.5 10l1 1.5" />
    <path d="M10 16l1.5 1" />
  </svg>
);

export const IconHex: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

export const IconTerminal: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m4 6 8 8-8 8" />
    <path d="M14 22h6" />
  </svg>
);

export const IconSkull: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <path d="M8 20v2h8v-2" />
    <path d="M12.5 17l-.5-1-.5 1h1z" />
    <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
  </svg>
);

export const IconAtom: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1" />
    <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
    <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
  </svg>
);

export const IconTarget: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

export const IconGrid: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

export const IconIMCULogo: React.FC<IconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Outer Octagonal Frame */}
    <path d="M7 3 L17 3 L21 7 L21 17 L17 21 L7 21 L3 17 L3 7 Z" strokeOpacity="0.8" />
    
    {/* Inner Containment Circle */}
    <circle cx="12" cy="12" r="6" strokeOpacity="0.6" />
    
    {/* Core Singularity */}
    <circle cx="12" cy="12" r="2" fill="currentColor" className="animate-pulse" />
    
    {/* Radiation / Stabilizer Beams */}
    <path d="M12 3 V 6" />
    <path d="M12 18 V 21" />
    <path d="M3 12 H 6" />
    <path d="M18 12 H 21" />
    
    {/* Diagonal Bracing */}
    <path d="M4.5 4.5 L 7 7" strokeOpacity="0.5" />
    <path d="M19.5 4.5 L 17 7" strokeOpacity="0.5" />
    <path d="M19.5 19.5 L 17 17" strokeOpacity="0.5" />
    <path d="M4.5 19.5 L 7 17" strokeOpacity="0.5" />
  </svg>
);
