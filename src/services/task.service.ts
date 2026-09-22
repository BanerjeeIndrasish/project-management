import { db } from "../configs/db";

export async function getAllTasks(projectId?: number) {
    let sql = `
    SELECT 
      t.id, t.title, t.description, t.project_id, 
      t.assigned_to, t.status, t.priority, t.due_date, 
      t.created_by, t.created_at, t.updated_at,
      u.name AS assigned_user,
      p.name AS project_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
    const params: any[] = [];

    if (projectId) {
        sql += " AND t.project_id = ?";
        params.push(projectId);
    }

    const [rows] = await db.execute(sql, params);
    return rows as any[];
}

export async function getTaskById(id: number) {
    const [rows] = await db.execute(
        `SELECT * FROM tasks WHERE id = ?`,        
        [id]
    );
    return (rows as any[])[0];
}

export async function createTask(
    title: string,
    description: string,
    projectId: number,
    assignedTo: number,
    status: string,
    priority: string,
    dueDate: string,
    createdBy: number
) {
    const [result] = await db.execute(
        `INSERT INTO tasks 
      (title, description, project_id, assigned_to, status, priority, due_date, created_by, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [title, description, projectId, assignedTo, status, priority, dueDate, createdBy]
    );
    return result;
}

export async function updateTask(
    id: number,
    title: string,
    description: string,
    status: string,
    priority: string,
    dueDate: string
) {
    const [result] = await db.execute(
        `UPDATE tasks 
     SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = NOW() 
     WHERE id = ?`,
        [title, description, status, priority, dueDate, id]
    );
    return result;
}

export async function deleteTask(id: number) {
    const [result] = await db.execute(`DELETE FROM tasks WHERE id = ?`, [id]);
    return result;
}
