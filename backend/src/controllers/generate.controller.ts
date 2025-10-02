import { agentBuildQueue } from "../config/queue"
import { Request, Response } from 'express';

export const handleGenerateRequest = async (req: Request, res: Response) => {
    try {
        const { manifest, sessionId = 'default-thread' } = req.body;
        if (!manifest) {
            return res.status(400).json({ error: 'manifest is required' });
        }

        // Fetch full chat history for this session
        const { getChatHistory } = await import('../services/dbChats.service');
        const chatMessages = await getChatHistory(sessionId);
        // Convert chat history to string (same as manifest generation)
        const historyAsString = chatMessages
            .map(msg => {
                const content = msg.parts?.map(p => p.text || '').join('') || '';
                return `${msg.role || 'unknown'}: ${content}`;
            })
            .join('\n');

        const job = await agentBuildQueue.add(manifest.name, {
            manifest: manifest,
            chatHistory: historyAsString,
        });

        console.log(`Job added with ID: ${job.id}`);

        return res.status(202).json({
            jobId: job.id,
        });
    } catch (error) {
        console.error('Error adding job to queue:', error);
        return res.status(500).json({ error: 'Failed to create generation job' });
    }
}