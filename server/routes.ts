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
    const { text, tone } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!tone || typeof tone !== "string") {
      return res.status(400).json({ error: "Tone is required" });
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
      // Map tone to prompt IDs
      const promptIds: Record<string, string> = {
        "work-safe": "pmpt_695b58295a2481949ca23193cc8f27220091e37db7b63e30",
        "informal": "pmpt_695b95e36d048190a564c246275c5b790a1baee717009f46",
        "email": "pmpt_695ce754ceb48193bbcedcc7d77dea430beca83ca0c73c92",
        "short-clear": "pmpt_695b9bc5c4ac8195bd1513b27c0495f002ca415d305af730",
        "make-longer": "pmpt_695b9d70d8dc81969a3ed440c090c8230ce18ebed8f0e9d2",
        "more-polite": "pmpt_695f8ff975188196914d614a7a852a4b07c33c4c16ae05bf",
        "more-direct": "pmpt_695f910affd481968187c16004d45ee1030478bc84fb6f78",
        "grammar-check": "pmpt_695bac961c6c819392bb186d2c63aeec0906203b8afe340b",
      };

      const promptId = promptIds[tone];

      if (!promptId) {
        return res.status(400).json({ error: "Invalid tone specified" });
      }

      // Use stored prompt by ID with responses.create (no variables needed)
      const inputText = JSON.stringify({ text: text });
      console.log("Rephrase input:", inputText);

      const response = await (openai as any).responses.create({
        prompt: {
          id: promptId
        },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: inputText }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "rewrite_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                rewritten_text: {
                  type: "string"
                }
              },
              required: ["rewritten_text"],
              additionalProperties: false
            }
          }
        },
        max_output_tokens: 2048,
        store: true
      });

      // Extract rewritten_text from response
      const outputText = response.output_text || "";
      console.log("Rephrase raw response:", outputText);

      let rephrasedText = "";
      try {
        const parsed = JSON.parse(outputText);
        rephrasedText = parsed.rewritten_text || outputText;
      } catch (e) {
        rephrasedText = outputText;
      }

      res.json({
        success: true,
        original: text,
        rephrased: rephrasedText,
        tone: tone,
      });
    } catch (error: any) {
      console.error("Rephrase error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Rephrasing failed",
      });
    }
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
      const language = LANGUAGE_NAMES[targetLanguage] || targetLanguage || "English";

      // Call OpenAI API using stored prompt by ID with responses.create
      const inputText = JSON.stringify({ text: text });
      console.log("Translate input:", inputText);

      const response = await (openai as any).responses.create({
        prompt: {
          id: "pmpt_695b5864d7988190897405dee09f9d0e0e8bed38e3fbc0ed",
          variables: {
            language: language
          }
        },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: inputText }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "translate_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                rewritten_text: {
                  type: "string"
                }
              },
              required: ["rewritten_text"],
              additionalProperties: false
            }
          }
        },
        max_output_tokens: 2048,
        store: true
      });

      // Extract rewritten_text from response
      const outputText = response.output_text || "";
      console.log("Translate raw response:", outputText);

      let translatedText = "";
      try {
        const parsed = JSON.parse(outputText);
        translatedText = parsed.rewritten_text || outputText;
      } catch (e) {
        translatedText = outputText;
      }

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
    const { situation, language, responseType } = req.body;

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
      // Select prompt ID based on response type
      let promptId: string;
      if (responseType === "email") {
        promptId = "pmpt_695ce754ceb48193bbcedcc7d77dea430beca83ca0c73c92";
      } else {
        // Default to chat prompt
        promptId = "pmpt_695ce77313008195b8cbdfbd4927d7c90daf7a860809e7a9";
      }

      // Call OpenAI API using stored prompt by ID with responses.create
      const response = await (openai as any).responses.create({
        prompt: {
          id: promptId
        },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: situation }
            ]
          }
        ],
        text: {
          format: {
            type: "text"
          }
        },
        max_output_tokens: 2048,
        store: true
      });

      const generatedText = response.output_text || response.output?.[0]?.content?.[0]?.text || "";

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
