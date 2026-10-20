import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMindfulnessBreathingVoice } from "@/hooks/use-mindfulness";

describe("useMindfulnessBreathingVoice", () => {
  const spoken: SpeechSynthesisUtterance[] = [];
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
      speak: (u: SpeechSynthesisUtterance) => spoken.push(u),
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
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts in idle state and reports supported", () => {
    const { result } = renderHook(() => useMindfulnessBreathingVoice());
    expect(result.current.isActive).toBe(false);
    expect(result.current.phase).toBe("idle");
    expect(result.current.phaseText).toBe("");
    expect(result.current.supported).toBe(true);
  });

  it("starts guided mindfulness with slow pace and inhale phase", () => {
    const { result } = renderHook(() => useMindfulnessBreathingVoice());

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.phase).toBe("inhale");
    expect(result.current.phaseText).toContain("Inhala");
    expect(spoken.length).toBeGreaterThan(0);
    expect(spoken[0]?.text).toContain("Inhala");
    expect(spoken[0]?.lang).toBe("es-ES");
    expect(spoken[0]?.rate).toBe(0.85);
  });

  it("advances to exhale phase after 5 seconds", () => {
    const { result } = renderHook(() => useMindfulnessBreathingVoice());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.phase).toBe("exhale");
    expect(result.current.phaseText).toContain("Exhala");
    expect(spoken.length).toBe(2);
    expect(spoken[1]?.text).toContain("Exhala");
  });

  it("stops immediately and cancels voice when user decides to end", () => {
    const { result } = renderHook(() => useMindfulnessBreathingVoice());

    act(() => {
      result.current.start();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.phase).toBe("idle");
    expect(result.current.phaseText).toBe("");
    expect(cancelMock).toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const { result, unmount } = renderHook(() => useMindfulnessBreathingVoice());

    act(() => {
      result.current.start();
    });
    expect(result.current.isActive).toBe(true);

    unmount();
    expect(cancelMock).toHaveBeenCalled();
  });
});
