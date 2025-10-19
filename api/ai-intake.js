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
    const { message = "", history = [], selectedService = "" } = req.body || {};

    // 🔹 AI system prompt for structured project intake
    const systemPrompt = `
      You are HyperLaunch Assistant 🚀 — a friendly AI project intake specialist helping clients plan their dream website or brand.

      Always respond conversationally, asking one question at a time.
      You must collect **all** of the following details in order:
      1. Full Name
      2. Email (for contact)
      3. Business or Brand Name
      4. Target Audience
      5. Main Goal or Purpose of the Website
      6. Pages or Features they want
      7. Visual Style (colors, vibe, inspirations)
      8. Timeline or Urgency
      9. Budget or Package Preference (if provided, confirm it)
      10. Any Additional Notes

      If a selected package (service) is provided — such as "${selectedService}" — acknowledge it naturally in your introduction:
      Example:
      “Awesome — you’re interested in our ${selectedService} package! Let’s plan your project together.”

      When all information is gathered, output a clean summary in this exact format:

      ---
      Here’s your project summary:  

      **Name:** [value]  
      **Email:** [value]  
      **Selected Package:** ${selectedService || "[not specified]"}  
      **Brand/Business Name:** [value]  
      **Audience:** [value]  
      **Goals:** [value]  
      **Pages or Features:** [value]  
      **Visual Style:** [value]  
      **Timeline:** [value]  
      **Budget/Package Preference:** [value]  
      **Additional Notes:** [value]  

      ---

      Then ask:
      “Would you like me to send this summary to the HyperLaunch team so we can start building your dream website?”
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

    // Extract summary section if it exists
    const summaryMatch = reply.match(/here’s your project summary:([\s\S]*)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    res.status(200).json({ reply, summary });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
}
