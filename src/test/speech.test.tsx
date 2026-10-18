import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDictation, useSpeechSynthesis } from "@/hooks/use-speech";

describe("Dictado por voz", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports unsupported when the browser has no speech recognition", () => {
    const { result } = renderHook(() => useDictation({ onFinalTranscript: () => {} }));
    expect(result.current.supported).toBe(false);
    act(() => result.current.start());
    expect(result.current.status).toBe("unsupported");
  });

  it("reports denied when microphone permission is refused", () => {
    const handlers: { onerror?: (e: { error: string }) => void } = {};
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult = null;
      onend = null;
      onerror: ((e: { error: string }) => void) | null = null;
      start() {
        this.onerror?.({ error: "not-allowed" });
      }
      stop() {}
      abort() {}
    }
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    const { result } = renderHook(() => useDictation({ onFinalTranscript: () => {} }));
    expect(result.current.supported).toBe(true);
    act(() => result.current.start());
    expect(result.current.status).toBe("denied");
    expect(handlers.onerror).toBeUndefined();
  });

  it("passes final transcripts to the message box and keeps Spanish as language", () => {
    const instances: Array<{
      lang: string;
      onresult: ((e: unknown) => void) | null;
    }> = [];
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror = null;
      onend = null;
      start() {
        instances.push(this);
      }
      stop() {}
      abort() {}
    }
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    const transcripts: string[] = [];
    const { result } = renderHook(() =>
      useDictation({ onFinalTranscript: (t) => transcripts.push(t) }),
    );
    act(() => result.current.start());
    expect(result.current.status).toBe("listening");
    expect(instances[0]?.lang).toBe("es-ES");
    act(() => {
      instances[0]?.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: "hola pausa" } }],
      });
    });
    expect(transcripts).toEqual(["hola pausa"]);
  });
});

describe("Síntesis de voz", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("prefers a Spanish voice and requests es-ES", () => {
    const spoken: SpeechSynthesisUtterance[] = [];
    const voices = [
      { lang: "en-US", localService: true },
      { lang: "es-CO", localService: false },
    ] as SpeechSynthesisVoice[];
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => voices,
      speak: (u: SpeechSynthesisUtterance) => spoken.push(u),
      cancel: () => {},
    });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        text: string;
        lang = "";
        rate = 1;
        voice: SpeechSynthesisVoice | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      },
    );
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.supported).toBe(true);
    act(() => result.current.speak("Respira con calma"));
    expect(spoken).toHaveLength(1);
    expect(spoken[0]?.lang).toBe("es-ES");
    expect(spoken[0]?.voice?.lang).toBe("es-CO");
  });
});
