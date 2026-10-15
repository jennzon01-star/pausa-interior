import { createFileRoute } from "@tanstack/react-router";
import { TopicPage } from "@/components/TopicPage";

export const Route = createFileRoute("/dificultad")({
  head: () => ({
    meta: [
      { title: "Afrontar una dificultad — Pausa Interior" },
      { name: "description", content: "Afrontar una dificultad en Pausa Interior, un espacio cálido y sin juicios." },
      { property: "og:title", content: "Afrontar una dificultad — Pausa Interior" },
      { property: "og:description", content: "Afrontar una dificultad en Pausa Interior, un espacio cálido y sin juicios." },
    ],
  }),
  component: () => <TopicPage slug="dificultad" />,
});
