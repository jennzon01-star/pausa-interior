import { useCallback, useEffect, useRef, useState } from "react";
import { pickSpanishVoice } from "@/hooks/use-speech";

export type BodyRelaxStep = {
  zone: string;
  instruction: string;
  voiceText: string;
};

const BODY_RELAX_STEPS: BodyRelaxStep[] = [
  {
    zone: "Rotación de hombros",
    instruction: "Rueda los hombros en círculos amplios: primero 3 veces hacia atrás y luego 3 hacia adelante.",
    voiceText: "Gira tus hombros en círculos hacia atrás, sintiendo cómo se abre el pecho. Ahora hacia adelante, soltando el peso.",
  },
  {
    zone: "Muñecas y manos",
    instruction: "Entrelaza los dedos y rota las muñecas suavemente en círculos; luego abre y estira bien las palmas.",
    voiceText: "Mueve tus muñecas en círculos suaves. Abre y cierra las manos para liberar la fatiga del teclado y el móvil.",
  },
  {
    zone: "Cuello y mandíbula",
    instruction: "Deja caer la oreja hacia el hombro con suavidad, relaja la mandíbula y respira profundo.",
    voiceText: "Inclina suavemente tu cuello hacia un lado y luego al otro. Suelta la mandíbula y entreabre los labios.",
  },
  {
    zone: "Espalda y apertura",
    instruction: "Lleva los codos hacia atrás para expandir el pecho, sostén 3 segundos y regresa al centro.",
    voiceText: "Abre suavemente el pecho llevando los codos hacia atrás. Siente cómo se alivia la espalda alta.",
  },
  {
    zone: "Pies y enraizamiento",
    instruction: "Apoya firmemente las plantas de los pies, mueve los dedos dentro del calzado y siente el suelo.",
    voiceText: "Siente el apoyo firme de tus pies en el suelo. Todo tu cuerpo encuentra estabilidad y reposo.",
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
