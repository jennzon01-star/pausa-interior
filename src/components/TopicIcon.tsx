import { Heart, Leaf, MessageCircle, Mountain, Sprout } from "lucide-react";
import type { TopicSlug } from "@/lib/topics";

const icons = { conversar: MessageCircle, emociones: Leaf, calma: Sprout, dificultad: Mountain, bienestar: Heart };

export function TopicIcon({ slug, className }: { slug: TopicSlug; className?: string }) {
  const Icon = icons[slug];
  return <Icon aria-hidden="true" className={className} />;
}