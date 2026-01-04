import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Language name mapping for better prompts
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  es: "Spanish",
  de: "German",
  zh: "Chinese",
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/ai/rephrase", async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    res.json({
      success: true,
      original: text,
      rephrased: null,
      message: "AI rephrasing will be available in the next version",
    });
  });

  app.post("/api/ai/translate", async (req, res) => {
    const { text, targetLanguage } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key missing");
      return res.status(500).json({
        success: false,
        error: "OpenAI API key is not configured",
      });
    }

    try {
      const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage || "English";

      // Call ChatGPT API with gpt-4o-mini model and temperature 0
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `Translate the text below into ${languageName} as literally and accurately as possible.

Requirements:
- Preserve the original meaning, tone, register, and intent exactly.
- Do not rephrase, soften, normalize, or improve the text.
- Keep the same level of formality or informality as in the original.
- Do not add explanations, comments, or context.
- Do not change the length unless strictly required by grammar.

Return only the translated text.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
      });

      const translatedText = completion.choices[0]?.message?.content || "";

      res.json({
        success: true,
        original: text,
        translated: translatedText,
        targetLanguage: targetLanguage || "en",
      });
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Translation failed",
      });
    }
  });

  app.post("/api/ai/help-write", async (req, res) => {
    const { situation, language } = req.body;

    if (!situation || typeof situation !== "string") {
      return res.status(400).json({ error: "Situation description is required" });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key missing");
      return res.status(500).json({
        success: false,
        error: "OpenAI API key is not configured",
      });
    }

    try {
      const languageName = LANGUAGE_NAMES[language] || "English";

      // Call ChatGPT API with gpt-4o-mini model and temperature 0.7 for more creative responses
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.0,
        messages: [
          {
            role: "system",
            content: `You are a writing assistant for work communication.
Write the response in ${languageName}.

Your task is to write a clear, concise, professional, work-safe message based on the situation described by the user.

Requirements:
- Keep the message concise and clear.
- Write the message from the user's perspective.
- Use a neutral, professional, and socially appropriate tone.
- Use the respectful form of address appropriate in this language.
- Do not escalate conflicts or introduce emotional language.
- Do not take on commitments unless they are explicitly stated in the description.
- Do not add unnecessary details or assumptions.
- Do not explain your reasoning or add meta comments.
- Output only the final message text in ${languageName}.

Situation:`,
          },
          {
            role: "user",
            content: situation,
          },
        ],
      });

      const generatedText = completion.choices[0]?.message?.content || "";

      res.json({
        success: true,
        situation: situation,
        generatedText: generatedText,
        language: language || "en",
      });
    } catch (error: any) {
      console.error("Help write error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate message",
      });
    }
  });

  app.get("/api/snippets", async (_req, res) => {
    res.json({
      success: true,
      snippets: [],
      message: "Snippets library will be available in the next version",
    });
  });

  app.get("/api/health", async (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
