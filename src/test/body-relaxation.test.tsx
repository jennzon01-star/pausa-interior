import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBodyRelaxationVoice } from "@/hooks/use-body-relaxation";

describe("useBodyRelaxationVoice", () => {
  const spoken: any[] = [];
  const cancelMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    spoken.length = 0;
    cancelMock.mockReset();

    const voices = [
      { lang: "es-ES", localService: true },
      { lang: "en-US", localService: false },
    ] as SpeechSynthesisVoice[];

    vi.stubGlobal("speechSynthesis", {
      getVoices: () => voices,
      speak: (u: any) => spoken.push(u),
      cancel: cancelMock,
    });

    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        text: string;
        lang = "";
        rate = 1;
        voice: SpeechSynthesisVoice | null = null;
        constructor(text: string) {
          this.text = text;
        }
      },
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("initializes with idle state", () => {
    const { result } = renderHook(() => useBodyRelaxationVoice());
    expect(result.current.isActive).toBe(false);
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(4);
  });

  it("starts guided relaxation and speaks step", () => {
    const { result } = renderHook(() => useBodyRelaxationVoice());
    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep.zone).toBe("Hombros y cuello");
    expect(spoken.length).toBeGreaterThan(0);
  });

  it("advances to next body station with timers", () => {
    const { result } = renderHook(() => useBodyRelaxationVoice());
    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(result.current.stepIndex).toBe(1);
    expect(result.current.currentStep.zone).toBe("Manos y brazos");
  });

  it("stops guided relaxation and resets", () => {
    const { result } = renderHook(() => useBodyRelaxationVoice());
    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.stepIndex).toBe(0);
    expect(cancelMock).toHaveBeenCalled();
  });
});
