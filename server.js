
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Citim corpul brut ca text, fără middleware JSON.
app.use(express.text({
  type: "*/*",
  limit: "20kb"
}));

app.get("/", (req, res) => {
  res.json({ name: "MAF ASSISTANT", status: "online" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/reply", async (req, res) => {
  try {
    const raw = req.body;

    console.log("CONTENT-TYPE:", req.headers["content-type"]);
    console.log("RAW BODY:", JSON.stringify(raw));

    if (typeof raw !== "string" || !raw.trim()) {
      return res.status(400).json({
        error: "Serverul nu a primit un Body.",
        contentType: req.headers["content-type"] || "missing",
        receivedBody: raw ?? null
      });
    }

    let body;

    try {
      body = JSON.parse(raw);
    } catch {
      return res.status(400).json({
        error: "Body-ul nu este JSON valid.",
        receivedBody: raw.slice(0, 200)
      });
    }

    const message = body?.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000
    ) {
      return res.status(400).json({
        error: "Câmpul message lipsește sau este invalid.",
        receivedKeys:
          body && typeof body === "object"
            ? Object.keys(body)
            : []
      });
    }

    if (!GROQ_API_KEY) {
      return res.status(503).json({
        error: "GROQ_API_KEY lipsește din Render Environment."
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
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "You are MAF ASSISTANT, a friendly TikTok editing community AI. " +
                "Reply in the same language as the user. Be concise, natural, and respectful."
            },
            { role: "user", content: message.trim() }
          ],
          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", JSON.stringify(data));
      return res.status(502).json({
        error: "Groq a respins cererea.",
        providerStatus: response.status,
        details: data.error?.message || "Unknown error"
      });
    }

    return res.json({
      assistant: "MAF ASSISTANT",
      reply: data.choices?.[0]?.message?.content || "Nu am un răspuns momentan."
    });
  } catch (error) {
    console.error("Server error:", error.message);
    return res.status(500).json({ error: "Eroare internă." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MAF ASSISTANT listening on port ${PORT}`);
});
  
