import { useCallback, useEffect, useRef, useState } from "react";
import { pickSpanishVoice } from "@/hooks/use-speech";

export type BodyRelaxStep = {
  zone: string;
  instruction: string;
  voiceText: string;
};

const BODY_RELAX_STEPS: BodyRelaxStep[] = [
  {
    zone: "Hombros y cuello",
    instruction: "Baja los hombros suavemente, suelta la mandíbula y descansa el cuello sin tensión.",
    voiceText: "Baja los hombros con suavidad, suelta la mandíbula y deja descansar tu cuello.",
  },
  {
    zone: "Manos y brazos",
    instruction: "Abre y afloja tus manos sobre las piernas o la mesa; nota cómo se descargan.",
    voiceText: "Abre y afloja tus manos. Nota cómo se descargan los brazos.",
  },
  {
    zone: "Espalda y pecho",
    instruction: "Apóyate cómodamente en el respaldo, siente cómo el pecho y la espalda se expanden al respirar.",
    voiceText: "Siente el apoyo en tu espalda. Permite que el pecho se relaje.",
  },
  {
    zone: "Pies y piernas",
    instruction: "Apoya bien las plantas de los pies sobre el suelo y siente la firmeza de la tierra.",
    voiceText: "Siente tus pies en el suelo, firmes y en descanso.",
  },
];

export function useBodyRelaxationVoice() {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [supported, setSupported] = useState(false);

  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const stepRef = useRef(0);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speakPhrase = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.85; // Ritmo pausado y relajado
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
    setStepIndex(0);
  }, []);

  const runStep = useCallback(
    (index: number) => {
      if (!activeRef.current) return;
      const current = BODY_RELAX_STEPS[index % BODY_RELAX_STEPS.length]!;
      stepRef.current = index % BODY_RELAX_STEPS.length;
      setStepIndex(stepRef.current);
      speakPhrase(current.voiceText);

      // Cada estación dura 7 segundos (7000ms)
      timerRef.current = window.setTimeout(() => {
        if (!activeRef.current) return;
        runStep((index + 1) % BODY_RELAX_STEPS.length);
      }, 7000);
    },
    [speakPhrase],
  );

  const start = useCallback(() => {
    activeRef.current = true;
    setIsActive(true);
    stepRef.current = 0;
    setStepIndex(0);
    runStep(0);
  }, [runStep]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentStep = BODY_RELAX_STEPS[stepIndex]!;

  return {
    isActive,
    currentStep,
    stepIndex,
    totalSteps: BODY_RELAX_STEPS.length,
    supported,
    start,
    stop,
  };
}
