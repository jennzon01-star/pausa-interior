import type { TopicSlug } from "@/lib/topics";

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "demo";
};

// The presentation supplies the entire history. A future adapter can replace
// this local responder without changing the transcript or persisting messages.
export type ConversationResponder = (request: {
  topic: TopicSlug;
  messages: readonly ConversationMessage[];
}) => string;

export const conversationGuidelines = [
  "Responder al contenido concreto, con naturalidad, respeto, calidez y honestidad.",
  "Conversar sobre experiencias agradables sin convertirlas en terapia.",
  "Reconocer preocupaciones sin juzgar ni imponer soluciones.",
  "No asumir tristeza, soledad ni necesidad de ayuda emocional.",
  "No terminar siempre con preguntas; dejar espacio para continuar.",
  "Explorar opciones sin imponerlas cuando la persona pide ayuda.",
] as const;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Deliberately limited keyword matching, not intelligent interpretation.
// Topic selection never assigns an emotional state to the person.
export const respondWithDemo: ConversationResponder = ({ messages }) => {
  const latest = messages.filter((message) => message.role === "user").at(-1);
  if (!latest) return "Puedes hablar de lo que quieras, a tu ritmo.";
  const text = normalize(latest.content);
  const used = new Set(
    messages.filter((message) => message.role === "assistant").map((message) => message.content),
  );
  const choose = (options: string[]) =>
    options.find((reply) => !used.has(reply)) ??
    options[(messages.filter((message) => message.role === "user").length - 1) % options.length] ??
    options[0] ??
    "Puedes continuar a tu ritmo.";

  const garden =
    /\b(jardin|plantas?|flores?|huerto|sembrar|sembrando|regar|cultivar|rosas?)\b/.test(text);
  const work = /\b(trabajo|trabajar|jefe|oficina|empleo)\b/.test(text) && !garden;
  const worry =
    /\b(preocupa\w*|preocupacion|miedo|triste\w*|angustia\w*|agobia\w*|dificil|problema\w*|estres\w*)\b/.test(
      text,
    ) &&
    !/\bno (?:estoy |me siento |me )?(?:triste|preocupad\w*|preocupa|angustiad\w*)\b/.test(text);
  const help =
    /(?:\bayuda\b|ayudame|me ayudas|puedes ayudar|podrias ayudar|que (?:puedo|podria|debo) hacer|como (?:puedo|resolver|afrontar)|explorar opciones)/.test(
      text,
    ) && !/\bno (?:quiero|necesito|busco|pido) (?:\w+ )?ayuda\b/.test(text);

  if (help)
    return choose([
      garden
        ? "Podemos explorar opciones para tu jardín, sin decidir por ti. ¿Qué te gustaría resolver con las plantas?"
        : work
          ? "Podemos mirar opciones para esa situación en el trabajo. ¿Qué te gustaría resolver primero?"
          : "Podemos explorar algunas opciones, sin que tengas que elegir ninguna ahora. ¿Qué parte te gustaría resolver primero?",
      "Podemos separar lo que está en tus manos de lo que no, y mirar las alternativas que te resulten posibles. Tú decides si alguna encaja.",
      "Si quieres, podemos comparar las opciones que ya tienes en mente, con lo que te atrae y lo que te preocupa de cada una.",
    ]);
  if (worry)
    return choose([
      garden
        ? "Mencionas una preocupación con tu jardín. No hace falta buscar una solución enseguida; puedes contar qué está pasando con las plantas."
        : work
          ? "Mencionas una preocupación relacionada con el trabajo. Podemos quedarnos en lo que te inquieta, sin apresurarnos a buscar soluciones."
          : "Mencionas algo que te preocupa. Puedes hablar de ello sin tener que justificar lo que sientes ni resolverlo ahora.",
      "No hace falta quitarle importancia a esa preocupación ni encontrar una respuesta de inmediato. Hay espacio para contar lo que pasa a tu ritmo.",
      "Gracias por poner esa preocupación en palabras. No voy a decirte cómo deberías sentirte ni qué tienes que hacer.",
    ]);
  if (garden)
    return choose([
      "El jardín tiene muchos pequeños detalles: lo que crece, los colores, la tierra. ¿Qué estuviste haciendo entre tus plantas?",
      "Trabajar en el jardín puede dar lugar a historias muy distintas, desde una nueva flor hasta algo que se está intentando cultivar. Puedes seguir contando sobre el tuyo.",
      "Cada planta tiene su propio ritmo. Me quedo en ese tema contigo, sin llevar la conversación a otra cosa.",
    ]);
  if (/\b(cocinar|cocine|cocinando|receta|pan|comida)\b/.test(text))
    return choose([
      "Hay mucho que contar alrededor de una receta: sabores, ingredientes y pequeños cambios. ¿Qué preparaste?",
      "Una receta también puede tener una historia propia. Puedes contar cómo quedó o qué le pusiste de tu parte.",
    ]);
  if (/\b(musica|cancion|canciones|concierto|guitarra)\b/.test(text))
    return choose([
      "La música da para conversar de sonidos, canciones y recuerdos. ¿Qué estuviste escuchando o tocando?",
      "Podemos seguir hablando de esa música, sin buscarle un significado más allá de lo que quieras contar.",
    ]);
  if (work)
    return choose([
      "Podemos hablar de tu trabajo tal como fue hoy, sin dar por hecho que haya sido un día bueno o malo. ¿Qué te gustaría contar?",
      "El trabajo ocupa una parte del día, pero cada experiencia es distinta. Puedes seguir contando la tuya.",
    ]);
  if (/\b(content\w*|feliz|alegr\w*|disfrut\w*|agradable|me gusto|me encanta)\b/.test(text))
    return choose([
      "Qué gusto que compartas algo que disfrutaste. Podemos quedarnos en esa experiencia, sin tener que convertirla en nada más.",
      "También hay espacio para hablar de lo agradable y de los pequeños detalles de un buen momento.",
    ]);
  if (/^(hola|buenas|buenos dias|buenas tardes)[!.,\s]*$/.test(text))
    return choose([
      "Hola. Puedes conversar de algo cotidiano, una idea o lo que te apetezca compartir.",
      "Hola de nuevo. Hay espacio para el tema que tú elijas.",
    ]);
  return choose([
    "Esta demostración tiene respuestas limitadas y puede no encajar con lo que cuentas. Puedes seguir con tu tema; no voy a dar por hecho cómo te sientes.",
    "Puedes continuar a tu ritmo. Si esta respuesta no encaja, es una limitación de las frases simuladas, no de lo que has compartido.",
    "No tengo una respuesta específica preparada para ese detalle. Prefiero decirlo con honestidad antes que atribuirte una emoción o inventar una explicación.",
  ]);
};

export function appendDemoTurn(
  messages: readonly ConversationMessage[],
  content: string,
  topic: TopicSlug,
  responder: ConversationResponder = respondWithDemo,
): ConversationMessage[] {
  const trimmed = content.trim();
  if (!trimmed) return [...messages];
  const history: ConversationMessage[] = [
    ...messages,
    { id: `message-${messages.length}`, role: "user", content: trimmed },
  ];
  const reply = responder({ topic, messages: history });
  return [
    ...history,
    { id: `message-${history.length}`, role: "assistant", content: reply, source: "demo" },
  ];
}
