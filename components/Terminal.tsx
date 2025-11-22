
import React, { useState, useEffect, useRef } from 'react';
import { FileSystemNode, DirectoryNode, FileNode, TerminalLine, Contact, ClearanceLevel, AppType } from '../types';
import { FILE_SYSTEM, getContactsForUser, LATIN_MOTTOS } from '../data';
import { soundManager } from '../utils/sound';
import { TypingText } from './TypingText';
import { SystemMonitor } from './SystemMonitor';
import { WorldMap } from './WorldMap';
import { BioScan } from './BioScan';
import { AIXi001 } from './AIXi001';
import { Surveillance } from './Surveillance';
import { IconBiohazard, IconCircuit, IconDatabase, IconEye, IconSatellite, IconTerminal, IconRadioactive } from './Icons';

interface TerminalProps {
  user: string;
  role: string;
  onLogout: () => void;
}

const COMMANDS = [
  'help', 'ls', 'cd', 'cat', 'clear', 'sys', 'map', 'scan', 
  'ai', 'cam', 'pwd', 'whoami', 'import', 'touch', 'comms', 
  'tree', 'logout', 'exit'
];

// App Configuration for Taskbar
const APP_CONFIG: Record<string, { label: string, icon: React.FC<any> }> = {
  'SYS': { label: 'SYSTEM', icon: IconCircuit },
  'MAP': { label: 'DEFENSE', icon: IconSatellite },
  'SCAN': { label: 'BIO-SCAN', icon: IconBiohazard },
  'AI': { label: 'AI CORE', icon: IconRadioactive },
  'CAM': { label: 'SURVEILLANCE', icon: IconEye },
};

