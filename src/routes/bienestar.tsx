import { createFileRoute } from "@tanstack/react-router";
import { TopicPage } from "@/components/TopicPage";

export const Route = createFileRoute("/bienestar")({
  head: () => ({
    meta: [
      { title: "Cuidar mi bienestar personal — Pausa Interior" },
      { name: "description", content: "Cuidar mi bienestar personal en Pausa Interior, un espacio cálido y sin juicios." },
      { property: "og:title", content: "Cuidar mi bienestar personal — Pausa Interior" },
      { property: "og:description", content: "Cuidar mi bienestar personal en Pausa Interior, un espacio cálido y sin juicios." },
    ],
  }),
  component: () => <TopicPage slug="bienestar" />,
});
