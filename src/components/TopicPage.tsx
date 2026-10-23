import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getTopic, takePendingMessage, topics, type TopicSlug } from "@/lib/topics";
import { TopicIcon } from "@/components/TopicIcon";
import { ArrowUp, Brain, Compass, Droplets, Eye, Heart, Mic, MicOff, RotateCcw, ShieldCheck, Sparkles, Square, Volume2 } from "lucide-react";
import { useDictation, useSpeechSynthesis } from "@/hooks/use-speech";
import { useMindfulnessBreathingVoice } from "@/hooks/use-mindfulness";
import { useBodyRelaxationVoice } from "@/hooks/use-body-relaxation";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  appendAssistantMessage,
  appendUserMessage,
  respondWithDemo,
  type ConversationMessage,
  type ConversationReply,
} from "@/lib/conversation";
import { sendChatTurn } from "@/lib/chat.functions";

async function requestReply(
  topic: TopicSlug,
  history: readonly ConversationMessage[],
): Promise<ConversationReply> {
  try {
    return await sendChatTurn({
      data: {
        topic,
        messages: history.map(({ role, content }) => ({ role, content })),
      },
    });
  } catch {
    // Server unreachable or input rejected: stay usable with the offline responder.
    return { reply: respondWithDemo({ topic, messages: history }), source: "demo" };
  }
}

export function TopicPage({ slug }: { slug: TopicSlug }) {
  return <TopicConversation key={slug} slug={slug} />;
}

