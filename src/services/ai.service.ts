import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../configs/db";
import { ai } from "../app";

const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY environment variable in .env file.");
    }
    
    return ai;
};


async function callLLM(prompt: string) {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Extract the tasks, assigned users, and deadlines from this text: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            top_suggestions: {
                                type: Type.STRING,
                                description: "Primary recommendation for the user query."
                            },
                            best_pathways_in_short: {
                                type: Type.STRING,
                                description: "A bulleted short summary of the steps to take."
                            },
                            real_value_in_market: {
                                type: Type.STRING,
                                description: "An evaluation of how valuable this skill/choice is in the current job market."
                            }
                        },
                        // 2. Now you can safely list them as required because they match perfectly!
                        required: [
                            "top_suggestions",
                            "best_pathways_in_short",
                            "real_value_in_market"
                        ],
                    },
                },
            },
        });

        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];
        const rawText = part?.text;

        console.log("Extracted Raw String directly from parts:", rawText);

        if (!rawText) {
            return "[]";
        }

        return rawText;

    } catch (error: any) {
        console.error("Gemini Error:", error);
        throw error;
    }
}

async function analyzeTicketLLM(ticket: string) {
    try {
        const res = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "dev-flow",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
                        {
                            role: "user",
                            content: `Analyze this support ticket: ${ticket}`,
                        },
                    ],

                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "ticket_analysis",
                            strict: true,
                            schema: {
                                type: "object",
                                properties: {
                                    category: {
                                        type: "string",
                                    },
                                    priority: {
                                        type: "string",
                                        enum: ["low", "medium", "high"],
                                    },
                                    summary: {
                                        type: "string",
                                    },
                                    possible_causes: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                        },
                                    },
                                    suggested_action: {
                                        type: "string",
                                    },
                                },
                                required: [
                                    "category",
                                    "priority",
                                    "summary",
                                    "possible_causes",
                                    "suggested_action",
                                ],
                                additionalProperties: false,
                            },
                        },
                    },
                }),
            }
        );

        const data = await res.json();

        const content = data.choices[0].message.content;

        const analysis = JSON.parse(content);

        return analysis;

    } catch (err: any) {
        throw new Error(err.message);
    }
}


export {
    callLLM,
    analyzeTicketLLM,
}