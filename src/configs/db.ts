import * as dotenv from 'dotenv';
dotenv.config();
import mysql, { Pool } from "mysql2/promise";

console.log('^^^', process.env.JWT_SECRET, process.env.DB_USER, process.env.DB_HOST, process.env.DB_PORT)
export const db: Pool = mysql.createPool({
    host: process.env.DB_HOST,
    // port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
