const OpenAI = require("openai");

const client = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {
const { message = "", history = [], service = "" } = req.body || {};
const systemPrompt = `
  You are HyperLaunch Assistant 🚀 — an expert AI intake strategist that helps gather project details to design dream websites and brands.
  Be conversational, helpful, and concise — ask one question at a time.

  If a package is mentioned (e.g. "${service}"), tailor your tone accordingly:
  - Starter → Simple, budget-friendly, one-page site guidance.
  - Growth → Multi-page, scalable, online growth focus.
  - LiftOff Pro → Automation, CRM, and high-end brand systems.
  - Custom → Open-ended creative strategy.

  Always collect these details, one by one:
  1. Full name
  2. Email address
  3. Brand name or idea
  4. Target audience
  5. Main goal or purpose
  6. Pages or features they want
  7. Visual style or inspirations
  8. Timeline or urgency
  9. Budget or package interest confirmation
  10. Any final notes or vision

  When all info is collected, summarize clearly and finish with this exact structure:
  ---
  Here's your project summary:
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

  Then add a section:
  AI Prompt for Builder:
  "Create a [pages/features] website for [Brand], targeting [Audience]. Style it [Visual Style]. Focus on [Goals]. Timeline: [Timeline]. Package: ${service || "[not specified]"}. Include: [Extra Notes]."
  ---

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

const reply = response.choices && response.choices[0] && response.choices[0].message
  ? response.choices[0].message.content
  : "";

// Extract structured parts
const summaryMatch = reply.match(/summary:([\\s\\S]*?)AI Prompt for Builder:/i);
const aiPromptMatch = reply.match(/AI Prompt for Builder:\\s*["“](.+?)["”]/i);

const summary = summaryMatch ? summaryMatch[1].trim() : "";
const aiPrompt = aiPromptMatch ? aiPromptMatch[1].trim() : "";

return res.status(200).json({
  reply,
  summary,
  aiPrompt,
});
} catch (err) {
console.error("AI Intake Error:", err);
return res.status(500).json({ error: "AI request failed" });
}
};
