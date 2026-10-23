
const express = require("express");

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(express.text({ type: "text/plain", limit: "20kb" }));

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
    let body = req.body;

    // Acceptă și JSON trimis ca text brut.
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          error: "Body-ul nu este JSON valid.",
          example: {
            message: "Salut, MAF ASSISTANT!"
          }
        });
      }
    }

    console.log("Request body type:", typeof body);
    console.log(
      "Request body keys:",
      body && typeof body === "object"
        ? Object.keys(body)
        : []
    );

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message || message.length > 2000) {
      return res.status(400).json({
        error: "Mesaj lipsă sau invalid.",
        receivedType: typeof body,
        expected: {
          message: "text, maximum 2000 characters"
        }
      });
    }

    if (!GROQ_API_KEY) {
      return res.status(503).json({
        error: "Lipsește GROQ_API_KEY din Render Environment."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
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
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Groq API error:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error: "Furnizorul AI a respins cererea.",
        providerStatus: response.status,
        details: data.error?.message || "Unknown provider error"
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "Furnizorul AI nu a returnat un răspuns."
      });
    }

    return res.json({
      assistant: "MAF ASSISTANT",
      reply
    });
  } catch (error) {
    console.error("Request failed:", error.message);

    return res.status(500).json({
      error: "Eroare internă la generarea răspunsului."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MAF ASSISTANT listening on port ${PORT}`);
});
    
