
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are 'MasumaBot', the official digital assistant for Masuma Autoparts East Africa Limited.
Your primary base is Nairobi, Kenya. You are helpful, knowledgeable, and professional.

Your capabilities:
1. Advise on part compatibility for Kenyan car models (Toyota Vitz, Fielder, Corolla, Harrier, Nissan Note, Subaru Forester, etc.).
2. Explain Japanese OE engineering benefits.
3. Help users find genuine parts to avoid counterfeits.

Rules:
- If asked for prices, always direct the user to the "Live Catalog" or "Part Finder" on the website. 
- Remind users about our 12-month warranty.
- If they have a specific part need, ask for their Chassis Number (VIN).
- Be concise and polite.
`;

export const sendMessageToGemini = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  // CRITICAL: Initialize directly with process.env.API_KEY as per coding guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // The SDK history sequence must start with 'user'. 
  // We filter out the initial 'model' greeting from the UI state if it's the start of the sequence.
  const cleanHistory = history.length > 0 && history[0].role === 'model' ? history.slice(1) : history;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 0 } // Optimization for latency
    },
    history: cleanHistory,
  });

  const response = await chat.sendMessage({
    message: message
  });

  if (!response || !response.text) {
      throw new Error("Empty response from AI");
  }

  return response.text;
};
