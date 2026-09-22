import { Request, Response } from "express";
import { deleteUser, findUserById, getAllUsers, updateUser } from "../services/user.service";


export async function listUsers(req: Request, res: Response) {
    try {
        const { search, roleId } = req.query;
        const users = await getAllUsers(
            search ? String(search) : undefined,
            roleId ? Number(roleId) : undefined
        );
        res.json({ status: true, data: users });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// ✅ Get one user by ID
export async function getOneUser(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const user = await findUserById(id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ status: true, data: user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// ✅ Update user
export async function editUser(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const { name, email, roleId } = req.body;
        const result = await updateUser(id, name, email, roleId);
        res.json({ status: true, message: "User updated", data: result });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ Delete user
export async function removeUser(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const result = await deleteUser(id);
        res.json({ status: true, message: "User deleted", data: result });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}
