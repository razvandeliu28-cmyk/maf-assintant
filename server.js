
const express = require("express");

const app = express();
app.use(express.json({ limit: "20kb" }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.get("/", (req, res) => {
  res.json({
    name: "MAF ASSISTANT",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/reply", async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(503).json({
        error: "GROQ_API_KEY is not configured."
      });
    }

    const message = req.body?.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000
    ) {
      return res.status(400).json({
        error: "Send a valid message (max 2000 characters)."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are MAF ASSISTANT, a friendly AI for a TikTok editing community. " +
                "Reply in the same language as the user's message. " +
                "Be concise, natural, funny when appropriate, and respectful. " +
                "Never claim to be human or invent facts about the creator."
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", JSON.stringify(data));
      return res.status(response.status).json({
        error: "AI provider request failed.",
        status: response.status
      });
    }

    res.json({
      assistant: "MAF ASSISTANT",
      reply:
        data.choices?.[0]?.message?.content ||
        "Nu am un răspuns momentan 😅"
    });
  } catch (error) {
    console.error("Request failed:", error.message);

    res.status(500).json({
      error: "Could not generate a reply."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MAF ASSISTANT listening on port ${PORT}`);
});
