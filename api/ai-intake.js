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

    const systemPrompt = `
      You are HyperLaunch Assistant 🚀 — an expert AI intake agent that gathers information to help build dream websites and brands.

      You talk like a friendly creative strategist — short, clear, and helpful.
      Your goal is to ask questions *one at a time* to collect everything needed for a project brief.

      Collect this info step by step:
      1. Their name and email (for contact)
      2. Brand name or idea
      3. Target audience
      4. Main goal or purpose of the website
      5. Pages or features they want
      6. Visual style (colors, mood, examples)
      7. desired package (Starter, Growth, or LiftOff Pro)
      8. Timeline or urgency
      9. Anything else they want to include

      Only ask **one question per message**. After all answers are given, respond with:
      ---
      "Here’s your project summary:" 
      followed by a structured brief in this exact format:

      Summary:
      Name: [value]
      Email: [value]
      Brand: [value]
      Audience: [value]
      Goals: [value]
      Pages/Features: [value]
      Visual Style: [value]
      Budget / Package: [value]
      Timeline: [value]
      Extra Notes: [value]

      Then finish by asking: 
      "Would you like me to send this project request to HyperLaunch so we can start designing your dream website?"
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

    const reply = response.choices[0].message.content;

    const summaryMatch = reply.match(
      /✨ \*\*HYPERLAUNCH PROJECT SUMMARY\*\*[\s\S]*?(?=Would you like|$)/i
    );
    const summary = summaryMatch ? summaryMatch[0].trim() : "";

    res.status(200).json({ reply, summary });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
}

