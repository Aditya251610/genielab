import { Worker } from "bullmq";
import { generateCodePrompt } from "../services/promptGenerator.service";
import { generateAgentCode } from "../services/codeGenerator.service"; // <-- new service

const REDIS_OPTIONS = {
  host: process.env.REDIS_HOST || "redis-17547.c321.us-east-1-2.ec2.redns.redis-cloud.com",
  port: Number(process.env.REDIS_PORT || 17547),
  username: process.env.REDIS_USER || "default",
  password: process.env.REDIS_PASSWORD || "fiVF8RxUC1e4r1h9gUHCjTBs48nShkeP",
};

export const agentWorker = new Worker(
  "agent-build-queue",
  async (job) => {
    const manifest = job.data.manifest;
    const chatHistory = job.data.chatHistory || "";

    console.log(`⚙️ Job ${job.id} started for ${manifest.name}`);

    try {
      // 1️⃣ Generate AI Prompt dynamically
      const devPrompt = await generateCodePrompt(manifest);
      console.log("Generated prompt for AI:\n", devPrompt);

      // 2️⃣ Generate full codebase and zip
      const { zipPath, dockerCommands } = await generateAgentCode({
        prompt: devPrompt,
        manifest,
        chatHistory,
      });

      console.log(`✅ Job ${job.id} completed. Code written to zip: ${zipPath}`);
      console.log("Docker commands to run agent:", dockerCommands);

      // 3️⃣ Return result for job completion
      return { zipPath, dockerCommands };
    } catch (err) {
      console.error(`❌ Job ${job.id} failed:`, err);
      throw err; // mark the job as failed in BullMQ
    }
  },
  { connection: REDIS_OPTIONS }
);

agentWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

agentWorker.on("completed", (job, result) => {
  console.log(`🎉 Job ${job.id} completed successfully`);
  console.log("Result:", result);
});
