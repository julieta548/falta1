import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { comments, players } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ ERROR: GEMINI_API_KEY no encontrada.");
      return NextResponse.json({ error: "Falta la GEMINI_API_KEY en .env.local" }, { status: 500 });
    }

    console.log("✅ [DEBUG] API KEY detectada: " + process.env.GEMINI_API_KEY.substring(0, 5) + "...");

    // Usamos gemini-flash-latest que es el modelo con más cuota gratuita
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Actúa como un experto analista de fútbol. 
      Tengo los siguientes comentarios de un partido de fútbol amateur:
      "${comments}"

      La lista oficial de jugadores es: ${players.join(", ")}. 
      USA ESTOS NOMBRES EXACTOS para las llaves "name".

      Analiza el texto y para cada jugador de la lista que sea mencionado (o al que se haga referencia clara), estima:
      1. Puntaje (Rating): Un número del 0 al 100 basado en el rendimiento descrito. 
         (Excelente/Crack: 90-100, Muy bien: 80-89, Bien: 70-79, Regular: 50-69, Mal/Tronco: 0-49).
      2. Goles: Cantidad de goles si se mencionan explícitamente.

      Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
      [
        { "name": "Nombre", "rating": number, "goals": number }
      ]
      No agregues texto adicional ni explicaciones, solo el JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean potential markdown code blocks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    console.log("🤖 AI Response Raw:", jsonStr);
    const stats = JSON.parse(jsonStr);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
