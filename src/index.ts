import { tool, type Plugin } from "@opencode-ai/plugin";
// Local vendored wrapper for the upstream generated Kagi client.
import { createConfiguration as createKagiConfiguration, ExtractApi, SearchApi } from "./vendor/kagi-api.js";
import { RUNTIME_CONFIG, runKagiOperation } from "./util.js";
import type { ExtractRequest, SearchRequest } from "./types.js";

const searchRequestSchema = tool.schema
  .object({
    query: tool.schema.string().min(1),
    workflow: tool.schema.enum(["search", "images", "videos", "news", "podcasts"]).optional(),
    format: tool.schema.enum(["json", "markdown"]).optional(),
    lensId: tool.schema.string().optional(),
    lens: tool.schema.record(tool.schema.string(), tool.schema.unknown()).optional(),
    timeout: tool.schema.number().positive().optional(),
    page: tool.schema.number().int().min(1).max(10).optional(),
    limit: tool.schema.number().int().min(1).max(1024).optional(),
    filters: tool.schema.record(tool.schema.string(), tool.schema.unknown()).optional(),
    extract: tool.schema.record(tool.schema.string(), tool.schema.unknown()).optional(),
    safeSearch: tool.schema.boolean().optional(),
    personalizations: tool.schema.record(tool.schema.string(), tool.schema.unknown()).optional(),
  })
  .passthrough();

const extractRequestSchema = tool.schema
  .object({
    pages: tool.schema
      .array(tool.schema.object({ url: tool.schema.string().min(1) }).loose())
      .min(1)
      .max(10),
    timeout: tool.schema.number().positive().optional(),
    format: tool.schema.enum(["json", "markdown"]).optional(),
  })
  .passthrough();

function validateSearchRequest(request: SearchRequest): void {
  if (typeof request.query !== "string" || request.query.trim().length === 0) {
    throw new Error("kagi_search requires a non-empty 'query' string.");
  }
}

function validateExtractRequest(request: ExtractRequest): void {
  if (!Array.isArray(request.pages) || request.pages.length === 0) {
    throw new Error("kagi_extract requires 'pages' with at least one URL.");
  }
  if (request.pages.length > 10) {
    throw new Error("kagi_extract supports at most 10 pages per request.");
  }
  for (const page of request.pages) {
    if (!page || typeof page.url !== "string" || page.url.trim().length === 0) {
      throw new Error("Each page must include a non-empty 'url' string.");
    }
    let parsed: URL;
    try {
      parsed = new URL(page.url);
    } catch {
      throw new Error("Each page URL must be a valid absolute URL.");
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error("Each page URL must start with http:// or https://.");
    }
  }
}

export const KagiSearchPlugin: Plugin = async ({ client }) => {
  const apiKey = process.env.KAGI_API_KEY;
  if (!apiKey) {
    throw new Error("opencode-kagi-search: Missing KAGI_API_KEY environment variable.");
  }

  const kagiConfig = createKagiConfiguration({
    authMethods: {
      kagi: { tokenProvider: { getToken: () => apiKey } },
    },
  });

  const searchApi = new SearchApi(kagiConfig);
  const extractApi = new ExtractApi(kagiConfig);

  await client.app.log({
    body: {
      service: "opencode-kagi-search",
      level: "info",
      message: "Plugin initialized",
      extra: {
        timeout_ms: RUNTIME_CONFIG.timeoutMs,
        max_retries: RUNTIME_CONFIG.maxRetries,
      },
    },
  });

  type RequestContextWithSignal = { setSignal: (signal: AbortSignal) => void };
  type ResponseContext = unknown;
  const withSignal = (signal: AbortSignal): {
    middleware: Array<{
      pre: (context: RequestContextWithSignal) => Promise<RequestContextWithSignal>;
      post: (context: ResponseContext) => Promise<ResponseContext>;
    }>
  } => ({
    middleware: [
      {
        async pre(context: RequestContextWithSignal) {
          context.setSignal(signal);
          return context;
        },
        async post(context: ResponseContext) {
          return context;
        },
      },
    ],
  });

  return {
    tool: {
      kagi_search: tool({
        description: "Run Kagi v1 search API with full request schema passthrough.",
        args: { request: searchRequestSchema },
        async execute(args) {
          const request = args.request as SearchRequest;
          validateSearchRequest(request);
          const result = await runKagiOperation(
            async (signal) => searchApi.search(request as never, withSignal(signal)),
            { tool: "kagi_search", endpoint: "/search", timeoutMs: RUNTIME_CONFIG.timeoutMs, retries: RUNTIME_CONFIG.maxRetries },
          );
          return JSON.stringify(result, null, 2);
        },
      }),
      kagi_extract: tool({
        description: "Run Kagi v1 extract API with full request schema passthrough.",
        args: { request: extractRequestSchema },
        async execute(args) {
          const request = args.request as ExtractRequest;
          validateExtractRequest(request);
          const result = await runKagiOperation(
            async (signal) => extractApi.extractContent(request as never, withSignal(signal)),
            { tool: "kagi_extract", endpoint: "/extract", timeoutMs: RUNTIME_CONFIG.timeoutMs, retries: RUNTIME_CONFIG.maxRetries },
          );
          return JSON.stringify(result, null, 2);
        },
      }),
    },
  };
};

export const server = KagiSearchPlugin;
export default KagiSearchPlugin;
