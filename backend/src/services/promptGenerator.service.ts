import { genAI } from "../config/gemini";

export async function generateCodePrompt(manifest: any): Promise<string> {
  const systemInstruction = `
You are an AI assistant that generates developer prompts for code generation.
Input: A manifest describing the desired agent.
Output: A clear, detailed prompt for an LLM to generate the full project in the specified language/framework.
Rules:
- Always tailor the prompt to the manifest.language and manifest.framework.
- Include dependencies, entrypoint, and Docker commands.
- Format the prompt as plain text. Do not wrap in markdown.
  `;

  const input = `
Manifest:
${JSON.stringify(manifest, null, 2)}
  `;

  const response = await genAI.models.generateContent({
    model: "gemini-1.5-pro",
    config: {
        systemInstruction: systemInstruction,
    },
    contents: [{
        role: 'user',
        parts: [{text: input}]
    }],
  });

  if (!response) return "No response from ai"
  return response.text || ""
}
