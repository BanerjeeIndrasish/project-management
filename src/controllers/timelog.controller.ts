import { Request, Response } from "express";
import * as timeLogService from "../services/timelog.service";

export async function getTimeLogs(req: Request, res: Response) {
    const taskId = req.query.taskId ? Number(req.query.taskId) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const logs = await timeLogService.getAllTimeLogs(taskId, userId);
    res.json({ status: true, data: logs });
}

export async function getTimeLog(req: Request, res: Response) {
    const id = Number(req.params.id);
    const log = await timeLogService.getTimeLogById(id);
    if (!log) return res.status(404).json({ status: false, error: "Not found" });
    res.json({ status: true, data: log });
}

export async function createTimeLog(req: Request, res: Response) {
    const { task_id, user_id, log_date, hours, description } = req.body;
    const result = await timeLogService.createTimeLog(task_id, user_id, log_date, hours, description);
    res.status(201).json({ status: true, data: result });
}

export async function updateTimeLog(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { log_date, hours, description } = req.body;
    const result = await timeLogService.updateTimeLog(id, log_date, hours, description);
    res.json({ status: true, data: result });
}

export async function deleteTimeLog(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await timeLogService.deleteTimeLog(id);
    res.json({ status: true, data: result });
}
