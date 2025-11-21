
import React, { useState, useEffect, useRef } from 'react';
import { FileSystemNode, DirectoryNode, FileNode, TerminalLine, Contact, ClearanceLevel } from '../types';
import { FILE_SYSTEM, CONTACTS } from '../data';
import { soundManager } from '../utils/sound';
import { TypingText } from './TypingText';
import { SystemMonitor } from './SystemMonitor';
import { WorldMap } from './WorldMap';
import { BioScan } from './BioScan';
import { AIXi001 } from './AIXi001';
import { Surveillance } from './Surveillance';

interface TerminalProps {
  user: string;
  onLogout: () => void;
}

export type AppType = 'NONE' | 'SYS' | 'MAP' | 'SCAN' | 'AI' | 'CAM';

const COMMANDS = [
  'help', 'ls', 'cd', 'cat', 'clear', 'sys', 'map', 'scan', 
  'ai', 'cam', 'pwd', 'whoami', 'import', 'touch', 'comms', 
  'tree', 'logout'
];

export const Terminal: React.FC<TerminalProps> = ({ user, onLogout }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: 'IMCU SECURE TERMINAL v4.4' },
    { type: 'system', content: '输入 "help" 查看可用命令 (Type "help")' }, 
    { type: 'success', content: '连接已建立 (Connection Established).' }
  ]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeProgram, setActiveProgram] = useState<AppType>('NONE');
  const [programOptions, setProgramOptions] = useState<any>({});
  
  // Autocompletion State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ghostText, setGhostText] = useState('');
  
  // Dynamic File System State
  const [fileSystem, setFileSystem] = useState<FileSystemNode>(FILE_SYSTEM);
  
  // Dynamic Contacts State
  const [contacts, setContacts] = useState<Contact[]>(CONTACTS);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Permission Level
  const checkClearance = (u: string): boolean => {
    const high = ['Ω', 'Omega', 'Observer', '观察者', 'Observation'];
    return high.some(h => h.toLowerCase() === u.toLowerCase() || h.toLowerCase() === u.trim().toLowerCase());
  };
  const isHighCommand = checkClearance(user);

  // Scroll to bottom on new line
  useEffect(() => {
    if (activeProgram === 'NONE') {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [lines, activeProgram]);

  // Focus input on click
  const handleContainerClick = () => {
    if (activeProgram === 'NONE') {
        // Check if user is selecting text
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
            inputRef.current?.focus({ preventScroll: true });
        }
    }
  };

  // Helper to get current node
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
        const children = node.children;
        
        if (cmd === 'cd') {
           // Suggest Directories
           const dirs = Object.entries(children)
             .filter(([_, child]) => child.type === 'DIR')
             .map(([name]) => name);
           matches = ['..', ...dirs].filter(d => d.startsWith(arg));
        } else if (cmd === 'cat') {
           // Suggest Files
           const files = Object.entries(children)
             .filter(([_, child]) => child.type === 'FILE')
             .map(([name]) => name);
           matches = files.filter(f => f.startsWith(arg));
        } else if (cmd === 'ai') {
           if ('-flash'.startsWith(arg)) matches.push('-flash');
        } else if (cmd === 'cam') {
           if ('-pro'.startsWith(arg)) matches.push('-pro');
        }
      }
    }

    setSuggestions(matches);

    // Ghost Text Calculation
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


  // Add a file to the current directory
  const addFile = (name: string, content: string) => {
    setFileSystem(prev => {
      // Deep clone to avoid mutation
      const newFS = JSON.parse(JSON.stringify(prev));
      
      // Traverse to current path
      let currentNode = newFS;
      const traversalPath = currentPath.slice(1);
      
      for (const segment of traversalPath) {
        if (currentNode.type === 'DIR' && currentNode.children[segment]) {
          currentNode = currentNode.children[segment];
        }
      }

      // Add file
      if (currentNode.type === 'DIR') {
        currentNode.children[name] = {
          type: 'FILE',
          name: name,
          content: content
        };
      }
      return newFS;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        addFile(file.name, content);
        setLines(prev => [...prev, { type: 'success', content: `文件 '${file.name}' 上传成功 (UPLOAD COMPLETE).` }]);
        soundManager.playLoginSuccess();
      };
      reader.readAsText(file);
    }
  };

  // Helper for Tree command
  const getTreeOutput = (node: DirectoryNode, prefix: string = '', result: string[] = []) => {
    const entries = Object.entries(node.children);
    entries.forEach(([key, child], index) => {
       const isLast = index === entries.length - 1;
       const connector = isLast ? '└── ' : '├── ';
       const childPrefix = isLast ? '    ' : '│   ';
       
       result.push(`${prefix}${connector}${key}${child.type === 'DIR' ? '/' : ''}`);
       
       if (child.type === 'DIR') {
         getTreeOutput(child, `${prefix}${childPrefix}`, result);
       }
    });
    return result;
  };

  const handleProgramClose = () => {
    setActiveProgram('NONE');
    setProgramOptions({});
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  };

  const handleNavigateFromAI = (target: AppType) => {
      setActiveProgram(target);
  };
  
  const handleAddContact = (contact: Contact) => {
      setContacts(prev => [...prev, contact]);
  };
  
  const handleDeleteContact = (id: string) => {
      setContacts(prev => prev.filter(c => c.id !== id));
  };

  // Execute command
  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;
    
    soundManager.playEnter();

    // Add to history
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
        newLines.push({ type: 'output', content: '可用命令 (AVAILABLE COMMANDS):' });
        newLines.push({ type: 'output', content: '  ls            - 列出当前目录 (List Directory)' });
        newLines.push({ type: 'output', content: '  cd [目录]     - 切换目录 (Change Directory)' });
        newLines.push({ type: 'output', content: '  cat [文件]    - 读取文件 (Read File)' });
        newLines.push({ type: 'output', content: '  import        - 导入文件 (Import File)' });
        newLines.push({ type: 'output', content: '  touch [名称]   - 创建新文件 (New File)' });
        newLines.push({ type: 'output', content: '  comms         - 通讯录 (Contact List)' });
        newLines.push({ type: 'output', content: '  pwd           - 显示当前路径 (Print Path)' });
        newLines.push({ type: 'output', content: '  clear         - 清空屏幕 (Clear Screen)' });
        newLines.push({ type: 'system', content: '--- VISUAL SUBSYSTEMS ---' });
        newLines.push({ type: 'output', content: '  sys           - 系统监控 (System Monitor)' });
        newLines.push({ type: 'output', content: '  map           - 全球防御 (Global Defense)' });
        newLines.push({ type: 'output', content: '  scan          - 生物扫描 (Bio-Scanner)' });
        newLines.push({ type: 'output', content: '  ai [-flash]   - AI核心 (Use -flash for speed / 使用flash模型提速)' });
        newLines.push({ type: 'output', content: '  cam [-pro]    - 闭路监控 (Use -pro for HD / 使用pro模型高清)' });
        break;

      case 'clear':
        setLines([]);
        return;

      case 'sys': setActiveProgram('SYS'); break;
      case 'map': setActiveProgram('MAP'); break;
      case 'scan': setActiveProgram('SCAN'); break;
      
      case 'ai': 
        if (args.includes('-flash') || args.includes('--flash')) {
           setProgramOptions({ initialModel: 'FLASH' });
        }
        setActiveProgram('AI'); 
        break;
        
      case 'cam': 
        if (args.includes('-pro') || args.includes('--pro')) {
            setProgramOptions({ initialModel: 'PRO' });
        }
        setActiveProgram('CAM'); 
        break;

      case 'pwd':
        newLines.push({ type: 'output', content: `/${currentPath.join('/')}` });
        break;

      case 'import':
      case 'upload':
        newLines.push({ type: 'system', content: '正在初始化磁带读取器... (INIT TAPE READER)' });
        fileInputRef.current?.click();
        break;

      case 'touch':
        if (args.length === 0) {
            newLines.push({ type: 'error', content: '用法: touch [文件名]' });
        } else {
            const fileName = args[0];
            addFile(fileName, "New file content...");
            newLines.push({ type: 'success', content: `文件 '${fileName}' 已创建。` });
        }
        break;

      case 'comms':
        newLines.push({ type: 'system', content: '--- IMCU SECURE CONTACTS ---' });
        contacts.forEach(c => {
            const statusColor = c.status === 'ONLINE' ? 'text-green-500' : c.status === 'BUSY' ? 'text-amber-500' : 'text-red-500';
            newLines.push({ type: 'output', content: `[${c.id}] ${c.name} - ${c.role}` });
        });
        newLines.push({ type: 'system', content: 'Tip: Access "AI Core" to send encrypted messages or add contacts.' });
        break;

      case 'whoami':
        newLines.push({ type: 'output', content: `当前用户: ${user}` });
        if (isHighCommand) {
             newLines.push({ type: 'output', content: '安全许可: Ω-IX (最高权限 / HIGHEST)' });
             if (user === 'Ω') {
                 newLines.push({ type: 'system', content: '备注: 别名 "复读奶牛猫" (Alias: Repeater Cow Cat)' });
             }
        } else {
             newLines.push({ type: 'output', content: '安全许可: Level-II (受限访问 / RESTRICTED)' });
             newLines.push({ type: 'system', content: '警报：您正在访问高级加密终端。部分功能可能被锁定。' });
        }
        break;

      // Easter Eggs
      case '复读奶牛猫':
      case 'repeater cow cat':
         if (user === 'Ω') {
             newLines.push({ type: 'success', content: '>> 检测到最高权限生物特征。欢迎您，复读奶牛猫阁下 (Ω)。' });
         } else {
             newLines.push({ type: 'error', content: '>> 访问被拒绝。你不是那只猫。' });
         }
         break;
      
      case '圆圆小黑球':
      case 'round little black ball':
         newLines.push({ type: 'system', content: '>> 正在呼叫观察者 (The Observer)...' });
         setTimeout(() => {
             if (isHighCommand) {
                setLines(prev => [...prev, { type: 'output', content: 'Observer: "我在看着你... (I am watching you...)"' }]);
             } else {
                setLines(prev => [...prev, { type: 'error', content: 'Observer: "这不是你该看的东西。" (System: Signal Jammed)' }]);
             }
             soundManager.playLoginSuccess();
         }, 1000);
         break;
      
      case 'tree':
        newLines.push({ type: 'output', content: '.' });
        const currentNode = getCurrentNode();
        if (currentNode && currentNode.type === 'DIR') {
            const treeLines = getTreeOutput(currentNode);
            treeLines.forEach(line => {
                newLines.push({ type: 'output', content: line });
            });
        }
        break;

      case 'ls':
        const node = getCurrentNode();
        if (node && node.type === 'DIR') {
          const children = Object.keys(node.children);
          if (children.length === 0) {
            newLines.push({ type: 'output', content: '(空目录 / EMPTY)' });
          } else {
             children.forEach(childName => {
                 const child = node.children[childName];
                 const suffix = child.type === 'DIR' ? '/' : '';
                 newLines.push({ type: 'output', content: `${childName}${suffix}` });
             });
          }
        }
        break;

      case 'cd':
        if (args.length === 0) {
           setCurrentPath(['root']);
        } else {
           const target = args[0];
           if (target === '..') {
              if (currentPath.length > 1) setCurrentPath(prev => prev.slice(0, -1));
           } else if (target === '/') {
              setCurrentPath(['root']);
           } else {
              const currentNode = getCurrentNode();
              if (currentNode && currentNode.type === 'DIR' && currentNode.children[target]) {
                 if (currentNode.children[target].type === 'DIR') {
                    setCurrentPath(prev => [...prev, target]);
                 } else {
                    newLines.push({ type: 'error', content: `错误：'${target}' 不是目录` });
                 }
              } else {
                 newLines.push({ type: 'error', content: `错误：目录 '${target}' 不存在` });
              }
           }
        }
        break;

      case 'cat':
        if (args.length === 0) {
           newLines.push({ type: 'error', content: '用法: cat [文件名]' });
        } else {
           const fileName = args[0];
           const currentNode = getCurrentNode();
           if (currentNode && currentNode.type === 'DIR' && currentNode.children[fileName]) {
              const file = currentNode.children[fileName];
              if (file.type === 'FILE') {
                 newLines.push({ type: 'output', content: file.content });
              } else {
                 newLines.push({ type: 'error', content: `错误：'${fileName}' 是目录` });
              }
           } else {
              newLines.push({ type: 'error', content: `错误：文件 '${fileName}' 不存在` });
           }
        }
        break;
      
      case 'logout':
        onLogout();
        return;

      default:
        newLines.push({ type: 'error', content: `未知命令: ${command}` });
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
    } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
      // Autocomplete
      if (ghostText) {
          e.preventDefault();
          setInput(prev => prev + ghostText);
      } else if (e.key === 'Tab') {
          e.preventDefault(); // Prevent focus loss if no ghost text but tab pressed
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        soundManager.playKeystroke();
        const nextIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      soundManager.playKeystroke();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const getPromptPath = () => {
      const p = currentPath.slice(1).join('/');
      return p ? `~/${p}` : '~';
  };

  return (
    <div 
      className="flex flex-col h-full w-full p-4 md:p-6 overflow-hidden font-vt323 text-lg md:text-xl text-amber-500 relative" 
      onClick={handleContainerClick}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
        accept=".txt,.md,.log,.json" 
      />

      {/* Programs Layer */}
      {activeProgram === 'SYS' && <SystemMonitor onClose={handleProgramClose} />}
      {activeProgram === 'MAP' && <WorldMap onClose={handleProgramClose} />}
      {activeProgram === 'SCAN' && <BioScan onClose={handleProgramClose} />}
      {activeProgram === 'CAM' && <Surveillance onClose={handleProgramClose} initialModel={programOptions.initialModel} />}
      {activeProgram === 'AI' && (
        <AIXi001 
            onClose={handleProgramClose} 
            onNavigate={handleNavigateFromAI} 
            fileSystem={fileSystem} 
            onUpdateFile={(name, content) => addFile(name, content)}
            contacts={contacts}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
            currentUser={user}
            isHighCommand={isHighCommand}
            initialModel={programOptions.initialModel}
        />
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
        {lines.map((line, idx) => (
          <div key={idx} className={`mb-1 break-words ${line.type === 'error' ? 'text-red-500' : line.type === 'success' ? 'text-green-500' : line.type === 'system' ? 'text-amber-700' : ''}`}>
             {line.type === 'input' && (
               <span className="mr-2 text-green-500">[{user}@{getPromptPath()}]$</span>
             )}
             <span className="whitespace-pre-wrap">{line.content}</span>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>
      
      {/* Input Area */}
      <div className="mt-2 flex flex-col shrink-0">
        <div className="flex items-center border-t border-amber-800/30 pt-2 relative">
            <span className="mr-2 text-green-500 whitespace-nowrap">[{user}@{getPromptPath()}]$</span>
            <div className="relative flex-1">
                {/* Ghost Text Layer */}
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
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="none"
                    disabled={activeProgram !== 'NONE'}
                />
            </div>
        </div>
        
        {/* Suggestions List */}
        {suggestions.length > 0 && input.length > 0 && (
            <div className="text-amber-900 text-sm mt-1 ml-2 flex gap-4 flex-wrap opacity-80 pl-[10px] md:pl-[20px]">
                {suggestions.map((s, i) => (
                    <span key={i} className={`cursor-pointer hover:text-amber-500 ${s.startsWith(input) || (input.split(' ').length > 1 && s.startsWith(input.split(' ').slice(1).join(' '))) ? "text-amber-700 font-bold" : ""}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (input.includes(' ')) {
                                // Argument completion
                                const parts = input.split(' ');
                                setInput(parts[0] + ' ' + s);
                            } else {
                                // Command completion
                                setInput(s);
                            }
                            inputRef.current?.focus({ preventScroll: true });
                        }}
                    >
                        {s}
                    </span>
                ))}
            </div>
        )}
      </div>
      
      {/* Mobile Quick Actions */}
      <div className="md:hidden flex space-x-2 mt-4 overflow-x-auto pb-2 shrink-0">
         {['ls', 'import', 'comms', 'sys', 'map', 'ai', 'cam'].map(cmd => (
            <button 
              key={cmd}
              onClick={(e) => { e.stopPropagation(); executeCommand(cmd); }}
              className="px-3 py-1 bg-amber-900/20 border border-amber-800 text-amber-500 rounded text-sm whitespace-nowrap active:bg-amber-500 active:text-black"
              disabled={activeProgram !== 'NONE'}
            >
              {cmd}
            </button>
         ))}
      </div>
    </div>
  );
};
