import { Request, Response } from "express";
import * as taskService from "../services/task.service";

export async function getTasks(req: Request, res: Response) {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const tasks = await taskService.getAllTasks(projectId);
    res.json({ status: true, data: tasks });
}

export async function getTask(req: Request, res: Response) {
    const id = Number(req.params.id);
    const task = await taskService.getTaskById(id);
    if (!task) return res.status(404).json({ status: false, error: "Not found" });
    res.json({ status: true, data: task });
}

export async function createTask(req: Request, res: Response) {
    const { title, description, project_id, assigned_to, status, priority, due_date, created_by } = req.body;
    const result = await taskService.createTask(title, description, project_id, assigned_to, status, priority, due_date, created_by);
    res.status(201).json({ status: true, data: result });
}

export async function updateTask(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { title, description, status, priority, due_date } = req.body;
    const result = await taskService.updateTask(id, title, description, status, priority, due_date);
    res.json({ status: true, data: result });
}

export async function deleteTask(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await taskService.deleteTask(id);
    res.json({ status: true, data: result });
}
