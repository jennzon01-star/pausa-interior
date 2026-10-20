// Server-only: reads GEMINI_API_KEY and talks to Gemini. Import it exclusively
// from server function handlers so the key never reaches the browser bundle.
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/conversation-principles";
import { respondWithDemo, type ConversationReply } from "@/lib/conversation";

export const GEMINI_MODEL = "gemini-3.5-flash";
export const MAX_MESSAGES = 40;
export const MAX_CONTENT_LENGTH = 4000;

export const chatInputSchema = z.object({
  topic: z.enum(["conversar", "emociones", "calma", "dificultad", "bienestar"]),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES)
    .refine((messages) => messages.some((message) => message.role === "user"), {
      message: "At least one user message is required",
    }),
});

export type ChatInput = z.infer<typeof chatInputSchema>;

const demoReply = ({ topic, messages }: ChatInput): ConversationReply => ({
  reply: respondWithDemo({
    topic,
    messages: messages.map((message, index) => ({ id: `message-${index}`, ...message })),
  }),
  source: "demo",
});

export async function replyToConversation(
  input: ChatInput,
  env: Record<string, string | undefined> = process.env,
): Promise<ConversationReply> {
  const apiKey = env["GEMINI_API_KEY"];
  if (!apiKey) return demoReply(input);
  try {
    // Gemini expects the conversation to start with a user turn, so the
    // assistant introduction shown in the UI is not sent.
    const firstUser = input.messages.findIndex((message) => message.role === "user");
    const { text } = await generateText({
      model: createGoogleGenerativeAI({ apiKey })(GEMINI_MODEL),
      system: buildSystemPrompt(),
      messages: input.messages.slice(firstUser),
    });
    const reply = text.trim();
    if (!reply) return demoReply(input);
    return { reply, source: "ai" };
  } catch (error) {
    // Log only the error name; provider messages may echo request details.
    console.error("Gemini request failed", error instanceof Error ? error.name : "unknown");
    return demoReply(input);
  }
}
