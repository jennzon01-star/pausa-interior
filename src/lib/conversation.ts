import type { TopicSlug } from "@/lib/topics";
import { conversationPrinciples } from "@/lib/conversation-principles";

export type ConversationSource = "demo" | "ai";

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: ConversationSource;
};

// The presentation supplies the entire history. The AI reply is produced by a
// server function; this local responder is the offline fallback. Messages are
// never persisted.
export type ConversationResponder = (request: {
  topic: TopicSlug;
  messages: readonly ConversationMessage[];
}) => string;

export type ConversationReply = { reply: string; source: ConversationSource };

export const conversationGuidelines = conversationPrinciples.map((p) => p.rule);

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

  const identifyFeelings =
    /\bno se (?:que|lo que) (?:siento|estoy sintiendo|sentir)\b/.test(text) ||
    /\b(?:entender|identificar|comprender|reconocer|poner nombre a)\b.*\b(?:emocion\w*|siento|sentimiento\w*|sentir)\b/.test(
      text,
    );

  const sortThoughts =
    /\b(ordenar|aclarar|organizar|despejar)\b.*\b(pensamiento\w*|mente|cabeza|idea\w*)/.test(text) ||
    /\b(pensamiento\w*|mente|cabeza|idea\w*)\b.*\b(ordenar|aclarar|organizar|despejar)/.test(text);

  const recognizeResources =
    /\b(recurso\w*|fortaleza\w*|habilidad\w*|con que cuento|apoyo\w*|herramienta\w*|experiencia previa)/.test(
      text,
    );

  const considerAlternatives =
    /\b(alternativa\w*|opcion\w*|posibilidad\w*|caminos?\b|otros caminos|otras vias)/.test(text);

  const wellnessScreen =
    /\b(pantalla|vista|ojos?|descanso visual|fatiga visual)\b/.test(text);

  const wellnessHydration =
    /\b(agua|hidratar\w*|sed|vaso de agua|beber)\b/.test(text);

  const wellnessStretch =
    /\b(estir\w*|postura|desentumecer)\b/.test(text) ||
    (/\b(espalda|cuello|hombros)\b/.test(text) && /\b(relajar|soltar|estirar|tension)\b/.test(text));

  const wellnessGratitude =
    /\b(agradec\w*|reconocer el dia|gesto amable|momento positivo|valoro)\b/.test(text);

  if (identifyFeelings)
    return choose([
      "Puede que todavía no tenga nombre, y está bien. Si quieres, cuéntame cómo lo notas: en el cuerpo, en la cabeza o en lo que te rodea.",
      "Podemos ir despacio y con tus propias palabras. No hay una respuesta correcta ni algo que debas sentir.",
      "Si alguna palabra te resuena, puedes probarla; y si no encaja, la dejamos. Tú eres quien mejor lo reconoce.",
    ]);
  if (/\bno se (?:que|lo que) me pasa\b/.test(text))
    return choose([
      "Está bien no tenerlo claro. Puedes ir con calma y sin prisa, aquí te leo.",
      "A veces cuesta encontrar las palabras exactas. Vamos despacio, sin presión.",
    ]);
  if (/\bsolo quiero (?:conversar|hablar|charlar)\b/.test(text))
    return choose([
      "Claro, conversemos tranquilamente de lo que te apetezca hoy.",
      "Me parece un gran plan. Aquí hay espacio para charlar sin apuros.",
    ]);
  if (sortThoughts)
    return choose([
      "Vamos a ordenarlo por partes. A veces ayuda escribir los hechos y separar lo que depende de ti de lo que escapa de tu control.",
      "Para poner orden en los pensamientos, ayuda ir de a una cosa a la vez. Sin prisa ni exigencias.",
      "Separar el torbellino de la cabeza en puntos concretos suele quitarle bastante peso a la situación.",
    ]);
  if (recognizeResources)
    return choose([
      "Los recursos pueden ser muchas cosas: habilidades, conocimientos, personas o hábitos que te ayuden. Podemos pensar cuáles tienes a mano.",
      "Si quieres, podemos explorar qué fortalezas o apoyos reconoces en ti o a tu alrededor, a tu ritmo.",
      "Reconocer con qué cuentas —por sencillo que parezca— te da un punto de apoyo firme para continuar.",
    ]);
  if (considerAlternatives)
    return choose([
      "Para considerar alternativas no hace falta una solución perfecta; basta con identificar un primer paso viable y realista.",
      "Podemos explorar dos o tres caminos distintos y ver cuál te genera más serenidad y menos desgaste.",
      "Siempre hay más de una manera de abordar una misma situación. Mirarlas con calma ayuda a elegir sin presión.",
    ]);
  if (wellnessScreen)
    return choose([
      "Mirar a lo lejos o cerrar los ojos 20 segundos ayuda un montón a descansar la vista. Quédate un momento así si te apetece.",
      "Alejar los ojos de la pantalla por un momento afloja la tensión de los ojos y la frente.",
    ]);
  if (wellnessHydration)
    return choose([
      "Tomar un vaso de agua despacio, sintiendo la temperatura, es un gesto simple que devuelve vitalidad.",
      "Un sorbo de agua fría o fresca siempre renueva el cuerpo.",
    ]);
  if (wellnessStretch)
    return choose([
      "Rotar los hombros suavemente hacia atrás y dejar caer la cabeza a un lado ayuda a liberar esa carga acumulada.",
      "Estirar suavemente los brazos hacia arriba y soltar el aire al bajar es un alivio para la espalda.",
    ]);
  if (wellnessGratitude)
    return choose([
      "Reconocer algo que salió bien o un pequeño detalle grato en el día nos ayuda a mantener perspectiva.",
      "Cualquier gesto amable o momento tranquilo que hayas tenido hoy vale la pena recordarlo.",
    ]);
  if (/\bno se (?:que|lo que) me pasa\b/.test(text))
    return choose([
      "Está bien no tenerlo claro. Puedes ir con calma y sin prisa, aquí te leo.",
      "A veces cuesta encontrar las palabras exactas. Vamos despacio, sin presión.",
    ]);
  if (/\bsolo quiero (?:conversar|hablar|charlar)\b/.test(text))
    return choose([
      "Claro, conversemos tranquilamente de lo que te apetezca hoy.",
      "Me parece un gran plan. Aquí hay espacio para charlar sin apuros.",
    ]);
  if (sortThoughts)
    return choose([
      "Vamos a ordenarlo por partes. A veces ayuda escribir los hechos y separar lo que depende de ti de lo que escapa de tu control.",
      "Para poner orden en los pensamientos, ayuda ir de a una cosa a la vez. Sin prisa ni exigencias.",
      "Separar el torbellino de la cabeza en puntos concretos suele quitarle bastante peso a la situación.",
    ]);
  if (recognizeResources)
    return choose([
      "Los recursos pueden ser muchas cosas: habilidades, conocimientos, personas o hábitos que te ayuden. Podemos pensar cuáles tienes a mano.",
      "Si quieres, podemos explorar qué fortalezas o apoyos reconoces en ti o a tu alrededor, a tu ritmo.",
      "Reconocer con qué cuentas —por sencillo que parezca— te da un punto de apoyo firme para continuar.",
    ]);
  if (considerAlternatives)
    return choose([
      "Para considerar alternativas no hace falta una solución perfecta; basta con identificar un primer paso viable y realista.",
      "Podemos explorar dos o tres caminos distintos y ver cuál te genera más serenidad y menos desgaste.",
      "Siempre hay más de una manera de abordar una misma situación. Mirarlas con calma ayuda a elegir sin presión.",
    ]);
  if (help)
    return choose([
      garden
        ? "Podemos mirar opciones para tus plantas sin complicarte la vida."
        : work
          ? "Podemos revisar algunas opciones para el trabajo con calma y paso a paso."
          : "Podemos revisar juntos algunas opciones sencillas para ver qué te resulta más viable.",
      "A veces ayuda separar lo que depende de ti de lo que no, y revisar alternativas posibles.",
      "Podemos comparar las opciones que ya tengas en mente, viendo con calma los pros y contras de cada una.",
    ]);
  if (worry)
    return choose([
      garden
        ? "Entiendo la preocupación por las plantas de tu jardín. Cuidar de ellas a veces trae momentos así."
        : work
          ? "Se entiende esa preocupación por el trabajo. Cosas del día a día laboral que a veces se sienten pesadas."
          : "Tiene sentido que te preocupe. A veces simplemente viene bien soltarlo y ponerlo en palabras.",
      "No hace falta quitarle peso ni buscarle una solución apresurada a esa preocupación.",
      "Gracias por comentarlo con sinceridad. Te leo con atención y sin juzgar.",
    ]);
  if (garden)
    return choose([
      "Estar en el jardín desconecta bastante. Cuidar la tierra y las plantas siempre tiene su encanto.",
      "Trabajar en el jardín da para muchas cosas: ver brotar algo nuevo, podar o simplemente pasar el rato.",
      "Cada planta va a su propio ritmo y estar ahí ayuda a bajar revoluciones.",
    ]);
  if (/\b(cocinar|cocine|cocinando|receta|pan|comida)\b/.test(text))
    return choose([
      "Cocinar algo rico siempre alegra el día. Qué bueno lo que preparaste hoy.",
      "Hacer una receta propia o improvisar en la cocina siempre tiene su toque especial.",
    ]);
  if (/\b(musica|cancion|canciones|concierto|guitarra)\b/.test(text))
    return choose([
      "La música cambia el ánimo por completo y acompaña muy bien cualquier momento.",
      "Qué buen tema. Hablar de música siempre es agradable y relajante.",
    ]);
  if (work)
    return choose([
      "El trabajo tiene sus días buenos y sus días pesados. Es muy normal.",
      "El trabajo ocupa buena parte del tiempo, pero cada jornada deja algo distinto.",
    ]);
  if (/\b(content\w*|feliz|alegr\w*|disfrut\w*|agradable|me gusto|me encanta)\b/.test(text))
    return choose([
      "Qué alegría leer eso. Da gusto cuando algo sale bien o se disfruta el momento.",
      "Compartir los momentos agradables siempre suma un montón de buena energía.",
    ]);
  if (/^(hola|buenas|buenos dias|buenas tardes)[!.,\s]*$/.test(text))
    return choose([
      "Hola. Qué bueno verte por acá. Cuéntame lo que tengas ganas de compartir.",
      "Hola de nuevo. Aquí estoy para charlar un rato con calma.",
    ]);
  return choose([
    "Esta demostración tiene respuestas limitadas y automáticas, pero te sigo leyendo con atención.",
    "Como es una demo con respuestas limitadas, tal vez esta frase sea sencilla, pero te acompaño.",
    "No tengo una respuesta exacta guardada para eso en esta demo, pero puedes seguir contándome.",
  ]);
};

export function appendUserMessage(
  messages: readonly ConversationMessage[],
  content: string,
): ConversationMessage[] {
  const trimmed = content.trim();
  if (!trimmed) return [...messages];
  return [...messages, { id: `message-${messages.length}`, role: "user", content: trimmed }];
}

export function appendAssistantMessage(
  messages: readonly ConversationMessage[],
  content: string,
  source: ConversationSource,
): ConversationMessage[] {
  return [...messages, { id: `message-${messages.length}`, role: "assistant", content, source }];
}

export function appendDemoTurn(
  messages: readonly ConversationMessage[],
  content: string,
  topic: TopicSlug,
  responder: ConversationResponder = respondWithDemo,
): ConversationMessage[] {
  if (!content.trim()) return [...messages];
  const history = appendUserMessage(messages, content);
  return appendAssistantMessage(history, responder({ topic, messages: history }), "demo");
}
