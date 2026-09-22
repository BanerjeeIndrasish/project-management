import { Router } from "express";
import { analyzeTicket } from "../controllers/ticket.controller";

const router = Router();

router.post('/analyze-ticket', analyzeTicket);

export default router;