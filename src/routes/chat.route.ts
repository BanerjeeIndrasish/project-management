import { Router } from "express";
import { chatLLM, handleHRMSChat } from "../controllers/chat.controller";
import { handleAgentChat } from "../controllers/agent.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);
router.post('/chat', chatLLM)
router.post('/query/tasks', handleHRMSChat)
router.post('/agent/chat', handleAgentChat)

export default router;