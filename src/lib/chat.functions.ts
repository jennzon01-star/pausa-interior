import { createServerFn } from "@tanstack/react-start";
import { chatInputSchema, replyToConversation } from "@/lib/chat.server";

export const sendChatTurn = createServerFn({ method: "POST" })
  .inputValidator(chatInputSchema)
  .handler(async ({ data }) => replyToConversation(data));
