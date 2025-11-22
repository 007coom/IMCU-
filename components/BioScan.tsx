
import React, { useEffect, useState } from 'react';
import { soundManager } from '../utils/sound';

interface BioScanProps {
  onClose: () => void;
}

export const BioScan: React.FC<BioScanProps> = ({ onClose }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setFrame(f => f + 1), 150);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
        onClose();
        soundManager.playKeystroke();
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', keyHandler);
    }
  }, [onClose]);

  // Simple scrolling DNA ASCII
  const dnaBase = [
    "   A--T   ",
    "  G----C  ",
    " T------A ",
    "C--------G",
    " G------C ",
    "  A----T  ",
    "   T--A   ",
    "  C----G  ",
    " G------C ",
    "A--------T",
    " T------A ",
    "  G----C  "
  ];

  // Create a moving window of the DNA strand
  const offset = frame % dnaBase.length;
  const visibleDNA = [...dnaBase.slice(offset), ...dnaBase.slice(0, offset)];

  return (
    <div className="h-full w-full flex flex-col p-4 font-vt323 text-amber-500 overflow-hidden bg-zinc-950/90 absolute inset-0 z-20">
       <div className="flex justify-between items-center border-b-2 border-amber-700 pb-2 mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-red-400">生物扫描分析仪 // BIO-SCAN v0.9</h2>
        <button 
          onClick={() => { soundManager.playKeystroke(); onClose(); }}
          className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-black px-3 py-1 text-sm md:text-base transition-colors uppercase"
        >
          [ 退出 EXIT ]
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center relative overflow-y-auto">
          
          {/* Center: DNA Strand */}
          <div className="flex flex-col items-center justify-center h-64 overflow-hidden border-x-2 border-amber-900/30 bg-black/50 relative order-2 md:order-1">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent animate-[scanline_2s_linear_infinite]"></div>
             <pre className="text-xl font-bold text-green-500 leading-relaxed">
                 {visibleDNA.map((line, i) => (
                     <div key={i} className={i === 5 ? "text-white scale-110 transition-transform" : "opacity-70"}>{line}</div>
                 ))}
             </pre>
          </div>

          {/* Right: Stats */}
          <div className="space-y-4 text-sm md:text-base order-1 md:order-2">
             <div className="border border-amber-700 p-4 bg-amber-900/10">
                <h3 className="text-amber-300 mb-2 underline">目标分析 (TARGET ANALYSIS)</h3>
                <p>物种: 智人 (变体) // HOMO SAPIENS</p>
                <p>状态: <span className="text-red-500 blink">已感染 (INFECTED)</span></p>
                <p>心率: {60 + Math.floor(Math.random()*40)} BPM</p>
                <p>血氧饱和度: 94%</p>
             </div>

             <div className="text-xs text-amber-600">
                <p>&gt; 正在执行扫描序列...</p>
                <p>&gt; 匹配数据库 [IMCU-GEN]...</p>
                <p>&gt; 在第23对染色体检测到异常。</p>
             </div>
          </div>

      </div>
    </div>
  );
};
