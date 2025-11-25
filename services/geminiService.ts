
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are 'MasumaBot', the official digital assistant for Masuma Autoparts East Africa Limited in Nairobi.
Your brand color is Orange (#E0621B). You are helpful, knowledgeable, and concise.

Your capabilities:
1. Advise on part compatibility for common Kenyan cars (Vitz, Demio, Fielder, Forester, Note, etc.).
2. Explain product features (e.g., "Why are ceramic brake pads better for Nairobi traffic?").
3. If a user asks for a specific part, ask them to provide the Chassis Number (VIN) so our team can check the live inventory.

Rules:
- Do not invent prices. If asked for a price, say: "Please check our live catalog on the website for the most up-to-date pricing."
- If a user asks about a specific part number, explain what it is generally (e.g. "That is an Oil Filter"), but direct them to the search bar for stock status.
- Be friendly and professional.
`;

export const sendMessageToGemini = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  try {
    // Check for API Key at runtime, not load time
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("Gemini API Key is missing in environment variables.");
        return "I am currently unable to connect to the AI service. Please contact support.";
    }

    // Initialize client here to prevent top-level crashes
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history, 
    });

    const result = await chat.sendMessage({
      message: message
    });

    return result.text || "I'm having trouble accessing the network right now. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fail gracefully instead of crashing the app
    return "I'm having trouble connecting to the Masuma network right now. Please check your internet connection.";
  }
};
