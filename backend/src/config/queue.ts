import { Queue } from "bullmq";

export const agentBuildQueue = new Queue('agent-build-queue', {
    connection: {
        url: process.env['REDIS_URL'] || ''
    }
})