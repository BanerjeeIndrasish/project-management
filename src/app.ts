import * as dotenv from 'dotenv';
dotenv.config();
import express from "express";
import corsPolicies from "./middlewares/cors";
import { GoogleGenAI } from "@google/genai";
import { db } from "./configs/db";
import rateLimit from 'express-rate-limit';


import healthRoute from "./routes/health.route"
import authRoutes from "./routes/auth.routes"
import chatRoutes from "./routes/chat.route"
import ticketRoutes from "./routes/ticket.route"
import userRoutes from "./routes/user.routes"
import projectRoutes from "./routes/project.routes"
import taskRoutes from "./routes/task.routes"
import timelogRoutes from "./routes/timelog.routes"
import dashboardRoutes from "./routes/dashboard.route"


const DB_PORT = process.env.DB_PORT;

const app = express();
app.use(express.json());

export const ai = new GoogleGenAI();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    message: "Too many requests, please try again later.",
});

app.use("/api", limiter);
app.use(corsPolicies);
app.use("/api", healthRoute);
app.use("/api", authRoutes);

app.use("/api", ticketRoutes);
app.use("/api", userRoutes);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", timelogRoutes);
app.use("/api", chatRoutes);
app.use("/api", dashboardRoutes);


app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);

    res.status(500).json({
        status: false,
        message: "Internal server error",
    });
});


app.listen(DB_PORT, async () => {
    // ─── DATABASE HEALTH CHECK INJECTION ───
    try {
        console.log("Checking local database connection pool status...");
        // Execute a fast, lightweight raw connection test query
        const [rows] = await db.query('SELECT 1 + 1 AS connection_test');
        console.log("✅ MySQL Database Connection Successful! (XAMPP instance is responsive)");
    } catch (dbError: any) {
        console.error("❌ Critical Database Connection Failure!");
        console.error(`Error details: ${dbError.message}`);
        console.error("Troubleshooting: Please ensure XAMPP Control Panel is open and MySQL is turned green.");
    }
});

export default app;