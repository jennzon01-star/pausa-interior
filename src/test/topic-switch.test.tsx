import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

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

describe("Cambio de opción", () => {
  it("no conserva la conversación ni el texto de la opción anterior", async () => {
    sendChatTurn.mockResolvedValue({ reply: "Respuesta anterior", source: "ai" });
    const { rerender } = render(<TopicPage slug="conversar" />);
    fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value: "Mensaje viejo" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Respuesta anterior")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value: "Borrador" } });

    rerender(<TopicPage slug="dificultad" />);
    expect(screen.queryByText("Mensaje viejo")).not.toBeInTheDocument();
    expect(screen.queryByText("Respuesta anterior")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tu mensaje")).toHaveValue("");
  });
});
