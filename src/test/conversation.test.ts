import { describe, expect, it, vi } from "vitest";
import {
  appendAssistantMessage,
  appendDemoTurn,
  appendUserMessage,
  respondWithDemo,
  type ConversationMessage,
} from "@/lib/conversation";

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
  it("supports sorting thoughts, recognizing resources and considering alternatives", () => {
    expect(reply("Quiero ayuda para ordenar mis pensamientos")).toMatch(/orden|partes|hechos/);
    expect(reply("Me gustaría reconocer mis recursos y fortalezas")).toMatch(/recursos|fortalezas|aprendizajes/);
    expect(reply("Quiero considerar alternativas y opciones")).toMatch(/alternativas|caminos|viable/);
  });
  it("is honest when no prepared response fits", () => {
    expect(reply("Estoy organizando una colección de sellos")).toContain("respuestas limitadas");
  });
  it("avoids automatic questions at the end of everyday responses", () => {
    expect(reply("Hoy cociné pan")).not.toContain("?");
    expect(reply("Estuve escuchando música")).not.toContain("?");
    expect(reply("Hoy tuve mucho trabajo")).not.toContain("?");
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

describe("Turn helpers", () => {
  it("appends a trimmed user message and ignores blank input", () => {
    const initial: ConversationMessage[] = [];
    const next = appendUserMessage(initial, "  Hola  ");
    expect(next).toEqual([{ id: "message-0", role: "user", content: "Hola" }]);
    expect(initial).toHaveLength(0);
    expect(appendUserMessage(next, "   ")).toEqual(next);
  });
  it("appends an assistant reply tagged with its source", () => {
    const history = appendUserMessage([], "Hola");
    expect(appendAssistantMessage(history, "Buenas", "ai").at(-1)).toEqual({
      id: "message-1",
      role: "assistant",
      content: "Buenas",
      source: "ai",
    });
  });
});
