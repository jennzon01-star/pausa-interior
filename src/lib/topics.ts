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
    intro:
      "Si lo deseas, podemos explorar con curiosidad lo que estás sintiendo, a tu ritmo y sin juzgarlo. Tú decides las palabras: no hay etiquetas correctas ni nada que debas sentir.",
    replies: [
      "Gracias por compartirlo. Si quieres, puedes contarme cómo lo notas, con tus propias palabras.",
      "No hace falta ponerle un nombre exacto. A veces basta con describir qué se siente en el cuerpo o qué pasa por la cabeza.",
      "Puede haber varias sensaciones a la vez, o ninguna clara todavía. Cualquiera de esas formas está bien.",
    ],
  },
  {
    slug: "calma",
    title: "Encontrar un momento de calma",
    icon: "🍃",
    intro:
      "Tómate este momento para ti. Inhala lentamente… y exhala con suavidad. No tienes que hacer nada más. Simplemente, date permiso para estar aquí.",
    replies: [
      "Bien. Quédate un momento con esa respiración.",
      "Nota tus pies en el suelo y tus hombros soltándose un poco.",
    ],
  },
  {
    slug: "dificultad",
    title: "Afrontar una dificultad",
    icon: "🪨",
    intro:
      "Las dificultades se recorren mejor paso a paso. Cuando lo desees, podemos ordenar tus pensamientos, reconocer tus recursos y considerar alternativas. Cuéntame lo que está pasando o elige cómo empezar.",
    replies: [
      "Eso suena exigente. Vamos a mirarlo por partes, sin apuro.",
      "No tienes que resolverlo todo hoy. Un primer paso pequeño ya cuenta.",
      "Si lo deseas, podemos mirar con qué cuentas hoy: lo que sabes, lo que has aprendido o quién te puede apoyar.",
      "Podemos desglosar lo que pasa: separar lo que está en tus manos de lo que no ayuda a aligerar la carga.",
      "Reconocer tus recursos puede ser pensar en qué te ha servido antes, si es que lo recuerdas, o en quién podría apoyarte.",
      "Mirar alternativas posibles paso a paso abre opciones viables sin forzarte a nada.",
    ],
  },
  {
    slug: "bienestar",
    title: "Cuidar mi bienestar personal",
    icon: "🌱",
    intro:
      "Pequeños gestos sostienen mucho: descansar la vista, tomar agua, soltar el cuerpo o darte un momento para ti. Cuéntame cómo estás hoy o elige una micro-pausa.",
    replies: [
      "Qué bueno que te dediques este momento.",
      "Un vaso de agua o unos minutos al aire libre pueden ser un buen comienzo.",
      "Cuidarte no es un lujo, es parte del camino.",
      "Aflojar los hombros y respirar un instante ya es un avance significativo.",
      "Tomarse un descanso breve renueva la energía y la claridad mental.",
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
