import { describe, expect, it } from "vitest";
import { getTopic, setPendingMessage, takePendingMessage, topics } from "@/lib/topics";

describe("Demonstration topics", () => {
  it("offers five distinct topics with introductions and prerecorded replies", () => {
    expect(new Set(topics.map((topic) => topic.slug)).size).toBe(5);
    for (const topic of topics) {
      expect(getTopic(topic.slug)).toBe(topic);
      expect(topic.intro.length).toBeGreaterThan(0);
      expect(topic.replies.length).toBeGreaterThan(0);
    }
  });

  it("hands a free message to the conversation only once", () => {
    setPendingMessage("Hoy necesito una pausa.");
    expect(takePendingMessage()).toBe("Hoy necesito una pausa.");
    expect(takePendingMessage()).toBe("");
  });
});