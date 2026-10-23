
const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(express.json({ limit: "20kb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

const ai = API_KEY
  ? new GoogleGenAI({ apiKey: API_KEY })
  : null;

app.get("/", (req, res) => {
  res.json({
    name: "MAF ASSISTANT",
    status: "online",
    message: "MAF AI is ready!"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/reply", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured."
      });
    }

    const message = req.body?.message;

    if (typeof message !== "string" ||
        !message.trim() ||
        message.length > 2000) {
      return res.status(400).json({
        error: "Send a valid message (max 2000 characters)."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message.trim(),
      config: {
        systemInstruction:
          "You are MAF ASSISTANT, a friendly AI for a TikTok editing community. " +
          "Reply in the same language as the user's message. " +
          "Be concise, natural, funny when appropriate, and respectful. " +
          "Never claim to be human or invent facts about the creator."
      }
    });

    res.json({
      assistant: "MAF ASSISTANT",
      reply: response.text || "Nu am un răspuns momentan 😅"
    });
  } catch (error) {
    console.error("Gemini request failed:", error.message);

    res.status(500).json({
      error: "Could not generate a reply."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MAF ASSISTANT listening on port ${PORT}`);
});
