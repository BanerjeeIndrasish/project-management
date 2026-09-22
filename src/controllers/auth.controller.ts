import { Request, Response } from "express";
import { createUser } from "../services/user.service";
import { loginUser } from "../services/auth.service";


export async function register(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;
        const result = await createUser(name, email, password, 1);
        res.status(201).json({ message: "User registered", result });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        const { user, token } = await loginUser(email, password);
        res.json({ status: true, message: "Login successful", user, token });
    } catch (err: any) {
        res.status(401).json({ status: false, error: err.message });
    }
}
