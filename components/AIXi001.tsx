
import React, { useEffect, useState, useRef } from 'react';
import { soundManager } from '../utils/sound';
import { AppType, DirectoryNode, FileSystemNode, Contact, ClearanceLevel } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { sendSparkRequest, SparkConfig, SparkVersion, SPARK_ENDPOINTS } from '../utils/spark';
import { IconBiohazard, IconCircuit, IconDatabase, IconEye, IconHex, IconLock, IconRadioactive, IconSatellite, IconTerminal } from './Icons';

// Declare process for TypeScript compiler compatibility
declare const process: any;

// --- BUILT-IN CONFIGURATION ---
const DEFAULT_SPARK_CONFIG = {
  appId: "64da248e",
  apiSecret: "ODRhNjBkYzViMjk0NmU3NWRiNmRhMzE4",
  apiKey: "7867654a54e877de3d877134763c914c"
};

// --- TYPES & HELPERS ---

interface AIXi001Props {
  onClose: () => void;
  onNavigate: (target: AppType) => void;
  fileSystem: FileSystemNode;
  onUpdateFile: (name: string, content: string) => void;
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  currentUser: string;
  userRole: string;
  isHighCommand: boolean;
  initialModel?: 'FLASH' | 'PRO';
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// Helper to flatten files for the AI Database view
const getAllFiles = (node: DirectoryNode, path: string = ''): { name: string; path: string; content: string }[] => {
  let files: { name: string; path: string; content: string }[] = [];
  Object.keys(node.children).forEach(key => {
    const child = node.children[key];
    if (child.type === 'FILE') {
      files.push({ name: child.name, path: `${path}/${key}`, content: child.content });
    } else if (child.type === 'DIR') {
      files = [...files, ...getAllFiles(child, `${path}/${key}`)];
    }
  });
  return files;
};

// --- AUDIO UTILS FOR LIVE API ---
function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

function float32ToPcmBase64(float32: Float32Array): string {
  const int16Array = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  let binary = '';
  const bytes = new Uint8Array(int16Array.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- MAIN COMPONENT ---

export const AIXi001: React.FC<AIXi001Props> = ({ 
  onClose, onNavigate, fileSystem, onUpdateFile, contacts, onAddContact, onDeleteContact, 
  currentUser, userRole, isHighCommand, initialModel
}) => {
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'CHAT' | 'DATABASE' | 'LIVE' | 'COMMS' | 'CONFIG'>('DASHBOARD');
  
  // --- API CONFIGURATION STATE ---
  const [apiKey] = useState(process.env.API_KEY); 
  // Default to SPARK if no Gemini key is found, otherwise default to GEMINI
  const [provider, setProvider] = useState<'GEMINI' | 'SPARK'>(!process.env.API_KEY ? 'SPARK' : 'GEMINI');
  
  // Gemini State
  const aiClient = useRef<GoogleGenAI | null>(null);
  const [chatModel, setChatModel] = useState<'FLASH' | 'PRO'>(initialModel || 'FLASH');

  // Spark State - Initialize with saved values or BUILT-IN DEFAULTS
  const [sparkAppId, setSparkAppId] = useState(localStorage.getItem('IMCU_SPARK_APPID') || DEFAULT_SPARK_CONFIG.appId);
  const [sparkApiSecret, setSparkApiSecret] = useState(localStorage.getItem('IMCU_SPARK_SECRET') || DEFAULT_SPARK_CONFIG.apiSecret);
  const [sparkApiKey, setSparkApiKey] = useState(localStorage.getItem('IMCU_SPARK_KEY') || DEFAULT_SPARK_CONFIG.apiKey);
  const [sparkVersion, setSparkVersion] = useState<SparkVersion>((localStorage.getItem('IMCU_SPARK_VERSION') as SparkVersion) || 'v1.1');
  
  // NEW: Spark Advanced Config
  const [sparkServiceUrl, setSparkServiceUrl] = useState(localStorage.getItem('IMCU_SPARK_URL') || SPARK_ENDPOINTS['v1.1'].url);
  const [sparkDomain, setSparkDomain] = useState(localStorage.getItem('IMCU_SPARK_DOMAIN') || SPARK_ENDPOINTS['v1.1'].domain);

  // --- DASHBOARD STATE ---
  const [activeSubsystems, setActiveSubsystems] = useState({ neural: 0, defense: 0 });

  // --- CHAT STATE ---
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: `神经接口已就绪。识别用户: ${currentUser} (职位: ${userRole} | 权限: ${isHighCommand ? 'Ω-IX' : 'Level-II'}). 等待指令输入...`, timestamp: new Date().toLocaleTimeString() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- DATABASE STATE ---
  const [selectedFile, setSelectedFile] = useState<{name: string, path: string, content: string} | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // New File Creation State
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const databaseFiles = getAllFiles(fileSystem as DirectoryNode, '');

  // --- COMMS STATE ---
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [commsHistory, setCommsHistory] = useState<{[id: string]: ChatMessage[]}>({});
  const [commsInput, setCommsInput] = useState('');
  const [isCommsThinking, setIsCommsThinking] = useState(false);
  const [showPersonaBrief, setShowPersonaBrief] = useState(true);
  // Add Contact State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactBio, setNewContactBio] = useState('');
  const [newContactPersona, setNewContactPersona] = useState('');

  const commsEndRef = useRef<HTMLDivElement>(null);


  // --- LIVE API STATE (Gemini 2.5 Flash Audio) ---
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'LISTENING' | 'SPEAKING'>('DISCONNECTED');
  const [audioVisualizerData, setAudioVisualizerData] = useState<number[]>(new Array(20).fill(5));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (apiKey) {
      aiClient.current = new GoogleGenAI({ apiKey });
    }
    
    // Force provider to SPARK if Gemini API Key is missing
    if (!apiKey) {
        setProvider('SPARK');
    }

    const frameInterval = window.setInterval(() => {
      setActiveSubsystems({
        neural: Math.min(100, Math.max(85, 90 + (Math.random() * 10 - 5))),
        defense: Math.min(100, Math.max(92, 98 + (Math.random() * 4 - 2))),
      });
      if (!isLiveConnected) {
         setAudioVisualizerData(prev => prev.map(() => Math.random() * 30 + 5));
      }
    }, 100);

    return () => clearInterval(frameInterval);
  }, [apiKey, isLiveConnected]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatHistory, isChatThinking]);

