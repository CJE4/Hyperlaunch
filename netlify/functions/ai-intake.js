import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  const data = JSON.parse(event.body);

  const prompt = `
You are an AI assistant for HyperLaunch. Summarize this client's message and ask up to 3 short, helpful follow-up questions that would help prepare a project quote.

Client submission:
${JSON.stringify(data, null, 2)}

Return JSON like:
{
  "summary": "summary here",
  "questions": ["question1", "question2", "question3"]
}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const reply = completion.choices[0].message.content;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: reply
  };
}
