import { createFileRoute } from "@tanstack/react-router";
import { TopicPage } from "@/components/TopicPage";

export const Route = createFileRoute("/calma")({
  head: () => ({
    meta: [
      { title: "Encontrar un momento de calma — Pausa Interior" },
      { name: "description", content: "Encontrar un momento de calma en Pausa Interior, un espacio cálido y sin juicios." },
      { property: "og:title", content: "Encontrar un momento de calma — Pausa Interior" },
      { property: "og:description", content: "Encontrar un momento de calma en Pausa Interior, un espacio cálido y sin juicios." },
    ],
  }),
  component: () => <TopicPage slug="calma" />,
});