export const Terminal: React.FC<TerminalProps> = ({ user, role, onLogout }) => {
  const [lines, setLines] = useState<TerminalLine[]>(() => {
    const motto = LATIN_MOTTOS[Math.floor(Math.random() * LATIN_MOTTOS.length)];
    return [
        { type: 'system', content: 'IMCU SECURE TERMINAL v4.5' },
        { type: 'system', content: 'INITIALIZING KERNEL... OK' },
        { type: 'system', content: 'LOADING SECURITY PROTOCOLS... OK' },
        { type: 'output', content: '----------------------------------------' },
        { type: 'output', content: `:: ${motto.text} ::` },
        { type: 'output', content: `   (${motto.trans})` },
        { type: 'output', content: '----------------------------------------' },
        { type: 'system', content: `欢迎, ${user} [${role}]` },
        { type: 'system', content: '输入 "help" 查看可用命令 (Type "help")' }, 
        { type: 'success', content: '连接已建立 (Connection Established).' }
    ];
  });
  
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Taskbar & Window Management
  const [activeProgram, setActiveProgram] = useState<AppType>('NONE');
  const [openApps, setOpenApps] = useState<AppType[]>([]);
  const [programOptions, setProgramOptions] = useState<any>({});
  
  // Autocompletion State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ghostText, setGhostText] = useState('');
  
  // Dynamic File System State
  const [fileSystem, setFileSystem] = useState<FileSystemNode>(FILE_SYSTEM);
  
  // Dynamic Contacts State
  const [contacts, setContacts] = useState<Contact[]>(() => getContactsForUser(user, role));

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHighCommand = ['Ω', 'OMEGA', 'CAT', 'OBSERVER', 'DIRECTOR', 'ADMIN', 'VANCE', 'ROOT'].some(k => (user + role).toUpperCase().includes(k));

  // Scroll handling
  useEffect(() => {
    if (activeProgram === 'NONE') {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [lines, activeProgram]);

  // Focus handling
  const handleContainerClick = (e: React.MouseEvent) => {
    if (activeProgram === 'NONE') {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;
        
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            if (scrollHeight - scrollTop - clientHeight > 50) return;
        }
        inputRef.current?.focus({ preventScroll: true });
    }
  };

  // App Management Functions
  const launchApp = (app: AppType, options: any = {}) => {
    setProgramOptions((prev: any) => ({ ...prev, ...options }));
    if (!openApps.includes(app)) {
      setOpenApps(prev => [...prev, app]);
    }
    setActiveProgram(app);
  };

  const closeApp = (app: AppType) => {
    setOpenApps(prev => prev.filter(a => a !== app));
    if (activeProgram === app) {
      setActiveProgram('NONE');
    }
  };

  const toggleApp = (app: AppType) => {
    if (activeProgram === app) {
      setActiveProgram('NONE'); // Minimize
    } else {
      setActiveProgram(app); // Focus
    }
  };

  // File System Helpers
  const getCurrentNode = (path: string[] = currentPath): FileSystemNode | null => {
    let node: FileSystemNode = fileSystem;
    const traversalPath = path.slice(1); 
    for (const segment of traversalPath) {
      if (node.type === 'DIR' && node.children[segment]) {
        node = node.children[segment];
      } else {
        return null;
      }
    }
    return node;
  };

  const addFile = (name: string, content: string) => {
    setFileSystem(prev => {
      const newFS = JSON.parse(JSON.stringify(prev));
      let currentNode = newFS;
      const traversalPath = currentPath.slice(1);
      for (const segment of traversalPath) {
        if (currentNode.type === 'DIR' && currentNode.children[segment]) {
          currentNode = currentNode.children[segment];
        }
      }
      if (currentNode.type === 'DIR') {
        currentNode.children[name] = { type: 'FILE', name, content };
      }
      return newFS;
    });
  };

  // Suggestion Logic
  useEffect(() => {
    if (!input) {
      setSuggestions([]);
      setGhostText('');
      return;
    }
    const parts = input.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    const isArgContext = parts.length > 1;
    let matches: string[] = [];

    if (!isArgContext) {
      matches = COMMANDS.filter(c => c.startsWith(cmd));
    } else {
      const node = getCurrentNode();
      if (node && node.type === 'DIR') {
        if (cmd === 'cd') {
           const dirs = Object.entries(node.children).filter(([_, c]) => c.type === 'DIR').map(([n]) => n);
           matches = ['..', ...dirs].filter(d => d.startsWith(arg));
        } else if (cmd === 'cat') {
           const files = Object.entries(node.children).filter(([_, c]) => c.type === 'FILE').map(([n]) => n);
           matches = files.filter(f => f.startsWith(arg));
        }
      }
    }
    setSuggestions(matches);
    if (matches.length > 0) {
      const bestMatch = matches[0];
      const currentTyped = isArgContext ? arg : cmd;
      if (bestMatch.startsWith(currentTyped) && bestMatch.length > currentTyped.length) {
         setGhostText(bestMatch.slice(currentTyped.length));
      } else {
         setGhostText('');
      }
    } else {
      setGhostText('');
    }
  }, [input, currentPath, fileSystem]);

  // Command Execution
  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;
    
    soundManager.playEnter();
    setHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newLines: TerminalLine[] = [
      { type: 'input', content: trimmed, path: `~/${currentPath.slice(1).join('/')}` }
    ];

    switch (command) {
      case 'help':
        // ... (Help content same as before)
        newLines.push({ type: 'output', content: '可用命令 (AVAILABLE COMMANDS):' });
        newLines.push({ type: 'output', content: '  ls, cd, cat, pwd, clear, import, touch' });
        newLines.push({ type: 'system', content: '--- APPS ---' });
        newLines.push({ type: 'output', content: '  sys, map, scan, ai, cam' });
        break;

      case 'clear':
        setLines([]);
        return;

      case 'sys': launchApp('SYS'); break;
      case 'map': launchApp('MAP'); break;
      case 'scan': launchApp('SCAN'); break;
      case 'ai': launchApp('AI', { initialModel: args.includes('-pro') ? 'PRO' : 'FLASH' }); break;
      case 'cam': launchApp('CAM', { initialModel: args.includes('-pro') ? 'PRO' : 'FLASH' }); break;

      case 'pwd':
        newLines.push({ type: 'output', content: `/${currentPath.join('/')}` });
        break;

      case 'import':
      case 'upload':
        newLines.push({ type: 'system', content: 'INIT TAPE READER...' });
        fileInputRef.current?.click();
        break;

      case 'touch':
        if (args.length === 0) newLines.push({ type: 'error', content: 'Usage: touch [name]' });
        else {
            addFile(args[0], "New file content...");
            newLines.push({ type: 'success', content: `File '${args[0]}' created.` });
        }
        break;

      case 'comms':
        newLines.push({ type: 'system', content: '--- CONTACTS ---' });
        contacts.forEach(c => newLines.push({ type: 'output', content: `[${c.id}] ${c.name} (${c.status})` }));
        newLines.push({ type: 'system', content: 'Use "ai" to open Comms Interface.' });
        launchApp('AI'); // Auto open AI for comms
        break;

      case 'whoami':
        newLines.push({ type: 'output', content: `USER: ${user} | ROLE: ${role}` });
        break;

      case 'ls':
        const node = getCurrentNode();
        if (node && node.type === 'DIR') {
             Object.entries(node.children).forEach(([name, child]) => {
                 newLines.push({ type: 'output', content: `${name}${child.type === 'DIR' ? '/' : ''}` });
             });
        }
        break;

      case 'cd':
        if (!args.length) setCurrentPath(['root']);
        else if (args[0] === '..') { if (currentPath.length > 1) setCurrentPath(prev => prev.slice(0, -1)); }
        else {
            const t = args[0];
            const n = getCurrentNode();
            if (n?.type === 'DIR' && n.children[t]?.type === 'DIR') setCurrentPath(prev => [...prev, t]);
            else newLines.push({ type: 'error', content: `Invalid directory: ${t}` });
        }
        break;

      case 'cat':
        if (!args.length) newLines.push({ type: 'error', content: 'Usage: cat [file]' });
        else {
            const n = getCurrentNode();
            const f = n?.type === 'DIR' ? n.children[args[0]] : null;
            if (f?.type === 'FILE') newLines.push({ type: 'output', content: f.content });
            else newLines.push({ type: 'error', content: 'File not found.' });
        }
        break;
      
      case 'logout':
        onLogout();
        return;
      
      case 'exit':
        if (activeProgram !== 'NONE') {
            closeApp(activeProgram);
        } else {
            newLines.push({ type: 'error', content: 'Already at root terminal.' });
        }
        return;

      default:
        newLines.push({ type: 'error', content: `Unknown command: ${command}` });
        soundManager.playLoginFail();
        break;
    }

    setLines(prev => [...prev, ...newLines]);
    setSuggestions([]);
    setGhostText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && ghostText)) {
      e.preventDefault();
      if (ghostText) setInput(prev => prev + ghostText);
      else if (suggestions.length === 1) setInput(suggestions[0] + (suggestions[0].endsWith('/') ? '' : ' '));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative" onClick={handleContainerClick}>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => {
            if(e.target.files?.[0]) {
                const r = new FileReader();
                r.onload = ev => {
                     addFile(e.target.files![0].name, ev.target?.result as string);
                     setLines(p => [...p, { type: 'success', content: 'Upload complete.' }]);
                };
                r.readAsText(e.target.files![0]);
            }
        }}
        accept=".txt,.md,.log,.json" 
      />

      {/* APP LAYER - Render all open apps but hide inactive ones */}
      <div className="absolute top-0 left-0 right-0 bottom-12 z-20 pointer-events-none">
          {/* System Monitor */}
          <div className={`absolute inset-0 pointer-events-auto bg-zinc-950/95 transition-opacity duration-200 ${openApps.includes('SYS') && activeProgram === 'SYS' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
             {openApps.includes('SYS') && <SystemMonitor onClose={() => closeApp('SYS')} />}
          </div>
          
          {/* World Map */}
          <div className={`absolute inset-0 pointer-events-auto bg-zinc-950/95 transition-opacity duration-200 ${openApps.includes('MAP') && activeProgram === 'MAP' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
             {openApps.includes('MAP') && <WorldMap onClose={() => closeApp('MAP')} />}
          </div>

          {/* Bio Scan */}
          <div className={`absolute inset-0 pointer-events-auto bg-zinc-950/95 transition-opacity duration-200 ${openApps.includes('SCAN') && activeProgram === 'SCAN' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
             {openApps.includes('SCAN') && <BioScan onClose={() => closeApp('SCAN')} />}
          </div>

           {/* Surveillance */}
           <div className={`absolute inset-0 pointer-events-auto bg-zinc-950/95 transition-opacity duration-200 ${openApps.includes('CAM') && activeProgram === 'CAM' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
             {openApps.includes('CAM') && <Surveillance onClose={() => closeApp('CAM')} initialModel={programOptions.initialModel} />}
          </div>

          {/* AI Core - Always keep mounted if in openApps to preserve chat state */}
          <div className={`absolute inset-0 pointer-events-auto bg-zinc-950/95 transition-opacity duration-200 ${openApps.includes('AI') && activeProgram === 'AI' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
             {openApps.includes('AI') && (
                <AIXi001 
                    onClose={() => closeApp('AI')} 
                    onNavigate={(target) => launchApp(target)} 
                    fileSystem={fileSystem} 
                    onUpdateFile={addFile}
                    contacts={contacts}
                    onAddContact={(c) => setContacts(p => [...p, c])}
                    onDeleteContact={(id) => setContacts(p => p.filter(x => x.id !== id))}
                    currentUser={user}
                    userRole={role}
                    isHighCommand={isHighCommand}
                    initialModel={programOptions.initialModel}
                />
             )}
          </div>
      </div>

      {/* TERMINAL LAYER - Always rendered at z-10, visible underneath or when active */}
      <div className={`absolute top-0 left-0 right-0 bottom-12 z-10 flex flex-col p-4 md:p-6 overflow-hidden font-vt323 text-lg md:text-xl text-amber-500 ${activeProgram !== 'NONE' ? 'opacity-20 blur-[2px] pointer-events-none' : 'opacity-100'}`}>
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar pb-4">
            {lines.map((line, idx) => (
              <div key={idx} className={`mb-1 break-words ${line.type === 'error' ? 'text-red-500' : line.type === 'success' ? 'text-green-500' : line.type === 'system' ? 'text-amber-700' : ''}`}>
                 {line.type === 'input' && <span className="mr-2 text-green-500">[{user}@terminal]$</span>}
                 <span className="whitespace-pre-wrap">{line.content}</span>
              </div>
            ))}
            <div ref={bottomRef}></div>
          </div>
          
          {/* Input Area */}
          <div className="mt-2 flex flex-col shrink-0">
            <div className="flex items-center border-t border-amber-800/30 pt-2 relative">
                <span className="mr-2 text-green-500 whitespace-nowrap">[{user}@terminal]$</span>
                <div className="relative flex-1">
                    <div className="absolute inset-0 pointer-events-none flex items-center text-amber-900/50 text-xl font-vt323 select-none z-0">
                        <span className="opacity-0 whitespace-pre">{input}</span>
                        <span>{ghostText}</span>
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); soundManager.playKeystroke(); }}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent border-none outline-none text-amber-500 caret-amber-500 font-vt323 text-xl min-w-0 relative z-10 placeholder-transparent"
                        autoFocus={activeProgram === 'NONE'}
                        autoComplete="off"
                        disabled={activeProgram !== 'NONE'}
                    />
                </div>
            </div>
            {suggestions.length > 0 && input.length > 0 && (
                <div className="text-amber-900 text-sm mt-1 ml-2 flex gap-4 flex-wrap opacity-80">
                    {suggestions.map((s, i) => (
                        <span key={i} className="mr-2">{s}</span>
                    ))}
                </div>
            )}
          </div>
      </div>

      {/* TASKBAR - Fixed Bottom z-30 */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-zinc-950 border-t-2 border-amber-800/60 z-30 flex items-center px-2 gap-2 select-none backdrop-blur-sm">
          {/* Start/Terminal Button */}
          <button 
              onClick={() => { setActiveProgram('NONE'); soundManager.playKeystroke(); }}
              className={`h-8 px-3 flex items-center gap-2 border transition-all ${activeProgram === 'NONE' ? 'bg-amber-500 text-black border-amber-500 font-bold' : 'bg-black text-amber-600 border-amber-900/50 hover:border-amber-500 hover:text-amber-400'}`}
          >
              <IconTerminal className="w-4 h-4" />
              <span className="hidden md:inline font-vt323">TERMINAL</span>
          </button>

          <div className="w-[1px] h-6 bg-amber-900/40 mx-1"></div>

          {/* Open Apps */}
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
              {openApps.map(app => {
                  const conf = APP_CONFIG[app] || { label: app, icon: IconCircuit };
                  const isActive = activeProgram === app;
                  const Icon = conf.icon;

                  return (
                      <div key={app} className={`group relative h-8 pl-3 pr-8 border flex items-center gap-2 cursor-pointer transition-all min-w-[100px] md:min-w-[140px] ${isActive ? 'bg-amber-900/30 border-amber-500 text-amber-300' : 'bg-black border-amber-900/30 text-amber-700 hover:border-amber-700'}`}
                           onClick={() => { toggleApp(app); soundManager.playKeystroke(); }}
                      >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="font-vt323 text-sm truncate">{conf.label}</span>
                          
                          {/* Close Button */}
                          <button 
                              onClick={(e) => { e.stopPropagation(); closeApp(app); soundManager.playKeystroke(); }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:text-red-500 hover:bg-red-900/20 rounded"
                          >
                              ×
                          </button>
                      </div>
                  );
              })}
          </div>

          {/* Clock / Status */}
          <div className="hidden md:flex items-center gap-3 text-amber-800 font-vt323 text-sm px-2 border-l border-amber-900/40 pl-4">
              <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>ONLINE</span>
              </div>
              <div>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
      </div>
    </div>
  );
};
