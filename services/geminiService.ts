
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AI_MODEL_NAME, AI_PROMPT_TEMPLATE } from '../constants';
import { AIRankedTask, TaskInputItem } from '../types';

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY && typeof process.env.API_KEY === 'string' && process.env.API_KEY.length > 0) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("Gemini API Key (process.env.API_KEY) is not set or is invalid. AI features will not work.");
}

export const getTaskImportance = async (tasks: TaskInputItem[]): Promise<AIRankedTask[]> => {
  if (!ai) {
    throw new Error("API Key not configured or invalid. Cannot assess task importance.");
  }
  if (tasks.length === 0) {
    return [];
  }

  try {
    // Include dueDate in the JSON sent to the AI
    const tasksJsonArray = JSON.stringify(tasks.map(t => ({id: t.id, text: t.text, dueDate: t.dueDate})));
    const prompt = AI_PROMPT_TEMPLATE.replace("{TASKS_JSON_ARRAY}", tasksJsonArray);
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4, 
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) { 
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    if (!Array.isArray(parsedData)) {
        throw new Error("Invalid JSON response format from AI. Expected a JSON array.");
    }

    const rankedTasks: AIRankedTask[] = [];
    const receivedIds = new Set<string>();
    const receivedRanks = new Set<number>();

    for (const item of parsedData) {
        if (typeof item.id !== 'string' || typeof item.rank !== 'number' || typeof item.justification !== 'string') {
            console.warn("Invalid item in AI response array:", item);
            throw new Error("Invalid item format in AI response array. Expected 'id' (string), 'rank' (number), and 'justification' (string).");
        }
        if (item.rank < 1 || item.rank > tasks.length) {
             throw new Error(`AI returned an invalid rank: ${item.rank}. Rank must be between 1 and ${tasks.length}.`);
        }
        if(receivedRanks.has(item.rank)){
            throw new Error(`AI returned duplicate rank: ${item.rank}. Each rank must be unique.`);
        }
        if(receivedIds.has(item.id)){
             throw new Error(`AI returned duplicate task ID: ${item.id}. Each task ID must be unique in the response.`);
        }
        
        rankedTasks.push({ id: item.id, rank: Math.round(item.rank), justification: item.justification });
        receivedIds.add(item.id);
        receivedRanks.add(item.rank);
    }

    if (receivedIds.size !== tasks.length) {
        throw new Error(`AI response did not include all task IDs. Expected ${tasks.length}, got ${receivedIds.size}.`);
    }
    for (let i = 1; i <= tasks.length; i++) {
        if (!receivedRanks.has(i)) {
            throw new Error(`AI response is missing rank ${i}. All ranks from 1 to ${tasks.length} must be present.`);
        }
    }

    return rankedTasks;

  } catch (error) {
    console.error("Error fetching task importance from AI:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("AI API Error: Invalid API Key. Please check your configuration.");
        }
        throw new Error(`AI API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching task importance.");
  }
};