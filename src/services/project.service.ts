import { RowDataPacket } from "mysql2";
import { db } from "../configs/db";

export async function getAllProjects() {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 
        p.id, p.name, p.description, p.status, 
        p.created_at, p.updated_at,
        u.id AS user_id, u.name AS user_name
        FROM projects p
        JOIN users u ON p.created_by = u.id`
    );
    return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        created_by: {
            user_id: row.user_id,
            name: row.user_name,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
    }));
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
    status: string,
    created_by: string
) {
    const [result] = await db.execute(
        `UPDATE projects 
     SET name = ?, description = ?, status = ?, created_by = ?, updated_at = NOW() 
     WHERE id = ?`,
        [name, description, status, created_by, id]
    );
    return result;
}

export async function deleteProject(id: number) {
    const [result] = await db.execute(`DELETE FROM projects WHERE id = ?`, [id]);
    return result;
}
