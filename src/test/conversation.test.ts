import { describe, expect, it, vi } from "vitest";
import { appendDemoTurn, respondWithDemo, type ConversationMessage } from "@/lib/conversation";

const reply = (content: string) =>
  respondWithDemo({ topic: "conversar", messages: [{ id: "user", role: "user", content }] });

describe("Offline conversation", () => {
  it("talks naturally about the garden rather than assuming distress", () => {
    expect(reply("Hoy disfruté trabajando en mi jardín")).toContain("jardín");
    expect(reply("Hoy disfruté trabajando en mi jardín")).not.toMatch(/triste|respira|soledad/);
  });
  it("recognizes a concrete worry before offering advice", () => {
    expect(reply("Me preocupa una situación en el trabajo")).toContain("trabajo");
    expect(reply("Me preocupa una situación en el trabajo")).not.toContain("?");
    expect(reply("Me preocupa que se mueran mis plantas")).toContain("plantas");
  });
  it("offers optional exploration only when requested", () => {
    expect(reply("¿Puedes ayudarme con un problema en el trabajo?")).toContain("opciones");
    expect(reply("No quiero ayuda, me preocupa mi trabajo")).not.toContain("opciones");
  });
  it("does not assume a category determines emotional state", () => {
    const messages: ConversationMessage[] = [
      { id: "user", role: "user", content: "Hoy cociné pan" },
    ];
    expect(respondWithDemo({ topic: "dificultad", messages })).toContain("preparaste");
    expect(reply("No estoy triste, solo quiero conversar")).not.toContain("preocupa");
  });
  it("varies replies within a theme without always asking a question", () => {
    const first = appendDemoTurn([], "Trabajé en mi jardín", "conversar");
    const next = appendDemoTurn(first, "Regué las plantas", "conversar");
    expect(first.at(-1)?.content).not.toBe(next.at(-1)?.content);
    expect(next.at(-1)?.content).not.toContain("?");
    expect(next.at(-1)?.source).toBe("demo");
  });
  it("follows the documented behavior examples", () => {
    expect(reply("No sé qué me pasa")).toMatch(/sin prisa|sin presión/);
    expect(reply("Solo quiero conversar")).toContain("onvers");
    expect(reply("Hoy estuve trabajando en mi jardín y me sentí muy bien")).toContain("jardín");
  });
  it("is honest when no prepared response fits", () => {
    expect(reply("Estoy organizando una colección de sellos")).toContain("respuestas limitadas");
  });
  it("passes the full history to the replaceable responder and does not mutate it", () => {
    const initial: ConversationMessage[] = [
      { id: "intro", role: "assistant", content: "Hola", source: "demo" },
    ];
    const responder = vi.fn(() => "Respuesta de prueba");
    const next = appendDemoTurn(initial, "  Hola  ", "conversar", responder);
    expect(responder).toHaveBeenCalledWith({ topic: "conversar", messages: next.slice(0, -1) });
    expect(initial).toHaveLength(1);
    expect(next.map((message) => message.role)).toEqual(["assistant", "user", "assistant"]);
    expect(appendDemoTurn(initial, "  ", "conversar", responder)).toEqual(initial);
  });
});
