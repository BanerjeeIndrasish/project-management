import mysql, { Pool } from "mysql2/promise";

export const db: Pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // XAMPP default is blank
    database: 'project-management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
