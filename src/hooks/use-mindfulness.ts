import { useCallback, useEffect, useRef, useState } from "react";
import { pickSpanishVoice } from "@/hooks/use-speech";

export type BreathingPhase = "idle" | "inhale" | "exhale";

const INHALE_PHRASES = [
  "Inhala suavemente...",
  "Inhala con calma...",
  "Toma aire despacio...",
  "Inhala profundo...",
];

const EXHALE_PHRASES = [
  "Exhala despacio...",
  "Suelta el aire con tranquilidad...",
  "Exhala suavemente...",
  "Deja salir todo el aire...",
];

const INHALE_CAPTIONS = [
  "Inhala suavemente mientras el círculo crece",
  "Inhala con calma, sintiendo el aire entrar",
  "Toma aire despacio, llenando tus pulmones",
  "Inhala profundo a tu propio ritmo",
];

const EXHALE_CAPTIONS = [
  "Exhala despacio mientras el círculo se encoge",
  "Suelta el aire con tranquilidad",
  "Exhala suavemente y deja ir la tensión",
  "Deja salir todo el aire con serenidad",
];

export function useMindfulnessBreathingVoice() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>("idle");
  const [phaseText, setPhaseText] = useState("");
  const [cycleCount, setCycleCount] = useState(0);
  const [supported, setSupported] = useState(false);

  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const cycleRef = useRef(0);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speakPhrase = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.85; // Ritmo pausado y relajado para mindfulness
    const voice = pickSpanishVoice(window.speechSynthesis.getVoices());
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsActive(false);
    setPhase("idle");
    setPhaseText("");
    setCycleCount(0);
  }, []);

  const runStep = useCallback(
    (currentPhase: "inhale" | "exhale") => {
      if (!activeRef.current) return;

      const cycle = cycleRef.current;
      const index = cycle % INHALE_PHRASES.length;

      if (currentPhase === "inhale") {
        setPhase("inhale");
        const phrase = INHALE_PHRASES[index]!;
        const caption = INHALE_CAPTIONS[index]!;
        setPhaseText(caption);
        speakPhrase(phrase);

        // Cada medio ciclo del círculo animate-breathe dura 5 segundos (5000ms)
        timerRef.current = window.setTimeout(() => {
          runStep("exhale");
        }, 5000);
      } else {
        setPhase("exhale");
        const phrase = EXHALE_PHRASES[index]!;
        const caption = EXHALE_CAPTIONS[index]!;
        setPhaseText(caption);
        speakPhrase(phrase);

        timerRef.current = window.setTimeout(() => {
          if (!activeRef.current) return;
          cycleRef.current += 1;
          setCycleCount(cycleRef.current);
          runStep("inhale");
        }, 5000);
      }
    },
    [speakPhrase],
  );

  const start = useCallback(() => {
    stop();
    activeRef.current = true;
    cycleRef.current = 0;
    setIsActive(true);
    setCycleCount(0);
    runStep("inhale");
  }, [stop, runStep]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    phase,
    phaseText,
    cycleCount,
    supported,
    start,
    stop,
  };
}
