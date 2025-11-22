
import React, { useState, useEffect, useRef } from 'react';
import { CRTLayout } from './components/CRTLayout';
import { Terminal } from './components/Terminal';
import { ViewState } from './types';
import { soundManager } from './utils/sound';
import { LATIN_MOTTOS, COUNCIL_QUOTES } from './data';
import { IconAtom, IconBiohazard, IconCircuit, IconDna, IconGrid, IconHex, IconIMCULogo, IconLock, IconRadioactive, IconSkull, IconTarget } from './components/Icons';

// Declare process for TypeScript compiler compatibility
declare const process: any;

// Helper for random hex generation
const randomHex = () => Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0');

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('POWER_OFF');
  const [bootStep, setBootStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Login State
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VISITOR');
  const [customRoleMode, setCustomRoleMode] = useState(false);
  
  const [loginStep, setLoginStep] = useState<'IDENTITY' | 'PASSWORD'>('IDENTITY');
  const [loginError, setLoginError] = useState('');
  
  // Visual Decorators
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [currentMotto, setCurrentMotto] = useState(LATIN_MOTTOS[0]);
  const [councilQuote, setCouncilQuote] = useState('');

  // --- BOOT SEQUENCE ---
  const handlePowerOn = () => {
    soundManager.init();
    setViewState('BOOT');
    // Pick a random motto and quote for this session
    setCurrentMotto(LATIN_MOTTOS[Math.floor(Math.random() * LATIN_MOTTOS.length)]);
    setCouncilQuote(COUNCIL_QUOTES[Math.floor(Math.random() * COUNCIL_QUOTES.length)]);
  };

  useEffect(() => {
    if (viewState === 'BOOT') {
      if (bootStep === 0) {
        soundManager.playKeystroke();
        setTimeout(() => setBootStep(1), 800);
      } else if (bootStep === 1) {
         soundManager.playKeystroke();
         setTimeout(() => setBootStep(2), 1000);
      } else if (bootStep === 2) {
        const interval = window.setInterval(() => {
          setLoadingProgress(prev => {
            const increment = Math.random() * 8 + 2;
            const next = prev + increment;
            if (next >= 100) {
              clearInterval(interval);
              soundManager.playLoginSuccess();
              setTimeout(() => setBootStep(3), 500);
              return 100;
            }
            if (Math.random() > 0.8) soundManager.playKeystroke(); 
            return next;
          });
        }, 50);
        return () => clearInterval(interval);
      } else if (bootStep === 3) {
         setTimeout(() => setBootStep(4), 1200);
      } else if (bootStep === 4) {
         setTimeout(() => setViewState('LOGIN'), 1000);
      }
    }
  }, [viewState, bootStep]);

  // --- TELEMETRY EFFECT ---
  useEffect(() => {
    if (viewState === 'LOGIN') {
        const interval = window.setInterval(() => {
            setTelemetry(prev => {
                const line = `DAT_STREAM: 0x${randomHex()}${randomHex()} [${Math.random() > 0.5 ? 'OK' : 'SYNC'}]`;
                return [line, ...prev.slice(0, 8)];
            });
        }, 200);
        return () => clearInterval(interval);
    }
  }, [viewState]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginStep === 'IDENTITY') {
      soundManager.playEnter();
      if (identity.trim().length > 0) {
        if (role.trim().length === 0) {
            setRole('VISITOR');
        }
        setLoginStep('PASSWORD');
        setLoginError('');
      } else {
        soundManager.playLoginFail();
        setLoginError('ID_REQUIRED');
      }
    } else {
      if (password.toLowerCase() === 'imcu' || password === '1234') { 
        soundManager.playLoginSuccess();
        setViewState('TERMINAL');
      } else {
        soundManager.playLoginFail();
        setLoginError('ACCESS_DENIED');
        setPassword('');
      }
    }
  };

  const handleLogout = () => {
     setIdentity('');
     setPassword('');
     setRole('VISITOR');
     setCustomRoleMode(false);
     setLoginStep('IDENTITY');
     setViewState('LOGIN');
     setLoginError('');
     setBootStep(0);
     setLoadingProgress(0);
     soundManager.playEnter(); 
     // Refresh quotes on logout
     setCurrentMotto(LATIN_MOTTOS[Math.floor(Math.random() * LATIN_MOTTOS.length)]);
     setCouncilQuote(COUNCIL_QUOTES[Math.floor(Math.random() * COUNCIL_QUOTES.length)]);
  };

  const ROLE_OPTIONS = [
    { id: 'VISITOR', label: '访客', code: 'GST-01' },
    { id: 'AGENT', label: '特工', code: 'OP-709' },
    { id: 'SCIENTIST', label: '研究员', code: 'SCI-LAB' },
    { id: 'DIRECTOR', label: '主管', code: 'DIR-LV5' },
    { id: 'Ω', label: 'Ω', code: 'OMG-IX' },
    { id: 'CUSTOM', label: '自定义', code: 'MAN-OVR' },
  ];

  // --- RENDERERS ---

  if (viewState === 'POWER_OFF') {
    return (
      <div className="h-[100dvh] w-full bg-zinc-950 flex items-center justify-center font-vt323 relative overflow-hidden touch-none flex-col gap-8">
         <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-20"></div>
         
         {/* Decorative Background Icons - Unified Branding */}
         <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
             <IconIMCULogo className="w-[800px] h-[800px] text-amber-900 animate-[spin_180s_linear_infinite]" strokeWidth={0.5} />
         </div>

         <button 
            onClick={handlePowerOn}
            className="group relative px-10 py-6 border-2 border-amber-900 bg-black text-amber-700 hover:bg-amber-900/20 hover:text-amber-500 hover:border-amber-500 transition-all duration-300 z-10"
         >
            <span className="text-2xl tracking-[0.3em] uppercase font-bold animate-pulse">Power On</span>
            <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-amber-900 group-hover:text-amber-700">TERMINAL_INIT_SEQ</div>
            
            {/* Decorators */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-500 -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-500 -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-500 -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-500 -mb-1 -mr-1"></div>
         </button>
         
         <div className="text-amber-900/50 font-serif italic text-sm tracking-widest animate-[pulse_4s_infinite] z-10">
            "VIGILANTIA AETERNA"
         </div>
      </div>
    );
  }

  if (viewState === 'BOOT') {
    return (
      <CRTLayout isOn={true}>
        <div className="flex flex-col justify-end h-full p-6 md:p-12 font-mono text-amber-500 uppercase text-sm md:text-base leading-relaxed">
           <div className="mb-4 text-amber-800">IMCU_BIOS_REV_4.11 [BUILD 2077]</div>
           
           {bootStep >= 0 && <div>&gt; SYSTEM_CHECK... <span className="text-green-500">OK</span></div>}
           {bootStep >= 1 && <div>&gt; MEMORY_ALLOC... <span className="text-green-500">OK</span> (512TB)</div>}
           {bootStep >= 2 && (
              <div className="mt-2 max-w-md">
                 <div className="flex justify-between mb-1 text-xs text-amber-700">
                    <span>LOADING_MODULES</span>
                    <span>{Math.floor(loadingProgress)}%</span>
                 </div>
                 <div className="h-2 bg-amber-900/30 w-full">
                    <div className="h-full bg-amber-500 shadow-[0_0_10px_#d97706]" style={{width: `${loadingProgress}%`}}></div>
                 </div>
              </div>
           )}
           {bootStep >= 3 && <div className="mt-2">&gt; MOUNTING_VOLUMES... <span className="text-green-500">MOUNTED</span></div>}
           {bootStep >= 4 && <div className="mt-2 animate-pulse text-amber-300">&gt; INIT_LOGIN_PROTOCOL...</div>}
        </div>
      </CRTLayout>
    );
  }

  if (viewState === 'LOGIN') {
    return (
      <CRTLayout isOn={true}>
        <div className="flex items-center justify-center h-full w-full p-2 md:p-8 font-vt323 overflow-hidden relative">
           
           {/* Background Grid */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(120,53,15,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(120,53,15,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
           
           {/* Background Icons - Replaced with Large Main Icon */}
           <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
               <IconIMCULogo className="w-[600px] h-[600px] text-amber-500 animate-[spin_120s_linear_infinite]" strokeWidth={0.5} />
           </div>

           {/* Login Main Frame */}
           <div className="relative w-full max-w-5xl h-[90%] md:h-[80%] border-4 border-double border-amber-800 bg-black/95 shadow-[0_0_40px_rgba(217,119,6,0.15)] flex flex-col md:flex-row overflow-hidden z-10">
              
              {/* Decorative Corner Brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-600"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600"></div>

              {/* LEFT PANEL: STATUS / LOGO */}
              <div className="hidden md:flex w-[35%] border-r-2 border-amber-800/50 flex-col p-8 justify-between bg-amber-900/5 relative">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(217,119,6,0.03)_10px,rgba(217,119,6,0.03)_20px)] pointer-events-none"></div>
                  
                  <div>
                      <div className="mb-6 flex justify-center md:justify-start relative group">
                           <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000"></div>
                           <IconIMCULogo className="w-32 h-32 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" strokeWidth={1.2} />
                      </div>
                      <h1 className="text-6xl font-bold text-amber-600 tracking-tighter mb-2 drop-shadow-[0_2px_0_rgba(0,0,0,1)]">
                          IMCU<span className="text-amber-400">Ω</span>
                      </h1>
                      <div className="h-1 w-16 bg-amber-500 mb-6"></div>
                      <p className="text-sm text-amber-800 leading-tight">
                          SECURE TERMINAL INTERFACE<br/>
                          RESTRICTED ACCESS ONLY<br/>
                          AUTH_REQ: LEVEL-II+
                      </p>
                  </div>

                  {/* Council Quote / Motto Area */}
                  <div className="border-t border-amber-800/30 pt-4">
                      <div className="text-xs text-amber-600 mb-2 font-bold">[ HIGH COUNCIL DECREE ]</div>
                      <p className="text-amber-500/80 text-lg font-serif italic leading-relaxed">
                        "{councilQuote}"
                      </p>
                  </div>

                  {/* Scrolling Telemetry */}
                  <div className="border-t border-amber-800/30 py-4">
                      <div className="text-xs text-amber-600 mb-2 font-bold">[ SYSTEM TELEMETRY ]</div>
                      <div className="font-mono text-[10px] text-amber-800/70 space-y-1 h-24 overflow-hidden flex flex-col-reverse">
                          {telemetry.map((t, i) => <div key={i}>{t}</div>)}
                      </div>
                  </div>

                  <div className="text-[10px] text-amber-900 text-center">
                      COPYRIGHT 1980-2077 IMCU FOUNDATION<br/>
                      {currentMotto.text}
                  </div>
              </div>

              {/* RIGHT PANEL: INTERACTION */}
              <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative">
                  {/* Mobile Header */}
                  <div className="md:hidden text-center mb-8 flex flex-col items-center">
                      <IconIMCULogo className="w-24 h-24 text-amber-500 mb-4 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      <h1 className="text-4xl font-bold text-amber-500">IMCU TERMINAL</h1>
                      <div className="text-xs text-amber-800 mt-1">MOBILE_ACCESS_DETECTED</div>
                  </div>

                  {loginStep === 'IDENTITY' ? (
                    <form onSubmit={handleLogin} className="space-y-6 w-full max-w-md mx-auto animate-in slide-in-from-right-8 duration-500">
                       <div className="space-y-2">
                          <label className="text-amber-700 text-sm tracking-widest">IDENTITY_VERIFICATION</label>
                          <input 
                            type="text" 
                            value={identity}
                            onChange={(e) => { setIdentity(e.target.value); soundManager.playKeystroke(); }}
                            className="w-full bg-amber-900/10 border-b-2 border-amber-800 text-amber-500 text-2xl py-2 focus:outline-none focus:border-amber-500 focus:bg-amber-900/20 transition-all font-bold uppercase placeholder-amber-900/30"
                            placeholder="ENTER USERNAME"
                            autoFocus
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-amber-700 text-sm tracking-widest">DESIGNATION (ROLE)</label>
                          
                          {!customRoleMode ? (
                              <div className="grid grid-cols-2 gap-2">
                                  {ROLE_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => { 
                                            soundManager.playKeystroke(); 
                                            if(opt.id === 'CUSTOM') {
                                                setCustomRoleMode(true);
                                                setRole('');
                                            } else {
                                                setRole(opt.id);
                                            }
                                        }}
                                        className={`border border-amber-800/50 p-2 text-sm text-left hover:bg-amber-500 hover:text-black transition-all ${role === opt.id ? 'bg-amber-500 text-black font-bold' : 'text-amber-600'}`}
                                      >
                                          <div className="text-[10px] opacity-50">{opt.code}</div>
                                          <div>{opt.label}</div>
                                      </button>
                                  ))}
                              </div>
                          ) : (
                              <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={role}
                                    onChange={(e) => { setRole(e.target.value); soundManager.playKeystroke(); }}
                                    className="flex-1 bg-amber-900/10 border-b-2 border-amber-800 text-amber-500 text-xl py-1 focus:outline-none focus:border-amber-500 font-bold uppercase"
                                    placeholder="OVERRIDE ROLE"
                                    autoFocus
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => { setCustomRoleMode(false); setRole('VISITOR'); }}
                                    className="text-xs text-amber-800 border border-amber-800 px-2 hover:text-amber-500"
                                  >
                                    CANCEL
                                  </button>
                              </div>
                          )}
                       </div>

                       <div className="pt-4">
                          <button 
                            type="submit"
                            className="w-full bg-amber-900/20 border-2 border-amber-600 text-amber-500 py-3 font-bold tracking-[0.2em] hover:bg-amber-500 hover:text-black transition-all duration-300 relative overflow-hidden group"
                          >
                             <span className="relative z-10">PROCEED &gt;&gt;</span>
                             <div className="absolute inset-0 bg-amber-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                          </button>
                       </div>

                       {loginError && (
                           <div className="text-red-500 text-center animate-pulse bg-red-900/10 p-2 border border-red-900/50">
                               ERROR: {loginError}
                           </div>
                       )}
                    </form>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-8 w-full max-w-md mx-auto animate-in slide-in-from-right-8 duration-500">
                       <div className="text-center space-y-1">
                           <div className="text-amber-500 text-xl">WELCOME, {identity.toUpperCase()}</div>
                           <div className="text-amber-800 text-sm">ROLE: {role.toUpperCase()}</div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-amber-700 text-sm tracking-widest">SECURITY CLEARANCE (PASSWORD)</label>
                          <div className="relative">
                              <input 
                                type="password" 
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); soundManager.playKeystroke(); }}
                                className="w-full bg-amber-900/10 border-b-2 border-amber-800 text-amber-500 text-2xl py-2 focus:outline-none focus:border-amber-500 focus:bg-amber-900/20 transition-all font-bold tracking-[0.5em]"
                                placeholder="••••••••"
                                autoFocus
                              />
                              <div className="absolute right-0 top-0 h-full flex items-center pr-2 pointer-events-none">
                                  <IconLock className="w-5 h-5 text-amber-800" />
                              </div>
                          </div>
                          <div className="text-[10px] text-amber-900 text-right">Hint: Try 'imcu'</div>
                       </div>

                       <div className="flex gap-4 pt-4">
                          <button 
                            type="button"
                            onClick={() => { setLoginStep('IDENTITY'); setPassword(''); soundManager.playKeystroke(); }}
                            className="flex-1 border border-amber-800 text-amber-700 py-3 hover:bg-amber-900/20 transition-all"
                          >
                             &lt; BACK
                          </button>
                          <button 
                            type="submit"
                            className="flex-[2] bg-amber-500 text-black border-2 border-amber-500 py-3 font-bold tracking-[0.2em] hover:bg-amber-400 hover:border-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                          >
                             AUTHENTICATE
                          </button>
                       </div>
                       
                       {loginError && (
                           <div className="text-red-500 text-center animate-pulse bg-red-900/10 p-2 border border-red-900/50 flex items-center justify-center gap-2">
                               <IconBiohazard className="w-4 h-4" /> ACCESS DENIED
                           </div>
                       )}
                    </form>
                  )}
              </div>

              {/* Decorator Lines */}
              <div className="absolute left-0 bottom-8 w-full h-[1px] bg-amber-900/30 pointer-events-none"></div>
              <div className="absolute right-8 top-0 h-full w-[1px] bg-amber-900/30 pointer-events-none"></div>

           </div>
           
           <div className="absolute bottom-2 text-amber-900/50 text-xs animate-pulse">
              TERMINAL_ID: Ω-709-X // SECURE CONNECTION
           </div>
        </div>
      </CRTLayout>
    );
  }

  return (
    <CRTLayout isOn={true}>
       <Terminal user={identity || 'GUEST'} role={role || 'VISITOR'} onLogout={handleLogout} />
    </CRTLayout>
  );
};

export default App;
