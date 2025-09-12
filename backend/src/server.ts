import app from "./index";
import "dotenv/config";
import { initRedis } from "./services/redis.service";
import { pool } from "./services/mariadb.service";
import { agentBuildQueue } from "./config/queue";

app.get("/api/status/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await agentBuildQueue.getJob(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Get job state from BullMQ
    let state = await job.getState();

    // Get job result (returned by worker)
    const result = job.returnvalue || null;

    // If job completed and S3 download URL exists, set state to 'ready'
    if (state === "completed" && result?.downloadUrl) {
      state = "completed";
    }

    return res.json({
      jobId,
      state,
      result, // contains downloadUrl and dockerCommands
    });
  } catch (err) {
    console.error("❌ Error fetching job status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MariaDB connection successful!");
    connection.release(); // just release, do NOT end the pool
  } catch (err) {
    console.error("❌ MariaDB connection failed:", err);
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
