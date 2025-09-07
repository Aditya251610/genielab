import { Request, Response } from "express";
import { processPrompt } from "../services/llm.service";


export const handlePrompt = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const result = await processPrompt(prompt);

    return res.json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
