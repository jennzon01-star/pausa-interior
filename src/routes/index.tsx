import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setPendingMessage, topics } from "@/lib/topics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pausa Interior — Un espacio para ti" },
      { name: "description", content: "Acompañamiento emocional cálido y sin juicios. Conversa, comprende tus emociones y encuentra calma." },
      { property: "og:title", content: "Pausa Interior" },
      { property: "og:description", content: "Un espacio cálido para conversar y encontrar calma, un paso a la vez." },
    ],
  }),
  component: Index,
});

function Index() {
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const go = () => {
    setPendingMessage(text);
    navigate({ to: "/conversar" });
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-20">
      <header className="text-center">
        <p className="text-sm tracking-widest text-primary uppercase">🌿 Pausa Interior</p>
        <h1 className="mt-6 text-4xl leading-tight md:text-5xl">
          Hola, me alegra que estés aquí.
          <br />
          <span className="text-primary">¿Cómo te puedo ayudar?</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-serif text-lg italic text-muted-foreground">
          «No tienes que tenerlo todo resuelto. En el camino siempre hay dificultades. Vamos a
          recorrerlo juntos, un paso a la vez».
        </p>
      </header>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={`/${t.slug}` as const}
            className="group rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:bg-accent"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-2xl">
              {t.icon}
            </span>
            <h2 className="mt-4 text-lg leading-snug">{t.title}</h2>
          </Link>
        ))}
      </section>

      <form
        onSubmit={(e) => { e.preventDefault(); go(); }}
        className="mx-auto mt-12 max-w-2xl rounded-3xl border bg-card p-4 shadow-sm"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Puedes contarme lo que quieras…"
          className="w-full resize-none bg-transparent p-2 text-lg outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Versión de demostración · no se guarda nada</span>
          <button className="rounded-2xl bg-primary px-6 py-3 text-primary-foreground transition hover:opacity-90">
            Continuar
          </button>
        </div>
      </form>
    </main>
  );
}
