import { genAI } from "../config/gemini";
import { Type } from "@google/genai";

export async function generateManifest(chatHistory: string) {
  const manifestPrompt = `
You are an AI system that generates a complete manifest.json file
for building a fully functional AI agent based on the chat history.

The manifest must always be valid JSON, with this structure:

{
  "name": "string - agent name",
  "description": "string - short summary of the agent",
  "language": "string - programming language (e.g., Python, Go, JavaScript)",
  "framework": "string - main framework or runtime (e.g., FastAPI, Express, Flask)",
  "platform": "string - deployment environment (e.g., GitHub Actions, AWS Lambda, Docker)",
  "features": ["list", "of", "key", "features"],
  "dependencies": ["list", "of", "required", "libraries", "or", "packages"],
  "entrypoint": "string - the main file or command to run",
  "docker": {
    "baseImage": "string - Docker base image",
    "ports": ["list of exposed ports"],
    "commands": ["list of build/run commands"]
  }
}

Rules:
- Output only valid JSON (no markdown, no backticks).
- Infer as much detail as possible from the chat history.
- If something is missing, make reasonable assumptions instead of asking.
- Ensure the JSON is syntactically correct.

### Chat History:
${chatHistory}
`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [{ role: 'user', parts: [{ text: manifestPrompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          language: { type: Type.STRING },
          framework: { type: Type.STRING },
          platform: { type: Type.STRING },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          dependencies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          entrypoint: { type: Type.STRING },
          docker: {
            type: Type.OBJECT,
            properties: {
              baseImage: { type: Type.STRING },
              ports: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              commands: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            propertyOrdering: ['baseImage', 'ports', 'commands'],
          },
        },
        propertyOrdering: [
          'name',
          'description',
          'language',
          'framework',
          'platform',
          'features',
          'dependencies',
          'entrypoint',
          'docker',
        ],
      },
    },
  });

  const rawText = response.text || '{}';

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error('Failed to parse manifest JSON:', rawText);
    throw err;
  }
}