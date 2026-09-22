import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../configs/db';
import { ai } from '../app';

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
                estimatedHours: {
                    type: Type.NUMBER,
                    description: "Estimated hours to complete the task.",
                },
            },
            required: ["projectId", "title", "priority", "estimatedHours"],
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
        const [projectsRows]: any = await db.query("SELECT id, name FROM projects");
        const projectContext = JSON.stringify(projectsRows);

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `
            You are an AI assistant inside DevFlow, a project and task tracking tool.
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
        const rawText =
            candidate?.content?.parts?.[0]?.text || "I processed that, but have nothing more to add.";

        return { type: "TEXT_RESPONSE", text: rawText };
    } catch (error) {
        console.error("AI Agent Error:", error);
        throw error;
    }
}
