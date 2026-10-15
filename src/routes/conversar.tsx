import { createFileRoute } from "@tanstack/react-router";
import { TopicPage } from "@/components/TopicPage";

export const Route = createFileRoute("/conversar")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Conversar libremente — Pausa Interior" },
      { name: "description", content: "Conversar libremente en Pausa Interior, un espacio cálido y sin juicios." },
      { property: "og:title", content: "Conversar libremente — Pausa Interior" },
      { property: "og:description", content: "Conversar libremente en Pausa Interior, un espacio cálido y sin juicios." },
    ],
  }),
  component: () => <TopicPage slug="conversar" />,
});
