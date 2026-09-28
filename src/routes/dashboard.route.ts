import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { handleDashboardInsights } from "../controllers/agent.controller";
import { getStatisticData } from "../controllers/dashboard.controller";

const router = Router()

router.use(authenticate)
router.get("/dashboard/insights", handleDashboardInsights);
router.get("/dashboard/stats", getStatisticData);

export default router;