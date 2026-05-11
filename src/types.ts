export type ToolName = "kagi_search" | "kagi_extract";
export type Endpoint = "/search" | "/extract";

export type SearchRequest = { query: string; [key: string]: unknown };

export type ExtractRequest = {
  pages: Array<{ url: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

export type RuntimeConfig = {
  timeoutMs: number;
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
};

export type RequestContext = {
  tool: ToolName;
  endpoint: Endpoint;
  timeoutMs: number;
  retries: number;
};

export type ToolResult<T> = {
  ok: boolean;
  data?: T;
  error?: {
    status?: number;
    tool: ToolName;
    endpoint: Endpoint;
    retriable: boolean;
    message: string;
    body?: unknown;
  };
  meta: {
    ok: boolean;
    status?: number;
    request_id?: string;
    duration_ms: number;
    retries_used: number;
  };
};
