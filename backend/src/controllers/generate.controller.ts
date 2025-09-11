import { agentBuildQueue } from "../config/queue"
import { Request, Response } from 'express';

export const handleGenerateRequest = async (req: Request, res: Response) => {
    try{
        const { manifest } = req.body
        if(!manifest) {
            return res.status(400).json({ error: 'manifest is required' })
        }

        const job = await agentBuildQueue.add(manifest.name, {
        manifest: manifest,
        });

        console.log(`Job added with ID: ${job.id}`);

        return res.status(202).json({
            jobId: job.id,
        });
    } catch(error) {
        console.error('Error adding job to queue:', error);
        return res.status(500).json({ error: 'Failed to create generation job' });
    }
}