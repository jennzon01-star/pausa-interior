import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getTopic, takePendingMessage, topics, type TopicSlug } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import { TopicIcon } from "@/components/TopicIcon";

type Msg = { from: "user" | "app"; text: string };

export function TopicPage({ slug }: { slug: TopicSlug }) {
  return <TopicConversation key={slug} slug={slug} />;
}

function TopicConversation({ slug }: { slug: TopicSlug }) {
  const topic = getTopic(slug);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "app", text: topic.intro }]);
  const [text, setText] = useState("");
  const idx = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  const send = (value: string) => {
    const v = value.trim();
    if (!v) return;
    const reply = topic.replies[idx.current % topic.replies.length] ?? topic.intro;
    idx.current++;
    setMsgs((m) => [...m, { from: "user", text: v }, { from: "app", text: reply }]);
    setText("");
  };

  useEffect(() => {
    const p = takePendingMessage();
    if (p) send(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (msgs.length > 1) end.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [msgs]);

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

      <section role="log" aria-label="Conversación de demostración" aria-live="polite" className="mt-6 flex-1 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.from === "user" ? "flex justify-end" : "flex"}>
            <p
              className={
                m.from === "user"
                  ? "max-w-[90%] whitespace-pre-wrap [overflow-wrap:anywhere] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground sm:max-w-[80%]"
                  : "max-w-[90%] whitespace-pre-wrap [overflow-wrap:anywhere] rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-sm sm:max-w-[80%]"
              }
            >
              {m.from === "app" && <span className="mb-1 block text-xs font-semibold text-primary">Respuesta de demostración · sin IA</span>}
              {m.text}
            </p>
          </div>
        ))}
        <div ref={end} />
      </section>

      <form
        onSubmit={(e) => { e.preventDefault(); send(text); }}
        className="sticky bottom-4 mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-3xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring"
      >
        <input
          aria-label="Tu mensaje"
          aria-describedby="conversation-privacy"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Puedes contarme lo que quieras…"
          className="min-w-0 w-full bg-transparent px-3 outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" disabled={!text.trim()} className="h-11 shrink-0 rounded-2xl px-5">
          Enviar
        </Button>
      </form>
      <p id="conversation-privacy" className="mt-3 text-center text-xs leading-relaxed text-secondary-foreground">
        Versión de demostración · respuestas preescritas, sin IA. No se guardan las conversaciones.
      </p>
    </main>
  );
}
