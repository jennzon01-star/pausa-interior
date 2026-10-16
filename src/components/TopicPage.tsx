import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTopic, takePendingMessage, topics, type TopicSlug } from "@/lib/topics";
import { TopicIcon } from "@/components/TopicIcon";
import { ArrowUp } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { appendDemoTurn, type ConversationMessage } from "@/lib/conversation";

export function TopicPage({ slug }: { slug: TopicSlug }) {
  return <TopicConversation key={slug} slug={slug} />;
}

function TopicConversation({ slug }: { slug: TopicSlug }) {
  const topic = getTopic(slug);
  const [msgs, setMsgs] = useState<ConversationMessage[]>([{ id: "intro", role: "assistant", content: topic.intro, source: "demo" }]);
  const [text, setText] = useState("");

  const send = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setMsgs((m) => appendDemoTurn(m, v, slug));
    setText("");
  };

  useEffect(() => {
    const p = takePendingMessage();
    if (p) setMsgs((m) => appendDemoTurn(m, p, slug));
  }, [slug]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <Link to="/" className="min-w-0 font-serif text-xl text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Pausa Interior</Link>
        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          Modo demostración
        </span>
      </header>

      <nav aria-label="Opciones de acompañamiento" className="mt-6 flex flex-wrap gap-2">
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={`/${t.slug}` as const}
            className="inline-flex min-w-0 items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            activeProps={{ className: "!bg-primary !text-primary-foreground border-primary" }}
          >
            <TopicIcon slug={t.slug} className="size-4 shrink-0" /> <span className="min-w-0">{t.title}</span>
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

      <Conversation aria-label="Conversación de demostración" aria-live="polite" initial="instant" resize="instant" className="mt-6 h-[min(52dvh,32rem)] min-h-64 flex-none">
        <ConversationContent className="gap-6 px-0 py-3">
        {msgs.map((m, i) => (
          <Message key={m.id} from={m.role} className="max-w-[92%] sm:max-w-[85%]">
            {m.role === "assistant" && <span className="flex items-center gap-2 text-xs font-semibold text-primary"><TopicIcon slug={slug} className="size-4 shrink-0" />{i === 0 ? "Pausa Interior · demostración sin IA" : "Respuesta simulada · sin IA"}</span>}
            <MessageContent className={m.role === "user" ? "whitespace-pre-wrap [overflow-wrap:anywhere] text-base leading-relaxed group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : "text-base leading-relaxed [overflow-wrap:anywhere]"}>
              {m.role === "assistant" ? <MessageResponse mode="static" parseIncompleteMarkdown={false}>{m.content}</MessageResponse> : m.content}
            </MessageContent>
          </Message>
        ))}
        </ConversationContent>
        <ConversationScrollButton aria-label="Ver los últimos mensajes" title="Ver los últimos mensajes" />
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
          onChange={(e) => setText(e.target.value)}
          placeholder="Puedes contarme lo que quieras…"
          className="min-h-20 min-w-0 w-full px-4 text-base outline-none placeholder:text-muted-foreground"
        />
        <PromptInputFooter className="justify-end px-3 pb-3">
          <PromptInputSubmit status="ready" disabled={!text.trim()} aria-label="Enviar" title="Enviar" className="size-11 shrink-0 rounded-2xl"><ArrowUp className="size-5" /></PromptInputSubmit>
        </PromptInputFooter>
      </PromptInput>
      <p id="conversation-privacy" className="mt-3 text-center text-xs leading-relaxed text-secondary-foreground">
        Demostración sin IA · frases simuladas según palabras clave; pueden no encajar. No se guardan las conversaciones.
      </p>
    </main>
  );
}
