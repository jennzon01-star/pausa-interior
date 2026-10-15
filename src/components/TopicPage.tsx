import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getTopic, takePendingMessage, topics, type TopicSlug } from "@/lib/topics";

type Msg = { from: "user" | "app"; text: string };

export function TopicPage({ slug }: { slug: TopicSlug }) {
  const topic = getTopic(slug);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "app", text: topic.intro }]);
  const [text, setText] = useState("");
  const idx = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  const send = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setMsgs((m) => [...m, { from: "user", text: v }]);
    setText("");
    setTimeout(() => {
      const reply = topic.replies[idx.current % topic.replies.length] ?? "";
      idx.current++;
      setMsgs((m) => [...m, { from: "app", text: reply }]);
    }, 900);
  };

  useEffect(() => {
    const p = takePendingMessage();
    if (p) send(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [msgs]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-primary">Pausa Interior</Link>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          Modo demostración
        </span>
      </header>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={`/${t.slug}` as const}
            className="whitespace-nowrap rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent"
            activeProps={{ className: "!bg-primary !text-primary-foreground border-primary" }}
          >
            {t.icon} {t.title}
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

      <section className="mt-6 flex-1 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.from === "user" ? "flex justify-end" : "flex"}>
            <p
              className={
                m.from === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground"
                  : "max-w-[80%] rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-sm"
              }
            >
              {m.text}
            </p>
          </div>
        ))}
        <div ref={end} />
      </section>

      <form
        onSubmit={(e) => { e.preventDefault(); send(text); }}
        className="sticky bottom-4 mt-6 flex gap-2 rounded-3xl border bg-card p-2 shadow-sm"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Puedes contarme lo que quieras…"
          className="flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground"
        />
        <button className="rounded-2xl bg-primary px-5 py-2 text-primary-foreground transition hover:opacity-90">
          Enviar
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Respuestas de demostración. Nada de lo que escribes se guarda.
      </p>
    </main>
  );
}
