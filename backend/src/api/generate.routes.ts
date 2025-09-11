import { Router } from "express";
import { handleGenerateRequest } from "../controllers/generate.controller"; 

const router = Router();

router.post("/", handleGenerateRequest);

export default router;
