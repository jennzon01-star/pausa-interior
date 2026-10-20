# Arquitectura del Proyecto — Pausa Interior

## 1. Visión y Propósito
**Pausa Interior** es una aplicación web de bienestar emocional, escucha activa y acompañamiento guiado. Proporciona un entorno cálido, seguro y accesible para procesar situaciones cotidianas, emociones complejas y momentos de sobrecarga.

La aplicación opera bajo **5 tópicos principales**:
- **Conversar** (`/conversar`): Espacio abierto para desahogarse y reflexionar.
- **Emociones** (`/emociones`): Identificación, validación y gestión de sentimientos.
- **Calma** (`/calma`): Técnicas de respiración, reducción de ansiedad y pausa mental.
- **Dificultad** (`/dificultad`): Procesamiento de momentos difíciles o crisis leves.
- **Bienestar** (`/bienestar`): Prácticas de autocuidado, gratitud y equilibrio personal.

---

## 2. Stack Tecnológico

| Área | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Framework Fullstack** | [TanStack Start](https://tanstack.com/start) (`@tanstack/react-start`) | SSR, Server Functions (`createServerFn`), enrutamiento tipado. |
| **Enrutador** | `@tanstack/react-router` | Rutas basadas en archivos en `src/routes/` y árbol tipado `routeTree.gen.ts`. |
| **Frontend Core** | React 19 + TypeScript | UI reactiva, moderna y estrictamente tipada. |
| **Estilos** | Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css` | Sistema de diseño coherente, responsivo y modo accesible. |
| **Primitivos UI** | `@radix-ui/*` | Componentes accesibles (modales, tooltips, acordeones, botones). |
| **Componentes de Chat** | `src/components/ai-elements/*` | Burbujas de mensaje, input multilínea, autoscroll persistente. |
| **IA / Generación de Texto** | Google Generative AI (`@ai-sdk/google`, `ai`) | Generación conversacional fluida usando `GEMINI_API_KEY`. |
| **Fallback Offline** | `src/lib/conversation.ts` | Respuestas preestablecidas empáticas si la IA o la red no están disponibles. |
| **Accesibilidad por Voz** | Web Speech API (`src/hooks/use-speech.ts`) | Síntesis de voz (Text-to-Speech) y dictado por micrófono (Speech Recognition). |
| **Despliegue** | **Vercel** | Hospedaje en producción mediante edge/serverless functions. |

---

## 3. Estructura de Directorios

```text
src/
├── components/
│   ├── ai-elements/      # UI conversacional (Conversation, Message, PromptInput)
│   ├── ui/               # Botones, tooltips, modales basados en Radix UI
│   ├── TopicPage.tsx     # Controlador de la experiencia conversacional por tema
│   └── TopicIcon.tsx     # Iconografía para cada una de las 5 categorías
├── hooks/
│   ├── use-speech.ts     # Manejo de voz (SpeechSynthesis & SpeechRecognition)
│   └── use-mobile.tsx    # Detección de viewport móvil
├── lib/
│   ├── chat.server.ts    # Servidor seguro que invoca Gemini con GEMINI_API_KEY
│   ├── chat.functions.ts # Server function puente entre cliente y backend
│   ├── conversation.ts   # Motor determinista de contingencia offline (demo fallback)
│   ├── conversation-principles.ts # Principios éticos, tono y system prompt de la IA
│   └── topics.ts         # Definiciones de categorías, intros y rutas
└── routes/
    ├── __root.tsx        # Layout global HTML, metadatos y fuentes
    ├── index.tsx         # Página de inicio con selector y entrada rápida
    ├── conversar.tsx     # Ruta /conversar
    ├── emociones.tsx     # Ruta /emociones
    ├── calma.tsx         # Ruta /calma
    ├── dificultad.tsx    # Ruta /dificultad
    └── bienestar.tsx     # Ruta /bienestar
```

---

## 4. Principios y Flujo de Datos

1. **Privacidad por diseño (Privacy-First):**
   - No se almacenan conversaciones en bases de datos ni en `localStorage`.
   - El historial vive en el estado React (`useState`) de la sesión.
   - El traspaso del mensaje inicial desde el Home al chat se hace en memoria de módulo (`takePendingMessage`).

2. **Doble Motor de Respuestas:**
   - Si `GEMINI_API_KEY` está configurada en las variables de entorno, la petición se envía de forma segura a Gemini a través de `sendChatTurn` (`createServerFn` en el servidor, sin exponer la clave en el cliente).
   - Si no hay clave o la petición falla, conmuta de forma transparente y sin error al motor empático local en `conversation.ts`.

3. **Voz y Accesibilidad:**
   - La síntesis de voz y el dictado utilizan las APIs nativas del navegador mediante `use-speech.ts`, permitiendo escuchar mensajes o dictar en lugar de escribir.

---

## 5. Reglas de Desarrollo del Proyecto

- **Gestión de Ramas:** Toda nueva mejora, cambio funcional o refactorización debe desarrollarse en su propia rama de Git (`feature/*`, `fix/*`, `chore/*`, `docs/*`).
- **Despliegue:** El proyecto está desplegado en Vercel. Asegurar que las variables requeridas (ej. `GEMINI_API_KEY`) estén dadas de alta en el panel de Vercel.
- **Componentes Compartidos:** Reutilizar siempre `TopicIcon` y los botones de `src/components/ui/button.tsx` para consistencia y accesibilidad.
- **Principios Éticos:** Toda modificación a los prompts o tono conversacional debe alinearse con `src/lib/conversation-principles.ts`.
