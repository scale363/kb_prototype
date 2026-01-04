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
    const { text, tone, language } = req.body;

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
      const languageName = LANGUAGE_NAMES[language] || "English";

      // Define prompts for each tone
      const prompts: Record<string, string> = {
        "work-safe": `You are a workplace communication assistant.
Write the response in ${languageName}.
Use the formal and respectful form of address appropriate for professional communication in this language.

Rewrite the user's message so it is safe to send in a professional work environment.

Requirements:
- Remove rudeness, harshness, or emotional tone
- Make the message sound natural, polite, and culturally appropriate at work
- Keep the original meaning and intent
- Fix grammar and awkward phrasing
- Do NOT add formality, authority, or unnecessary business language
- Do NOT make the message longer unless required for clarity

The result should sound neutral, respectful, and safe to send.`,

        "grammar-check": `You are a grammar correction assistant.
Write the response in ${languageName}.

Your task is to correct grammar, spelling, punctuation, and basic syntax errors ONLY.

Strict rules:
- Do NOT rephrase, rewrite, or improve the style
- Do NOT change tone, formality, or level of politeness
- Do NOT simplify or restructure sentences
- Do NOT add or remove information
- Do NOT add greetings, closings, or extra words
- Preserve the original wording, structure, and meaning as much as possible

Make only the minimal changes required to fix errors.

If the original text is already correct, return it unchanged.

Output only the corrected text.`,

        "informal": `You are a casual communication assistant.
Write the response in ${languageName}.

Rewrite the user's message in an informal, natural, and human tone suitable for personal or non-work communication.

Requirements:
- Use an informal and relaxed form of address appropriate for this language (e.g. "ты / du / tu")
- Sound natural, simple, and conversational
- Keep the message human and friendly, not professional or business-like
- Preserve the original meaning and intent
- Do NOT sound rude, aggressive, or disrespectful
- Do NOT use slang, profanity, or internet-style expressions
- Do NOT add greetings, emojis, or filler unless they are clearly implied by the original message
- Do NOT enlarge the message unless it is absolutely necessary

The result should sound like a normal, friendly message between people who know each other — simple, informal, and natural.`,

        "short-clear": `You are an assistant that rewrites messages to be shorter and clearer.

Rewrite the user's message to be shorter while preserving the original meaning.

The result should be concise, clear, and easy to understand.`,
      };

      const systemPrompt = prompts[tone];
      if (!systemPrompt) {
        return res.status(400).json({ error: "Invalid tone specified" });
      }

      // Call ChatGPT API with gpt-4o-mini model and temperature 0
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: text,
          },
        ],
      });

      const rephrasedText = completion.choices[0]?.message?.content || "";

      res.json({
        success: true,
        original: text,
        rephrased: rephrasedText,
        tone: tone,
        language: language || "en",
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
