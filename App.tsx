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
        setLoginError('错误：身份标识无效 (INVALID IDENTITY)');
      }
    } else {
      if (password.toLowerCase() === 'imcu' || password === '1234') { 
        soundManager.playLoginSuccess();
        setViewState('TERMINAL');
      } else {
        soundManager.playLoginFail();
        setLoginError('错误：访问代码被拒绝 (ACCESS DENIED)');
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
        <div className="flex flex-col items-center justify-center h-full w-full p-4 overflow-y-auto custom-scrollbar">
          <div className="border-2 border-amber-600 bg-black max-w-2xl w-full text-center relative shadow-[0_0_30px_rgba(217,119,6,0.15)] p-6 md:p-8 my-auto">
             <h1 className="text-4xl md:text-5xl mb-6 tracking-widest text-glow font-bold text-amber-500">IMCU 终端</h1>
             
             <div className="text-left space-y-2 mb-8 border-l-4 border-amber-800 pl-4 bg-amber-900/10 py-2">
               <div className="flex justify-between items-center">
                 <p className="text-amber-700 text-sm font-bold">安全协议 (SECURITY PROTOCOL)</p>
                 <p className="text-amber-900 text-xs">v.9.0.1</p>
               </div>
               <p className="text-red-500 animate-pulse tracking-wider">RESTRICTED AREA / 极密禁区</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
               <div>
                 <label className="block text-amber-700 text-left text-xs md:text-sm mb-2 uppercase tracking-wider">
                    {loginStep === 'IDENTITY' ? '> 身份标识 (IDENTITY)' : '> 访问代码 (ACCESS CODE)'}
                 </label>
                 <div className="relative group">
                    <input 
                      type={loginStep === 'PASSWORD' ? "password" : "text"}
                      className="w-full bg-black border-2 border-amber-800 text-amber-300 text-xl md:text-2xl p-3 focus:outline-none focus:border-amber-500 font-mono text-center uppercase transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] placeholder-amber-900/50"
                      value={loginStep === 'IDENTITY' ? identity : password}
                      onChange={(e) => {
                        if(loginStep === 'IDENTITY') setIdentity(e.target.value);
                        else setPassword(e.target.value);
                        soundManager.playKeystroke();
                      }}
                      autoFocus
                      placeholder={loginStep === 'IDENTITY' ? "ENTER NAME..." : "XXXX"}
                    />
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-amber-900/20 group-focus-within:bg-amber-500/20"></div>
                 </div>
               </div>

               {/* Role Selection Step - Redesigned */}
               {loginStep === 'IDENTITY' && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 border-t border-amber-900/30">
                   <label className="block text-amber-700 text-left text-xs md:text-sm mb-3 uppercase tracking-wider">
                      > 职位选择 (SELECT POSITION)
                   </label>
                   
                   {!customRoleMode ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                               relative p-3 border transition-all duration-200 flex flex-col items-center justify-center group
                               ${role === opt.id 
                                 ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                 : 'bg-black/40 border-amber-800 text-amber-600 hover:border-amber-500 hover:text-amber-400 hover:bg-amber-900/20'
                               }
                             `}
                           >
                              {/* Tech Corners */}
                              <div className={`absolute top-0 left-0 w-1 h-1 ${role === opt.id ? 'bg-black' : 'bg-amber-500'} transition-colors`}></div>
                              <div className={`absolute bottom-0 right-0 w-1 h-1 ${role === opt.id ? 'bg-black' : 'bg-amber-500'} transition-colors`}></div>
                              
                              <span className="text-lg md:text-xl font-bold leading-none mb-1">{opt.label}</span>
                              <span className={`text-[10px] uppercase tracking-wider ${role === opt.id ? 'text-black/70' : 'text-amber-800 group-hover:text-amber-600'}`}>{opt.sub}</span>
                           </button>
                         ))}
                      </div>
                   ) : (
                      <div className="relative animate-in zoom-in-95 duration-300">
                         <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="text"
                                    className="w-full bg-black border-2 border-amber-500 text-amber-300 text-lg p-2 focus:outline-none shadow-[0_0_15px_rgba(245,158,11,0.1)] font-mono text-center uppercase placeholder-amber-900"
                                    value={role}
                                    onChange={(e) => { setRole(e.target.value); soundManager.playKeystroke(); }}
                                    placeholder="ENTER CUSTOM ROLE..."
                                    autoFocus
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">_</div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => { setCustomRoleMode(false); setRole('VISITOR'); soundManager.playKeystroke(); }}
                              className="px-4 border border-amber-700 text-amber-700 hover:bg-amber-900/20 hover:text-amber-500 hover:border-amber-500 transition-colors"
                            >
                                BACK
                            </button>
                         </div>
                         <div className="text-xs text-amber-800 mt-2 text-center">
                             * WARNING: Non-standard roles may trigger anomalous AI responses.
                         </div>
                      </div>
                   )}
                 </div>
               )}

               {loginError && (
                  <div className="border border-red-900/50 bg-red-900/10 p-3 text-red-500 text-sm font-bold animate-pulse flex items-center justify-center gap-2">
                     <span className="text-xl">!</span> {loginError}
                  </div>
               )}

               <button 
                  type="submit"
                  className="group w-full bg-amber-900/20 border-2 border-amber-600 hover:bg-amber-500 hover:text-black hover:border-amber-500 text-amber-500 py-3 md:py-4 transition-all duration-300 uppercase tracking-[0.2em] font-bold text-lg mt-6 relative overflow-hidden"
               >
                  <span className="relative z-10">{loginStep === 'IDENTITY' ? '下一步 // NEXT' : '授权登录 // AUTHENTICATE'}</span>
                  {/* Hover Sweep Effect */}
                  <div className="absolute inset-0 bg-amber-400/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
               </button>
             </form>
             
             <div className="mt-8 pt-4 border-t border-amber-900/30 flex justify-between text-[10px] text-amber-900 uppercase font-mono">
                <span>SECURE TERMINAL ACCESS</span>
                <span>IMCU-NET // ENCRYPTED</span>
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