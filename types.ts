
export enum ClearanceLevel {
  I = "I",
  II = "II",
  III = "III",
  IV = "IV",
  OMEGA = "Ω-IX"
}

export type FileType = 'FILE' | 'DIR';

export interface FileNode {
  type: 'FILE';
  name: string;
  content: string;
  readOnly?: boolean;
}

export interface DirectoryNode {
  type: 'DIR';
  name: string;
  children: { [key: string]: FileSystemNode };
}

export type FileSystemNode = FileNode | DirectoryNode;

export type ViewState = 'POWER_OFF' | 'BOOT' | 'LOGIN' | 'TERMINAL';

export interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'error' | 'success';
  content: string;
  path?: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'KIA';
  clearance: ClearanceLevel;
  bio: string;           // Description visible to user
  personaPrompt: string; // Instruction for AI
}

export type AppType = 'NONE' | 'SYS' | 'MAP' | 'SCAN' | 'AI' | 'CAM';