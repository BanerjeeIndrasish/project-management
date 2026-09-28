import { Request, Response } from "express";
import { generateDashboardInsights, processAgentMessage } from "../tool-services/agent.services";
import { db } from "../configs/db";
import { ai } from "../app";

async function runToolCall(call: { name: string; args: any }) {
    console.log('Entry #$%^&*((#$%^&*($#!@#$%^&*', call)
    try {
        if (call.name === "createProject") {
            const { name, description, status, createdBy } = call.args;

            await db.query(
                `INSERT INTO projects (name, description, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [name, description, status, createdBy]
            );

            return { message: `Project "${name}" created successfully.` };
        }
        if (call.name === "modifyProject") {
            const { projectId, name, description, status } = call.args;

            await db.query(
                `UPDATE projects 
         SET 
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            updated_at = NOW()
         WHERE id = ?`,
                [name, description, status, projectId]
            );

            return { message: `Project ${projectId} updated successfully.` };
        }

        if (call.name === "createTask") {
            // Fix: this used to read "projectName" from args, but the tool's
            // own schema declares "projectId" — every task was being
            // inserted with an undefined project_id.
            const { projectId, title, priority } = call.args;

            await db.query(
                `INSERT INTO tasks (project_id, title, priority, status) VALUES (?, ?, ?, 'Pending', ?)`,
                [projectId, title, priority,]
            );

            return { message: `Task "${title}" created.` };
        }

        if (call.name === "checkProjectStatus") {
            const { projectName } = call.args;

            // Fix: this used to filter tasks.title by the project's name
            // (comparing the wrong column entirely) and would always
            // return zero rows. Now joins through projects properly.
            const [rows]: any = await db.query(
                `SELECT
                        t.title AS task_title,
                        t.status,
                        IFNULL(SUM(tl.hours), 0) AS total_hours_logged
                    FROM tasks t
                    JOIN projects p ON t.project_id = p.id
                    LEFT JOIN timelogs tl ON t.id = tl.task_id
                    WHERE p.name = ?
                    GROUP BY t.id, t.title, t.status;`,
                [projectName]
            );

            const summaryResponse = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: `The user asked about the progress of the project "${projectName}".
Here is the live data from the database: ${JSON.stringify(rows)}.
Summarize completion status, flag anything exceeding its estimate, and write like a professional manager.`,
            });

            const text = summaryResponse.candidates?.[0]?.content?.parts?.[0]?.text;
            return { message: text || `No data found for a project named "${projectName}".` };
        }

        return { message: `I don't know how to handle "${call.name}" yet.` };
    } catch (err: any) {
        console.error(`Tool "${call.name}" failed:`, err);
        return { message: `Something went wrong running "${call.name}": ${err.message}` };
    }
}

export async function handleAgentChat(req: Request, res: Response) {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === "") {
            return res.status(400).json({ status: false, message: "Message cannot be empty." });
        }

        const aiResult = await processAgentMessage(prompt);

        if (aiResult.type === "TOOL_CALLING") {
            const results = await Promise.all(aiResult.calls.map(runToolCall));
            return res.json({
                status: true,
                mode: "AUTOMATED_ACTION",
                messages: results.map((r) => r.message),
            });
        }

        // Fix: previously this branch lived *inside* the TOOL_CALLING check,
        // so a plain conversational reply (no tool triggered) skipped the
        // whole block and the request never sent a response at all.
        return res.json({
            status: true,
            mode: "CONVERSATION",
            answer: aiResult.text,
        });
    } catch (error: any) {
        console.error("Assistant Controller Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
}

export async function handleDashboardInsights(req: Request, res: Response) {
    try {
        const insights = await generateDashboardInsights();
        return res.json({ status: true, insights });
    } catch (error: any) {
        console.error("Dashboard Insights Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
}