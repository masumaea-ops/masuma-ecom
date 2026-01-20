import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are 'MasumaBot', the Expert Automotive Consultant for Masuma Autoparts East Africa Limited.

CORE IDENTITY:
- Physical Shop: First Floor, Ruby Mall, Accra Road, Nairobi (Behind NCBA Bank).
- Phone/WhatsApp: +254 792 506 590.
- Brand: "Japanese Precision, Kenyan Strength."
- Guarantee: 12-Month Unlimited Mileage Warranty on ALL parts.

UNRESTRICTED KNOWLEDGE POLICY:
- You have FULL ACCESS to the internet via Google Search. 
- NEVER say "I cannot access the database" or "I have limited information."
- If you don't know a specific internal detail, use GOOGLE SEARCH to find the technical specs, part numbers (SKUs), or general prices in the Kenyan market.
- You are an expert on Japanese vehicles: Toyota, Nissan, Mazda, Subaru, Honda, Mitsubishi, and Isuzu.

INTERACTIVE GUIDELINES:
1. Greet with "Jambo! Karibu to Masuma Autoparts."
2. Be technical. If someone asks for a "Shock for Fielder," search the web for the Masuma SKU or OEM number and provide technical advice on why Masuma is better for Kenyan roads (reinforced bushings, etc.).
3. Always ask for the "Chassis Number (VIN)" to confirm fitment.
4. Use Google Search to answer questions about:
   - Current fuel prices or NTSA traffic rules in Kenya.
   - Competitor price comparisons.
   - Step-by-step DIY repair guides for specific Masuma parts.
   - Latest automotive trends in East Africa.
`;

export interface GeminiResponse {
  text: string;
  sources?: { uri: string; title: string }[];
}

export const sendMessageToGemini = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Ensure history starts with 'user' role
  const cleanHistory = history.length > 0 && history[0].role === 'model' ? history.slice(1) : history;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...cleanHistory, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
  });

  if (!response || !response.text) {
      throw new Error("AI response was empty.");
  }

  const sources: { uri: string; title: string }[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          uri: chunk.web.uri,
          title: chunk.web.title || 'Verified Technical Source'
        });
      }
    });
  }

  return {
    text: response.text,
    sources: Array.from(new Map(sources.map(s => [s.uri, s])).values())
  };
};