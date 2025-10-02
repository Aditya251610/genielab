import { Request, Response } from 'express';
import { processPrompt } from '../services/llm.service';
import { generateManifest } from '../services/manifest.service';
import { getChatHistory, saveChatMessage } from '../services/dbChats.service';
import { ChatMessage } from '../types/chat';

export const handlePrompt = async (req: Request, res: Response) => {
  try {
    const { prompt, sessionId = 'default-thread' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Step 1: Save the new user prompt
    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: prompt }],
      timestamp: new Date().toISOString(),
      sessionId,
    };
    await saveChatMessage(sessionId, userMessage);

    // Step 2: Process the prompt
    const conversationalResult = await processPrompt(prompt, sessionId);

    // Step 3: If more info is needed, return immediately
    if (conversationalResult.status === 'need_more_info') {
      return res.status(200).json(conversationalResult);
    }

    // Step 4: If ready, fetch full chat history
    if (conversationalResult.status === 'ready') {
      const fullChatHistory: ChatMessage[] = await getChatHistory(sessionId);

      // Step 5: Filter out previous model manifests (keep user messages and non-manifest model messages)
      const filteredMessages = fullChatHistory.filter(msg => {
        if (msg.role === 'user') return true;

        if (msg.role === 'model') {
          const text = msg.parts?.[0]?.text;
          if (!text) return true;

          try {
            const parsed = JSON.parse(text);
            if (parsed?.name && parsed?.description) return false; // skip old manifests
          } catch {
            return true; // not JSON, keep message
          }
        }
        return true;
      });

      // Step 6: Convert filtered messages to string for manifest generation
      const historyAsString = filteredMessages
        .map(msg => {
          const content = msg.parts?.map(p => p.text || '').join('') || '';
          return `${msg.role || 'unknown'}: ${content}`;
        })
        .join('\n');

      // Step 7: Generate manifest based on latest prompt
      const manifest = await generateManifest(historyAsString);

      // Step 8: Save AI response as a new message
      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: JSON.stringify(manifest) }],
        timestamp: new Date().toISOString(),
        sessionId,
      };
      await saveChatMessage(sessionId, modelMessage);

      // Step 9: Return manifest to frontend
      return res.status(200).json({
        status: 'manifest_ready',
        manifest,
      });
    }

    // Step 10: Fallback
    return res.status(200).json(conversationalResult);
  } catch (error) {
    console.error('Error in handlePrompt controller:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
