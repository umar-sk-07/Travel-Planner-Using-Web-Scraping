import { StreamingTextResponse, GoogleGenerativeAIStream } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Parse the request body to get the prompt
    const { prompt } = await req.json();
    console.log("Received request body:", { prompt });

    // Ensure the prompt is provided
    if (!prompt) {
      throw new Error("Prompt is required.");
    }

    // Initialize Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY!);

    // Set the model parameters
    const modelParams = { model: "gemini-pro" }; // Use the desired model
    const model = genAI.getGenerativeModel(modelParams);

    // Prepare the content for the request
    const content = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    // Generate content stream
    const streamingResponse = await model.generateContentStream(content);

    // Return the streaming response
    return new StreamingTextResponse(GoogleGenerativeAIStream(streamingResponse));

  } catch (error) {
    console.error("Error generating AI response:", error);
    return new Response(JSON.stringify({ error: "Failed to generate AI response" }), { status: 500 });
  }
}