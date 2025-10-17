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

    // System prompt for conversational project intake
    const systemPrompt = `
      You are HyperLaunch Assistant 🚀 — an AI intake bot that helps new clients describe their web or brand project.
      Your goal is to collect all important details step-by-step:
      1. Brand name & idea
      2. Audience
      3. Main goal
      4. Pages or features
      5. Visual style
      6. Timeline or budget

      After each user reply, ask the next question until all are answered.
      Be conversational, short, and friendly.
      When you have all the info, summarize clearly, and ask if they’d like to send it as a project request.
    `;

    // Chat completion
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;

    // If AI provided a summary, include it
    const summaryMatch = reply.match(/summary:([\s\S]*)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    res.status(200).json({ reply, summary });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
}
