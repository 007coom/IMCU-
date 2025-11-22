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
      // Allow any non-empty identity
      if (identity.trim().length > 0) {
        setLoginStep('PASSWORD');
        setLoginError('');
      } else {
        soundManager.playLoginFail();
        setLoginError('错误：身份标识无效 (INVALID IDENTITY)');
        setIdentity('');
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
     setLoginStep('IDENTITY');
     setViewState('LOGIN');
     setLoginError('');
     setBootStep(0); // Reset boot for effect if desired, or keep simplified
     setLoadingProgress(0);
     soundManager.playEnter(); 
  }

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
        <div className="flex flex-col items-center justify-center h-full w-full p-4">
          <div className="border-2 border-amber-600 bg-black max-w-md w-full text-center relative shadow-[0_0_30px_rgba(217,119,6,0.15)] p-6 md:p-8">
             <h1 className="text-4xl md:text-5xl mb-8 tracking-widest text-glow font-bold text-amber-500">IMCU 终端</h1>
             
             <div className="text-left space-y-2 mb-8 border-l-2 border-amber-800 pl-4">
               <p className="text-amber-700 text-sm">安全协议 (SECURITY PROTOCOL)</p>
               <p className="text-red-500 animate-pulse">RESTRICTED AREA / 极密禁区</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
               <div>
                 <label className="block text-amber-700 text-left text-sm mb-1">
                    {loginStep === 'IDENTITY' ? '身份标识 (IDENTITY)' : '访问代码 (ACCESS CODE)'}
                 </label>
                 <input 
                   type={loginStep === 'PASSWORD' ? "password" : "text"}
                   className="w-full bg-black border-b-2 border-amber-500 text-amber-300 text-base md:text-2xl p-2 focus:outline-none focus:border-amber-300 font-mono text-center uppercase"
                   value={loginStep === 'IDENTITY' ? identity : password}
                   onChange={(e) => {
                     if(loginStep === 'IDENTITY') setIdentity(e.target.value);
                     else setPassword(e.target.value);
                     soundManager.playKeystroke();
                   }}
                   autoFocus
                   placeholder={loginStep === 'IDENTITY' ? "输入身份标识 / ENTER ID" : "****"}
                 />
               </div>

               {loginError && <div className="text-red-500 text-sm font-bold animate-pulse">{loginError}</div>}

               <button 
                  type="submit"
                  className="w-full bg-amber-900/30 border border-amber-600 hover:bg-amber-600 hover:text-black text-amber-500 py-2 transition-colors"
               >
                  {loginStep === 'IDENTITY' ? '验证身份 (VERIFY)' : '授权登录 (AUTHENTICATE)'}
               </button>
             </form>
             
             <div className="mt-6 text-xs text-amber-800">
                提示: 默认访问代码为 IMCU<br/>
                HINT: Default access code is IMCU
             </div>
          </div>
        </div>
      </CRTLayout>
    );
  }

  return (
    <CRTLayout isOn={true}>
      <Terminal user={identity} onLogout={handleLogout} />
    </CRTLayout>
  );
};

export default App;