import app from "./index";
import "dotenv/config";
import { initRedis } from "./services/redis.service";
import { pool } from "./services/mariadb.service";
import { agentBuildQueue } from "./config/queue";

app.get("/api/status/:jobId", async (req, res) => {
    const { jobId } = req.params;
    const job = await agentBuildQueue.getJob(jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });

    const state = await job.getState();
    const result = job.returnvalue || null;

    return res.json({ jobId, state, result });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MariaDB connection successful!');
    connection.release(); // just release, do NOT end the pool
  } catch (err) {
    console.error('❌ MariaDB connection failed:', err);
    process.exit(1);
  }
  try {
    // Ensure Redis is connected before starting
    await initRedis();

    app.listen(PORT, () => {
      console.log(`🚀 GenieLab backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
