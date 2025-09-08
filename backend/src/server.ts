import app from "./index";
import "dotenv/config";
import { initRedis } from "./services/redis.service";

const PORT = process.env.PORT || 3000;

async function startServer() {
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
