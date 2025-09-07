import express from "express";
import cors from "cors";
import promptRoutes from "./api/prompt.routes";
import healthRouter from "./api/health.routes";
import "dotenv/config"
const app = express();

app.use(cors());
app.use(express.json());
// Routes
app.use("/api/prompt", promptRoutes);
app.use("/api/health", healthRouter);

export default app;
