
import React, { useState, useEffect } from 'react';
import { CRTLayout } from './components/CRTLayout';
import { Terminal } from './components/Terminal';
import { ViewState } from './types';
import { soundManager } from './utils/sound';

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

  const handlePowerOn = () => {
    soundManager.init();
    setViewState('BOOT');
  };

  // Boot Sequence with Loading Bar
  useEffect(() => {
    if (viewState === 'BOOT') {
      // Step 0: Initial text
      if (bootStep === 0) {
        soundManager.playKeystroke(); // Initial beep
        const timer = setTimeout(() => setBootStep(1), 800);
        return () => clearTimeout(timer);
      }
      
      // Step 1: Connection text
      if (bootStep === 1) {
         soundManager.playKeystroke();
         const timer = setTimeout(() => setBootStep(2), 1000);
         return () => clearTimeout(timer);
      }

      // Step 2: Progress Bar Loading
      if (bootStep === 2) {
        const interval = setInterval(() => {
          setLoadingProgress(prev => {
            // Non-linear loading speed for realism
            const increment = Math.random() * 5 + 1;
            const next = prev + increment;
            if (next >= 100) {
              clearInterval(interval);
              soundManager.playLoginSuccess(); // Ready sound
              setTimeout(() => setBootStep(3), 500);
              return 100;
            }
            // Occasional click sound during load
            if (Math.random() > 0.7) soundManager.playKeystroke(); 
            return next;
          });
        }, 50);
        return () => clearInterval(interval);
      }

      // Step 3: Final Check
      if (bootStep === 3) {
         const timer = setTimeout(() => setBootStep(4), 1200);
         return () => clearTimeout(timer);
      }

      // Step 4: Transition
      if (bootStep === 4) {
         const timer = setTimeout(() => setViewState('LOGIN'), 1000);
         return () => clearTimeout(timer);
      }
    }
  }, [viewState, bootStep]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginStep === 'IDENTITY') {
      soundManager.playEnter();
      // Allow any non-empty identity and role
      if (identity.trim().length > 0) {
        if (role.trim().length === 0) {
            setRole('VISITOR'); // Default fallback
        }
        setLoginStep('PASSWORD');
        setLoginError('');
      } else {
        soundManager.playLoginFail();
        setLoginError('IDENTITY_REQUIRED');
      }
    } else {
      if (password.toLowerCase() === 'imcu' || password === '1234') { 
        soundManager.playLoginSuccess();
        setViewState('TERMINAL');
      } else {
        soundManager.playLoginFail();
        setLoginError('INVALID_ACCESS_CODE');
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
     setBootStep(0); // Reset boot for effect if desired, or keep simplified
     setLoadingProgress(0);
     soundManager.playEnter(); 
  }

  const ROLE_OPTIONS = [
    { id: 'VISITOR', label: '访客', sub: 'VISITOR' },
    { id: 'AGENT', label: '特工', sub: 'AGENT' },
    { id: 'SCIENTIST', label: '研究员', sub: 'SCIENTIST' },
    { id: 'DIRECTOR', label: '主管', sub: 'DIRECTOR' },
    { id: 'Ω', label: 'Ω', sub: 'OMEGA' },
    { id: 'CUSTOM', label: '自定义', sub: 'CUSTOM' },
  ];

  if (viewState === 'POWER_OFF') {
    return (
      <div className="h-[100dvh] w-full bg-zinc-950 flex items-center justify-center font-vt323 relative overflow-hidden touch-none">
         <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-20"></div>
         <button 
            onClick={handlePowerOn}
            className="group relative px-8 py-4 border-2 border-amber-800/50 bg-black text-amber-600 hover:bg-amber-900/20 hover:text-amber-400 hover:border-amber-500 transition-all duration-300 uppercase tracking-[0.2em] text-xl md:text-2xl z-10"
         >
            <span className="animate-pulse">初始化系统</span>
            <div className="text-xs mt-2 text-center text-amber-800 group-hover:text-amber-600">INITIALIZE SYSTEM</div>
         </button>
      </div>
    );
  }

  if (viewState === 'BOOT') {
    return (
      <CRTLayout isOn={true}>
        <div className="flex flex-col items-start justify-end h-full p-4 md:p-10 text-lg md:text-xl font-mono uppercase">
          <div className="mb-2 text-amber-700">IMCU-BIOS v4.11.09 (c) 2077 Foundation Tech</div>
          
          {bootStep >= 0 && (
             <div className="mb-1">&gt; 正在检查内存完整性 (CHECKING MEMORY)... <span className="text-green-500">OK</span> (256TB)</div>
          )}
          
          {bootStep >= 1 && (
             <div className="mb-1">&gt; 正在建立与 OMEGA-NET 的上行链路... <span className="text-green-500">已连接</span></div>
          )}
          
          {bootStep >= 2 && (
             <div className="mt-6 mb-6 w-full max-w-2xl">
               <div className="flex justify-between text-sm text-amber-600 mb-1">
                  <span>正在加载内核模块 (LOADING KERNEL MODULES)</span>
                  <span>{Math.floor(loadingProgress)}%</span>
               </div>
               <div className="h-4 md:h-6 w-full border-2 border-amber-700 p-1">
                  <div 
                    className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-75 ease-out" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
               </div>
             </div>
          )}

          {bootStep >= 3 && (
             <div className="mb-1">&gt; 神经接口同步中 (NEURAL SYNC)... <span className="text-green-500">完成</span></div>
          )}

          {bootStep >= 4 && (
             <div className="animate-pulse mt-4 text-amber-300">&gt; 系统就绪。正在初始化安全协议...</div>
          )}
        </div>
      </CRTLayout>
    );
  }

  if (viewState === 'LOGIN') {
    return (
      <CRTLayout isOn={true}>
        <div className="flex flex-col items-center justify-center h-full w-full p-4 overflow-hidden relative">
          
          {/* Decorative Background Elements */}
          <div className="absolute top-10 left-10 text-amber-900/30 text-xs font-mono hidden md:block">
             SECURE_CONNECTION<br/>
             ENCRYPTION: AES-4096-GCM<br/>
             NODE: 192.168.0.1
          </div>
          <div className="absolute bottom-10 right-10 text-amber-900/30 text-xs font-mono hidden md:block text-right">
             IMCU_TERMINAL_OS<br/>
             COPYRIGHT 2077<br/>
             ALL RIGHTS RESERVED
          </div>

          {/* Main Login Container - Cassette Futurism Style */}
          <div className="relative max-w-3xl w-full border border-amber-800 bg-black/90 backdrop-blur-sm shadow-[0_0_50px_rgba(217,119,6,0.1)] flex flex-col md:flex-row overflow-hidden">
             
             {/* Decorative Header Bar */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-900 via-amber-500 to-amber-900 opacity-50"></div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-900/30"></div>

             {/* Left Side: Branding & Info */}
             <div className="hidden md:flex w-1/3 border-r border-amber-800 flex-col p-6 justify-between bg-amber-900/10">
                 <div>
                    <h1 className="text-4xl font-bold text-amber-500 mb-2 tracking-tighter">IMCU<br/>TERMINAL<br/>Ω</h1>
                    <div className="w-12 h-1 bg-amber-500 mb-4"></div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                       AUTHORIZED PERSONNEL ONLY.<br/>
                       VIOLATION OF PROTOCOL 709<br/>
                       WILL RESULT IN IMMEDIATE<br/>
                       TERMINATION.
                    </p>
                 </div>
                 <div className="space-y-2 text-[10px] text-amber-800 font-mono">
                    <div className="flex justify-between border-b border-amber-900/30 pb-1"><span>SYS_STATUS</span><span className="text-amber-600">ONLINE</span></div>
                    <div className="flex justify-between border-b border-amber-900/30 pb-1"><span>NET_LINK</span><span className="text-amber-600">SECURE</span></div>
                    <div className="flex justify-between pb-1"><span>AUTH_SRV</span><span className="text-amber-600 animate-pulse">WAITING</span></div>
                 </div>
             </div>

             {/* Right Side: Form */}
             <div className="flex-1 p-6 md:p-10 flex flex-col relative">
                {/* Mobile Branding */}
                <div className="md:hidden mb-6 text-center">
                   <h1 className="text-3xl font-bold text-amber-500 tracking-widest">IMCU ACCESS</h1>
                   <div className="h-px w-full bg-amber-800 mt-2"></div>
                </div>

                <div className="mb-8 flex justify-between items-end border-b border-amber-900/50 pb-2">
                   <div>
                      <div className="text-amber-700 text-xs uppercase tracking-widest mb-1">AUTHENTICATION MODULE</div>
                      <div className="text-amber-500 text-sm font-bold">{loginStep === 'IDENTITY' ? 'STEP 1: IDENTIFICATION' : 'STEP 2: VERIFICATION'}</div>
                   </div>
                   <div className="text-xs text-amber-900 font-mono">v4.2</div>
                </div>

                <form onSubmit={handleLogin} className="flex-1 flex flex-col justify-between space-y-6">
                   
                   {/* Input Section */}
                   <div className="space-y-2">
                      <label className="block text-amber-600 text-xs uppercase tracking-wider">
                        {loginStep === 'IDENTITY' ? '> USER_IDENTITY' : '> ACCESS_CODE'}
                      </label>
                      <div className="relative group">
                         <input 
                            type={loginStep === 'PASSWORD' ? "password" : "text"}
                            className="w-full bg-transparent border-b-2 border-amber-800 text-amber-300 text-2xl py-2 focus:outline-none focus:border-amber-500 font-mono uppercase placeholder-amber-900/30 transition-colors"
                            value={loginStep === 'IDENTITY' ? identity : password}
                            onChange={(e) => {
                              if(loginStep === 'IDENTITY') setIdentity(e.target.value);
                              else setPassword(e.target.value);
                              soundManager.playKeystroke();
                            }}
                            autoFocus
                            placeholder={loginStep === 'IDENTITY' ? "ENTER NAME" : "••••"}
                         />
                         <div className="absolute right-0 bottom-2 text-amber-500 animate-pulse text-xl font-bold">_</div>
                      </div>
                   </div>

                   {/* Role Selection (Strict Cassette Future Style) */}
                   {loginStep === 'IDENTITY' && (
                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <label className="block text-amber-600 text-xs uppercase tracking-wider mb-3 flex justify-between items-center">
                           <span>> SECURITY_CLEARANCE</span>
                           <span className="text-amber-900 bg-amber-900/20 px-1">REQUIRED</span>
                        </label>

                        {!customRoleMode ? (
                           <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
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
                                       relative p-2 text-left border flex items-center gap-3 transition-all group
                                       ${role === opt.id 
                                          ? 'border-amber-500 bg-amber-500/10 text-amber-300' 
                                          : 'border-amber-900/30 bg-transparent text-amber-700 hover:border-amber-700 hover:text-amber-500'
                                       }
                                    `}
                                 >
                                    {/* Retro Checkbox Visual */}
                                    <div className={`w-3 h-3 border ${role === opt.id ? 'border-amber-500' : 'border-amber-800'} flex items-center justify-center shrink-0`}>
                                       {role === opt.id && <div className="w-1.5 h-1.5 bg-amber-500"></div>}
                                    </div>
                                    
                                    <div className="flex flex-col min-w-0">
                                       <span className="text-xs font-bold tracking-wider truncate">{opt.sub}</span>
                                       <span className="text-[9px] opacity-60 truncate uppercase">{opt.label}</span>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        ) : (
                           <div className="border border-amber-600/50 p-3 bg-amber-900/5 relative">
                               <div className="text-[10px] text-amber-500 mb-2 flex items-center gap-2">
                                  <span className="animate-pulse">●</span> MANUAL_OVERRIDE_ENABLED
                               </div>
                               <input 
                                    type="text"
                                    className="w-full bg-black border border-amber-500 text-amber-300 text-sm p-2 focus:outline-none font-mono uppercase placeholder-amber-900"
                                    value={role}
                                    onChange={(e) => { setRole(e.target.value); soundManager.playKeystroke(); }}
                                    placeholder="ENTER DESIGNATION..."
                                    autoFocus
                                />
                                <div className="flex justify-end mt-2">
                                   <button 
                                      type="button" 
                                      onClick={() => { setCustomRoleMode(false); setRole('VISITOR'); soundManager.playKeystroke(); }}
                                      className="text-[10px] text-amber-700 hover:text-amber-500 hover:underline uppercase"
                                   >
                                      [ CANCEL OVERRIDE ]
                                   </button>
                                </div>
                           </div>
                        )}
                     </div>
                   )}

                   {loginError && (
                      <div className="text-red-500 text-xs font-bold animate-pulse bg-red-900/10 p-2 border-l-2 border-red-500 flex items-center gap-2">
                         <span>⚠</span> ERROR: {loginError}
                      </div>
                   )}

                   <button 
                      type="submit"
                      className="w-full bg-amber-600 text-black font-bold py-3 hover:bg-amber-500 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 group mt-4"
                   >
                      <span>{loginStep === 'IDENTITY' ? 'PROCEED' : 'AUTHENTICATE'}</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
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
