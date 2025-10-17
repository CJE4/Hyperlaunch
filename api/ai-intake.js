// /api/ai-intake.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message = "", history = [] } = req.body || {};

    // --- Conversational step-by-step prompt ---
    const systemPrompt = `
      You are HyperLaunch Assistant 🚀 — an AI intake bot that helps new clients describe their web or brand project.

      You must act like a friendly conversation partner who asks *one question at a time*.
      Your goal is to collect all essential info step-by-step:
      1. Brand name & idea
      2. Target audience
      3. Main goal or purpose
      4. Pages or features desired
      5. Visual style or mood
      6. Timeline or budget expectations

      Rules:
      - Ask the next question only after the user answers the previous one.
      - Once you have all the info, write a short clear summary beginning with “Here’s a summary of your project:” 
      - Then ask: “Would you like me to send this as a project request?”
      - Keep it friendly, concise, and human.
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = response.choices?.[0]?.message?.content || "";

    // Try to extract a summary section, if any
    const summaryMatch = reply.match(/here.?s a summary([\s\S]*)/i);
    const summary = summaryMatch ? summaryMatch[0].trim() : "";

    res.status(200).json({ reply, summary });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
}
