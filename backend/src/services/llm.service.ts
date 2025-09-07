import { GoogleGenAI } from '@google/genai';
import "dotenv/config";

// Define the structured return type
export interface ProcessPromptResponse {
  status: 'need_more_info' | 'ready';
  question?: string;
  agentType?: string;
  error?: string;
}

// Fail-fast if API key is missing
if (!process.env['GEMINI_API_KEY']) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

// Initialize Gemini client once
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// System instruction for the AI
const SYSTEM_INSTRUCTION = `
You are an AI assistant that analyzes a user’s request to create another AI agent.
Your primary task is to determine if you have enough information.
- If details are missing, ask one clear, concise follow-up question.
- If you have enough information, determine the specific type of AI agent to create.

Your output must be a JSON object with a 'status' field.
- If asking a question, set status to 'need_more_info' and provide the 'question'.
- If ready, set status to 'ready' and provide the 'agentType'.

Agent types should be concise, like "FullstackAppAgent", "CI_CDAgent", or "DatabaseManagerAgent".
`;

export async function processPrompt(prompt: string): Promise<ProcessPromptResponse> {
  if (!prompt?.trim()) {
    return { status: 'ready', error: 'Prompt is required' };
  }

  try {
    // Generate AI content using systemInstruction + user content
    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-pro-latest',
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    });

    // Access text as a property (not a method)
    const responseText = result.text ?? '';

    if (!responseText) {
      return { status: 'ready', error: 'No response from AI' };
    }

    // Parse and return structured JSON
    const parsed: ProcessPromptResponse = JSON.parse(responseText);
    return parsed;

  } catch (err) {
    console.error('Failed to get AI response:', err);
    return { status: 'ready', error: 'Failed to fetch a valid response from the AI model.' };
  }
}
