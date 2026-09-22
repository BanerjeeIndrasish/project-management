import { Router } from "express";
import {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
} from "../controllers/project.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.use(authenticate);
router.get("/projects", getProjects);
router.get("/projects/:id", getProject);
router.post("/projects", authorize('ADMN', 'MNGR'), createProject);
router.put("/projects/:id", authorize('ADMN', 'MNGR'), updateProject);
router.delete("/projects/:id", authorize('ADMN', 'MNGR'), deleteProject);

export default router;
