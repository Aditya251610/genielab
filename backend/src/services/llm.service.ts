import { genAI, SYSTEM_INSTRUCTION } from './gemini.service';
import { redisClient } from './redis.service';
import { ProcessPromptResponse, ChatMessage, ChatPart } from '../types/chat';

// --- Helper to extract JSON ---
function extractJSON(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
  return match?.[1]?.trim() || text.trim();
}

export async function processPrompt(prompt: string, sessionId: string): Promise<ProcessPromptResponse> {
  if (!prompt?.trim()) {
    return { status: 'ready', error: 'Prompt is required' };
  }

  const sessionKey = `chat:${sessionId}`;

  try {
    const data = await redisClient.get(sessionKey);
    let chatHistory: ChatMessage[] = data ? JSON.parse(data) : [];

    if (chatHistory.length === 0) {
      chatHistory.push({ role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] });
    }

    chatHistory.push({ role: 'user', parts: [{ text: prompt }] });

    const chat = genAI.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory
    });

    const response = await chat.sendMessage({ message: prompt });
    const responseText = response.text || '';

    if (!responseText) {
      return { status: 'ready', error: 'No response from AI.' };
    }

    const jsonText = extractJSON(responseText);
    let parsed: ProcessPromptResponse;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = { status: 'ready', error: 'Invalid JSON from AI', raw: responseText };
    }

    chatHistory.push({ role: 'model', parts: [{ text: responseText }] });

    await redisClient.set(sessionKey, JSON.stringify(chatHistory), { EX: 3600 });

    if (parsed.status === 'ready') {
      const allUserMessages = chatHistory
        .filter(m => m.role === 'user')
        .map(m => m.parts.map((p: ChatPart) => p.text).join(" "))
        .join(" ")
        .toLowerCase();

      const missing = ['platform', 'tool', 'framework', 'language', 'functionality', 'feature', 'constraint']
        .some(k => !allUserMessages.includes(k));

      if (missing) {
        return {
          status: 'need_more_info',
          question: 'Could you provide more details on the platform, tools, features, and constraints for the agent?'
        };
      }
    }

    return parsed;
  } catch (err) {
    console.error('Error in processPrompt:', err);
    return { status: 'ready', error: 'Failed to process prompt' };
  }
}
