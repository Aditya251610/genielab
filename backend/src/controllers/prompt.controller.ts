import { Request, Response } from 'express';
import { processPrompt } from '../services/llm.service';
import { generateManifest } from '../services/manifest.service';
// Import your actual function from dbChats.service.ts
import { getChatHistory } from '../services/dbChats.service'; 

export const handlePrompt = async (req: Request, res: Response) => {
  try {
    // In a real app, you would get the sessionId from an authenticated user session
    const { prompt, sessionId = 'test-session' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Step 1: Always call the conversational service first
    const conversationalResult = await processPrompt(prompt, sessionId);

    // Step 2: The controller now acts as an orchestrator based on the result
    if (conversationalResult.status === 'need_more_info') {
      // The conversation is ongoing. Return the question to the user.
      return res.status(200).json(conversationalResult);

    } else if (conversationalResult.status === 'ready') {
      // The conversation is complete! This is the trigger to generate the manifest.
      console.log('Conversation is ready. Synthesizing manifest...');

      // Step 3: Use your existing getChatHistory function
      const finalChatHistoryArray = await getChatHistory(sessionId);

      // Step 4: Transform the array of objects into a single string
      const historyAsString = finalChatHistoryArray
       .map(message => {
          // This creates a line like "user: Hello there" or "model: How can I help?"
          const content = message.parts.map(part => part.text).join('');
          return `${message.role}: ${content}`;
        })
       .join('\n'); // Join all lines into a single transcript string

      // Step 5: Call the manifest service with the formatted string
      const manifest = await generateManifest(historyAsString);

      // Return a new status and the completed manifest to the frontend
      return res.status(200).json({
        status: 'manifest_ready',
        manifest: manifest,
      });
    } else {
      // Handle any other cases, like errors from the llm.service
      return res.status(200).json(conversationalResult);
    }
  } catch (error) {
    console.error('Error in handlePrompt controller:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};