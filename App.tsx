import React, { useState, useEffect, useRef } from 'react';
import { CRTLayout } from './components/CRTLayout';
import { Terminal } from './components/Terminal';
import { ViewState } from './types';
import { soundManager } from './utils/sound';

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

  // --- BOOT SEQUENCE ---
  const handlePowerOn = () => {
    soundManager.init();
    setViewState('BOOT');
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
        const interval = setInterval(() => {
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
        const interval = setInterval(() => {
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
      <div className="h-[100dvh] w-full bg-zinc-950 flex items-center justify-center font-vt323 relative overflow-hidden touch-none">
         <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-20"></div>
         <button 
            onClick={handlePowerOn}
            className="group relative px-10 py-6 border-2 border-amber-900 bg-black text-amber-700 hover:bg-amber-900/20 hover:text-amber-500 hover:border-amber-500 transition-all duration-300"
         >
            <span className="text-2xl tracking-[0.3em] uppercase font-bold animate-pulse">Power On</span>
            <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-amber-900 group-hover:text-amber-700">TERMINAL_INIT_SEQ</div>
            
            {/* Decorators */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-500 -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-500 -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-500 -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-500 -mb-1 -mr-1"></div>
         </button>
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

           {/* Login Main Frame */}
           <div className="relative w-full max-w-5xl h-[90%] md:h-[80%] border-4 border-double border-amber-800 bg-black/95 shadow-[0_0_40px_rgba(217,119,6,0.15)] flex flex-col md:flex-row overflow-hidden">
              
              {/* Decorative Corner Brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-600"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600"></div>

              {/* LEFT PANEL: STATUS / LOGO */}
              <div className="hidden md:flex w-[35%] border-r-2 border-amber-800/50 flex-col p-8 justify-between bg-amber-900/5 relative">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(217,119,6,0.03)_10px,rgba(217,119,6,0.03)_20px)] pointer-events-none"></div>
                  
                  <div>
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

                  {/* Scrolling Telemetry */}
                  <div className="border-t border-b border-amber-800/30 py-4">
                      <div className="text-xs text-amber-600 mb-2 font-bold">[ SYSTEM TELEMETRY ]</div>
                      <div className="font-mono text-[10px] text-amber-800/70 space-y-1 h-32 overflow-hidden flex flex-col-reverse">
                          {telemetry.map((t, i) => <div key={i}>{t}</div>)}
                      </div>
                  </div>

                  <div className="text-[10px] text-amber-900 text-center">
                      COPYRIGHT 1980-2077 IMCU FOUNDATION<br/>
                      ALL RIGHTS RESERVED
                  </div>
              </div>

              {/* RIGHT PANEL: INTERACTION */}
              <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative">
                  {/* Mobile Header */}
                  <div className="md:hidden text-center mb-8">
                      <h1 className="text-4xl font-bold text-amber-500">IMCU TERMINAL</h1>
                      <div className="text-xs text-amber-800 mt-1">MOBILE_UPLINK_DETECTED</div>
                  </div>

                  <div className="mb-2 flex justify-between items-end border-b border-amber-800/50 pb-2">
                      <span className="text-amber-500 font-bold text-xl tracking-widest">
                          {loginStep === 'IDENTITY' ? '>> IDENTIFICATION' : '>> VERIFICATION'}
                      </span>
                      <span className="text-xs text-amber-800 animate-pulse">
                          {loginStep === 'IDENTITY' ? 'WAITING_FOR_INPUT' : 'SECURE_CHANNEL'}
                      </span>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-8 mt-6">
                      
                      {/* INPUT FIELD */}
                      <div className="relative group">
                          <label className="text-xs text-amber-700 uppercase tracking-widest mb-1 block group-focus-within:text-amber-500 transition-colors">
                             {loginStep === 'IDENTITY' ? 'USER_ID / CODENAME' : 'ACCESS_CODE'}
                          </label>
                          <div className="flex items-center">
                             <span className="text-amber-600 mr-2 text-xl">&gt;</span>
                             <input 
                                type={loginStep === 'PASSWORD' ? "password" : "text"}
                                value={loginStep === 'IDENTITY' ? identity : password}
                                onChange={(e) => {
                                    if(loginStep === 'IDENTITY') setIdentity(e.target.value);
                                    else setPassword(e.target.value);
                                    soundManager.playKeystroke();
                                }}
                                className="w-full bg-transparent border-b-2 border-amber-800/50 text-amber-200 text-2xl md:text-3xl py-1 focus:outline-none focus:border-amber-500 font-mono uppercase tracking-widest placeholder-amber-900/20"
                                autoFocus
                                placeholder={loginStep === 'IDENTITY' ? "ENTER NAME" : "••••••••"}
                             />
                             <div className="w-3 h-6 bg-amber-500 animate-pulse ml-1"></div>
                          </div>
                      </div>

                      {/* ROLE SELECTOR (IDENTITY STEP ONLY) */}
                      {loginStep === 'IDENTITY' && (
                          <div className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                              <div className="flex justify-between items-center mb-2">
                                  <label className="text-xs text-amber-700 uppercase tracking-widest">SECURITY_CLEARANCE</label>
                                  {customRoleMode && <span className="text-[10px] text-red-500 bg-red-900/10 px-1">OVERRIDE_ACTIVE</span>}
                              </div>

                              {!customRoleMode ? (
                                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                      {ROLE_OPTIONS.map((opt) => (
                                          <button
                                              key={opt.id}
                                              type="button"
                                              onClick={() => {
                                                  if (opt.id === 'CUSTOM') {
                                                      setCustomRoleMode(true);
                                                      setRole('');
                                                  } else {
                                                      setRole(opt.id);
                                                  }
                                                  soundManager.playKeystroke();
                                              }}
                                              className={`
                                                  relative p-3 border flex items-center gap-3 group transition-all
                                                  ${role === opt.id 
                                                      ? 'border-amber-500 bg-amber-500/10 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                                                      : 'border-amber-900/40 text-amber-800 hover:border-amber-600 hover:text-amber-500'
                                                  }
                                              `}
                                          >
                                              {/* LED Indicator */}
                                              <div className={`w-2 h-2 border border-amber-600 ${role === opt.id ? 'bg-amber-500 shadow-[0_0_5px_#d97706]' : 'bg-black'}`}></div>
                                              
                                              <div className="flex flex-col items-start leading-none">
                                                  <span className="text-sm font-bold tracking-wider">{opt.label}</span>
                                                  <span className="text-[10px] opacity-70 mt-1">{opt.code}</span>
                                              </div>
                                              
                                              {/* Corner ticks */}
                                              <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-50"></div>
                                              <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-50"></div>
                                          </button>
                                      ))}
                                  </div>
                              ) : (
                                  <div className="border border-dashed border-amber-700 p-4 bg-black/50">
                                      <input 
                                          className="w-full bg-zinc-900 border border-amber-600 text-amber-300 p-2 font-mono uppercase focus:outline-none focus:border-amber-400"
                                          placeholder="ENTER_CUSTOM_ROLE..."
                                          value={role}
                                          onChange={(e) => { setRole(e.target.value); soundManager.playKeystroke(); }}
                                          autoFocus
                                      />
                                      <div className="flex justify-end mt-2">
                                          <button 
                                              type="button" 
                                              onClick={() => { setCustomRoleMode(false); setRole('VISITOR'); }}
                                              className="text-[10px] text-amber-600 hover:text-amber-400 underline"
                                          >
                                              CANCEL_OVERRIDE
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}

                      {/* ERROR DISPLAY */}
                      {loginError && (
                          <div className="bg-red-900/10 border-l-4 border-red-500 p-3 flex items-center gap-3 animate-pulse">
                              <span className="text-red-500 font-bold">⚠ ERROR:</span>
                              <span className="text-red-400 text-sm">{loginError}</span>
                          </div>
                      )}

                      {/* SUBMIT BUTTON */}
                      <button 
                          type="submit"
                          className="w-full bg-amber-700 text-black font-bold py-4 mt-4 hover:bg-amber-500 transition-all uppercase tracking-[0.2em] text-lg shadow-[0_4px_0_rgba(69,26,3,1)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(69,26,3,1)]"
                      >
                          {loginStep === 'IDENTITY' ? 'INITIATE_LINK' : 'AUTHENTICATE'}
                      </button>

                  </form>
              </div>
           </div>
        </div>
      </CRTLayout>
    );
  }

  return (
    <CRTLayout isOn={true}>
      <Terminal user={identity} role={role} onLogout={handleLogout} />
    </CRTLayout>
  );
};

export default App;