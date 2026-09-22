import { Router } from "express";

const router = Router();


router.get('/health', (_: any, res: any) => {
    res.json({
        status: "ok",
        service: "devflow-backend health is okay...",
    });
})


export default router;