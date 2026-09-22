import { Router } from "express";
import {
    getTimeLogs,
    getTimeLog,
    createTimeLog,
    updateTimeLog,
    deleteTimeLog,
} from "../controllers/timelog.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// 🔑 All timelog routes require authentication
router.use(authenticate);

router.get("/timelogs", getTimeLogs);
router.get("/timelogs/:id", getTimeLog);

// 🔑 Only Admins & Managers can create/update/delete timelogs
router.post("/timelogs", authorize("ADMN", "MNGR", "EMPY"), createTimeLog);
router.put("/timelogs/:id", authorize("ADMN", "MNGR", "EMPY"), updateTimeLog);
router.delete("/timelogs/:id", authorize("ADMN", "MNGR"), deleteTimeLog);

export default router;
