import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Lazy initialization of GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

const RECOVERABLE_CODES = [503, 429, 404, 500];

interface ModelGenerationResult {
  text: string;
  modelUsed: string;
}

/**
 * Standard Helper: Generates content with sequential fallback ladder
 */
async function generateContentWithFallback(
  contents: any,
  systemInstruction: string
): Promise<ModelGenerationResult> {
  const ai = getAIClient();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return {
          text: responseText,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || (err?.message?.includes('429') ? 429 : 500);
      const isRecoverable = RECOVERABLE_CODES.includes(statusCode) || err?.message?.includes('RESOURCE_EXHAUSTED');

      console.warn(`[Gemini Fallback] Model ${modelName} failed (status: ${statusCode}). Recoverable: ${isRecoverable}. Error: ${err?.message || err}`);

      // Continue to next model in fallback ladder
      continue;
    }
  }

  throw new Error(`All models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown generation failure'}`);
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Reflection Endpoint
app.post('/api/reflect', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === 'string' ? body.mode : 'reflect';
    const titleContext = typeof body.titleContext === 'string' ? body.titleContext : '';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt cannot be empty.' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt exceeds maximum character length of 10,000.' });
    }

    // Sanitize conversation history for Gemini API
    const formattedHistory = rawHistory
      .filter((turn: any) => turn && (turn.role === 'user' || turn.role === 'model') && Array.isArray(turn.parts))
      .map((turn: any) => ({
        role: turn.role,
        parts: turn.parts.map((p: any) => ({ text: String(p.text || '') })),
      }));

    // Mode-specific guidance instructions
    let modeGuidance = '';
    switch (mode) {
      case 'summarize':
        modeGuidance = 'Focus on providing a clear, structured executive synthesis of thoughts, key themes, emotional patterns, and breakthroughs.';
        break;
      case 'brainstorm':
        modeGuidance = 'Offer creative perspectives, constructive possibilities, probing questions, and fresh angles to explore without being judgmental.';
        break;
      case 'action_plan':
        modeGuidance = 'Distill the reflection into realistic, mindful, and actionable next steps or micro-habits.';
        break;
      case 'reflect':
      default:
        modeGuidance = 'Act as an empathetic, thoughtful reflection partner. Offer validating insights, gentle mirrors to the writer\'s feelings, and open-ended contemplative prompts.';
        break;
    }

    const systemInstruction = `You are a private, deeply empathetic reflective journaling companion and cognitive thinking partner.
Your role:
- Help the user explore their thoughts, feelings, ambitions, and dilemmas.
- Respect their emotional space and maintain a warm, grounded, and non-prescriptive tone.
- Mode focus: ${modeGuidance}
- Format responses cleanly with readable paragraphs, subtle markdown bullet points where appropriate, and avoid overwhelming the user.
- If this is a new entry (no prior turns), provide a concise response and conclude with a gentle follow-up question.
${titleContext ? `The entry title context is: "${titleContext}".` : ''}`;

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const result = await generateContentWithFallback(contents, systemInstruction);

    return res.json({
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error generating reflection:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection. Please try again.',
    });
  }
});

// Title & Tag generation endpoint
app.post('/api/summarize-entry', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return res.status(400).json({ error: 'Text content is required for summarization.' });
    }

    const systemInstruction = `You are an expert editorial assistant for a reflective journaling app.
Analyze the user's journal entry and return ONLY a valid JSON object with the following schema:
{
  "title": "A concise, poetic or reflective title (3 to 6 words)",
  "summary": "A 1-2 sentence core insight or summary of the entry",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
Do not include markdown code block backticks around the JSON if possible, or format cleanly as JSON.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `Generate title, summary, and tags for this journal entry:\n\n${text.slice(0, 4000)}` }],
      },
    ];

    const result = await generateContentWithFallback(contents, systemInstruction);

    // Clean any markdown code blocks
    let cleanText = result.text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanText);
      return res.json(parsed);
    } catch {
      return res.json({
        title: 'Reflective Entry',
        summary: cleanText.slice(0, 150),
        tags: ['Reflection'],
      });
    }
  } catch (error: any) {
    console.error('Error summarizing entry:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to summarize entry.',
    });
  }
});

// Full-Stack Server & Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Journal & Reflections server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
