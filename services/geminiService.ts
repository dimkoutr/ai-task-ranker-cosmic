
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIRankedTask, TaskInputItem } from '../types';
import { AI_MODEL_NAME, AI_PROMPT_TEMPLATE } from '../constants';

const getCurrentDateYYYYMMDD = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTaskImportance = async (tasks: TaskInputItem[]): Promise<AIRankedTask[]> => {
  if (tasks.length === 0) {
    return [];
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0 || apiKey === "MISSING_API_KEY_IN_BUILD") {
    console.error("[geminiService] CRITICAL: API_KEY is not configured or is a placeholder. Ensure it's set in the build environment.");
    // User-facing error should be generic as per guidelines
    throw new Error("AI features are temporarily unavailable. Please check configuration or contact support. (API Key Issue)");
  }

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("[geminiService] Failed to initialize GoogleGenAI:", error);
    throw new Error("Failed to initialize AI client.");
  }

  try {
    const tasksJsonArray = JSON.stringify(tasks.map(t => ({id: t.id, text: t.text, dueDate: t.dueDate})));
    const currentDate = getCurrentDateYYYYMMDD();
    const promptWithDate = AI_PROMPT_TEMPLATE.replace(/{CURRENT_DATE_YYYY_MM_DD}/g, currentDate);
    const prompt = promptWithDate.replace("{TASKS_JSON_ARRAY}", tasksJsonArray);
    

    const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, // Slightly reduced temperature for more deterministic output following stricter rules
        topK: 32,
        topP: 0.9,
        thinkingConfig: { thinkingBudget: 0 } // For lower latency
      },
    });

    const textResponse = genAIResponse.text;
    if (!textResponse || textResponse.trim() === "") {
        console.error("[geminiService] Gemini API returned an empty text response.");
        throw new Error("AI returned an empty or malformed response. Please try again.");
    }

    let jsonStr = textResponse.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    let parsedData;
    try {
        parsedData = JSON.parse(jsonStr);
    } catch (parseError: any) {
        console.error("[geminiService] Failed to parse AI response as JSON. Raw response:", jsonStr, "Error:", parseError.message);
        throw new Error(`AI response was not valid JSON: ${parseError.message}. Raw output: ${jsonStr.substring(0,100)}...`);
    }

    if (!Array.isArray(parsedData)) {
        console.error("[geminiService] Invalid JSON response format from AI. Expected a JSON array. Got:", typeof parsedData, JSON.stringify(parsedData).substring(0,100));
        throw new Error("Invalid AI response format: Expected a JSON array of ranked tasks.");
    }

    // --- Response Validation ---
    const rankedTasks: AIRankedTask[] = [];
    const receivedIds = new Set<string>();
    const receivedRanks = new Set<number>();
    const originalTaskIds = new Set(tasks.map(t => t.id));

    for (const item of parsedData) {
        if (typeof item !== 'object' || item === null) {
            console.warn("[geminiService] Invalid item type in AI response array (expected object):", item);
            throw new Error("Invalid item format in AI response array: item is not an object.");
        }
        if (typeof item.id !== 'string' || typeof item.rank !== 'number' || typeof item.justification !== 'string') {
            console.warn("[geminiService] Invalid item structure in AI response array:", item);
            throw new Error("Invalid item format in AI response. Each item must have 'id' (string), 'rank' (number), and 'justification' (string).");
        }
        if (!originalTaskIds.has(item.id)) {
             console.error(`[geminiService] AI returned an unknown task ID: ${item.id}.`);
             throw new Error(`AI returned an unknown task ID: ${item.id}. Ensure the AI only ranks provided tasks.`);
        }
        if (item.rank < 1 || item.rank > tasks.length || !Number.isInteger(item.rank)) {
             console.error(`[geminiService] AI returned an invalid rank: ${item.rank} for task ${item.id}. Rank must be an integer between 1 and ${tasks.length}.`);
             throw new Error(`AI returned an invalid rank: ${item.rank} for task ${item.id}. Rank must be an integer between 1 and ${tasks.length}.`);
        }
        if(receivedRanks.has(item.rank)){
            console.error(`[geminiService] AI returned duplicate rank: ${item.rank}. Each rank must be unique.`);
            throw new Error(`AI returned duplicate rank: ${item.rank}. Each rank must be unique.`);
        }
        if(receivedIds.has(item.id)){
             console.error(`[geminiService] AI returned duplicate task ID: ${item.id}. Each task ID must be unique in the response.`);
             throw new Error(`AI returned duplicate task ID: ${item.id}. Each task ID must be unique in the response.`);
        }
        
        rankedTasks.push({ id: item.id, rank: item.rank, justification: item.justification });
        receivedIds.add(item.id);
        receivedRanks.add(item.rank);
    }

    if (receivedIds.size !== tasks.length) {
        const missingIds = tasks.filter(t => !receivedIds.has(t.id)).map(t=> t.id);
        console.error(`[geminiService] AI response did not include all task IDs. Expected ${tasks.length}, got ${receivedIds.size}. Missing: ${missingIds.join(', ')}`);
        throw new Error(`AI response did not include all task IDs. Missing ranks for: ${missingIds.join(', ')}`);
    }
    for (let i = 1; i <= tasks.length; i++) {
        if (!receivedRanks.has(i)) {
            console.error(`[geminiService] AI response is missing rank ${i}. All ranks from 1 to ${tasks.length} must be present.`);
            throw new Error(`AI response is missing rank ${i}. All ranks from 1 to ${tasks.length} must be present and unique.`);
        }
    }
    // --- End of Response Validation ---

    return rankedTasks;

  } catch (error: any) {
    console.error('[geminiService] Error processing request:', error);
    const errorMessage = error.message || 'An unknown error occurred while ranking tasks.';
     if (error.message && error.message.includes("API Key not valid")) {
      throw new Error("AI features are temporarily unavailable. Please contact support or try again later. (Auth Issue)");
    }
    throw new Error(`AI Ranking Error: ${errorMessage}`);
  }
};

export const isApiConfigured = (): boolean => {
  const apiKey = process.env.API_KEY;
  // Check if it's a string, not empty, and not the placeholder injected by build if missing
  return typeof apiKey === 'string' && apiKey.length > 0 && apiKey !== "MISSING_API_KEY_IN_BUILD";
};
