
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { soundManager } from '../utils/sound';

interface SurveillanceProps {
  onClose: () => void;
}

export const Surveillance: React.FC<SurveillanceProps> = ({ onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(['> CCTV NETWORK CONNECTED', '> WAITING FOR SECTOR INPUT...']);
  const [blink, setBlink] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 1000);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        soundManager.playKeystroke();
      }
    };
    window.addEventListener('keydown', keyHandler);
    inputRef.current?.focus();
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [logs]);

  const addLog = (msg: string) => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const command = input.trim();
    setInput('');
    setLoading(true);
    soundManager.playEnter();

    try {
      let prompt = "";
      let imagePart = null;

      if (!image) {
          // Generation Mode
          addLog(`LOCATING SECTOR: ${command}...`);
          addLog(`> INITIATING VISUAL RECONSTRUCTION...`);
          prompt = `Generate a grainy, low-fidelity CCTV security camera image of ${command} inside a mysterious, brutalist, underground SCP-style containment facility. The image should look like it was taken by an old surveillance camera: noisy, desaturated, slightly distorted, with a timestamp overlay. Retro sci-fi aesthetic.`;
      } else {
          // Edit Mode
          addLog(`PROCESSING COMMAND: ${command}...`);
          addLog(`> APPLYING VISUAL MODIFICATIONS...`);
          prompt = `Edit this CCTV image: ${command}. Maintain the grainy security camera aesthetic.`;
          imagePart = {
              inlineData: {
                  mimeType: 'image/png',
                  data: image
              }
          };
      }

      const parts: any[] = [{ text: prompt }];
      if (imagePart) parts.push(imagePart);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts.reverse() } // Image, then text typically for editing context
      });
      
      let newImage = null;
      if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  newImage = part.inlineData.data;
                  break;
              }
          }
      }

      if (newImage) {
          setImage(newImage);
          addLog(`> VISUAL FEED UPDATED.`);
          soundManager.playLoginSuccess();
      } else {
          addLog(`> ERR: NO VISUAL DATA RECEIVED.`);
          if (response.text) {
              addLog(`> SYS: ${response.text.substring(0, 50)}...`);
          }
          soundManager.playLoginFail();
      }

    } catch (error: any) {
        console.error(error);
        addLog(`> ERR: CONNECTION LOST // ${error.message}`);
        soundManager.playLoginFail();
    } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = () => {
      setImage(null);
      addLog('> FEED CLEARED. RETURNED TO STANDBY.');
      soundManager.playKeystroke();
      inputRef.current?.focus();
  };

  return (
    <div className="h-full w-full flex flex-col p-4 font-vt323 text-amber-500 overflow-hidden bg-zinc-950/90 absolute inset-0 z-20">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-amber-700 pb-2 mb-4 shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-widest text-red-500 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full bg-red-600 ${blink ? 'opacity-100' : 'opacity-30'}`}></span>
                CCTV SURVEILLANCE
            </h2>
            <span className="text-xs text-amber-800">CAM-OS v9.0</span>
        </div>
        <button 
          onClick={() => { soundManager.playKeystroke(); onClose(); }}
          className="border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black px-3 py-1 text-sm md:text-base transition-colors uppercase"
        >
          [ CLOSE ]
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
          
          {/* Monitor Viewport */}
          <div className="flex-1 relative border-[10px] border-zinc-900 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)] group">
              
              {/* Screen Effects */}
              <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
              <div className="absolute inset-0 pointer-events-none z-10 animate-[scanline_10s_linear_infinite] bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-30"></div>
              
              {image ? (
                 <div className="relative w-full h-full">
                    <img src={`data:image/png;base64,${image}`} alt="Surveillance Feed" className="w-full h-full object-contain filter contrast-125 brightness-90 sepia-[0.3] grayscale-[0.3]" />
                    <div className="absolute top-4 left-4 text-white/80 font-mono text-xs md:text-sm drop-shadow-md">
                        CAM_04<br/>
                        {new Date().toISOString().split('T')[0]}<br/>
                        {new Date().toLocaleTimeString()}
                    </div>
                    <div className="absolute bottom-4 right-4 text-red-500 font-bold animate-pulse text-xs md:text-sm tracking-widest">
                        REC ●
                    </div>
                 </div>
              ) : (
                 <div className="text-center space-y-2 opacity-50">
                     <div className="text-4xl md:text-6xl font-bold text-zinc-800">NO SIGNAL</div>
                     <div className="text-sm text-zinc-700">WAITING FOR TARGET COORDINATES</div>
                 </div>
              )}

              {loading && (
                  <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center flex-col gap-2">
                      <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-amber-500 blink">GENERATING FEED...</div>
                  </div>
              )}
          </div>

          {/* Controls & Logs */}
          <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
              
              {/* Log Output */}
              <div className="flex-1 border border-amber-900/50 bg-black/40 p-2 overflow-y-auto font-mono text-xs md:text-sm text-amber-300/80 custom-scrollbar" ref={scrollRef}>
                  {logs.map((log, i) => (
                      <div key={i} className="mb-1 break-words">{log}</div>
                  ))}
              </div>

              {/* Input Console */}
              <div className="border-t border-amber-600 pt-4">
                  <div className="mb-2 text-sm text-amber-500">
                      {image ? '指令输入 (COMMAND INPUT):' : '目标地点 (TARGET LOCATION):'}
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                      <input 
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={image ? "e.g. Zoom in, Add fog..." : "e.g. Site-19 Cafeteria..."}
                        className="w-full bg-amber-900/10 border border-amber-700 p-2 text-amber-300 focus:outline-none focus:border-amber-400 font-mono uppercase"
                        autoFocus
                        disabled={loading}
                      />
                      <div className="flex gap-2">
                          <button 
                             type="submit" 
                             disabled={loading}
                             className="flex-1 bg-amber-700 hover:bg-amber-600 text-black py-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {loading ? 'PROCESSING...' : (image ? 'EXECUTE' : 'GENERATE')}
                          </button>
                          {image && (
                              <button 
                                 type="button"
                                 onClick={handleClear}
                                 className="w-1/3 border border-red-600 text-red-500 hover:bg-red-600 hover:text-black py-2 font-bold text-xs"
                              >
                                 CLEAR
                              </button>
                          )}
                      </div>
                  </form>
              </div>
          </div>
      </div>
    </div>
  );
};
