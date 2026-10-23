import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setPendingMessage, topics } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import { TopicIcon } from "@/components/TopicIcon";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pausa Interior — Un espacio para ti" },
      { name: "description", content: "Acompañamiento emocional cálido y sin juicios. Conversa, comprende tus emociones y encuentra calma." },
      { property: "og:title", content: "Pausa Interior" },
      { property: "og:description", content: "Un espacio cálido para conversar y encontrar calma, un paso a la vez." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="text-center">
        <p className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium uppercase tracking-wider text-primary">
          <Leaf aria-hidden="true" className="size-4 shrink-0" /> Pausa Interior
        </p>
        <h1 className="mt-3 text-2xl font-serif leading-tight sm:mt-5 sm:text-4xl lg:text-5xl">
          Hola, me alegra que estés aquí.
          <br />
          <span className="text-primary">¿Cómo te puedo ayudar?</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl font-serif text-base italic leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
          «No tienes que tenerlo todo resuelto. En el camino siempre hay dificultades. Vamos a
          recorrerlo juntos, un paso a la vez».
        </p>
      </header>

      <section
        aria-label="Opciones de acompañamiento"
        className="mt-6 grid auto-rows-fr gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
      >
        {topics.map((t) => (
          <Link
            key={t.slug}
            to={`/${t.slug}` as const}
            className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 rounded-3xl border bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-accent/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-1 sm:content-start sm:p-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
              <TopicIcon slug={t.slug} className="size-5 sm:size-6" />
            </span>
            <h2 className="min-w-0 text-base font-medium leading-snug sm:text-lg">{t.title}</h2>
          </Link>
        ))}
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="mx-auto mt-6 max-w-2xl rounded-3xl border bg-card p-4 shadow-xs transition-shadow focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring sm:mt-8 sm:p-5"
      >
        <label htmlFor="free-message" className="sr-only">
          Tu mensaje
        </label>
        <textarea
          id="free-message"
          aria-describedby="demo-privacy"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Puedes contarme lo que quieras…"
          className="w-full resize-none bg-transparent p-1.5 text-base sm:text-lg outline-none placeholder:text-muted-foreground leading-relaxed"
        />
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span
            id="demo-privacy"
            className="min-w-0 text-xs leading-relaxed text-secondary-foreground order-2 sm:order-1"
          >
            Versión de demostración · sin IA · no se guardan conversaciones
          </span>
          <Button
            type="submit"
            className="h-11 w-full shrink-0 rounded-2xl px-6 font-medium shadow-xs active:scale-[0.98] sm:w-auto order-1 sm:order-2"
          >
            Continuar
          </Button>
        </div>
      </form>
    </main>
  );
}
