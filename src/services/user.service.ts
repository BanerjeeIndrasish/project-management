import bcrypt from "bcrypt";
import { db } from "../configs/db";
import { hashPassword } from "../utils/bcrypt";
import { RowDataPacket } from "mysql2";

interface UserWithRole extends RowDataPacket {
    id: number;
    email: string;
    password: string;
    role_code: string;
}

export async function createUser(
    name: string,
    email: string,
    plainPassword: string,
    roleId: number
) {
    const hashed = await hashPassword(plainPassword);
    const [result] = await db.execute(
        "INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)",
        [name, email, hashed, roleId]
    );
    return result;
}

export async function findUserByEmail(email: string) {
    const [rows] = await db.query<UserWithRole[]>(
        `SELECT u.id, u.email, u.password, r.role_code
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.email = ?`,
        [email]
    );
    return rows[0];
}

export async function findUserById(id: number) {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return (rows as any[])[0];
}

// ✅ Get all users
export async function getAllUsers(
    search?: string,
    roleId?: number
) {
    let sql = `
        SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.city, 
        u.country, 
        u.role_id,
        r.name AS role_name,
        r.description AS role_description
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
        sql += " AND (name LIKE ? OR email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    if (roleId) {
        sql += " AND role_id = ?";
        params.push(roleId);
    }

    const [rows] = await db.execute(sql, params);
    return rows as any[];
}

// ✅ Update user (name, email, role)
export async function updateUser(
    id: number,
    name?: string,
    email?: string,
    roleId?: number
) {
    const [result] = await db.query(
        "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role_id = COALESCE(?, role_id) WHERE id = ?",
        [name, email, roleId, id]
    );
    return result;
}

// ✅ Update password
export async function updatePassword(id: number, plainPassword: string) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    const [result] = await db.execute(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashed, id]
    );
    return result;
}

// ✅ Delete user
export async function deleteUser(id: number) {
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    return result;
}
