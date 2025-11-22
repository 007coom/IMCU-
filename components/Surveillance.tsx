
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { soundManager } from '../utils/sound';

// Declare process for TypeScript compiler compatibility
declare const process: any;

interface SurveillanceProps {
  onClose: () => void;
  initialModel?: 'FLASH' | 'PRO';
}

interface ImageData {
  data: string;
  mimeType: string;
}

export const Surveillance: React.FC<SurveillanceProps> = ({ onClose, initialModel }) => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(['> CCTV NETWORK CONNECTED', '> WAITING FOR SECTOR INPUT...']);
  const [blink, setBlink] = useState(true);
  
  // Config State
  const [showConfig, setShowConfig] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [modelType, setModelType] = useState<'FLASH' | 'PRO'>(initialModel || 'FLASH');
  const [resolution, setResolution] = useState<'1K' | '2K'>('1K');
  const [sessionApiKey, setSessionApiKey] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const interval = window.setInterval(() => setBlink(b => !b), 1000);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        soundManager.playKeystroke();
      }
    };
    window.addEventListener('keydown', keyHandler);
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

    try {
      const isPro = modelType === 'PRO';
      // Prefer manual override key if provided (common for Vercel deployments), else fallback to ENV
      let apiKey = sessionApiKey || process.env.API_KEY || '';
      
      // Check for AI Studio environment
      const isAIStudio = typeof window !== 'undefined' && (window as any).aistudio;

      // Only try to access aistudio API if checking PRO features AND in AI Studio
      if (isPro && isAIStudio) {
           try {
              const hasKey = await (window as any).aistudio.hasSelectedApiKey();
              if (!hasKey) {
                  addLog('> SECURITY ALERT: HIGHER CLEARANCE REQUIRED.');
                  addLog('> INITIATING AUTHENTICATION PROTOCOL...');
                  await (window as any).aistudio.openSelectKey();
              }
              // In AI Studio, env key might be updated automatically, but usually we rely on the injection.
              // We assume valid key presence after selection.
           } catch (err) {
              console.warn("AI Studio Auth Check Failed", err);
           }
      }
      
      // If on Vercel/Deployment (isAIStudio is false) and using PRO model without a manually set key
      if (isPro && !isAIStudio && !apiKey) {
          addLog('> ERR: MISSING API KEY FOR PRO MODEL.');
          addLog('> PLEASE SET API KEY IN CONFIG MENU OR ENV.');
          setLoading(false);
          setShowConfig(true);
          return;
      }

      if (!apiKey) {
          addLog('> ERR: MISSING API KEY.');
          addLog('> SOLUTION: OPEN [CONFIG] AND ENTER YOUR KEY.');
          setShowConfig(true);
          setLoading(false);
          return;
      }

      const ai = new GoogleGenAI({ apiKey });

      // Use stable model names. 'preview' often has lower quotas.
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
      
      // Image Config varies by model
      // CRITICAL FIX: Do NOT set config.imageConfig for gemini-2.5-flash-image to avoid 400 errors.
      if (isPro) {
          config.imageConfig = { 
              imageSize: resolution,
              aspectRatio: "1:1"
          };
      }

      // Reverse parts to put image first if it exists (Common practice: [Image, Text])
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
        
        const errMsg = error.message || '';
        
        // Special Handling for Quota Exceeded / 429 / Resource Exhausted
        if (errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED')) {
             addLog('> CRITICAL ERROR: API QUOTA EXHAUSTED (429).');
             addLog('> CAUSE: VERCEL SHARED QUOTA LIMIT REACHED.');
             addLog('> SOLUTION: OPEN [CONFIG] AND ENTER A PERSONAL API KEY.');
             setShowConfig(true); // Auto open config
             soundManager.playLoginFail();
             setLoading(false);
             return;
        }

        // Handle Specific API Key Error for Pro Model in AI Studio
        const isAIStudio = typeof window !== 'undefined' && (window as any).aistudio;
        if (modelType === 'PRO' && errMsg.includes('Requested entity was not found') && isAIStudio) {
            addLog('> AUTH ERROR. INVALID KEY. RESETTING...');
            try {
                if ((window as any).aistudio?.openSelectKey) {
                    await (window as any).aistudio.openSelectKey();
                    addLog('> KEY RESET. PLEASE RETRY COMMAND.');
                } else {
                    throw new Error("AI Studio SDK missing");
                }
            } catch (e) {
                addLog('> MANUAL AUTH REQUIRED.');
            }
        } else {
            addLog(`> ERR: ${errMsg || 'UNKNOWN ERROR'}`);
            if (modelType === 'PRO') {
                addLog(`> TIP: IF USING VERCEL/EXTERNAL, ENSURE API KEY SUPPORTS PRO MODEL.`);
                addLog(`> TIP: TRY SWITCHING TO [FLASH] MODEL.`);
            }
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
              onClick={() => { soundManager.playKeystroke(); setShowHelp(!showHelp); setShowConfig(false); }}
              className={`border border-amber-500 px-3 py-1 text-sm md:text-base transition-colors uppercase ${showHelp ? 'bg-amber-500 text-black' : 'text-amber-500 hover:bg-amber-500 hover:text-black'}`}
            >
              [ 指令 HELP ]
            </button>
            <button 
              onClick={() => { soundManager.playKeystroke(); setShowConfig(!showConfig); setShowHelp(false); }}
              className={`border border-amber-500 px-3 py-1 text-sm md:text-base transition-colors uppercase ${showConfig ? 'bg-amber-500 text-black' : 'text-amber-500 hover:bg-amber-500 hover:text-black'}`}
            >
              [ 设置 CONFIG ]
            </button>
            <button 
              onClick={() => { soundManager.playKeystroke(); onClose(); }}
              className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-black px-3 py-1 text-sm md:text-base transition-colors uppercase"
            >
              [ 退出 EXIT ]
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative">
        
        {/* Config Panel Overlay */}
        {showConfig && (
           <div className="absolute top-0 right-0 z-50 bg-black border border-amber-600 p-4 shadow-[0_0_20px_rgba(217,119,6,0.3)] w-64 animate-in slide-in-from-right-4 duration-200 overflow-y-auto max-h-full">
               <div className="text-amber-500 font-bold mb-4 border-b border-amber-800 pb-2">AI CORE CONFIG</div>
               
               <div className="mb-4">
                   <label className="block text-xs text-amber-700 mb-2">MODEL SELECTION</label>
                   <div className="flex gap-2">
                       <button 
                         onClick={() => { setModelType('FLASH'); soundManager.playKeystroke(); }}
                         className={`flex-1 py-1 border text-sm ${modelType === 'FLASH' ? 'bg-amber-600 text-black border-amber-600' : 'border-amber-800 text-amber-700 hover:border-amber-600'}`}
                       >
                         FLASH
                       </button>
                       <button 
                         onClick={() => { setModelType('PRO'); soundManager.playKeystroke(); }}
                         className={`flex-1 py-1 border text-sm ${modelType === 'PRO' ? 'bg-amber-600 text-black border-amber-600' : 'border-amber-800 text-amber-700 hover:border-amber-600'}`}
                       >
                         PRO
                       </button>
                   </div>
                   <div className="text-[10px] text-amber-800 mt-1 leading-tight">
                       {modelType === 'FLASH' ? 'Standard speed. Low fidelity.' : 'High fidelity. Requires Paid API Key.'}
                   </div>
               </div>

               {modelType === 'PRO' && (
                   <div className="mb-4">
                       <label className="block text-xs text-amber-700 mb-2">RESOLUTION</label>
                       <div className="flex gap-2">
                           <button 
                             onClick={() => { setResolution('1K'); soundManager.playKeystroke(); }}
                             className={`flex-1 py-1 border text-sm ${resolution === '1K' ? 'bg-amber-600 text-black border-amber-600' : 'border-amber-800 text-amber-700 hover:border-amber-600'}`}
                           >
                             1K
                           </button>
                           <button 
                             onClick={() => { setResolution('2K'); soundManager.playKeystroke(); }}
                             className={`flex-1 py-1 border text-sm ${resolution === '2K' ? 'bg-amber-600 text-black border-amber-600' : 'border-amber-800 text-amber-700 hover:border-amber-600'}`}
                           >
                             2K
                           </button>
                       </div>
                   </div>
               )}
               
               <div className="mb-4 border-t border-amber-900/50 pt-2">
                   <label className="block text-xs text-amber-700 mb-2">MANUAL API KEY (OVERRIDE)</label>
                   <input 
                     type="password"
                     value={sessionApiKey}
                     onChange={(e) => setSessionApiKey(e.target.value)}
                     className="w-full bg-zinc-900 border border-amber-800 text-amber-300 p-1 text-xs font-mono focus:border-amber-500 focus:outline-none"
                     placeholder="Paste Key Here (Starts with AIza...)"
                   />
                   <div className="text-[10px] text-amber-800 mt-1">
                       Use this if running on Vercel/Deployment and the environment key is exhausted (Error 429).
                   </div>
               </div>

               <button 
                 onClick={() => setShowConfig(false)}
                 className="w-full border border-amber-800 text-amber-800 hover:bg-amber-900/20 hover:text-amber-600 py-1 text-xs"
               >
                 CLOSE MENU
               </button>
           </div>
        )}

        {/* Help Panel Overlay */}
         {showHelp && (
           <div className="absolute top-0 right-0 z-50 bg-black border border-amber-600 p-4 shadow-[0_0_20px_rgba(217,119,6,0.3)] w-64 animate-in slide-in-from-right-4 duration-200">
               <div className="text-amber-500 font-bold mb-4 border-b border-amber-800 pb-2">OPERATOR GUIDE</div>
               
               <ul className="text-xs space-y-3 text-amber-300 font-mono list-disc pl-4">
                   <li>
                       <strong className="text-amber-500">GENERATE:</strong><br/>
                       Type a location or object to generate a new CCTV feed.<br/>
                       <span className="text-amber-700 italic">Ex: "SCP-173 cell", "Cafeteria", "Corridor 9"</span>
                   </li>
                   <li>
                       <strong className="text-amber-500">EDIT:</strong><br/>
                       If an image exists, type a command to modify it.<br/>
                       <span className="text-amber-700 italic">Ex: "Add a guard", "Turn lights off", "Make it red"</span>
                   </li>
                   <li>
                       <strong className="text-amber-500">MODEL:</strong><br/>
                       Use [CONFIG] to switch between Fast (Flash) and High Quality (Pro) generation.
                   </li>
               </ul>

               <button 
                 onClick={() => setShowHelp(false)}
                 className="w-full border border-amber-800 text-amber-800 hover:bg-amber-900/20 hover:text-amber-600 py-1 text-xs mt-4"
               >
                 CLOSE GUIDE
               </button>
           </div>
        )}

        {/* Left: Image Feed */}
        <div className="flex-1 bg-black border border-amber-900/50 relative flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 pointer-events-none z-10 scanline-overlay opacity-30"></div>
            <div className="absolute top-4 left-4 z-20 text-red-500 text-sm font-bold bg-black/50 px-2">REC ●</div>
            <div className="absolute bottom-4 right-4 z-20 text-amber-500 text-xl font-vt323 bg-black/50 px-2">
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
            
            {loading && (
                <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center">
                    <div className="text-amber-500 text-2xl animate-pulse mb-2">ACCESSING SATELLITE LINK...</div>
                    <div className="w-64 h-2 bg-amber-900 rounded overflow-hidden">
                        <div className="h-full bg-amber-500 animate-[scanline_2s_linear_infinite]"></div>
                    </div>
                    <div className="mt-2 text-xs text-amber-700">{modelType === 'PRO' ? 'RENDERING HIGH RES...' : 'BUFFERING STREAM...'}</div>
                </div>
            )}

            {imageData ? (
                <img 
                   src={`data:${imageData.mimeType};base64,${imageData.data}`} 
                   alt="Surveillance Feed" 
                   className="w-full h-full object-contain"
                />
            ) : (
                <div className="text-amber-800/50 text-4xl font-bold tracking-widest">NO SIGNAL</div>
            )}
        </div>

        {/* Right: Log & Input */}
        <div className="h-48 md:h-full md:w-80 flex flex-col border-l border-amber-900/30 pl-0 md:pl-4">
           <div className="flex-1 bg-black/20 border border-amber-900/30 p-2 overflow-y-auto custom-scrollbar font-mono text-xs space-y-1 mb-2" ref={scrollRef}>
               {logs.map((log, i) => (
                   <div key={i} className="text-amber-500/80 break-words">{log}</div>
               ))}
           </div>
           
           <div className="flex gap-2 mb-2">
               <button onClick={handleClear} className="flex-1 bg-amber-900/20 text-amber-700 text-xs py-1 hover:bg-amber-700 hover:text-black">CLEAR FEED</button>
           </div>

           <form onSubmit={handleSubmit} className="relative">
               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-700">&gt;</span>
               <input 
                  ref={inputRef}
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-black border border-amber-700 pl-6 pr-2 py-2 text-amber-500 focus:border-amber-400 focus:outline-none font-vt323 text-lg"
                  placeholder="ENTER COMMAND..."
                  disabled={loading}
                  autoComplete="off"
               />
           </form>
        </div>

      </div>
    </div>
  );
};
