import express from "express";
import http from "node:http";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { printDevServerUrls } from "./src/server/network.ts";
import { buildInterpretMessages } from "./src/server/interpretPrompt.ts";
import {
  getDeepSeekApiKey,
  getDeepSeekModel,
  streamDeepSeekChat,
} from "./src/server/deepseek.ts";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      deepseekConfigured: Boolean(getDeepSeekApiKey()),
      model: getDeepSeekModel(),
    });
  });

  app.post("/api/interpret", async (req, res) => {
    const { question, hexagram } = req.body as {
      question?: string;
      hexagram?: number[];
    };

    if (!question?.trim()) {
      return res.status(400).json({ error: "Question is required." });
    }
    if (!Array.isArray(hexagram) || hexagram.length !== 6) {
      return res.status(400).json({ error: "Hexagram must contain exactly 6 lines." });
    }
    if (!getDeepSeekApiKey()) {
      return res.status(500).json({ error: "DEEPSEEK_API_KEY is not configured." });
    }

    try {
      const { messages } = buildInterpretMessages(question.trim(), hexagram);

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Content-Type-Options", "nosniff");

      await streamDeepSeekChat(messages, (delta) => {
        res.write(delta);
      });

      res.end();
    } catch (error) {
      console.error("DeepSeek interpretation error:", error);
      if (!res.headersSent) {
        return res.status(500).json({
          error:
            error instanceof Error ? error.message : "Interpretation failed.",
        });
      }
      res.end();
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: true,
        hmr: { server: httpServer },
      },
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    printDevServerUrls(PORT);
    if (!getDeepSeekApiKey()) {
      console.warn(
        "\n  ⚠️  DEEPSEEK_API_KEY 未配置：View Truth 将无法解卦。\n" +
          "      请在项目根目录创建 .env.local，写入：\n" +
          '      DEEPSEEK_API_KEY="你的-key"\n',
      );
    } else {
      console.log("  ✓ DeepSeek API 已配置，View Truth 可用\n");
    }
  });
}

startServer();
