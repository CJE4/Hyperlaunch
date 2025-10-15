import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");

    // Chat memory can be added later — for now, simple one-turn
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are HyperLaunch’s AI assistant. Ask questions to help gather details about new client projects (e.g., goals, timeline, design style, budget)." },
        { role: "user", content: message }
      ],
    });

    const reply = completion.choices[0].message.content;
    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
}
