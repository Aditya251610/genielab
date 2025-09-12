import fs from "fs"; // classic fs for streams
import fsp from "fs/promises"; // fs/promises for async/await
import path from "path";
import os from "os";
import archiver from "archiver";
import { genAI } from "../config/gemini";

interface GenerateCodeOptions {
  prompt: string;
  manifest: any;
  chatHistory?: string; // optional, for context
  userContext?: string; // optional, for context
}

export async function generateAgentCode({
  prompt,
  manifest,
  chatHistory
}: GenerateCodeOptions): Promise<{ zipPath: string; dockerCommands: string[] }> {
  // 1️⃣ Create temporary workspace
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), `agent-${manifest.name}-`));

  // 2️⃣ Combine prompt with context
  let fullPrompt = prompt;
  if (chatHistory) fullPrompt += `\nChat history:\n${chatHistory}`;

  fullPrompt += `
Instructions:
- Generate a complete, multi-file ${manifest.language} project based on this manifest.
- Include all source files, configs, Dockerfile, and README.
- Structure the code properly in folders (e.g., src/, bin/).
- Provide all dependencies from manifest.dependencies.
- The entrypoint is ${manifest.entrypoint}.
- Output should be ready-to-run using Docker commands.
- Return only code, separate files clearly with a comment like "=== FILENAME: path/to/file ===".
`;

  // 3️⃣ Call Gemini AI to generate full project code
  const aiResponse = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
  });

  const codeText = aiResponse?.text;
  if (!codeText) throw new Error("AI did not return any code");

  // 4️⃣ Parse AI output into files
  const fileRegex = /=== FILENAME: (.+) ===\n([\s\S]+?)(?=(\n=== FILENAME:|$))/g;
  let match;
  const files: { filePath: string; content: string }[] = [];
  while ((match = fileRegex.exec(codeText)) !== null) {
    const filePath = match[1]?.trim();
    const content = match[2]?.trim();
    if (!filePath || !content) continue; // skip invalid matches
    files.push({ filePath, content });
  }

  // 5️⃣ Write each file to tmpDir
  for (const file of files) {
    const absolutePath = path.join(tmpDir, file.filePath);
    await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
    await fsp.writeFile(absolutePath, file.content);
  }

  // 6️⃣ Zip the folder
  const zipPath = path.join(os.tmpdir(), `${manifest.name}-${Date.now()}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(tmpDir, false);

  await new Promise<void>((resolve, reject) => {
    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));
    archive.finalize();
  });

  // 7️⃣ Provide Docker commands from manifest
  const dockerCommands = manifest.docker?.commands || [];

  return { zipPath, dockerCommands };
}
