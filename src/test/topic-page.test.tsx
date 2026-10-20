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
});
