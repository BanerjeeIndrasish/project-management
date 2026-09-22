import { Request, Response } from "express";
import * as projectService from "../services/project.service";

export async function getProjects(req: Request, res: Response) {
    const projects = await projectService.getAllProjects();
    res.json({ status: true, data: projects });
}

export async function getProject(req: Request, res: Response) {
    const id = Number(req.params.id);
    const project = await projectService.getProjectById(id);
    if (!project) return res.status(404).json({ status: false, error: "Not found" });
    res.json({ status: true, data: project });
}

export async function createProject(req: Request, res: Response) {
    const { name, description, status, created_by } = req.body;
    let createdBy = (req as any).user.userId;

    if (created_by && (req as any).user.role_code === "ADMN") {
        // only admins can override
        createdBy = created_by;
    }

    const result = await projectService.createProject(name, description, status, createdBy);
    res.status(201).json({ status: true, data: result });
}

export async function updateProject(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { name, description, status } = req.body;
    const result = await projectService.updateProject(id, name, description, status);
    res.json({ status: true, data: result });
}

export async function deleteProject(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await projectService.deleteProject(id);
    res.json({ status: true, data: result });
}
