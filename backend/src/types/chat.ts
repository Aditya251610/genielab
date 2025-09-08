export interface ProcessPromptResponse {
  status: 'need_more_info' | 'ready';
  question?: string;
  agentType?: string;
  error?: string;
  raw?: string;
}

export type ChatPart = { text: string };
export type ChatRole = 'user' | 'model';
export type ChatMessage = { role: ChatRole; parts: ChatPart[] };
