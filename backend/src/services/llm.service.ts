import { SYSTEM_INSTRUCTION } from './gemini.service';
import { genAI } from '../config/gemini';
import { redisClient } from './redis.service';
import { ProcessPromptResponse, ChatMessage, ChatPart } from '../types/chat';
import { getChatHistory, saveChatMessage } from './dbChats.service';
// --- Helper to extract JSON ---
function extractJSON(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
  return match?.[1]?.trim() || text.trim();
}

export async function processPrompt(
  prompt: string,
  sessionId: string
): Promise<ProcessPromptResponse> {
  if (!prompt?.trim()) {
    return { status: 'ready', error: 'Prompt is required' };
  }

  const sessionKey = `chat:${sessionId}`;

  try {
    // 1. Try Redis first
    let data = await redisClient.get(sessionKey);
    let chatHistory: ChatMessage[] = data ? JSON.parse(data) : [];

    // 2. If Redis empty, fall back to MariaDB
    if (chatHistory.length === 0) {
      chatHistory = await getChatHistory(sessionId);

      // warm up Redis cache
      if (chatHistory.length > 0) {
        await redisClient.set(sessionKey, JSON.stringify(chatHistory), { EX: 3600 });
      }
    }

    // 3. Add system instruction if no history exists
    if (chatHistory.length === 0) {
      const systemMsg: ChatMessage = {
        role: 'user',
        parts: [{ text: SYSTEM_INSTRUCTION }],
        timestamp: new Date().toISOString()
      };
      chatHistory.push(systemMsg);
      await saveChatMessage(sessionId, systemMsg);
    }

    // 4. Save user message
    const userMsg: ChatMessage = {
      role: 'user',
      parts: [{ text: prompt }],
      timestamp: new Date().toISOString()
    };
    chatHistory.push(userMsg);
    await saveChatMessage(sessionId, userMsg);

    // 5. Call AI
    const chat = genAI.chats.create({
      model: 'gemini-2.5-pro',
      history: chatHistory
    });

    const response = await chat.sendMessage({ message: prompt });
    const responseText = response.text || '';

    if (!responseText) {
      return { status: 'ready', error: 'No response from AI.' };
    }

    // 6. Parse AI response
    const jsonText = extractJSON(responseText);
    let parsed: ProcessPromptResponse;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = { status: 'ready', error: 'Invalid JSON from AI', raw: responseText };
    }

    // 7. Save AI response
    const modelMsg: ChatMessage = {
      role: 'model',
      parts: [{ text: responseText }],
      timestamp: new Date().toISOString()
    };
    chatHistory.push(modelMsg);
    await saveChatMessage(sessionId, modelMsg);

    // 8. Refresh Redis cache
    await redisClient.set(sessionKey, JSON.stringify(chatHistory), { EX: 3600 });

    // 9. Check if user input is missing key info
    if (parsed.status === 'ready') {
      const allUserMessages = chatHistory
        .filter(m => m.role === 'user')
        .map(m => m.parts.map((p: ChatPart) => p.text).join(' '))
        .join(' ')
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