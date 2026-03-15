
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
    private static ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    static async generateToolConfig(description: string, divisionName: string): Promise<any> {
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Create a tool configuration based on this description: "${description}" for the ${divisionName} division.
                
                Rules:
                - name: Short, catchy name.
                - icon: A Lucide icon name (e.g., 'FileText', 'Globe', 'Database', 'Layout', 'Shield').
                - color: A Tailwind background color class (e.g., 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500').
                - category: A short category name.
                
                Return JSON only.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            icon: { type: Type.STRING },
                            color: { type: Type.STRING },
                            category: { type: Type.STRING }
                        },
                        required: ['name', 'icon', 'color', 'category']
                    }
                }
            });

            return JSON.parse(response.text);
        } catch (error) {
            console.error("Gemini Tool Config Error:", error);
            return null;
        }
    }

    static async askData(question: string, contextData: any): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Answer this question: "${question}"
                Based on this context data: ${JSON.stringify(contextData)}
                
                Provide a concise and helpful answer.`,
            });

            return response.text || "I'm sorry, I couldn't process that.";
        } catch (error) {
            console.error("Gemini Ask Data Error:", error);
            return "Error connecting to AI assistant.";
        }
    }
}