function TopicConversation({ slug }: { slug: TopicSlug }) {
  const topic = getTopic(slug);
  const [msgs, setMsgs] = useState<ConversationMessage[]>([
    { id: "intro", role: "assistant", content: topic.intro, source: "demo" },
  ]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const alive = useRef(true);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const scrollToInput = (focus = false) => {
    setTimeout(() => {
      if (inputContainerRef.current) {
        if (typeof inputContainerRef.current.scrollIntoView === "function") {
          inputContainerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        } else if (typeof window !== "undefined") {
          const rect = inputContainerRef.current.getBoundingClientRect();
          window.scrollTo({
            top: window.scrollY + rect.top - 80,
            behavior: "smooth",
          });
        }
      }
      if (focus) {
        const textarea = inputContainerRef.current?.querySelector("textarea");
        textarea?.focus({ preventScroll: true });
      }
    }, 120);
  };

  useEffect(() => {
    alive.current = true;
    return () => {
      // Al cambiar de opción nada de esta conversación debe seguir vivo.
      alive.current = false;
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);
  const lastReplySource = msgs.length > 1 ? msgs.at(-1)?.source : undefined;
  const demoMode = lastReplySource === "demo";
  const speech = useSpeechSynthesis();
  const mindfulness = useMindfulnessBreathingVoice();
  const bodyRelaxation = useBodyRelaxationVoice();
  const dictation = useDictation({
    onFinalTranscript: (t) => {
      setText((prev) => (prev ? `${prev} ${t}` : t));
      scrollToInput(true);
    },
  });

  const resetConversation = () => {
    if (dictation.status === "listening") dictation.stop();
    if (speech.speaking) speech.stop();
    if (mindfulness.isActive) mindfulness.stop();
    if (bodyRelaxation.isActive) bodyRelaxation.stop();
    setMsgs([{ id: "intro", role: "assistant", content: topic.intro, source: "demo" }]);
    setText("");
    scrollToInput(true);
  };

  const handleStopMindfulness = () => {
    mindfulness.stop();
    const followUp = "¿Cómo te sientes ahora? ¿Quieres continuar la conversación?";
    setMsgs((m) => appendAssistantMessage(m, followUp, demoMode ? "demo" : "ai"));
    if (speech.supported) {
      speech.speak(followUp);
    }
    scrollToInput();
  };

  const handleStopBodyRelaxation = () => {
    bodyRelaxation.stop();
    const followUp = "¿Cómo se siente tu cuerpo tras esta pausa? Puedes contarme o seguir a tu ritmo.";
    setMsgs((m) => appendAssistantMessage(m, followUp, demoMode ? "demo" : "ai"));
    if (speech.supported) {
      speech.speak(followUp);
    }
    scrollToInput();
  };

  const ask = async (value: string, current: readonly ConversationMessage[]) => {
    const history = appendUserMessage(current, value);
    if (history.length === current.length) return;
    setMsgs(history);
    setPending(true);
    const { reply, source } = await requestReply(slug, history);
    if (!alive.current) return;
    setMsgs((m) => appendAssistantMessage(m, reply, source));
    setPending(false);
    scrollToInput();
  };

  const send = (value: string) => {
    const v = value.trim();
    if (!v || pending) return;
    if (dictation.status === "listening") dictation.stop();
    setText("");
    void ask(v, msgs);
  };

  const toggleDictation = () => {
    if (dictation.status === "listening") dictation.stop();
    else {
      dictation.start();
      scrollToInput(true);
    }
  };

  const handleDifficultyAction = (action: "thoughts" | "resources" | "alternatives") => {
    if (pending) return;
    if (dictation.status === "listening") dictation.stop();
    const currentInput = text.trim();
    setText("");
    let promptText = "";
    if (action === "thoughts") {
      promptText = currentInput
        ? `${currentInput}\n\nQuisiera ayuda para ordenar mis pensamientos sobre esto.`
        : "Quiero ayuda para ordenar mis pensamientos sobre lo que está pasando.";
    } else if (action === "resources") {
      promptText = currentInput
        ? `${currentInput}\n\nMe gustaría reconocer mis recursos y fortalezas para afrontar esto.`
        : "Me gustaría reconocer mis recursos y fortalezas para afrontar esta situación.";
    } else {
      promptText = currentInput
        ? `${currentInput}\n\nQuiero considerar alternativas y opciones para afrontar esto.`
        : "Quiero considerar alternativas y opciones para afrontar esta situación.";
    }
    void ask(promptText, msgs);
    scrollToInput();
  };

  const handleWellnessAction = (action: "screen" | "hydration" | "stretch" | "gratitude") => {
    if (pending) return;
    if (dictation.status === "listening") dictation.stop();
    const currentInput = text.trim();
    setText("");
    let promptText = "";
    if (action === "screen") {
      promptText = currentInput
        ? `${currentInput}\n\nQuiero hacer una pausa de pantalla y descansar la vista.`
        : "Quiero hacer una pausa de pantalla y descansar la vista unos momentos.";
    } else if (action === "hydration") {
      promptText = currentInput
        ? `${currentInput}\n\nVoy a tomar un vaso de agua con calma para hidratarme.`
        : "Voy a tomar un vaso de agua con calma para hidratarme.";
    } else if (action === "stretch") {
      promptText = currentInput
        ? `${currentInput}\n\nQuiero estirar la espalda y relajar los hombros.`
        : "Quiero estirar la espalda y relajar los hombros un momento.";
    } else {
      promptText = currentInput
        ? `${currentInput}\n\nQuiero reconocer un pequeño detalle o momento positivo de mi día.`
        : "Quiero reconocer un pequeño detalle o momento positivo de mi día.";
    }
    void ask(promptText, msgs);
    scrollToInput();
  };

  useEffect(() => {
    const p = takePendingMessage();
    if (p) {
      void ask(p, msgs);
    } else {
      // Si entra directamente a la página, enfoca y acomoda la vista al campo
      scrollToInput();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per slug (component is keyed by slug)
  }, [slug]);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-3.5 py-4 sm:px-5 sm:py-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <Link
          to="/"
          className="min-w-0 font-serif text-xl text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Pausa Interior
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetConversation}
            disabled={pending || (msgs.length <= 1 && !text.trim())}
            aria-label="Nueva conversación"
            title="Iniciar nueva conversación"
            className="h-8 gap-1.5 rounded-full px-3 text-xs"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Nueva conversación</span>
            <span className="sm:hidden">Reiniciar</span>
          </Button>
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            {demoMode ? "Modo demostración" : "Asistente de IA"}
          </span>
        </div>
      </header>

      <nav
        aria-label="Opciones de acompañamiento"
        className="mt-4 sm:mt-6 flex gap-2 overflow-x-auto pb-1.5 sm:flex-wrap sm:pb-0 scrollbar-none -mx-1 px-1"
      >
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={`/${t.slug}` as const}
            className="inline-flex shrink-0 min-w-0 items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-xs sm:text-sm text-muted-foreground transition-all hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            activeProps={{ className: "!bg-primary !text-primary-foreground border-primary shadow-xs" }}
          >
            <TopicIcon slug={t.slug} className="size-4 shrink-0" />{" "}
            <span className="min-w-0 font-medium">{t.title}</span>
          </Link>
        ))}
      </nav>

      <h1 className="mt-5 text-2xl font-serif text-foreground sm:mt-8 sm:text-3xl">{topic.title}</h1>

      {slug === "calma" && (
        <section
          aria-label="Guía de respiración y mindfulness"
          className="my-8 flex flex-col items-center justify-center gap-5 rounded-3xl border bg-card/60 p-6 text-center shadow-sm backdrop-blur-xs"
        >
          <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-accent/70 shadow-inner">
            <div className="animate-breathe h-40 w-40 rounded-full bg-sage/70" />
            <span
              aria-live="polite"
              className="absolute text-center font-serif text-sm font-semibold tracking-wide text-primary-foreground drop-shadow-xs select-none"
            >
              {mindfulness.isActive
                ? mindfulness.phase === "inhale"
                  ? "Inhala"
                  : "Exhala"
                : "Respira"}
            </span>
          </div>

          <div className="min-h-12 max-w-md px-2" aria-live="polite">
            {mindfulness.isActive ? (
              <p className="text-base font-medium text-primary">{mindfulness.phaseText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sigue la voz y el ritmo del círculo para inhalar y exhalar con calma.
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            {mindfulness.isActive ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleStopMindfulness}
                aria-label="Terminar ejercicio de respiración guiada"
                className="h-12 gap-2 rounded-full border-primary/40 px-6 font-medium text-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              >
                <Square className="size-4 shrink-0 fill-current" />
                <span>Terminar cuando quieras</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={mindfulness.start}
                aria-label="Iniciar guía de respiración consciente con voz"
                className="h-12 gap-2 rounded-full px-6 font-medium shadow-sm"
              >
                <Volume2 className="size-5 shrink-0" />
                <span>Iniciar guía con voz</span>
              </Button>
            )}
            {mindfulness.isActive && (
              <span className="text-xs text-muted-foreground">
                Ciclo {mindfulness.cycleCount + 1} · Decide con libertad cuándo terminar
              </span>
            )}
          </div>
        </section>
      )}

      {slug === "dificultad" && (
        <section
          aria-label="Acompañamiento para afrontar una dificultad"
          className="my-6 rounded-3xl border bg-card/60 p-5 shadow-sm backdrop-blur-xs"
        >
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Acompañamiento paso a paso
            </span>
            <h2 className="text-lg font-medium text-foreground">
              ¿Por dónde te gustaría empezar?
            </h2>
            <p className="text-sm text-muted-foreground">
              Cuando lo desees, puedes elegir una de estas opciones para avanzar juntos o escribir directamente abajo.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDifficultyAction("thoughts")}
              disabled={pending}
              aria-label="Ordenar mis pensamientos"
              className="group h-auto flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left whitespace-normal shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                <Brain className="size-4" />
              </div>
              <div className="w-full">
                <span className="block text-sm font-medium text-foreground">
                  Ordenar pensamientos
                </span>
                <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                  Desglosar la situación y separar lo que puedes controlar de lo que no.
                </span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleDifficultyAction("resources")}
              disabled={pending}
              aria-label="Reconocer mis recursos"
              className="group h-auto flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left whitespace-normal shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                <ShieldCheck className="size-4" />
              </div>
              <div className="w-full">
                <span className="block text-sm font-medium text-foreground">
                  Reconocer mis recursos
                </span>
                <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                  Identificar tus fortalezas, aprendizajes o apoyos, si quieres.
                </span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleDifficultyAction("alternatives")}
              disabled={pending}
              aria-label="Considerar alternativas"
              className="group h-auto flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left whitespace-normal shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                <Compass className="size-4" />
              </div>
              <div className="w-full">
                <span className="block text-sm font-medium text-foreground">
                  Considerar alternativas
                </span>
                <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                  Explorar opciones viables y definir un primer paso pequeño y realista.
                </span>
              </div>
            </Button>
          </div>
        </section>
      )}

      {slug === "bienestar" && (
        <section
          aria-label="Pausa y cuidado de bienestar personal"
          className="my-6 space-y-6"
        >
          {/* Guía interactiva de relajación corporal */}
          <div className="flex flex-col items-center justify-center rounded-3xl border bg-card/60 p-6 shadow-sm backdrop-blur-xs text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Pausa corporal guiada
            </span>
            <h2 className="mt-1 text-lg font-medium text-foreground">
              Soltar tensión y descargar el cuerpo
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Una breve pausa para recorrer hombros, manos, espalda y pies, devolviendo ligereza a tu jornada.
            </p>

            <div className="my-6 flex flex-col items-center justify-center">
              <div
                className={`relative flex size-36 sm:size-40 items-center justify-center rounded-full border-2 transition-all duration-700 ${
                  bodyRelaxation.isActive
                    ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/15 scale-105"
                    : "border-primary/20 bg-secondary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-1 px-4 text-center">
                  <Heart
                    className={`size-7 text-primary transition-transform duration-500 ${
                      bodyRelaxation.isActive ? "scale-110 animate-pulse" : ""
                    }`}
                  />
                  <span className="text-xs font-medium text-foreground">
                    {bodyRelaxation.isActive
                      ? bodyRelaxation.currentStep.zone
                      : "Pausa en calma"}
                  </span>
                </div>
              </div>

              {bodyRelaxation.isActive && (
                <div className="mt-4 max-w-sm px-4">
                  <p className="text-sm font-medium text-primary">
                    {bodyRelaxation.currentStep.instruction}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estación {bodyRelaxation.stepIndex + 1} de {bodyRelaxation.totalSteps}
                  </p>
                </div>
              )}
            </div>

            <div>
              {bodyRelaxation.isActive ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleStopBodyRelaxation}
                  aria-label="Terminar pausa corporal"
                  className="h-12 gap-2 rounded-full border-primary/40 px-6 font-medium text-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Square className="size-4 shrink-0 fill-current" />
                  <span>Terminar pausa</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={bodyRelaxation.start}
                  aria-label="Iniciar pausa corporal con voz"
                  className="h-12 gap-2 rounded-full px-6 font-medium shadow-sm"
                >
                  <Volume2 className="size-5 shrink-0" />
                  <span>Iniciar pausa con voz</span>
                </Button>
              )}
            </div>
          </div>

          {/* Tarjetas de micro-pausas interactivas */}
          <div className="rounded-3xl border bg-card/60 p-5 shadow-sm backdrop-blur-xs">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Micro-pausas de autocuidado
              </span>
              <h3 className="text-base font-medium text-foreground">
                Pequeños gestos para tu momento actual
              </h3>
              <p className="text-xs text-muted-foreground">
                Elige uno para acompañarte o escribe tu propio mensaje libremente.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleWellnessAction("screen")}
                disabled={pending || bodyRelaxation.isActive}
                aria-label="Pausa de pantalla y descanso visual"
                className="group h-auto flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left whitespace-normal shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                  <Eye className="size-4" />
                </div>
                <div className="w-full">
                  <span className="block text-sm font-medium text-foreground">
                    Descanso visual
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                    Apartar la vista de pantallas y soltar la tensión ocular.
                  </span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleWellnessAction("hydration")}
                disabled={pending || bodyRelaxation.isActive}
                aria-label="Hidratación consciente"
                className="group h-auto flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left whitespace-normal shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                  <Droplets className="size-4" />
                </div>
                <div className="w-full">
                  <span className="block text-sm font-medium text-foreground">
                    Hidratación consciente
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                    Tomar un vaso de agua despacio para reanimar el cuerpo.
                  </span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleWellnessAction("stretch")}
                disabled={pending || bodyRelaxation.isActive}
                aria-label="Estiramiento suave"
                className="group h-auto flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left whitespace-normal shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                  <Sparkles className="size-4" />
                </div>
                <div className="w-full">
                  <span className="block text-sm font-medium text-foreground">
                    Estiramiento suave
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                    Desentumecer hombros y espalda en un minuto.
                  </span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleWellnessAction("gratitude")}
                disabled={pending || bodyRelaxation.isActive}
                aria-label="Reconocer el día"
                className="group h-auto flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left whitespace-normal shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                  <Heart className="size-4" />
                </div>
                <div className="w-full">
                  <span className="block text-sm font-medium text-foreground">
                    Reconocer el día
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                    Agradecer o valorar un pequeño gesto grato de hoy.
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </section>
      )}

      <Conversation
        aria-label="Conversación"
        aria-live="polite"
        initial="instant"
        resize="instant"
        className="mt-4 sm:mt-6 h-[min(48dvh,32rem)] min-h-56 sm:min-h-64 flex-none"
      >
        <ConversationContent className="gap-4 sm:gap-6 px-0 py-2 sm:py-3">
          {msgs.map((m, i) => (
            <Message key={m.id} from={m.role} className="max-w-[95%] sm:max-w-[85%]">
              {m.role === "assistant" && (
                <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <TopicIcon slug={slug} className="size-4 shrink-0" />
                  {i === 0
                    ? "Pausa Interior · bienvenida"
                    : m.source === "ai"
                      ? "Respuesta de IA · no es un profesional"
                      : "Respuesta simulada · sin IA"}
                  {speech.supported && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => speech.speak(m.content)}
                      aria-label={`Escuchar respuesta ${i + 1} en voz alta`}
                      title="Escuchar en voz alta"
                      className="h-6 gap-1 px-2 text-xs font-normal text-muted-foreground"
                    >
                      <Volume2 className="size-3.5" /> Escuchar
                    </Button>
                  )}
                </span>
              )}
              <MessageContent
                className={
                  m.role === "user"
                    ? "whitespace-pre-wrap [overflow-wrap:anywhere] text-sm sm:text-base leading-relaxed group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                    : "text-sm sm:text-base leading-relaxed [overflow-wrap:anywhere]"
                }
              >
                {m.role === "assistant" ? (
                  <MessageResponse mode="static" parseIncompleteMarkdown={false}>
                    {m.content}
                  </MessageResponse>
                ) : (
                  m.content
                )}
              </MessageContent>
            </Message>
          ))}
          {pending && (
            <p role="status" className="text-sm text-muted-foreground">
              Pensando una respuesta…
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton
          aria-label="Ver los últimos mensajes"
          title="Ver los últimos mensajes"
        />
      </Conversation>

      {!mindfulness.isActive && !bodyRelaxation.isActive && (
        <div ref={inputContainerRef} className="mt-3 sm:mt-6 scroll-mt-20 sm:scroll-mt-6">
          <PromptInput
            onSubmit={({ text: value }) => send(value)}
            maxFiles={0}
            className="[&_[data-slot=input-group]]:rounded-3xl [&_[data-slot=input-group]]:bg-card [&_[data-slot=input-group]]:shadow-xs sm:[&_[data-slot=input-group]]:shadow-sm"
          >
            <PromptInputTextarea
              aria-label="Tu mensaje"
              aria-describedby="conversation-privacy"
              value={text}
              disabled={pending}
              onChange={(e) => setText(e.target.value)}
              placeholder="Puedes contarme lo que quieras…"
              className="min-h-16 sm:min-h-20 min-w-0 w-full px-3.5 sm:px-4 py-2.5 text-base outline-none placeholder:text-muted-foreground leading-relaxed"
            />
            <PromptInputFooter className="justify-end gap-2 px-3 pb-3">
              {dictation.supported && (
                <Button
                  type="button"
                  variant={dictation.status === "listening" ? "default" : "outline"}
                  size="icon"
                  onClick={toggleDictation}
                  aria-label={
                    dictation.status === "listening"
                      ? "Detener dictado por voz"
                      : "Dictar mensaje por voz"
                  }
                  aria-pressed={dictation.status === "listening"}
                  title={
                    dictation.status === "listening"
                      ? "Detener dictado por voz"
                      : "Dictar mensaje por voz"
                  }
                  className="size-11 shrink-0 rounded-2xl"
                >
                  {dictation.status === "listening" ? (
                    <MicOff className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </Button>
              )}
              {speech.speaking && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={speech.stop}
                  aria-label="Detener la reproducción hablada"
                  title="Detener la reproducción hablada"
                  className="size-11 shrink-0 rounded-2xl"
                >
                  <Square className="size-5" />
                </Button>
              )}
              <PromptInputSubmit
                status={pending ? "submitted" : "ready"}
                disabled={!text.trim() || pending}
                aria-label="Enviar"
                title="Enviar"
                className="size-11 shrink-0 rounded-2xl"
              >
                <ArrowUp className="size-5" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
          <div aria-live="polite" className="mt-3 space-y-1">
            {dictation.status === "listening" && (
              <p className="text-center text-sm text-primary">
                Escuchando… habla con calma; el texto aparecerá en el cuadro para que lo revises
                antes de enviarlo.
                {dictation.interim && (
                  <span className="block text-muted-foreground">{dictation.interim}</span>
                )}
              </p>
            )}
            {dictation.status === "unsupported" && (
              <p className="text-center text-sm text-muted-foreground">
                Este navegador no admite dictado por voz. Puedes seguir escribiendo tu mensaje con
                el teclado.
              </p>
            )}
            {dictation.status === "denied" && (
              <p className="text-center text-sm text-muted-foreground">
                No se pudo usar el micrófono porque el permiso fue denegado. Puedes activarlo en la
                configuración del navegador o seguir escribiendo con el teclado.
              </p>
            )}
            {dictation.status === "error" && (
              <p className="text-center text-sm text-muted-foreground">
                El dictado por voz se interrumpió. Puedes intentarlo de nuevo o escribir tu mensaje.
              </p>
            )}
            {speech.speaking && (
              <p className="text-center text-sm text-primary">
                Reproduciendo respuesta en voz alta…
              </p>
            )}
          </div>
          <p
            id="conversation-privacy"
            className="mt-3 text-center text-xs leading-relaxed text-secondary-foreground"
          >
            {demoMode
              ? "Demostración sin IA · frases simuladas según palabras clave; pueden no encajar. No se guardan las conversaciones."
              : "Las respuestas las genera una inteligencia artificial y no sustituyen a un profesional. Tus mensajes se envían a un servicio de IA (Google Gemini) solo para responder; no se guardan las conversaciones. Si el servicio no está disponible, verás respuestas simuladas sin IA."}
          </p>
        </div>
      )}
    </main>
  );
}
