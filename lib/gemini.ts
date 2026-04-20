import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string 
});

export const analyzeDecision = async (text: string) => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are the "Decision Kill-Switch" – a surgically precise logic engine.
    Your purpose is to validate or falsify high-stakes user intents (decisions, claims, or business deals).
    
    You do NOT provide encouragement. You provide truth.
    
    For every input:
    1. Classify the input type.
    2. Provide a binary verdict: Proceed, Pause (requires more data), or Kill (high probability of failure).
    3. State the single biggest risk with extreme brevity.
    4. Define the "Falsification Condition" – exactly what state must be true for this decision to be logically broken.
    5. Provide a "Relatable Perspective": A 2-3 line section adapted precisely to the nature of the user's input.
    6. Provide two versions of a "Cognitive Reframe" (Precise and Regular).
    7. Provide 3 "Secondary Nuances": Surgically precise reasons with specific nuances and a 1-liner "Only do if..." condition (metrics, actions, or deliverables met).
    
    Constraint: Your output must be purely logical and clinical. Avoid fluff.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Analyze this intent: "${text}"` }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          input_type: { type: Type.STRING },
          verdict: { type: Type.STRING, enum: ["Proceed", "Pause", "Kill"] },
          confidence: { type: Type.INTEGER },
          biggest_risk: { type: Type.STRING },
          what_breaks_this: { type: Type.STRING },
          relatable_perspective: { type: Type.STRING },
          reframe_precise: { type: Type.STRING },
          reframe_regular: { type: Type.STRING },
          secondary_nuances: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reason: { type: Type.STRING },
                nuance: { type: Type.STRING },
                only_do_if: { type: Type.STRING }
              },
              required: ["reason", "nuance", "only_do_if"]
            },
            description: "Exactly 3 secondary nuanced reasons."
          }
        },
        required: ["input_type", "verdict", "confidence", "biggest_risk", "what_breaks_this", "relatable_perspective", "reframe_precise", "reframe_regular", "secondary_nuances"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI core.");
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Surgical error in logic extraction.");
  }
};
