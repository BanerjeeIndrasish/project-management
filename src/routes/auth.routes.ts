import { Router } from "express";
import { guestLogin, login, register } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/guest-login", guestLogin);

export default router;
