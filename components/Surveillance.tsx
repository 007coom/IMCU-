
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { soundManager } from '../utils/sound';

interface SurveillanceProps {
  onClose: () => void;
}

interface ImageData {
  data: string;
  mimeType: string;
}

export const Surveillance: React.FC<SurveillanceProps> = ({ onClose }) => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(['> CCTV NETWORK CONNECTED', '> WAITING FOR SECTOR INPUT...']);
  const [blink, setBlink] = useState(true);
  
  // Config State
  const [showConfig, setShowConfig] = useState(false);
  const [modelType, setModelType] = useState<'FLASH' | 'PRO'>('FLASH');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('1K');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 1000);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        soundManager.playKeystroke();
      }
    };
    window.addEventListener('keydown', keyHandler);
    // Focus input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', keyHandler);
      clearTimeout(timer);
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

    // Create client request-scoped to pick up latest API key if changed
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const isPro = modelType === 'PRO';
      
      // API Key Check for Pro Model (Nano Banana Pro)
      if (isPro && (window as any).aistudio) {
         const hasKey = await (window as any).aistudio.hasSelectedApiKey();
         if (!hasKey) {
            addLog('> SECURITY CHECK: AUTH REQUIRED...');
            await (window as any).aistudio.openSelectKey();
            // We assume success or retry loop
         }
      }

      const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      let prompt = "";
      let imagePart = null;

      if (!imageData) {
          // Generation Mode
          addLog(`LOCATING SECTOR: ${command}...`);
          addLog(`> INITIATING VISUAL RECONSTRUCTION (${isPro ? 'PRO_CORE' : 'STD_CORE'})...`);
          
          if (isPro) {
             prompt = `Generate a high-fidelity surveillance image of ${command} inside a mysterious, brutalist, underground SCP-style containment facility. The image should have a cinematic CCTV aesthetic: slight chromatic aberration, timestamp overlay, realistic lighting, but high detail.`;
          } else {
             prompt = `Generate a grainy, low-fidelity CCTV security camera image of ${command} inside a mysterious, brutalist, underground SCP-style containment facility. The image should look like it was taken by an old surveillance camera: noisy, desaturated, slightly distorted, with a timestamp overlay. Retro sci-fi aesthetic.`;
          }
      } else {
          // Edit Mode
          addLog(`PROCESSING COMMAND: ${command}...`);
          addLog(`> APPLYING VISUAL MODIFICATIONS...`);
          prompt = `Edit this image. Instruction: ${command}. Maintain the CCTV surveillance aesthetic.`;
          imagePart = {
              inlineData: {
                  mimeType: imageData.mimeType,
                  data: imageData.data
              }
          };
      }

      const parts: any[] = [{ text: prompt }];
      if (imagePart) parts.push(imagePart);

      const config: any = {};
      if (isPro) {
          config.imageConfig = { 
              imageSize: resolution,
              aspectRatio: "1:1"
          };
      }

      // Reverse to put image first if it exists (Edit: [Image, Text], Generate: [Text])
      // Note: For editing, typically [image, text] is preferred.
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: parts.reverse() },
        config: config
      });
      
      let newImage = null;
      let newMimeType = 'image/png';

      if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  newImage = part.inlineData.data;
                  if (part.inlineData.mimeType) {
                    newMimeType = part.inlineData.mimeType;
                  }
                  break;
              }
          }
      }

      if (newImage) {
          setImageData({ data: newImage, mimeType: newMimeType });
          addLog(`> VISUAL FEED UPDATED [${isPro ? resolution : 'STD'}].`);
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
        // Handle Specific API Key Error for Pro Model
        if (modelType === 'PRO' && error.message?.includes('Requested entity was not found') && (window as any).aistudio) {
            addLog('> AUTH ERROR. INVALID KEY. RESETTING...');
            try {
                await (window as any).aistudio.openSelectKey();
                addLog('> KEY RESET. PLEASE RETRY COMMAND.');
            } catch (e) {
                addLog('> MANUAL AUTH REQUIRED.');
            }
        } else {
            addLog(`> ERR: CONNECTION LOST // ${error.message}`);
        }
        soundManager.playLoginFail();
    } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = () => {
      setImageData(null);
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
            <span className="text-xs text-amber-800 hidden md:inline">CAM-OS v9.0 // {modelType === 'PRO' ? `PRO_CORE [${resolution}]` : 'STD_CORE'}</span>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => { soundManager.playKeystroke(); setShowConfig(!showConfig); }}
              className={`border border-amber-500 px-3 py-1 text-sm md:text-base transition-colors uppercase ${showConfig ? 'bg-amber-500 text-black' : 'text-amber-500 hover:bg-amber-500 hover:text-black'}`}
            >
              [ CONFIG ]
            </button>
            <button 
              onClick={() => { soundManager.playKeystroke(); onClose(); }}
              className="border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black px-3 py-1 text-sm md:text-base transition-colors uppercase"
            >
              [ CLOSE ]
            </button>
        </div>
      </div>

      {/* Config Panel */}
      {showConfig && (
          <div className="bg-amber-900/10 border-b border-amber-700 mb-4 p-3 flex flex-col md:flex-row gap-4 md:gap-8 animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-amber-700 font-bold uppercase">Core Model</label>
                  <div className="flex gap-1">
                      <button 
                        onClick={() => { setModelType('FLASH'); soundManager.playKeystroke(); }}
                        className={`px-2 py-1 text-xs border ${modelType === 'FLASH' ? 'bg-amber-600 border-amber-600 text-black font-bold' : 'border-amber-800 text-amber-600 hover:border-amber-500'}`}
                      >
                        CCTV V1 (FLASH)
                      </button>
                      <button 
                        onClick={() => { setModelType('PRO'); soundManager.playKeystroke(); }}
                        className={`px-2 py-1 text-xs border ${modelType === 'PRO' ? 'bg-amber-500 border-amber-500 text-black font-bold' : 'border-amber-800 text-amber-600 hover:border-amber-500'}`}
                      >
                        CCTV PRO (Ω)
                      </button>
                  </div>
              </div>

              {modelType === 'PRO' && (
                  <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-amber-700 font-bold uppercase">Resolution (Nano Banana Pro)</label>
                      <div className="flex gap-1">
                          {(['1K', '2K', '4K'] as const).map((res) => (
                              <button 
                                key={res}
                                onClick={() => { setResolution(res); soundManager.playKeystroke(); }}
                                className={`px-2 py-1 text-xs border ${resolution === res ? 'bg-amber-500 border-amber-500 text-black font-bold' : 'border-amber-800 text-amber-600 hover:border-amber-500'}`}
                              >
                                {res}
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex-1 flex items-end justify-end text-[10px] text-amber-800">
                 {modelType === 'PRO' ? 'WARN: PRO CORE REQUIRES HIGH BANDWIDTH (API KEY)' : 'STD CORE: LOW LATENCY OPTIMIZED'}
              </div>
          </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
          
          {/* Monitor Viewport */}
          <div className="flex-1 relative border-[10px] border-zinc-900 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)] group">
              
              {/* Screen Effects */}
              <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
              <div className="absolute inset-0 pointer-events-none z-10 animate-[scanline_10s_linear_infinite] bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-30"></div>
              
              {imageData ? (
                 <div className="relative w-full h-full">
                    <img 
                      src={`data:${imageData.mimeType};base64,${imageData.data}`} 
                      alt="Surveillance Feed" 
                      className={`w-full h-full object-contain ${modelType === 'FLASH' ? 'filter contrast-125 brightness-90 sepia-[0.3] grayscale-[0.3]' : ''}`} 
                    />
                    <div className="absolute top-4 left-4 text-white/80 font-mono text-xs md:text-sm drop-shadow-md">
                        CAM_{Math.floor(Math.random() * 99).toString().padStart(2, '0')}<br/>
                        {new Date().toISOString().split('T')[0]}<br/>
                        {new Date().toLocaleTimeString()}
                    </div>
                    <div className="absolute bottom-4 right-4 text-red-500 font-bold animate-pulse text-xs md:text-sm tracking-widest">
                        REC ● {resolution}
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
                      {imageData ? '指令输入 (COMMAND INPUT):' : '目标地点 (TARGET LOCATION):'}
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                      <input 
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={imageData ? "e.g. Enhance image..." : "e.g. Site-19..."}
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
                              {loading ? 'PROCESSING...' : (imageData ? 'EXECUTE' : 'GENERATE')}
                          </button>
                          {imageData && (
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
    