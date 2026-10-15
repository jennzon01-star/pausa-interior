import { createFileRoute } from "@tanstack/react-router";
import { TopicPage } from "@/components/TopicPage";

export const Route = createFileRoute("/emociones")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Comprender mis emociones — Pausa Interior" },
      { name: "description", content: "Comprender mis emociones en Pausa Interior, un espacio cálido y sin juicios." },
      { property: "og:title", content: "Comprender mis emociones — Pausa Interior" },
      { property: "og:description", content: "Comprender mis emociones en Pausa Interior, un espacio cálido y sin juicios." },
    ],
  }),
  component: () => <TopicPage slug="emociones" />,
});
