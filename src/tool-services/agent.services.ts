import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../configs/db';
import { ai } from '../app';

interface DashboardInsight {
    title: string;
    detail: string;
    severity: "info" | "warning" | "critical";
    metric?: string; // e.g. "3 tasks", "42%"
}

interface TaskStatusCount {
    status: string;
    count: number;
}

interface HoursByDay {
    day: string; // "2026-09-20"
    hours: number;
}

interface WorkloadRow {
    name: string;
    hours: number;
}

interface DashboardStats {
    taskStatus: TaskStatusCount[];
    hoursByDay: HoursByDay[];
    projectStatus: TaskStatusCount[];
    workload: WorkloadRow[];
    overdueCount: number;
    totalTasks: number;
    totalHours: number;
    activeProjects: number;
}

export async function processHRMSAgentMessage(userMessage: string): Promise<any> {
    try {
        console.log("Checking environment variables inside execution loop...");
        console.log("GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);

        // ─── 1. RAG LAYER (Retrieval-Augmented Generation) ───
        // Fetch active projects from XAMPP MySQL so the AI knows what IDs map to what names
        const [projectsRows]: any = await db.query("SELECT id, name FROM projects");
        const projectContext = JSON.stringify(projectsRows);

        // ─── 2. AI CONFIGURATION WITH TOOLS ───
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `
            You are an AI Operational Assistant inside an HRMS portal. 
            You have access to current company records via the provided Context block.
            Today's date is Monday, Sep 14, 2026.

            [COMPANY CONTEXT]:
            Available Projects: ${projectContext}

            [USER MESSAGE]:
            "${userMessage}"
            `,
            config: {
                // Registering the tool Gemini can decide to execute
                tools: [{
                    functionDeclarations: [
                        {
                            name: "createTaskInDatabase",
                            description: "Triggers ONLY when the user asks to schedule, add, assign, or create a task for a project.",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    projectId: { type: Type.INTEGER, description: "The internal database ID of the project from the Context list." },
                                    title: { type: Type.STRING, description: "The core task action item." },
                                    priority: { type: Type.STRING, description: "Must be exactly: High, Medium, or Low" },
                                    estimatedHours: { type: Type.NUMBER, description: "Estimated hours to finish." }
                                },
                                required: ["projectId", "title", "priority", "estimatedHours"]
                            }
                        },
                        {
                            name: "checkProjectInfo",
                            description: 'Give info about a specific project about its status, workdone, deadline or timelimit etc.',
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    // projectId: { type: Type.INTEGER, description: 'The internal databse ID or name of the project from the context'},
                                    projectName: { type: Type.STRING, description: 'The title of the project in the database' },
                                },
                                required: ['projectName']
                            }
                        }
                    ]
                }]
            }
        });

        // ─── 3. RESOLVING DYNAMIC BEHAVIOUR ───
        const functionCalls = response.functionCalls;

        // If Gemini decides to execute the tool
        if (functionCalls && functionCalls.length > 0) {
            const toolCall = functionCalls[0];
            return {
                type: "TOOL_CALLING",
                name: toolCall.name,
                args: toolCall.args
            };
        }

        // Standard response (Conversational or RAG breakdown answer)
        const candidate = response.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text || "I processed that request successfully.";

        return {
            type: "TEXT_RESPONSE",
            text: rawText
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
}




// One entry per action the assistant is allowed to trigger. Gemini reads
// these descriptions and decides which one (if any) fits the user's
// message — it never runs anything itself, it only ever proposes a call.
const TOOLS = [
    {
        name: "createTask",
        description:
            "Creates a new task under a project. Triggers when the user asks to add, schedule, or assign a task.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: {
                    type: Type.INTEGER,
                    description: "The internal database ID of the project, from the Context list below.",
                },
                title: {
                    type: Type.STRING,
                    description: "The task's title.",
                },
                priority: {
                    type: Type.STRING,
                    description: "Must be exactly: High, Medium, or Low.",
                },
                // estimatedHours: {
                //     type: Type.NUMBER,
                //     description: "Estimated hours to complete the task.",
                // },
            },
            required: ["projectId", "title", "priority"],
        },
    },
    {
        name: "modifyProject",
        description:
            "Updates an existing project in the HRMS system. Triggers when the user asks to edit, change, or update project details.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: {
                    type: Type.INTEGER,
                    description: "The internal database ID of the project to update.",
                },
                name: {
                    type: Type.STRING,
                    description: "The new project name (optional).",
                },
                description: {
                    type: Type.STRING,
                    description: "The new project description (optional).",
                },
                status: {
                    type: Type.STRING,
                    description: "The new status of the project. Must be one of: Active, On Hold, Completed.",
                },
            },
            required: ["projectId"],
        },
    },
    {
        name: "createProject",
        description:
            "Creates a new project in the HRMS system. Triggers when the user asks to start, initiate, or register a project.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: {
                    type: Type.STRING,
                    description: "The project's name or title.",
                },
                description: {
                    type: Type.STRING,
                    description: "A short description of the project.",
                },
                status: {
                    type: Type.STRING,
                    description: "The current status of the project. Must be one of: Active, On Hold, Completed.",
                },
                createdBy: {
                    type: Type.INTEGER,
                    description: "The internal database ID of the user creating the project.",
                },
            },
            required: ["name", "description", "status", "createdBy"],
        },
    },
    {
        name: "checkProjectStatus",
        description:
            "Reports on a project's progress — its tasks, their status, and hours logged against them.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectName: {
                    type: Type.STRING,
                    description: "The project's name, from the Context list below.",
                },
            },
            required: ["projectName"],
        },
    },
];

