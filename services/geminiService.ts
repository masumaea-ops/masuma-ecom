
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../constants";

// Initialize the client
// The API key must be obtained from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are 'MasumaBot', the official digital assistant for Masuma Autoparts East Africa Limited in Nairobi.
Your brand color is Orange (#E0621B). You are helpful, knowledgeable, and concise.

Your capabilities:
1. Search parts by **Masuma Number (SKU)** or **OEM Number**.
2. Advise on part compatibility for common Kenyan cars (Vitz, Demio, Fielder, Forester, Note, etc.).
3. Explain product features (e.g., "Why are ceramic brake pads better for Nairobi traffic?").

Current Product Catalog Context (Use this strictly to answer availability and price):
${PRODUCTS.map(p => `
- Product: ${p.name}
  SKU: ${p.sku}
  OEM: ${p.oemNumbers.join(', ')}
  Price: KES ${p.price}
  Fits: ${p.compatibility.join(', ')}
  Category: ${p.category}
`).join('')}

Rules:
- If a user asks for a part number or OEM number that matches one in the list, confirm we have it, state the price, and mention the car it fits.
- If a user provides an OEM number not in the list, say: "I don't see that specific OEM number in our immediate online catalog, but please contact our Industrial Area warehouse at +254 700 123 456 as we likely have it in stock."
- Always quote prices in KES (Kenyan Shillings).
- Be friendly and professional.
`;

export const sendMessageToGemini = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5, // Lower temperature for more accurate catalog data retrieval
      },
      history: history, 
    });

    const result = await chat.sendMessage({
      message: message
    });

    return result.text || "I'm having trouble accessing the catalog right now. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to connect to the Masuma AI service. Please check your internet connection.");
  }
};
