
import React, { useEffect, useState } from 'react';
import { soundManager } from '../utils/sound';

interface WorldMapProps {
  onClose: () => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ onClose }) => {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => setBlink(b => !b), 500);
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

  // Simplified ASCII World Map
  const mapAscii = `
         .                                            .
       _..::__:  ,-"-"._       |]       ,     _,.__  
   _.___ _ _<_>\`!(._\`.\`-.    /        |    \`(_  _\\-
  _{_._AA__..,'  _   _-:^;._/        /        \`'  \\
 /_o__o_o_ooo;  / \\  \\   \\          |
 :  _    __..__  \\_/   \\      /     | 
 : / \\  /      \\        \\    /      /   
  \\__/  \\      /         \\  /      /    
         \\    /           \\/      /     
          \\__/             \\______/     
`;

  return (
    <div className="h-full w-full flex flex-col p-4 font-vt323 text-amber-500 overflow-hidden bg-zinc-950/90 absolute inset-0 z-20">
       <div className="flex justify-between items-center border-b-2 border-amber-700 pb-2 mb-4">
        <h2 className="text-xl md:text-2xl font-bold">全球防御地图 // GLOBAL DEFENSE</h2>
        <button 
          onClick={() => { soundManager.playKeystroke(); onClose(); }}
          className="border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black px-3 py-1 text-sm md:text-base transition-colors uppercase"
        >
          [ 退出 EXIT ]
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Map Container */}
        <div className="relative scale-125 md:scale-100">
            <pre className="text-[8px] md:text-xs lg:text-sm leading-[10px] md:leading-[14px] lg:leading-[18px] font-bold text-amber-800/50 select-none">
                {mapAscii}
            </pre>
            
            {/* Overlays for locations */}
            {/* North America */}
            <div className={`absolute top-[30%] left-[20%] w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] ${blink ? 'opacity-100' : 'opacity-50'}`}></div>
            <div className="absolute top-[32%] left-[22%] text-[10px] text-green-500">站点-19</div>

            {/* Europe */}
            <div className={`absolute top-[25%] left-[52%] w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b] ${blink ? 'opacity-100' : 'opacity-20'}`}></div>
            
            {/* Asia */}
            <div className="absolute top-[35%] left-[75%] w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
            <div className="absolute top-[35%] left-[75%] w-2 h-2 bg-red-600 rounded-full"></div>
            <div className="absolute top-[38%] left-[70%] text-[10px] text-red-500 font-bold bg-black/50 px-1 whitespace-nowrap">
                警报: 收容失效 (BREACH)
            </div>

            {/* Antarctica */}
             <div className={`absolute bottom-[10%] left-[55%] w-2 h-2 bg-blue-400 rounded-full ${blink ? 'opacity-100' : 'opacity-30'}`}></div>
        </div>
      </div>

      <div className="border-t border-amber-800 pt-2 flex justify-between text-xs md:text-sm">
         <span>活跃站点: 42</span>
         <span className="text-red-500 animate-pulse">危急警报: 1</span>
         <span>DEFCON: 3</span>
      </div>
    </div>
  );
};
