import { Request, Response } from 'express';
import { callLLM } from "../services/ai.service";
import { processHRMSAgentMessage } from '../tool-services/agent.services';
import { db } from '../configs/db';
import { ai } from '../app';

export async function chatLLM(req: Request, res: Response) {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === "") {
            return res.status(400).json({ status: false, message: "Prompt cannot be empty" });
        }

        const rawStringAnswer = await callLLM(prompt);

        const parsedArray = JSON.parse(rawStringAnswer);

        return res.json({
            status: true,
            answer: parsedArray
        });

    } catch (error: any) {
        console.error("Controller Execution Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

export async function handleHRMSChat(req: Request, res: Response) {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === "") {
            return res.status(400).json({ status: false, message: "Message prompt cannot be empty." });
        }

        const aiResult = await processHRMSAgentMessage(prompt);

        // Check if Tool Execution was triggered

        if (aiResult.type === "TOOL_CALLING") {

            // ─── CONDITION A: Handle Task Creation (Existing Logic) ───
            if (aiResult.name === "createTaskInDatabase") {
                const { projectName, title, priority, estimatedHours } = aiResult.args;
                await db.query(
                    `INSERT INTO tasks (project_id, title, priority, status, estimated_hours) VALUES (?, ?, ?, 'Pending', ?)`,
                    [projectName, title, priority, estimatedHours]
                );
                return res.json({ status: true, mode: "AUTOMATED_ACTION", message: `Task "${title}" created successfully!` });
            }

            // ─── CONDITION B: Handle Project Progress Lookup (New RAG Logic) ───
            if (aiResult.name === "checkProjectInfo") {
                const { projectName } = aiResult.args;

                // Write your core MySQL join query to get task statuses and logged hours
                const [reportRows]: any = await db.query(
                    `SELECT t.title as task_title, t.status, t.estimated_hours,
                    IFNULL(SUM(tl.hours_spent), 0) as total_hours_logged
             FROM tasks t
             LEFT JOIN timelogs tl ON t.id = tl.task_id
             WHERE t.title = ?
             GROUP BY t.id`,
                    [projectName]
                );

                // Turn the raw database rows into a string format for Gemini
                const databasePayload = JSON.stringify(reportRows);

                // Call Gemini a second time, passing the real database results to summarize it natively
                const summaryResponse = await ai.models.generateContent({
                    model: "gemini-3.6-flash",
                    contents: `The user asked about the progress of project ID ${projectName}. 
            Here is the live data pulled from the MySQL tables: ${databasePayload}. 
            Summarize the project completion status, flag any tasks exceeding estimates, and speak like a professional manager.`
                });

                const finalReportText = summaryResponse.candidates?.[0]?.content?.parts?.[0]?.text;

                return res.json({
                    status: true,
                    mode: "PROJECT_REPORT",
                    answer: finalReportText // Clean text response for React UI
                });
            }

            // Otherwise return standard conversational answer (or RAG answer)
            return res.json({
                status: true,
                mode: "CONVERSATION",
                answer: aiResult.text
            });
        }
    } catch (error: any) {
        console.error("Controller Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
}