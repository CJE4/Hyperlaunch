import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const message = body.message || "";
    const history = body.history || [];

    // System prompt: make the bot a structured intake assistant
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
      Once all details are collected, summarize everything clearly for the user.
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

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("AI error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI request failed" }),
    };
  }
};
