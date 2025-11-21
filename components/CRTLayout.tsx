import React from 'react';

interface CRTLayoutProps {
  children: React.ReactNode;
  isOn: boolean;
}

export const CRTLayout: React.FC<CRTLayoutProps> = ({ children, isOn }) => {
  if (!isOn) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full opacity-50 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-zinc-950 overflow-hidden font-vt323 text-amber-500 selection:bg-amber-500 selection:text-black">
      {/* Screen Curvature Vignette */}
      <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-40 scanline-overlay opacity-30"></div>
      
      {/* Slow Roll Scanline */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent h-full w-full animate-[scanline_8s_linear_infinite] opacity-10"></div>

      {/* Content Container with slight padding for bezel */}
      <div className="relative z-10 h-full w-full p-4 md:p-8 flex flex-col crt-flicker">
         <div className="border-2 border-amber-800/50 h-full w-full rounded-xl bg-black/80 backdrop-blur-sm shadow-[0_0_20px_rgba(217,119,6,0.1)] flex flex-col overflow-hidden">
            {children}
         </div>
      </div>
    </div>
  );
};