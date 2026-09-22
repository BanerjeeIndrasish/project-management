import { Router } from "express";
import { editUser, getOneUser, listUsers, removeUser } from "../controllers/user.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.use(authenticate);
router.get("/users", listUsers);
router.get("/users/:id", getOneUser);
router.put("/users/:id", authorize('ADMN'), editUser);
router.delete("/users/:id", removeUser);

export default router;