export async function processAgentMessage(userMessage: string): Promise<any> {
    try {
        // ─── RAG: give the model real project names/IDs before it answers ───
        const [projectsRows]: any = await db.query(`
            SELECT
                p.id,
                p.name,
                p.description,
                p.status,
                p.created_by,
                u.name AS created_by_name
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
        `);
        const projectContext = JSON.stringify(projectsRows);

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `
            You are an AI assistant inside project-management, a project and task tracking tool.
            You have access to the user's current projects via the Context block below.

            [CONTEXT]
            Available projects: ${projectContext}

            [USER MESSAGE]
            "${userMessage}"
            `,
            config: {
                tools: [{ functionDeclarations: TOOLS as any }],
            },
        });
        console.log('1 step respone ^&&$%&*%^$&%%#^%&%#^&^*&%#%%&$', response)
        const functionCalls = response.functionCalls;

        // Fix: previously only functionCalls[0] was ever used, so if Gemini
        // decided to create more than one task in a single message, every
        // call after the first was silently dropped. Now all of them come
        // back and the controller runs each one.
        if (functionCalls && functionCalls.length > 0) {
            return {
                type: "TOOL_CALLING",
                calls: functionCalls.map((call) => ({ name: call.name, args: call.args })),
            };
        }

        const candidate = response.candidates?.[0];
        console.log('2 step candidate ^&&$%&*%^$&%%#^%&%#^&^*&%#%%&$', candidate)
        const rawText =
            candidate?.content?.parts?.[0]?.text || "I processed that, but have nothing more to add.";

        return { type: "TEXT_RESPONSE", text: rawText };
    } catch (error) {
        console.error("AI Agent Error:", error);
        throw error;
    }
}

export async function generateDashboardInsights(): Promise<DashboardInsight[]> {
    // 1. Pull aggregates, not raw rows — this keeps the prompt small and cheap
    const [[projectStats]]: any = await db.query(`
        SELECT status, COUNT(*) AS count FROM projects GROUP BY status
    `);
    const [overdueTasks]: any = await db.query(`
        SELECT t.title, p.name AS project_name, t.priority
        FROM tasks t JOIN projects p ON t.project_id = p.id
        WHERE t.status != 'Completed' AND t.due_date < NOW()
    `);
    const [hoursTrend]: any = await db.query(`
        SELECT DATE(log_date) AS day, SUM(hours) AS hours
        FROM timelogs
        WHERE log_date >= NOW() - INTERVAL 14 DAY
        GROUP BY day ORDER BY day
    `);

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `
        You analyze project management data and surface the most useful insights
        for a manager glancing at a dashboard.

        [PROJECT STATUS COUNTS]
        ${JSON.stringify(projectStats)}

        [OVERDUE TASKS]
        ${JSON.stringify(overdueTasks)}

        [HOURS LOGGED, LAST 14 DAYS]
        ${JSON.stringify(hoursTrend)}

        Return 3-6 insights. Prioritize anything that needs attention
        (overdue work, stalled projects, unusual drops in logged hours)
        over routine good news.
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        detail: { type: Type.STRING },
                        severity: { type: Type.STRING, description: "info, warning, or critical" },
                        metric: { type: Type.STRING },
                    },
                    required: ["title", "detail", "severity"],
                },
            },
        },
    });

    return JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
}


async function getDashboardStats(): Promise<DashboardStats> {
    const [taskStatusRows]: any = await db.query(`
        SELECT status, COUNT(*) AS count
        FROM tasks
        GROUP BY status
    `);

    const [hoursByDayRows]: any = await db.query(`
        SELECT DATE(log_date) AS day, COALESCE(SUM(hours), 0) AS hours
        FROM timelogs
        WHERE log_date >= NOW() - INTERVAL 14 DAY
        GROUP BY day
        ORDER BY day
    `);

    const [projectStatusRows]: any = await db.query(`
        SELECT status, COUNT(*) AS count
        FROM projects
        GROUP BY status
    `);

    // Who logged the most hours in the last 14 days — a lightweight workload view.
    const [workloadRows]: any = await db.query(`
        SELECT u.name, COALESCE(SUM(tl.hours), 0) AS hours
        FROM users u
        LEFT JOIN timelogs tl ON tl.user_id = u.id AND tl.log_date >= NOW() - INTERVAL 14 DAY
        GROUP BY u.id, u.name
        ORDER BY hours DESC
        LIMIT 6
    `);

    const [[overdueRow]]: any = await db.query(`
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE status != 'Completed' AND due_date < NOW()
    `);

    const [[totalsRow]]: any = await db.query(`
        SELECT
            (SELECT COUNT(*) FROM tasks) AS total_tasks,
            (SELECT COALESCE(SUM(hours), 0) FROM timelogs) AS total_hours,
            (SELECT COUNT(*) FROM projects WHERE status = 'Active') AS active_projects
    `);

    return {
        taskStatus: taskStatusRows,
        hoursByDay: hoursByDayRows.map((r: any) => ({ day: r.day, hours: Number(r.hours) })),
        projectStatus: projectStatusRows,
        workload: workloadRows.map((r: any) => ({ name: r.name, hours: Number(r.hours) })),
        overdueCount: overdueRow?.count ?? 0,
        totalTasks: totalsRow?.total_tasks ?? 0,
        totalHours: Number(totalsRow?.total_hours ?? 0),
        activeProjects: totalsRow?.active_projects ?? 0,
    };
}

export async function handleDashboardStats() {
    try {
        const stats = await getDashboardStats();
        return stats;
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        throw error;
    }
}

