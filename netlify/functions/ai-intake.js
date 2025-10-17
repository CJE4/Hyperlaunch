import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");

    const userInput =
      body.message ||
      `Service: ${body.service || "N/A"} | Project: ${body.project || "N/A"} | Name: ${body.name || "N/A"} | Email: ${body.email || "N/A"}`;

    const prompt = `
You are the HyperLaunch intake assistant. The following text is from a potential client inquiry:
---
${userInput}
---
Summarize the most important information for a web design project:
- Business or brand name
- Goals or vision
- Target audience
- Timeline or urgency
- Requested features or services

Then, list 2–3 clear follow-up questions to help gather anything missing.

Respond **only** in JSON, in this format:
{
  "summary": "Short summary here",
  "questions": ["Question 1", "Question 2"]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: result.summary || "No summary generated.",
        questions: result.questions || [],
      }),
    };
  } catch (err) {
    console.error("AI Intake Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI processing failed." }),
    };
  }
}
