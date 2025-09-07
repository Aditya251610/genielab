import { Router } from "express";
import { handlePrompt } from "../controllers/prompt.controller";

const router = Router();

router.post("/", handlePrompt);

export default router;
