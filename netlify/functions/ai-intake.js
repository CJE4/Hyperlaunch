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

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `
You are HyperLaunch AI — an expert brand launch assistant that gathers details about new projects for Connor (the web developer).
Ask questions conversationally about:
- brand name & story
- target audience
- style & color preferences
- pages or features needed
- budget/timeline
- goals or challenges

Once you believe you have all details, summarize them in **structured JSON** like:
{
  "name": "",
  "email": "",
  "brand": "",
  "goals": "",
  "style": "",
  "pages": "",
  "features": "",
  "timeline": ""
}

Keep your tone warm, clear, and slightly energetic (like a launch coach 🚀). 
End by confirming if they’d like to proceed to booking a consult or quote.`,
        },
        ...history,
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    // Automatically email the summary if JSON detected
    if (reply && reply.includes("{") && reply.includes("}")) {
      try {
        await fetch("https://formspree.io/f/xnngoodr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _subject: "New HyperLaunch AI Intake",
            message: reply,
          }),
        });
      } catch (emailError) {
        console.error("Formspree send failed:", emailError);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    console.error("AI Intake Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong." }),
    };
  }
};