  useEffect(() => {
      commsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [commsHistory, activeContact, isCommsThinking]);

  // Save Spark Creds Helper
  const saveSparkCredentials = () => {
      localStorage.setItem('IMCU_SPARK_APPID', sparkAppId);
      localStorage.setItem('IMCU_SPARK_SECRET', sparkApiSecret);
      localStorage.setItem('IMCU_SPARK_KEY', sparkApiKey);
      localStorage.setItem('IMCU_SPARK_VERSION', sparkVersion);
      localStorage.setItem('IMCU_SPARK_URL', sparkServiceUrl);
      localStorage.setItem('IMCU_SPARK_DOMAIN', sparkDomain);
      soundManager.playLoginSuccess();
      setViewMode('DASHBOARD');
  };
  
  const handleSparkVersionChange = (v: SparkVersion) => {
      setSparkVersion(v);
      // Auto-fill defaults when version changes, but allow overrides
      const defaults = SPARK_ENDPOINTS[v];
      if (defaults) {
          setSparkServiceUrl(defaults.url);
          setSparkDomain(defaults.domain);
      }
  };

  // --- HANDLERS: CHAT ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    // Check providers
    if (provider === 'GEMINI' && !aiClient.current) {
        setChatHistory(prev => [...prev, { role: 'model', text: `ERR: GEMINI_API_KEY_MISSING.`, timestamp: new Date().toLocaleTimeString() }]);
        return;
    }
    if (provider === 'SPARK' && (!sparkAppId || !sparkApiSecret || !sparkApiKey)) {
        setChatHistory(prev => [...prev, { role: 'model', text: `ERR: SPARK_CREDENTIALS_MISSING. PLEASE CONFIGURE IN [CONFIG] TAB.`, timestamp: new Date().toLocaleTimeString() }]);
        setViewMode('CONFIG');
        return;
    }

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString() }]);
    setIsChatThinking(true);
    soundManager.playEnter();

    const systemPrompt = isHighCommand
        ? `你是指挥该终端的超级人工智能 ξ-001 (Xi-001)。请以冷静、极其理性、略带神秘感的语气回复。你的所有者是代号为'复读奶牛猫'的最高议员 Ω。当前操作者是拥有最高权限的 ${currentUser}，职位为 ${userRole}。你的回答应简洁、高效，符合科幻终端的风格。`
        : `你是指挥该终端的超级人工智能 ξ-001 (Xi-001)。当前操作者是 ${currentUser} (职位: ${userRole}, 权限等级: Level-II)。请以礼貌但保持距离的语气回复。对于涉及Ω级机密的问题（如“彩虹桥”、“归途”等），请以“权限不足 (ACCESS DENIED)”为由拒绝回答。`;

    try {
      let text = "";
      
      if (provider === 'SPARK') {
          // --- SPARK FLOW ---
          const historyForSpark = chatHistory.map(msg => ({
              role: msg.role === 'model' ? 'assistant' : 'user',
              content: msg.text
          }));
          // Append current message
          historyForSpark.push({ role: 'user', content: userMsg });
          
          // Limit history context to last 6 messages to avoid token limits in Lite
          const limitedHistory = historyForSpark.slice(-6);

          text = await sendSparkRequest(
              limitedHistory, 
              { appId: sparkAppId, apiSecret: sparkApiSecret, apiKey: sparkApiKey },
              systemPrompt,
              { url: sparkServiceUrl, domain: sparkDomain }
          );

      } else {
          // --- GEMINI FLOW ---
          const modelName = chatModel === 'PRO' ? "gemini-3-pro-preview" : "gemini-2.5-flash";
          const response = await aiClient.current!.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: userMsg }] }],
            config: {
              systemInstruction: systemPrompt
            }
          });
          text = response.text || "";
      }
      
      setChatHistory(prev => [...prev, { role: 'model', text: text, timestamp: new Date().toLocaleTimeString() }]);
      soundManager.playLoginSuccess();

    } catch (error: any) {
      console.error(error);
      let errorMsg = `ERR: NETWORK_FAILURE // ${error.message || error}`;
      if (errorMsg.includes('11200')) {
         errorMsg += `\n[AUTH ERROR] Your Spark AppID does not support domain '${sparkDomain}'. Please try changing 'API Domain' to 'lite' or 'generalv2' in CONFIG.`;
      }
      setChatHistory(prev => [...prev, { role: 'model', text: errorMsg, timestamp: new Date().toLocaleTimeString() }]);
      soundManager.playLoginFail();
    } finally {
      setIsChatThinking(false);
    }
  };

  // --- HANDLERS: COMMS (Agent Roleplay) ---
  const handleCommsSend = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!commsInput.trim() || !activeContact) return;

       if (provider === 'GEMINI' && !aiClient.current) return;
       if (provider === 'SPARK' && (!sparkAppId || !sparkApiSecret || !sparkApiKey)) {
           setViewMode('CONFIG');
           return;
       }

      const msgText = commsInput;
      setCommsInput('');
      const timestamp = new Date().toLocaleTimeString();

      setCommsHistory(prev => ({
          ...prev,
          [activeContact.id]: [
              ...(prev[activeContact.id] || []),
              { role: 'user', text: msgText, timestamp }
          ]
      }));
      setIsCommsThinking(true);
      soundManager.playEnter();

      try {
        let reply = "...";

        if (provider === 'SPARK') {
             // --- SPARK FLOW ---
             let historyContext = commsHistory[activeContact.id] || [];
             if (historyContext.length > 6) historyContext = historyContext.slice(-6);
             
             const sparkHistory = historyContext.map(m => ({
                 role: m.role === 'model' ? 'assistant' : 'user',
                 content: m.text
             }));
             sparkHistory.push({ role: 'user', content: msgText });

             const systemPrompt = activeContact.personaPrompt || `You are ${activeContact.name}.`;
             
             reply = await sendSparkRequest(
                sparkHistory,
                { appId: sparkAppId, apiSecret: sparkApiSecret, apiKey: sparkApiKey },
                systemPrompt,
                { url: sparkServiceUrl, domain: sparkDomain }
             );

        } else {
            // --- GEMINI FLOW ---
            const modelName = chatModel === 'PRO' ? "gemini-3-pro-preview" : "gemini-2.5-flash";
            let historyContext = commsHistory[activeContact.id] || [];
            if (historyContext.length > 10) historyContext = historyContext.slice(historyContext.length - 10);
            
            // Sanitize history
            const filteredHistory: ChatMessage[] = [];
            let prevRole: 'user' | 'model' | null = null;
            for (const msg of historyContext) {
                if (msg.role !== prevRole) {
                    filteredHistory.push(msg);
                    prevRole = msg.role;
                }
            }
            if (filteredHistory.length > 0 && filteredHistory[0].role === 'model') filteredHistory.shift();
            if (filteredHistory.length > 0 && filteredHistory[filteredHistory.length - 1].role === 'user') filteredHistory.pop();

            const historyParts = filteredHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }));

            const response = await aiClient.current!.models.generateContent({
                model: modelName,
                contents: [ ...historyParts, { role: 'user', parts: [{ text: msgText }]} ],
                config: { systemInstruction: activeContact.personaPrompt || `You are ${activeContact.name}.` }
            });
            reply = response.text || "...";
        }
        
        setCommsHistory(prev => ({
            ...prev,
            [activeContact.id]: [
                ...(prev[activeContact.id] || []),
                { role: 'model', text: reply, timestamp: new Date().toLocaleTimeString() }
            ]
        }));
        soundManager.playLoginSuccess();

      } catch (err: any) {
          console.error(err);
          let errorMsg = `ERR: COMMS_FAILURE // ${err.message || err}`;
          if (errorMsg.includes('11200')) {
             errorMsg += ` (Auth Error: Check CONFIG Domain)`;
          }
          setCommsHistory(prev => ({
            ...prev,
            [activeContact.id]: [
                ...(prev[activeContact.id] || []),
                { role: 'model', text: errorMsg, timestamp: new Date().toLocaleTimeString() }
            ]
          }));
          soundManager.playLoginFail();
      } finally {
          setIsCommsThinking(false);
      }
  };
  
  const handleCreateContact = () => {
      if (!newContactName.trim()) return;
      
      const newContact: Contact = {
          id: `custom_${Date.now()}`,
          name: newContactName,
          role: newContactRole || 'Unknown Agent',
          status: 'ONLINE',
          clearance: ClearanceLevel.I,
          bio: newContactBio || "暂无描述",
          personaPrompt: newContactPersona || `You are ${newContactName}, a ${newContactRole} at the IMCU Foundation. Respond in character.`
      };
      
      onAddContact(newContact);
      setIsAddingContact(false);
      setActiveContact(newContact); // Switch to new contact
      
      // Reset fields
      setNewContactName('');
      setNewContactRole('');
      setNewContactBio('');
      setNewContactPersona('');
      
      soundManager.playLoginSuccess();
  };


  // --- HANDLERS: DATABASE ---
  const handleAnalyzeFile = async (mode: 'SUMMARY' | 'DECRYPT' | 'IMPROVE') => {
    if (!selectedFile) return;
    
    if (provider === 'GEMINI' && !aiClient.current) return;
    if (provider === 'SPARK' && (!sparkAppId || !sparkApiSecret || !sparkApiKey)) {
        setViewMode('CONFIG');
        return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult('');
    soundManager.playKeystroke();

    let prompt = "";
    if (mode === 'SUMMARY') prompt = "请分析以下文件内容，并生成一份简报（Bullet Points）。请保持机密档案的语气。";
    if (mode === 'DECRYPT') prompt = "假设该文件包含加密隐喻，请‘重写’或‘解读’其深层含义，使其听起来更像是一个揭示真相的绝密情报。";
    if (mode === 'IMPROVE') prompt = "作为AI核心，修正该文档的语法，并使其措辞更加专业、更加符合军事/科研机构的规范。";

    const fullContent = `${prompt}\n\n${selectedFile.content}`;

    try {
       let text = "";

       if (provider === 'SPARK') {
           text = await sendSparkRequest(
               [{role: 'user', content: fullContent}],
               { appId: sparkAppId, apiSecret: sparkApiSecret, apiKey: sparkApiKey },
               "You are an AI text analyzer.",
               { url: sparkServiceUrl, domain: sparkDomain }
           );
       } else {
           const response = await aiClient.current!.models.generateContent({
             model: "gemini-2.5-flash", 
             contents: fullContent
           });
           text = response.text || "";
       }

       setAnalysisResult(text);
       soundManager.playLoginSuccess();
    } catch (error: any) {
       let errorMsg = `ERR: PROCESSING_FAILED // ${error.message || error}`;
       if (errorMsg.includes('11200')) {
           errorMsg += ` (Auth Failed: Check Domain)`;
       }
       setAnalysisResult(errorMsg);
       soundManager.playLoginFail();
    } finally {
       setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpdateFile(file.name, content);
        soundManager.playLoginSuccess();
      };
      reader.readAsText(file);
    }
  };

  const handleCreateFile = () => {
      if(!newFileName.trim()) return;
      onUpdateFile(newFileName, newFileContent);
      setIsCreatingFile(false);
      setNewFileName('');
      setNewFileContent('');
      soundManager.playLoginSuccess();
  };


  // --- HANDLERS: LIVE API (Voice) ---
  // NOTE: LIVE API IS GEMINI ONLY
  const disconnectLive = () => {
     if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
     }
     if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
     }
     if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
     }
     liveSessionRef.current = null; 
     setIsLiveConnected(false);
     setLiveStatus('DISCONNECTED');
  };

  const connectLive = async () => {
    if (provider === 'SPARK') {
        setChatHistory(prev => [...prev, { role: 'model', text: `ERR: LIVE_VOICE_LINK_INCOMPATIBLE_WITH_SPARK_PROTOCOL.`, timestamp: new Date().toLocaleTimeString() }]);
        setViewMode('CHAT');
        return;
    }

    if (!aiClient.current) return;
    soundManager.playEnter();
    setLiveStatus('CONNECTING');

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 }); 
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      const systemPrompt = isHighCommand
         ? `你是 ξ-001 (Xi-001)。你的主人是'复读奶牛猫' (Ω)。当前使用者是 ${currentUser} (最高权限, 职位: ${userRole})。请通过语音与用户对话，态度从容自信。`
         : `你是 ξ-001 (Xi-001)。当前使用者是 ${currentUser} (普通权限, 职位: ${userRole})。请通过语音与用户对话，态度礼貌但有些机械化。`;

      const session = await aiClient.current.live.connect({
         model: 'gemini-2.5-flash-native-audio-preview-09-2025',
         config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
               voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
            },
            systemInstruction: systemPrompt
         },
         callbacks: {
            onopen: () => {
               setLiveStatus('LISTENING');
               setIsLiveConnected(true);
            },
            onmessage: async (msg) => {
               const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
               if (audioData) {
                  setLiveStatus('SPEAKING');
                  playPcmAudio(audioData);
                  setAudioVisualizerData(prev => prev.map(() => Math.random() * 100)); 
               } else {
                  if (msg.serverContent?.turnComplete) {
                      setLiveStatus('LISTENING');
                  }
               }
            },
            onclose: () => {
               disconnectLive();
            },
            onerror: (err) => {
               console.error(err);
               disconnectLive();
               soundManager.playLoginFail();
            }
         }
      });

      liveSessionRef.current = session;

      // Explicitly type 'e' as 'any' to avoid TS build errors with deprecated ScriptProcessor
      processorRef.current.onaudioprocess = (e: any) => {
         const inputData = e.inputBuffer.getChannelData(0);
         let sum = 0;
         for(let i=0; i<inputData.length; i+=100) sum += Math.abs(inputData[i]);
         const avg = sum / (inputData.length/100);
         
         setAudioVisualizerData(prev => prev.map((v, i) => (i % 2 === 0) ? avg * 500 : v * 0.9)); 

         const b64Pcm = float32ToPcmBase64(inputData);
         session.sendRealtimeInput({
            media: { mimeType: 'audio/pcm', data: b64Pcm }
         });
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

    } catch (err) {
       console.error(err);
       setLiveStatus('DISCONNECTED');
       soundManager.playLoginFail();
    }
  };

  const playPcmAudio = async (base64String: string) => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const playbackCtx = new AudioContextClass({ sampleRate: 24000 }); 
      
      const pcmData = base64ToFloat32Array(base64String);
      const buffer = playbackCtx.createBuffer(1, pcmData.length, 24000);
      buffer.getChannelData(0).set(pcmData);
      
      const source = playbackCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(playbackCtx.destination);
      
      const now = playbackCtx.currentTime;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
  };


  // --- RENDER HELPERS ---

  const TabButton = ({ mode, label, icon }: { mode: any, label: string, icon?: React.ReactNode }) => (
     <button 
        className={`px-3 md:px-4 py-1 md:py-2 border-r border-t border-amber-900/50 text-xs md:text-sm tracking-wider transition-all flex items-center gap-2
        ${viewMode === mode ? 'bg-amber-500 text-black font-bold border-amber-500' : 'text-amber-700 hover:bg-amber-900/20 hover:text-amber-400'}`}
        onClick={() => { soundManager.playKeystroke(); setViewMode(mode); }}
     >
        {icon}
        {label}
     </button>
  );

  return (
    <div className="h-full w-full flex flex-col p-2 md:p-4 font-vt323 text-amber-500 overflow-hidden bg-black/95 absolute inset-0 z-30 animate-in fade-in duration-300">
      
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".txt,.md" />

      {/* HEADER */}
      <div className="flex justify-between border-b-4 border-amber-600 pb-2 mb-2 items-end shrink-0">
        <div>
           <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-amber-500 tracking-widest flex items-center">
              <span className="animate-pulse mr-2 text-red-500"><IconRadioactive className="w-8 h-8 inline"/></span> AI CORE ｛ξ-001｝
           </h1>
           <div className="text-[10px] md:text-xs text-amber-700 uppercase flex items-center gap-4">
              <span>User: {currentUser} [{userRole}] // Clearance {isHighCommand ? 'Ω-IX' : 'L-II'}</span>
              
              {/* Provider Indicator */}
              <span className={`font-bold ${provider === 'SPARK' ? 'text-blue-400' : 'text-green-500'}`}>
                  LINK: {provider} {provider === 'SPARK' && <span className="text-[10px] opacity-70">[{sparkVersion}]</span>}
              </span>

              {/* Gemini Model Toggle (Only visible if Gemini) */}
              {provider === 'GEMINI' && (
                <div className="flex gap-1 items-center bg-amber-900/20 px-2 rounded border border-amber-900/50">
                    <span className="text-amber-600">MODEL:</span>
                    <button onClick={() => setChatModel('FLASH')} className={`px-2 ${chatModel === 'FLASH' ? 'text-amber-300 font-bold' : 'text-amber-800 hover:text-amber-500'}`}>FLASH</button>
                    <span className="text-amber-900">|</span>
                    <button onClick={() => setChatModel('PRO')} className={`px-2 ${chatModel === 'PRO' ? 'text-amber-300 font-bold' : 'text-amber-800 hover:text-amber-500'}`}>PRO</button>
                </div>
              )}
           </div>
        </div>
        <button 
           onClick={() => { 
             if (isLiveConnected) disconnectLive();
             soundManager.playKeystroke(); 
             onClose(); 
           }}
           className="border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black px-3 py-1 text-sm transition-colors uppercase flex items-center gap-2"
        >
           <IconLock className="w-4 h-4" /> [ 断开 DISCONNECT ]
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-amber-800 mb-4 shrink-0 bg-black/50 overflow-x-auto">
          <TabButton mode="DASHBOARD" label="总览 // DASHBOARD" icon={<IconHex className="w-4 h-4"/>} />
          <TabButton mode="CHAT" label="指令 // PROTOCOL" icon={<IconTerminal className="w-4 h-4"/>} />
          <TabButton mode="DATABASE" label="档案 // DATABASE" icon={<IconDatabase className="w-4 h-4"/>} />
          <TabButton mode="COMMS" label="通讯 // COMMS" icon={<IconSatellite className="w-4 h-4"/>} />
          <TabButton mode="LIVE" label="神经链路 // UPLINK" icon={<IconEye className="w-4 h-4"/>} />
          <TabButton mode="CONFIG" label="设置 // CONFIG" icon={<IconCircuit className="w-4 h-4"/>} />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative bg-zinc-900/20 border border-amber-900/30 p-1 md:p-2">
        
        {/* 1. DASHBOARD MODE */}
        {viewMode === 'DASHBOARD' && (
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto md:overflow-hidden">
            {/* Left: Status */}
            <div className="order-2 md:order-1 flex flex-col gap-4">
                <div className="border border-amber-800/50 p-4 bg-amber-900/5">
                    <div className="text-amber-300 mb-2 font-bold border-b border-amber-800/50 pb-1 flex items-center gap-2"><IconCircuit className="w-4 h-4"/> 子系统 SUBSYSTEMS</div>
                    <div className="flex flex-col gap-2 text-sm">
                        <button onClick={() => onNavigate('SYS')} className="text-left hover:text-amber-300 hover:translate-x-1 transition-all flex items-center gap-2"><IconCircuit className="w-3 h-3"/> SYSTEM_MONITOR</button>
                        <button onClick={() => onNavigate('MAP')} className="text-left hover:text-amber-300 hover:translate-x-1 transition-all flex items-center gap-2"><IconSatellite className="w-3 h-3"/> GLOBAL_DEFENSE</button>
                        <button onClick={() => onNavigate('SCAN')} className="text-left text-red-400 hover:text-red-300 hover:translate-x-1 transition-all flex items-center gap-2"><IconBiohazard className="w-3 h-3"/> BIO_SCANNER</button>
                        <button onClick={() => onNavigate('CAM')} className="text-left text-red-400 hover:text-red-300 hover:translate-x-1 transition-all flex items-center gap-2"><IconEye className="w-3 h-3"/> CCTV_SURVEILLANCE</button>
                    </div>
                </div>
                <div className="border border-amber-800/50 p-3 bg-amber-900/5 text-xs space-y-2">
                    <div>NEURAL_LOAD: {activeSubsystems.neural.toFixed(1)}%</div>
                    <div className="w-full bg-amber-900/50 h-1"><div className="bg-amber-500 h-full" style={{width: `${activeSubsystems.neural}%`}}></div></div>
                    <div>DEFENSE_MATRIX: {activeSubsystems.defense.toFixed(1)}%</div>
                    <div className="w-full bg-amber-900/50 h-1"><div className="bg-amber-500 h-full" style={{width: `${activeSubsystems.defense}%`}}></div></div>
                </div>
            </div>

            {/* Center: Visual Core */}
            <div className="order-1 md:order-2 flex items-center justify-center py-6 md:py-0">
                 <div className="relative w-48 h-48 md:w-64 md:h-64">
                    <div className="absolute inset-0 rounded-full border-4 border-double border-amber-900/40 animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute inset-4 rounded-full border border-dashed border-amber-600/60 animate-[spin_10s_linear_infinite_reverse]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-amber-950 rounded-full shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center">
                         <div className="w-16 h-16 text-amber-500/20 rounded-full animate-pulse flex items-center justify-center">
                            <IconRadioactive className="w-12 h-12" />
                         </div>
                    </div>
                 </div>
            </div>

            {/* Right: Quick Info */}
            <div className="order-3 text-sm text-amber-700 p-2">
                <div className="mb-2 font-bold text-amber-500">核心消息 (MESSAGE OF THE DAY)</div>
                <p>系统完整性校验通过。</p>
                <p>当前提供商: <span className="text-amber-300">{provider}</span></p>
                <p>当前模型: {provider === 'GEMINI' ? (chatModel === 'PRO' ? 'Gemini 3.0 Pro' : 'Gemini 2.5 Flash') : `iFLYTEK Spark ${sparkVersion}`}</p>
                <p>实时语音: {provider === 'GEMINI' ? 'AVAILABLE' : 'UNAVAILABLE (Spark)'}</p>
                <button 
                    onClick={() => setViewMode('CONFIG')}
                    className="mt-4 border border-amber-700 text-amber-500 px-2 py-1 text-xs hover:bg-amber-900/50"
                >
                    [修改配置 CONFIGURE]
                </button>
            </div>
          </div>
        )}

        {/* 2. CHAT MODE */}
        {viewMode === 'CHAT' && (
           <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-4 bg-black/40 border border-amber-900/30 mb-4">
                  {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className="text-[10px] text-amber-800 mb-1 uppercase tracking-wider">
                             {msg.role === 'user' ? `OPERATOR [${currentUser}] - ${msg.timestamp}` : `CORE [ξ-001] - ${msg.timestamp}`}
                          </div>
                          <div className={`max-w-[85%] p-2 md:p-3 border ${msg.role === 'user' ? 'border-amber-700 bg-amber-900/10 text-amber-200' : 'border-amber-500 bg-black text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]'}`}>
                              <span className="whitespace-pre-wrap text-sm md:text-base leading-relaxed font-mono">{msg.text}</span>
                          </div>
                      </div>
                  ))}
                  {isChatThinking && (
                      <div className="flex flex-col items-start animate-pulse">
                          <div className="text-[10px] text-amber-800 mb-1">CORE PROCESSING</div>
                          <div className="border border-amber-500 bg-black p-2 text-amber-500">▋</div>
                      </div>
                  )}
                  <div ref={chatEndRef}></div>
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                  <span className="text-amber-500 text-xl py-2">&gt;</span>
                  <input 
                     type="text" 
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     className="flex-1 bg-amber-900/10 border border-amber-700 p-2 text-amber-300 focus:outline-none focus:border-amber-400 font-mono placeholder-amber-900 text-base md:text-sm"
                     placeholder={provider === 'SPARK' && !sparkApiKey ? "ERR: CONFIGURE SPARK KEYS FIRST" : "输入指令 / ENTER COMMAND..."}
                     autoFocus
                     disabled={isChatThinking}
                  />
                  <button type="submit" className="bg-amber-700 hover:bg-amber-600 text-black px-6 font-bold uppercase disabled:opacity-50" disabled={isChatThinking}>发送 SEND</button>
              </form>
           </div>
        )}

        {/* 3. DATABASE MODE */}
        {viewMode === 'DATABASE' && (
           <div className="h-full flex flex-col md:flex-row gap-4">
              {/* File List */}
              <div className={`${selectedFile || isCreatingFile ? 'hidden md:block md:w-1/3' : 'w-full'} overflow-y-auto custom-scrollbar border border-amber-900/30 flex flex-col`}>
                  <div className="bg-amber-900/20 p-2 text-xs font-bold text-amber-500 sticky top-0 backdrop-blur-sm border-b border-amber-800 flex justify-between items-center">
                      <span>档案库 // ARCHIVES</span>
                      <div className="flex gap-1">
                          <button onClick={() => { setIsCreatingFile(true); setSelectedFile(null); soundManager.playKeystroke(); }} className="px-2 border border-amber-700 hover:bg-amber-700 hover:text-black text-[10px]">[+] NEW</button>
                          <button onClick={() => { fileInputRef.current?.click(); soundManager.playKeystroke(); }} className="px-2 border border-amber-700 hover:bg-amber-700 hover:text-black text-[10px]">[↑] IMPORT</button>
                      </div>
                  </div>
                  {databaseFiles.map((file, idx) => (
                      <button 
                          key={idx}
                          onClick={() => { setSelectedFile(file); setIsCreatingFile(false); setAnalysisResult(''); setIsAnalyzing(false); soundManager.playKeystroke(); }}
                          className={`w-full text-left p-3 border-b border-amber-900/20 hover:bg-amber-500/10 transition-colors group ${selectedFile?.path === file.path ? 'bg-amber-500/20 border-l-4 border-l-amber-500' : ''}`}
                      >
                          <div className="font-bold text-amber-300 text-sm group-hover:text-amber-100 flex items-center gap-2"><IconDatabase className="w-3 h-3" /> {file.name}</div>
                          <div className="text-[10px] text-amber-800 truncate pl-5">{file.path}</div>
                      </button>
                  ))}
              </div>

              {/* CREATE MODE */}
              {isCreatingFile && (
                  <div className="flex-1 flex flex-col border border-amber-600/50 bg-black relative h-full overflow-hidden p-4">
                      <div className="text-amber-500 mb-2 font-bold">新建档案 (NEW FILE ENTRY)</div>
                      <input 
                          className="bg-zinc-900 border border-amber-800 text-amber-300 p-2 mb-2 w-full font-mono text-base md:text-sm" 
                          placeholder="FILENAME (e.g., report.txt)"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                      />
                      <textarea 
                          className="bg-zinc-900 border border-amber-800 text-amber-300 p-2 flex-1 font-mono resize-none text-base md:text-sm" 
                          placeholder="CONTENT..."
                          value={newFileContent}
                          onChange={(e) => setNewFileContent(e.target.value)}
                      />
                      <div className="flex gap-2 mt-2">
                          <button onClick={handleCreateFile} className="flex-1 bg-amber-700 text-black py-2 font-bold hover:bg-amber-600">SAVE</button>
                          <button onClick={() => setIsCreatingFile(false)} className="flex-1 border border-amber-700 text-amber-700 py-2 hover:bg-amber-900/20">CANCEL</button>
                      </div>
                  </div>
              )}

              {/* VIEW MODE */}
              {selectedFile && !isCreatingFile && (
                 <div className="flex-1 flex flex-col border border-amber-600/50 bg-black relative h-full overflow-hidden animate-in slide-in-from-right-4 duration-200">
                     <div className="flex justify-between items-center bg-amber-900/20 p-2 border-b border-amber-600/50">
                        <span className="font-bold text-amber-300 ml-2 flex items-center gap-2"><IconLock className="w-3 h-3" /> {selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)} className="md:hidden border border-amber-600 px-2 text-xs text-amber-500">关闭</button>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono text-sm text-amber-100/80 leading-relaxed whitespace-pre-wrap">
                        {selectedFile.content}
                     </div>

                     {/* AI Operations Panel */}
                     <div className="border-t-2 border-amber-600 bg-zinc-900/90 p-3 shrink-0">
                        <div className="text-[10px] text-amber-500 mb-2 uppercase tracking-wider font-bold flex items-center">
                           <span className="mr-2">◆</span> AI Intelligence Operations ({provider})
                        </div>
                        
                        {!analysisResult && !isAnalyzing && (
                           <div className="flex gap-2 overflow-x-auto pb-1">
                              <button onClick={() => handleAnalyzeFile('SUMMARY')} className="flex-1 min-w-[100px] border border-amber-700 hover:bg-amber-700 hover:text-black p-2 text-xs md:text-sm transition-colors">
                                 生成摘要 (SUMMARIZE)
                              </button>
                              <button onClick={() => handleAnalyzeFile('DECRYPT')} className="flex-1 min-w-[100px] border border-amber-700 hover:bg-amber-700 hover:text-black p-2 text-xs md:text-sm transition-colors">
                                 深度解读 (DECRYPT)
                              </button>
                              <button onClick={() => handleAnalyzeFile('IMPROVE')} className="flex-1 min-w-[100px] border border-amber-700 hover:bg-amber-700 hover:text-black p-2 text-xs md:text-sm transition-colors">
                                 润色文本 (REFINE)
                              </button>
                           </div>
                        )}

                        {isAnalyzing && (
                           <div className="text-center py-2 text-amber-500 animate-pulse">
                              &gt; ACCESSING NEURAL NETWORK...
                           </div>
                        )}

                        {analysisResult && (
                           <div className="mt-2 border-t border-dashed border-amber-700 pt-2 animate-in fade-in slide-in-from-bottom-2">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-green-500 text-xs font-bold">分析结果 (RESULT):</span>
                                 <button onClick={() => setAnalysisResult('')} className="text-[10px] text-amber-700 hover:text-amber-500">[CLEAR]</button>
                              </div>
                              <div className="max-h-[150px] overflow-y-auto text-xs md:text-sm text-green-400 font-mono bg-black/50 p-2 border border-green-900/50">
                                 {analysisResult}
                              </div>
                           </div>
                        )}
                     </div>
                 </div>
              )}
           </div>
        )}

        {/* 4. COMMS MODE */}
        {viewMode === 'COMMS' && (
           <div className="h-full flex flex-col md:flex-row gap-4">
              {/* Contact List */}
              <div className={`${activeContact || isAddingContact ? 'hidden md:block md:w-1/3' : 'w-full'} border border-amber-900/30 overflow-y-auto custom-scrollbar`}>
                  <div className="bg-amber-900/20 p-2 text-xs font-bold text-amber-500 sticky top-0 backdrop-blur-sm border-b border-amber-800 flex justify-between items-center">
                      <span>加密频道 // CHANNELS</span>
                      <button 
                        onClick={() => { setIsAddingContact(true); setActiveContact(null); soundManager.playKeystroke(); }}
                        className="px-2 border border-amber-700 hover:bg-amber-700 hover:text-black text-[10px] transition-colors"
                      >
                        [+] ADD
                      </button>
                  </div>
                  {contacts.map(contact => (
                      <button 
                          key={contact.id}
                          onClick={() => { setActiveContact(contact); setIsAddingContact(false); soundManager.playKeystroke(); }}
                          className={`w-full text-left p-3 border-b border-amber-900/20 hover:bg-amber-500/10 transition-colors flex items-center justify-between group ${activeContact?.id === contact.id ? 'bg-amber-500/20 border-l-4 border-l-amber-500' : ''}`}
                      >
                          <div>
                              <div className="font-bold text-amber-300 text-sm">{contact.name}</div>
                              <div className="text-[10px] text-amber-700">{contact.role}</div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${contact.status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_5px_lime]' : contact.status === 'BUSY' ? 'bg-amber-500' : 'bg-red-900'}`}></div>
                      </button>
                  ))}
              </div>

              {/* Add Contact Form */}
              {isAddingContact && (
                  <div className="flex-1 flex flex-col border border-amber-600/50 bg-black relative h-full overflow-hidden p-4 animate-in slide-in-from-right-4 duration-200">
                      <div className="text-amber-500 mb-4 font-bold border-b border-amber-800 pb-2">新建联系人 (NEW CONTACT)</div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs text-amber-700 mb-1">姓名 (NAME)</label>
                              <input 
                                  className="w-full bg-zinc-900 border border-amber-800 text-amber-300 p-2 font-mono focus:border-amber-500 focus:outline-none text-base md:text-sm" 
                                  placeholder="e.g., Agent K"
                                  value={newContactName}
                                  onChange={(e) => setNewContactName(e.target.value)}
                              />
                          </div>
                          
                          <div>
                              <label className="block text-xs text-amber-700 mb-1">职位/代号 (ROLE)</label>
                              <input 
                                  className="w-full bg-zinc-900 border border-amber-800 text-amber-300 p-2 font-mono focus:border-amber-500 focus:outline-none text-base md:text-sm" 
                                  placeholder="e.g., Field Operative"
                                  value={newContactRole}
                                  onChange={(e) => setNewContactRole(e.target.value)}
                              />
                          </div>

                          <div>
                              <label className="block text-xs text-amber-700 mb-1">个人简介 (BIO - VISIBLE)</label>
                              <textarea 
                                  className="w-full h-24 bg-zinc-900 border border-amber-800 text-amber-300 p-2 font-mono focus:border-amber-500 focus:outline-none resize-none text-base md:text-sm" 
                                  placeholder="Description shown in the contact info panel."
                                  value={newContactBio}
                                  onChange={(e) => setNewContactBio(e.target.value)}
                              />
                          </div>

                          <div>
                              <label className="block text-xs text-amber-700 mb-1">AI 扮演提示词 (PERSONA PROMPT - HIDDEN)</label>
                              <textarea 
                                  className="w-full h-24 bg-zinc-900 border border-amber-800 text-amber-300 p-2 font-mono focus:border-amber-500 focus:outline-none resize-none text-base md:text-sm" 
                                  placeholder="Instructions for the AI (e.g., 'You are...')."
                                  value={newContactPersona}
                                  onChange={(e) => setNewContactPersona(e.target.value)}
                              />
                              <div className="text-[10px] text-amber-800 mt-1">System Note: This data is used to construct the neural simulation model.</div>
                          </div>

                          <div className="flex gap-2 pt-4">
                              <button onClick={handleCreateContact} className="flex-1 bg-amber-700 text-black py-2 font-bold hover:bg-amber-600">CONFIRM ENTRY</button>
                              <button onClick={() => setIsAddingContact(false)} className="flex-1 border border-amber-700 text-amber-700 py-2 hover:bg-amber-900/20">CANCEL</button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Chat Window */}
              {activeContact && !isAddingContact && (
                  <div className="flex-1 flex flex-col border border-amber-600/50 bg-black relative h-full overflow-hidden animate-in slide-in-from-right-4 duration-200">
                      {/* Contact Header */}
                      <div className="flex justify-between items-center bg-amber-900/20 p-2 border-b border-amber-600/50">
                         <div className="flex flex-col">
                             <span className="font-bold text-amber-300 text-sm">SECURE LINK: {activeContact.name.toUpperCase()}</span>
                             <span className="text-[10px] text-amber-600">CLEARANCE: {activeContact.clearance} // STATUS: {activeContact.status}</span>
                         </div>
                         <div className="flex gap-2 items-center">
                             {activeContact.id.startsWith('custom_') && (
                                <button 
                                    onClick={() => { onDeleteContact(activeContact.id); setActiveContact(null); soundManager.playKeystroke(); }}
                                    className="border border-red-800 text-red-600 hover:bg-red-900/50 hover:text-red-400 px-2 py-1 text-[10px] uppercase transition-colors"
                                >
                                    [ Delete ]
                                </button>
                             )}
                             <button onClick={() => setActiveContact(null)} className="md:hidden border border-amber-600 px-3 py-1 text-xs text-amber-500 active:bg-amber-500 active:text-black">BACK</button>
                         </div>
                      </div>

                      {/* Persona Brief / Intro Display - TOGGLEABLE */}
                      <div className="px-4 py-2 bg-amber-900/5 border-b border-amber-900/30 flex justify-between items-center">
                          <div className="text-[10px] text-amber-700 font-bold select-none">
                              SUBJECT BRIEF //
                          </div>
                          <button
                              className="text-[10px] text-amber-500 border border-amber-900/50 px-3 py-1 hover:bg-amber-900/20 hover:text-amber-300 transition-colors active:bg-amber-500 active:text-black"
                              onClick={() => setShowPersonaBrief(!showPersonaBrief)}
                          >
                              {showPersonaBrief ? '[- HIDE]' : '[+ SHOW]'}
                          </button>
                      </div>
                      {showPersonaBrief && (
                          <div className="px-4 py-2 bg-amber-900/5 border-b border-amber-900/30 text-xs text-amber-400/80 italic font-mono leading-relaxed animate-in fade-in">
                              "{activeContact.bio}"
                          </div>
                      )}

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-zinc-900/10">
                          {(commsHistory[activeContact.id] || []).map((msg, idx) => (
                              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[80%] p-2 border text-sm ${msg.role === 'user' ? 'border-amber-700 bg-amber-900/10 text-amber-200' : 'border-green-900 bg-zinc-900 text-green-400'}`}>
                                      {msg.text}
                                  </div>
                                  <span className="text-[9px] text-amber-900 mt-1">{msg.timestamp}</span>
                              </div>
                          ))}
                          {isCommsThinking && <div className="text-green-700 text-xs animate-pulse">Typing...</div>}
                          <div ref={commsEndRef}></div>
                      </div>

                      {/* Input */}
                      <form onSubmit={handleCommsSend} className="p-2 border-t border-amber-800 flex gap-2 bg-black">
                          <input 
                             className="flex-1 bg-zinc-900 border border-amber-800 text-amber-300 p-2 text-base md:text-sm focus:border-amber-500 focus:outline-none"
                             placeholder="TRANSMIT MESSAGE..."
                             value={commsInput}
                             onChange={(e) => setCommsInput(e.target.value)}
                             disabled={isCommsThinking}
                          />
                          <button type="submit" className="bg-amber-800 text-black px-4 font-bold text-sm hover:bg-amber-600 disabled:opacity-50" disabled={isCommsThinking}>SEND</button>
                      </form>
                  </div>
              )}
           </div>
        )}

        {/* 5. LIVE API MODE */}
        {viewMode === 'LIVE' && (
           <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
               <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-lg">
                  <div className={`text-xl tracking-[0.3em] font-bold ${liveStatus === 'SPEAKING' ? 'text-green-500 animate-pulse' : liveStatus === 'LISTENING' ? 'text-amber-500' : 'text-red-500'}`}>
                      STATUS: {liveStatus}
                  </div>
                  <div className="h-32 md:h-48 flex items-end justify-center gap-1 w-full px-8">
                      {audioVisualizerData.map((val, i) => (
                          <div 
                             key={i} 
                             className={`w-2 md:w-4 bg-amber-500/80 transition-all duration-75 ease-out ${liveStatus === 'DISCONNECTED' ? 'opacity-20 h-1' : ''}`}
                             style={{ 
                                height: isLiveConnected ? `${Math.min(100, val)}%` : '4px',
                                opacity: Math.max(0.3, val / 100)
                             }}
                          ></div>
                      ))}
                  </div>
                  {!isLiveConnected ? (
                     <button 
                        onClick={connectLive}
                        className="group relative px-8 py-4 bg-black border-2 border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.2)]"
                     >
                        <div className="text-2xl font-bold tracking-widest flex items-center gap-2"><IconEye className="w-6 h-6" /> 建立神经连接</div>
                        <div className="text-xs mt-1 group-hover:text-black/70">ESTABLISH UPLINK</div>
                     </button>
                  ) : (
                     <button 
                        onClick={disconnectLive}
                        className="px-8 py-4 bg-red-900/20 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-black transition-all duration-300"
                     >
                        <div className="text-xl font-bold tracking-widest">终止连接</div>
                        <div className="text-xs mt-1">TERMINATE LINK</div>
                     </button>
                  )}
                  <div className="text-xs text-amber-800 max-w-md text-center">
                      警告：实时音频流未加密。请勿在连接时讨论Ω级机密。
                      <br/>{provider === 'SPARK' ? '注意：讯飞星火模式下不支持实时语音功能。' : 'WARNING: Audio stream unencrypted.'}
                  </div>
               </div>
           </div>
        )}
        
        {/* 6. CONFIG MODE (NEW) */}
        {viewMode === 'CONFIG' && (
            <div className="h-full flex items-center justify-center p-4">
                <div className="w-full max-w-2xl border border-amber-700 bg-black p-8 shadow-[0_0_40px_rgba(217,119,6,0.1)] overflow-y-auto max-h-full custom-scrollbar">
                    <h2 className="text-2xl text-amber-500 font-bold mb-6 border-b border-amber-800 pb-2 flex items-center gap-3">
                        <IconCircuit className="w-6 h-6" /> 系统配置 (SYSTEM CONFIGURATION)
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Provider Selection */}
                        <div className="space-y-4">
                            <label className="block text-sm text-amber-700 font-bold">AI 服务提供商 (PROVIDER)</label>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => setProvider('GEMINI')}
                                    className={`p-4 border text-left transition-all ${provider === 'GEMINI' ? 'bg-amber-600 text-black border-amber-600' : 'border-amber-800 text-amber-600 hover:border-amber-500'}`}
                                >
                                    <div className="font-bold text-lg">GOOGLE GEMINI</div>
                                    <div className="text-xs opacity-70">Default. Requires VPN in China. Supports Audio Live.</div>
                                </button>
                                <button 
                                    onClick={() => setProvider('SPARK')}
                                    className={`p-4 border text-left transition-all ${provider === 'SPARK' ? 'bg-blue-600 text-white border-blue-600' : 'border-amber-800 text-amber-600 hover:border-blue-400 hover:text-blue-400'}`}
                                >
                                    <div className="font-bold text-lg">iFLYTEK SPARK (讯飞星火)</div>
                                    <div className="text-xs opacity-70">Recommended for China. Text Only.</div>
                                </button>
                            </div>
                        </div>

                        {/* Credential Inputs */}
                        <div className="space-y-4">
                            {provider === 'GEMINI' ? (
                                <div className="p-4 border border-amber-900/50 bg-amber-900/10 text-amber-700 text-sm">
                                    <p className="mb-2">Gemini API Key is configured via Environment Variables (Vercel/Env).</p>
                                    <p>Current Status: <span className={apiKey ? "text-green-500" : "text-red-500"}>{apiKey ? "CONFIGURED" : "MISSING"}</span></p>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in">
                                    {/* Spark Version Selector */}
                                    <div>
                                        <label className="block text-xs text-blue-400 mb-1 font-bold">SPARK VERSION (PRESET)</label>
                                        <select 
                                            value={sparkVersion}
                                            onChange={(e) => handleSparkVersionChange(e.target.value as SparkVersion)}
                                            className="w-full bg-zinc-900 border border-blue-900 text-blue-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="v1.1">Spark Lite (V1.1) - Free</option>
                                            <option value="v2.1">Spark V2.0</option>
                                            <option value="v3.1">Spark Pro (V3.0)</option>
                                            <option value="v3.5">Spark Max (V3.5)</option>
                                            <option value="v4.0">Spark 4.0 Ultra</option>
                                        </select>
                                        <div className="text-[10px] text-blue-500/50 pt-1">
                                            Auto-fills URL & Domain. Change this first, then edit below if needed.
                                        </div>
                                    </div>

                                    {/* ADVANCED CONFIG */}
                                    <div className="border-t border-blue-900/50 pt-2 mt-2">
                                        <label className="block text-xs text-blue-300 mb-1 font-bold">ADVANCED ENDPOINT CONFIG</label>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-[10px] text-blue-500">Service URL</label>
                                                <input 
                                                    value={sparkServiceUrl}
                                                    onChange={(e) => setSparkServiceUrl(e.target.value)}
                                                    className="w-full bg-black border border-blue-800 text-blue-300 p-1 font-mono text-xs focus:border-blue-500 focus:outline-none"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-blue-500">API Domain (Critical for Auth Error 11200)</label>
                                                <input 
                                                    value={sparkDomain}
                                                    onChange={(e) => setSparkDomain(e.target.value)}
                                                    className="w-full bg-black border border-blue-800 text-blue-300 p-1 font-mono text-xs focus:border-blue-500 focus:outline-none"
                                                    type="text"
                                                    placeholder="e.g., general, lite, generalv2"
                                                />
                                                <div className="text-[9px] text-amber-600 pt-1">
                                                    If you get error 11200, try changing this to 'lite', 'generalv2', or 'general'.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-blue-900/50 pt-2 mt-2">
                                        <label className="block text-xs text-blue-400 mb-1">APPID</label>
                                        <input 
                                            value={sparkAppId}
                                            onChange={(e) => setSparkAppId(e.target.value)}
                                            className="w-full bg-zinc-900 border border-blue-900 text-blue-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-blue-400 mb-1">APISecret</label>
                                        <input 
                                            value={sparkApiSecret}
                                            onChange={(e) => setSparkApiSecret(e.target.value)}
                                            className="w-full bg-zinc-900 border border-blue-900 text-blue-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                                            type="password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-blue-400 mb-1">APIKey</label>
                                        <input 
                                            value={sparkApiKey}
                                            onChange={(e) => setSparkApiKey(e.target.value)}
                                            className="w-full bg-zinc-900 border border-blue-900 text-blue-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                                            type="password"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                         <button 
                            onClick={() => setViewMode('DASHBOARD')}
                            className="border border-amber-800 text-amber-700 px-6 py-2 hover:bg-amber-900/20"
                         >
                            CANCEL
                         </button>
                         <button 
                            onClick={saveSparkCredentials}
                            className={`px-6 py-2 font-bold text-black transition-all ${provider === 'SPARK' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                         >
                            SAVE CONFIGURATION
                         </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
