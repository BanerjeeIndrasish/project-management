import { Router } from "express";
import {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
} from "../controllers/task.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// 🔑 All task routes require authentication
router.use(authenticate);

router.get("/tasks", getTasks);
router.get("/tasks/:id", getTask);

// 🔑 Only Admins & Managers can create/update/delete tasks
router.post("/tasks", authorize("ADMN", "MNGR"), createTask);
router.put("/tasks/:id", authorize("ADMN", "MNGR"), updateTask);
router.delete("/tasks/:id", authorize("ADMN", "MNGR"), deleteTask);

export default router;
