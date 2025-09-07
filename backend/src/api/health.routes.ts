import { Router } from "express";

const router =  Router();
router.get("/", (_req, res) => {
    return res.send({
        "status": "ok",
        "uptime": process.uptime()
    })
});
export default router;