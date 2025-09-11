import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Fail-fast if the API key is missing from environment variables
if (!process.env['GEMINI_API_KEY']) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

/**
 * A shared, singleton instance of the GoogleGenAI client.
 * This is initialized once and can be imported by any service that needs to interact with the Gemini API.
 */
export const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});