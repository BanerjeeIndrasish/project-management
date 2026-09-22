import { db } from "../configs/db";

export async function getAllProjects() {
    const [rows] = await db.execute(
        `SELECT id, name, description, status, created_by, created_at, updated_at 
     FROM projects`
    );
    return rows as any[];
}

export async function getProjectById(id: number) {
    const [rows] = await db.execute(
        `SELECT id, name, description, status, created_by, created_at, updated_at 
     FROM projects WHERE id = ?`,
        [id]
    );
    return (rows as any[])[0];
}

export async function createProject(
    name: string,
    description: string,
    status: string,
    createdBy: number
) {
    const [result] = await db.execute(
        `INSERT INTO projects (name, description, status, created_by, created_at, updated_at) 
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [name, description, status, createdBy]
    );
    return result;
}

export async function updateProject(
    id: number,
    name: string,
    description: string,
    status: string
) {
    const [result] = await db.execute(
        `UPDATE projects 
     SET name = ?, description = ?, status = ?, updated_at = NOW() 
     WHERE id = ?`,
        [name, description, status, id]
    );
    return result;
}

export async function deleteProject(id: number) {
    const [result] = await db.execute(`DELETE FROM projects WHERE id = ?`, [id]);
    return result;
}
