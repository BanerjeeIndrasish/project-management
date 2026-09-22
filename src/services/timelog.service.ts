import { db } from "../configs/db";

export async function getAllTimeLogs(taskId?: number, userId?: number) {
    let sql = `
    SELECT 
      tl.id, tl.task_id, tl.user_id, tl.log_date, tl.hours, tl.description, tl.created_at,
      u.name AS user_name,
      t.title AS task_title
    FROM timelogs tl
    LEFT JOIN users u ON tl.user_id = u.id
    LEFT JOIN tasks t ON tl.task_id = t.id
    WHERE 1=1
  `;
    const params: any[] = [];

    if (taskId) {
        sql += " AND tl.task_id = ?";
        params.push(taskId);
    }

    if (userId) {
        sql += " AND tl.user_id = ?";
        params.push(userId);
    }

    const [rows] = await db.execute(sql, params);
    return rows as any[];
}

export async function getTimeLogById(id: number) {
    let sql = `
        SELECT 
        t.id, 
        t.task_id, 
        t.user_id, 
        t.log_date, 
        t.hours, 
        t.description,
        ts.project_id,
        p.name AS project_name
        FROM timelogs t
        LEFT JOIN tasks ts ON t.task_id = ts.id
        LEFT JOIN projects p ON ts.project_id = p.id
        WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
        sql += " AND t.id = ?";
        params.push(id);
    }

    const [rows] = await db.execute(sql, params);
    return (rows as any[])[0];
}

export async function createTimeLog(
    taskId: number,
    userId: number,
    logDate: string,
    hours: number,
    description: string
) {
    const [result] = await db.execute(
        `INSERT INTO timelogs 
      (task_id, user_id, log_date, hours, description, created_at) 
     VALUES (?, ?, ?, ?, ?, NOW())`,
        [taskId, userId, logDate, hours, description]
    );
    return result;
}

export async function updateTimeLog(
    id: number,
    logDate: string,
    hours: number,
    description: string
) {
    const [result] = await db.execute(
        `UPDATE timelogs 
     SET log_date = ?, hours = ?, description = ? 
     WHERE id = ?`,
        [logDate, hours, description, id]
    );
    return result;
}

export async function deleteTimeLog(id: number) {
    const [result] = await db.execute(`DELETE FROM timelogs WHERE id = ?`, [id]);
    return result;
}
