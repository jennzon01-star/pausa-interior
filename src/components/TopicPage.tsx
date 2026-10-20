import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTopic, takePendingMessage, topics, type TopicSlug } from "@/lib/topics";
import { TopicIcon } from "@/components/TopicIcon";
import { ArrowUp, Mic, MicOff, RotateCcw, Square, Volume2 } from "lucide-react";
import { useDictation, useSpeechSynthesis } from "@/hooks/use-speech";
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
  const lastReplySource = msgs.length > 1 ? msgs.at(-1)?.source : undefined;
  const demoMode = lastReplySource === "demo";
  const speech = useSpeechSynthesis();
  const dictation = useDictation({
    onFinalTranscript: (t) => setText((prev) => (prev ? `${prev} ${t}` : t)),
  });

  const resetConversation = () => {
    if (dictation.status === "listening") dictation.stop();
    if (speech.speaking) speech.stop();
    setMsgs([{ id: "intro", role: "assistant", content: topic.intro, source: "demo" }]);
    setText("");
  };

  const ask = async (value: string, current: readonly ConversationMessage[]) => {
    const history = appendUserMessage(current, value);
    if (history.length === current.length) return;
    setMsgs(history);
    setPending(true);
    const { reply, source } = await requestReply(slug, history);
    setMsgs((m) => appendAssistantMessage(m, reply, source));
    setPending(false);
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
    else dictation.start();
  };

  useEffect(() => {
    const p = takePendingMessage();
    if (p) void ask(p, msgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per slug (component is keyed by slug)
  }, [slug]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
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

      <nav aria-label="Opciones de acompañamiento" className="mt-6 flex flex-wrap gap-2">
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={`/${t.slug}` as const}
            className="inline-flex min-w-0 items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            activeProps={{ className: "!bg-primary !text-primary-foreground border-primary" }}
          >
            <TopicIcon slug={t.slug} className="size-4 shrink-0" />{" "}
            <span className="min-w-0">{t.title}</span>
          </Link>
        ))}
      </nav>

      <h1 className="mt-8 text-3xl text-foreground">{topic.title}</h1>

      {slug === "calma" && (
        <div className="my-8 flex justify-center">
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-accent">
            <div className="animate-breathe h-40 w-40 rounded-full bg-sage/70" />
          </div>
        </div>
      )}

      <Conversation
        aria-label="Conversación"
        aria-live="polite"
        initial="instant"
        resize="instant"
        className="mt-6 h-[min(52dvh,32rem)] min-h-64 flex-none"
      >
        <ConversationContent className="gap-6 px-0 py-3">
          {msgs.map((m, i) => (
            <Message key={m.id} from={m.role} className="max-w-[92%] sm:max-w-[85%]">
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
                    ? "whitespace-pre-wrap [overflow-wrap:anywhere] text-base leading-relaxed group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                    : "text-base leading-relaxed [overflow-wrap:anywhere]"
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

      <PromptInput
        onSubmit={({ text: value }) => send(value)}
        maxFiles={0}
        className="mt-6 [&_[data-slot=input-group]]:rounded-3xl [&_[data-slot=input-group]]:bg-card [&_[data-slot=input-group]]:shadow-sm"
      >
        <PromptInputTextarea
          aria-label="Tu mensaje"
          aria-describedby="conversation-privacy"
          value={text}
          disabled={pending}
          onChange={(e) => setText(e.target.value)}
          placeholder="Puedes contarme lo que quieras…"
          className="min-h-20 min-w-0 w-full px-4 text-base outline-none placeholder:text-muted-foreground"
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
            Escuchando… habla con calma; el texto aparecerá en el cuadro para que lo revises antes
            de enviarlo.
            {dictation.interim && (
              <span className="block text-muted-foreground">{dictation.interim}</span>
            )}
          </p>
        )}
        {dictation.status === "unsupported" && (
          <p className="text-center text-sm text-muted-foreground">
            Este navegador no admite dictado por voz. Puedes seguir escribiendo tu mensaje con el
            teclado.
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
          <p className="text-center text-sm text-primary">Reproduciendo respuesta en voz alta…</p>
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
    </main>
  );
}
