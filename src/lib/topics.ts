// Contenido de las cinco opciones. Respuestas de DEMOSTRACIÓN (sin IA).
export type TopicSlug = "conversar" | "emociones" | "calma" | "dificultad" | "bienestar";

export interface Topic {
  slug: TopicSlug;
  title: string;
  icon: string;
  intro: string;
  replies: string[];
}

export const topics: Topic[] = [
  {
    slug: "conversar",
    title: "Conversar libremente",
    icon: "💬",
    intro: "Este es tu espacio. Puedes hablar de lo que quieras, a tu ritmo.",
    replies: [
      "Gracias por contármelo. Te leo con calma.",
      "Entiendo. Tómate el tiempo que necesites, aquí sigo.",
      "Suena a que eso ha ocupado un lugar en tu día. Está bien ponerlo en palabras.",
      "Me quedo con lo que dices. No hay prisa para nada más.",
    ],
  },
  {
    slug: "emociones",
    title: "Comprender mis emociones",
    icon: "🌿",
    intro: "Las emociones no son buenas ni malas: son señales. Podemos mirarlas juntos, sin juzgarlas.",
    replies: [
      "Lo que sientes tiene sentido dentro de lo que estás viviendo.",
      "A veces ponerle nombre a una emoción ya la hace un poco más liviana.",
      "Es posible sentir varias cosas a la vez. Eso también es humano.",
    ],
  },
  {
    slug: "calma",
    title: "Encontrar un momento de calma",
    icon: "🍃",
    intro: "Respira conmigo. Sigue el círculo: inhala mientras crece, exhala mientras se encoge.",
    replies: [
      "Bien. Quédate un momento con esa respiración.",
      "Nota tus pies en el suelo y tus hombros soltándose un poco.",
    ],
  },
  {
    slug: "dificultad",
    title: "Afrontar una dificultad",
    icon: "🪨",
    intro: "Las dificultades se recorren mejor paso a paso. Cuéntame lo que está pasando, si quieres.",
    replies: [
      "Eso suena exigente. Vamos a mirarlo por partes, sin apuro.",
      "No tienes que resolverlo todo hoy. Un primer paso pequeño ya cuenta.",
      "Has atravesado otros momentos difíciles; esa experiencia también está contigo.",
    ],
  },
  {
    slug: "bienestar",
    title: "Cuidar mi bienestar personal",
    icon: "🌱",
    intro: "Pequeños gestos sostienen mucho: descanso, agua, movimiento, algo que disfrutes.",
    replies: [
      "Qué bueno que te dediques este momento.",
      "Un vaso de agua o unos minutos al aire libre pueden ser un buen comienzo.",
      "Cuidarte no es un lujo, es parte del camino.",
    ],
  },
];

export const getTopic = (slug: TopicSlug): Topic => {
  const topic = topics.find((t) => t.slug === slug);
  if (!topic) throw new Error("Opción de demostración no disponible");
  return topic;
};

// Memoria temporal solo en la pestaña (no se guarda nada).
let pendingMessage = "";
export const setPendingMessage = (m: string) => (pendingMessage = m);
export const takePendingMessage = () => {
  const m = pendingMessage;
  pendingMessage = "";
  return m;
};
