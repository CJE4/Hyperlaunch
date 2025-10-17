import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// A list of intake questions for structured one-by-one AI chat
const intakeQuestions = [
  "What’s your brand or project name?",
  "Who’s your target audience?",
  "What’s your main goal for this website or launch?",
  "What pages or features would you like? (e.g., Home, About, Shop)",
  "Do you have a specific visual style or colors in mind?",
  "What’s your ideal timeline or budget range?",
];

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { message, history = [] } = body;

    const messages = [
      {
        role: "system",
        content: `
          You are HyperLaunch Assistant 🚀 — a friendly and structured intake AI.
          You help users describe their project step-by-step.
          Ask **one question at a time** from this sequence:
          ${intakeQuestions.join(", ")}.
          When you’ve asked all questions and gathered enough info,
          create a friendly summary of everything you learned.
          Then ask:
          "Would you like me to send this to HyperLaunch as your contact request?"
          If they say yes, respond with:
          "✅ Got it! I’ll send this to the team right away."
        `,
      },
      ...history,
      { role: "user", content: message },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
    });

    const reply = response.choices[0].message.content;

    // Try to detect if AI produced a final summary
    const isSummary = reply.toLowerCase().includes("would you like me to send this");

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply,
        isSummary,
      }),
    };
  } catch (err) {
    console.error("AI error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI request failed" }),
    };
  }
};
