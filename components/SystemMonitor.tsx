
import React, { useEffect, useState } from 'react';
import { soundManager } from '../utils/sound';

interface SystemMonitorProps {
  onClose: () => void;
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ onClose }) => {
  const [cpu, setCpu] = useState<number[]>(Array(10).fill(0));
  const [mem, setMem] = useState(30);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCpu(prev => [...prev.slice(1), Math.floor(Math.random() * 100)]);
      setMem(prev => Math.min(100, Math.max(10, prev + (Math.random() - 0.5) * 10)));
      
      if (Math.random() > 0.7) {
        const msgs = [
          "检测到数据包丢失 (PACKET_LOSS)",
          "加密周期完成 (ENCRYPTION_CYCLE)",
          "节点 23 同步正常 (NODE_SYNC)",
          "警告：第7扇区温度峰值 (TEMP_SPIKE)",
          "上行链路稳定 (UPLINK_STABLE)",
          "正在分析模式 (ANALYZING)...",
          "请求守护进程重启 (DAEMON_RESTART)",
          "PING 响应 3ms"
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 14)]);
      }
    }, 200);

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
        onClose();
        soundManager.playKeystroke();
      }
    };
    window.addEventListener('keydown', keyHandler);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const renderBar = (val: number, width: number = 20) => {
    const filled = Math.floor((val / 100) * width);
    return '[' + '#'.repeat(filled) + '.'.repeat(width - filled) + ']';
  };

  return (
    <div className="h-full w-full flex flex-col p-4 font-vt323 text-amber-500 overflow-hidden bg-zinc-950/90 absolute inset-0 z-20">
      <div className="flex justify-between items-center border-b-2 border-amber-700 pb-2 mb-4">
        <h2 className="text-xl md:text-2xl font-bold blink">系统监控 // SYSTEM MONITOR</h2>
        <button 
          onClick={() => { soundManager.playKeystroke(); onClose(); }}
          className="border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black px-3 py-1 text-sm md:text-base transition-colors uppercase"
        >
          [ 退出 EXIT ]
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto md:overflow-hidden">
        {/* Left Column */}
        <div className="space-y-6 border-r border-amber-900/30 pr-4">
          <div>
            <div className="mb-1 flex justify-between">
               <span>CPU 负载聚合 (LOAD)</span>
               <span className="text-amber-300">{renderBar(cpu[cpu.length-1], 10)} {cpu[cpu.length-1]}%</span>
            </div>
            <div className="flex items-end space-x-1 h-24 border-b border-amber-800/50 pt-4">
              {cpu.map((val, i) => (
                <div key={i} className="flex-1 bg-amber-600/50 hover:bg-amber-500 transition-all" style={{ height: `${val}%` }}></div>
              ))}
            </div>
          </div>

          <div>
             <div className="mb-1">内存完整性 (MEMORY)</div>
             <div className="text-amber-300 mb-2">{renderBar(mem, 30)}</div>
             <div className="text-xs text-amber-700 grid grid-cols-4 gap-2">
               {Array(16).fill(0).map((_, i) => (
                 <div key={i} className={Math.random() > 0.8 ? "text-amber-300 animate-pulse" : ""}>
                   0x{Math.floor(Math.random()*10000).toString(16).toUpperCase()}
                 </div>
               ))}
             </div>
          </div>

          <div className="border border-amber-800 p-2">
            <div className="text-sm text-amber-600 mb-2">网络拓扑 (NETWORK TOPOLOGY)</div>
            <pre className="text-xs leading-none whitespace-pre">
{`     [SRV-1] <---> [GTW-A]
        |             |
        +--> [FWL] <--+
              |
      [数据链路已建立/LINKED]`}
            </pre>
          </div>
        </div>

        {/* Right Column: Logs */}
        <div className="flex flex-col h-full">
          <h3 className="text-lg border-b border-amber-800 mb-2">系统日志 (SYSTEM_LOGS)</h3>
          <div className="flex-1 overflow-hidden flex flex-col-reverse text-sm font-mono text-amber-400/80">
            {logs.map((log, i) => (
              <div key={i} className="border-b border-amber-900/20 py-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
