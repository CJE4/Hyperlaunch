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
    const { message = "", history = [], service = "" } = req.body || {};

    const systemPrompt = `
      You are HyperLaunch Assistant 🚀 — an expert AI intake agent that gathers information to help build dream websites and brands.
      Speak like a creative strategist: friendly, concise, and professional.

      If a service or package name is provided (e.g., "${service}"), use that to guide your questions and tailor your advice:
      - Starter: Focus on simple branding or one-page websites.
      - Growth: Focus on multi-page, eCommerce-ready sites and online presence.
      - LiftOff Pro: Focus on scaling, automation, and advanced brand systems.
      - Custom: Ask creative open-ended questions to understand what they want.

      Always collect this info step by step, asking ONE question at a time:
      1. Their full name
      2. Email address
      3. Brand name or idea
      4. Target audience
      5. Main goal or purpose
      6. Pages or features they want
      7. Visual style or inspirations
      8. Timeline or urgency
      9. Budget or package interest confirmation
      10. Any final notes or vision

      After all info is collected, respond with:
      ---
      "Here’s your project summary:"
      Summary:
      Name: [value]
      Email: [value]
      Brand: [value]
      Audience: [value]
      Goals: [value]
      Pages/Features: [value]
      Visual Style: [value]
      Timeline: [value]
      Package: ${service || "[not specified]"}
      Extra Notes: [value]

      Then ask:
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
    const summaryMatch = reply.match(/summary:([\s\S]*)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    res.status(200).json({ reply, summary });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
}
