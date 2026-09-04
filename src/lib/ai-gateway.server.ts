import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const runIdHeader = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayProvider(apiKey: string, initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(runIdHeader, runId);
      const response = await fetch(input, { ...init, headers });
      runId = response.headers.get(runIdHeader)?.trim() || runId;
      return response;
    },
  });

  return provider;
}