import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(12000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  mode: z.enum(["build", "chat", "code"]).default("build"),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Please send a valid message." }, { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "Lovable AI is not configured yet." }, { status: 401 });
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const modePrompt = parsed.data.mode === "build"
          ? "You are an expert product engineer inside a free AI app builder. Help users turn ideas into real websites and apps. Be concise, practical, and describe concrete files, UI, and next steps."
          : parsed.data.mode === "code"
            ? "You are a precise senior software engineer. Give correct, production-ready code and explain only what is necessary."
            : "You are a helpful, warm, direct AI assistant. Answer in clear markdown and ask a useful follow-up only when needed.";

        const result = streamText({
          model: gateway("google/gemini-3.7-flash"),
          system: modePrompt,
          messages: parsed.data.messages,
          providerOptions: { lovable: { reasoning: { effort: "medium" } } },
        });

        return result.toTextStreamResponse({
          headers: { "X-Content-Type-Options": "nosniff" },
        });
      },
    },
  },
});