import { beforeEach, describe, expect, it, vi } from "vitest";

const generateText = vi.fn();
const model = vi.fn((id: string) => ({ id }));
const createGoogleGenerativeAI = vi.fn((_options: { apiKey: string }) => model);

vi.mock("ai", () => ({ generateText: (...args: unknown[]) => generateText(...args) }));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: (options: { apiKey: string }) => createGoogleGenerativeAI(options),
}));

import { chatInputSchema, replyToConversation } from "@/lib/chat.server";
import { buildSystemPrompt } from "@/lib/conversation-principles";

const request = {
  topic: "conversar" as const,
  messages: [
    { role: "assistant" as const, content: "Intro" },
    { role: "user" as const, content: "Hoy cociné pan" },
  ],
};

describe("replyToConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("falls back to the demo responder when the key is missing", async () => {
    const result = await replyToConversation(request, {});
    expect(result.source).toBe("demo");
    expect(result.reply.length).toBeGreaterThan(0);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("calls Gemini with the shared system prompt and returns an AI reply", async () => {
    generateText.mockResolvedValue({ text: "  Suena delicioso.  " });
    const result = await replyToConversation(request, { GEMINI_API_KEY: "secret" });
    expect(result).toEqual({ reply: "Suena delicioso.", source: "ai" });
    expect(createGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: "secret" });
    const call = generateText.mock.calls[0]![0];
    expect(call.system).toBe(buildSystemPrompt());
    expect(call.messages).toEqual([{ role: "user", content: "Hoy cociné pan" }]);
  });

  it("falls back without leaking the key or the provider error", async () => {
    generateText.mockRejectedValue(new Error("quota secret"));
    const result = await replyToConversation(request, { GEMINI_API_KEY: "secret" });
    expect(result.source).toBe("demo");
    expect(JSON.stringify(result)).not.toMatch(/secret|quota/);
  });

  it("falls back when Gemini returns empty text", async () => {
    generateText.mockResolvedValue({ text: "   " });
    const result = await replyToConversation(request, { GEMINI_API_KEY: "secret" });
    expect(result.source).toBe("demo");
  });
});

describe("chatInputSchema", () => {
  it("accepts a valid request", () => {
    expect(chatInputSchema.safeParse(request).success).toBe(true);
  });
  it("rejects unknown topics, bad roles, empty and oversized content", () => {
    expect(chatInputSchema.safeParse({ ...request, topic: "nope" }).success).toBe(false);
    expect(
      chatInputSchema.safeParse({ ...request, messages: [{ role: "system", content: "x" }] })
        .success,
    ).toBe(false);
    expect(
      chatInputSchema.safeParse({ ...request, messages: [{ role: "user", content: "" }] }).success,
    ).toBe(false);
    expect(
      chatInputSchema.safeParse({
        ...request,
        messages: [{ role: "user", content: "a".repeat(4001) }],
      }).success,
    ).toBe(false);
  });
  it("rejects too many messages or no user message", () => {
    const many = Array.from({ length: 41 }, () => ({ role: "user" as const, content: "hola" }));
    expect(chatInputSchema.safeParse({ ...request, messages: many }).success).toBe(false);
    expect(
      chatInputSchema.safeParse({ ...request, messages: [{ role: "assistant", content: "x" }] })
        .success,
    ).toBe(false);
  });
});
