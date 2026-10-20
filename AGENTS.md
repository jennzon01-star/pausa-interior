# Reglas y Guías del Proyecto — Pausa Interior

> [!IMPORTANT]
> **Regla de Desarrollo Obligatoria:**
> Cada vez que se realice una mejora, corrección o nueva funcionalidad en el proyecto, **se debe crear una nueva rama en Git** (siguiendo convenciones como `feature/...`, `fix/...`, `chore/...`, `docs/...`). No realizar commits directos sobre `main`.

## Entorno y Despliegue
- El proyecto está desplegado de forma independiente en **Vercel**. No depende del editor de Lovable.
- Las variables de entorno de producción (como `GEMINI_API_KEY`) deben mantenerse configuradas en el panel de Vercel.
- Para detalles de arquitectura, consulta [docs/arquitectura-proyecto.md](docs/arquitectura-proyecto.md).

## Reglas Arquitectónicas y de Código
- **Privacidad y Estado:** Mantener las conversaciones en el estado de React (`useState`) y el mensaje pendiente del home únicamente en memoria de módulo por pestaña (`takePendingMessage`), garantizando que no se persistan datos personales ni conversaciones en bases de datos o almacenamiento local.
- **Iconografía y Botones:** Reutilizar siempre `TopicIcon` y el componente compartido `Button` (`src/components/ui/button.tsx`) para mantener consistencia visual y estados de foco accesibles.
- **Clave por Slug:** Asignar la clave (`key={slug}`) a cada conversación temática para que al cambiar de categoría se reinicie la demostración con la introducción y respuestas correctas.
- **Resiliencia de Respuesta:** Mantener el respondedor offline en un módulo seguro para navegador con un contrato de historial completo, permitiendo que la integración con Google Gemini (`chat.server.ts`) y el fallback local (`conversation.ts`) compartan interfaz sin romper la UI.
- **Componentes Conversacionales:** Construir la conversación con componentes de `ai-elements` (`Conversation`, `Message`, `PromptInput`) y el botón compartido para asegurar markdown, scroll automático e inputs multilínea accesibles.
- **Principios Éticos:** Centralizar los principios de conversación y el system prompt en `src/lib/conversation-principles.ts` para que tanto el motor de IA como el respondedor de contingencia sigan las mismas pautas de empatía y tono.
