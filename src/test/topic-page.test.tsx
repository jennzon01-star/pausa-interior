import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const sendChatTurn = vi.fn();

vi.mock("@/lib/chat.functions", () => ({
  sendChatTurn: (...args: unknown[]) => sendChatTurn(...args),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="#" className={className}>
      {children}
    </a>
  ),
}));

import { TopicPage } from "@/components/TopicPage";

beforeAll(() => {
  class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

const submit = (value: string) => {
  fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
};

describe("TopicPage with the AI server function", () => {
  beforeEach(() => {
    sendChatTurn.mockReset();
  });

  it("shows the user message, a loading state, then an AI-labelled reply", async () => {
    let resolve: (value: { reply: string; source: "ai" }) => void = () => {};
    sendChatTurn.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<TopicPage slug="conversar" />);

    submit("Hoy cociné pan");
    expect(await screen.findByText("Pensando una respuesta…")).toBeInTheDocument();
    expect(screen.getByText("Hoy cociné pan")).toBeInTheDocument();
    expect(screen.getByLabelText("Tu mensaje")).toBeDisabled();

    resolve({ reply: "Suena delicioso.", source: "ai" });
    expect(await screen.findByText("Suena delicioso.")).toBeInTheDocument();
    expect(screen.getByText(/Respuesta de IA/)).toBeInTheDocument();
    expect(screen.queryByText("Pensando una respuesta…")).not.toBeInTheDocument();

    const payload = sendChatTurn.mock.calls[0]![0].data;
    expect(payload.topic).toBe("conversar");
    expect(payload.messages.at(-1)).toEqual({ role: "user", content: "Hoy cociné pan" });
  });

  it("labels fallback replies as simulated", async () => {
    sendChatTurn.mockResolvedValue({ reply: "Respuesta local", source: "demo" });
    render(<TopicPage slug="conversar" />);
    submit("Hola");
    expect(await screen.findByText("Respuesta local")).toBeInTheDocument();
    expect(screen.getByText(/Respuesta simulada · sin IA/)).toBeInTheDocument();
  });

  it("recovers gracefully when the server function throws", async () => {
    sendChatTurn.mockRejectedValue(new Error("network"));
    render(<TopicPage slug="conversar" />);
    submit("Hola");
    await waitFor(() => expect(screen.queryByText("Pensando una respuesta…")).toBeNull());
    expect(screen.getByText(/Respuesta simulada · sin IA/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tu mensaje")).not.toBeDisabled();
  });

  it("resets conversation when the new conversation button is clicked", async () => {
    sendChatTurn.mockResolvedValue({ reply: "Un gusto hablar contigo.", source: "ai" });
    render(<TopicPage slug="conversar" />);

    const newChatBtn = screen.getByRole("button", { name: "Nueva conversación" });
    expect(newChatBtn).toBeDisabled();

    submit("Hola, quiero hablar");
    expect(await screen.findByText("Un gusto hablar contigo.")).toBeInTheDocument();
    expect(screen.getByText("Hola, quiero hablar")).toBeInTheDocument();
    expect(newChatBtn).not.toBeDisabled();

    fireEvent.click(newChatBtn);
    expect(screen.queryByText("Hola, quiero hablar")).not.toBeInTheDocument();
    expect(screen.queryByText("Un gusto hablar contigo.")).not.toBeInTheDocument();
    expect(newChatBtn).toBeDisabled();
  });

  it("hides input during mindfulness in calma and asks follow-up when finished", async () => {
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [],
      speak: () => {},
      cancel: () => {},
    });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        text = "";
      },
    );

    render(<TopicPage slug="calma" />);

    expect(screen.getByText(/Tómate este momento para ti/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tu mensaje")).toBeInTheDocument();

    const startBtn = screen.getByRole("button", { name: /Iniciar guía de respiración/ });
    fireEvent.click(startBtn);

    expect(screen.queryByLabelText("Tu mensaje")).not.toBeInTheDocument();
    expect(screen.queryByText(/No se guardan las conversaciones/)).not.toBeInTheDocument();

    const stopBtn = screen.getByRole("button", {
      name: "Terminar ejercicio de respiración guiada",
    });
    fireEvent.click(stopBtn);

    expect(screen.getByLabelText("Tu mensaje")).toBeInTheDocument();
    expect(
      await screen.findByText("¿Cómo te sientes ahora? ¿Quieres continuar la conversación?"),
    ).toBeInTheDocument();
  });

  it("shows difficulty assistance options and triggers prompt when clicked", async () => {
    sendChatTurn.mockResolvedValue({
      reply: "Vamos a ordenarlo por partes con calma.",
      source: "ai",
    });
    render(<TopicPage slug="dificultad" />);

    expect(screen.getByText("Acompañamiento paso a paso")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ordenar mis pensamientos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconocer mis recursos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Considerar alternativas" })).toBeInTheDocument();

    const thoughtsBtn = screen.getByRole("button", { name: "Ordenar mis pensamientos" });
    fireEvent.click(thoughtsBtn);

    expect(
      await screen.findByText("Quiero ayuda para ordenar mis pensamientos sobre lo que está pasando."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Vamos a ordenarlo por partes con calma.")).toBeInTheDocument();
  });

  it("combines existing input with difficulty action when clicked", async () => {
    sendChatTurn.mockResolvedValue({
      reply: "Tus recursos y fortalezas previas siguen estando contigo.",
      source: "ai",
    });
    render(<TopicPage slug="dificultad" />);

    fireEvent.change(screen.getByLabelText("Tu mensaje"), {
      target: { value: "Siento mucha presión en el trabajo" },
    });
    const resourcesBtn = screen.getByRole("button", { name: "Reconocer mis recursos" });
    fireEvent.click(resourcesBtn);

    expect(
      await screen.findByText(/Siento mucha presión en el trabajo[\s\S]*Me gustaría reconocer mis recursos/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Tus recursos y fortalezas previas siguen estando contigo."),
    ).toBeInTheDocument();
  });
});

