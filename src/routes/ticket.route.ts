import { Router } from "express";
import { analyzeTicket } from "../controllers/ticket.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post('/analyze-ticket', authenticate, analyzeTicket);

export default router;