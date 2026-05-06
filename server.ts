import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Mirroring the FastAPI endpoint requested by user
  app.post("/api/predict", async (req, res) => {
    try {
      const { data } = req.body; // 784 pixels [0..1]
      if (!data || data.length !== 784) {
        return res.status(400).json({ error: "Invalid pixel data. Expected 784 values." });
      }

      // We'll provide a simple mock here. 
      // The high-fidelity AI recognition is handled in the frontend to follow platform guidelines.
      res.json({
        prediction: "?",
        confidence: 0.0,
        message: "Endpoint available. For live preview results, the frontend handles AI recognition directly via Gemini SDK."
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
