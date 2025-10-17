// netlify/functions/ai-intake.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const message = body.message || "";
    const history = body.history || [];
    const service = body.service || "";
    const project = body.project || "";
    const name = body.name || "";
    const email = body.email || "";

    // System role: friendly intake assistant
    const systemPrompt = `
You are HyperLaunch Assistant 🚀 — a friendly AI intake bot that helps new clients describe their project.
Ask thoughtful, short questions about:
1. Brand name or idea
2. Target audience
3. Project goals or challenges
4. Pages/features they want (e.g., Home, Shop, Contact)
5. Design preferences (colors, tone, vibe)
6. Timeline or urgency

If you already have enough info, summarize the full project in 3–6 sentences clearly for the business owner.
Keep a helpful, upbeat tone.
Return structured data like:
{
  "reply": "...",
  "summary": "..."
}
    `;

    // Chat with OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.8,
    });

    const reply = response.choices[0].message.content || "";

    // Optional: ask the model for a project summary once there’s enough info
    let summary = "";
    if (history.length > 4) {
      const summaryResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Summarize the user’s project idea, goals, and key details for the team in 3–6 sentences." },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.5,
      });
      summary = summaryResponse.choices[0].message.content || "";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply,
        summary,
      }),
    };
  } catch (err) {
    console.error("AI intake error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI request failed" }),
    };
  }
};
