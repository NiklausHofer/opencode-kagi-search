// Vendored from the generated client published in the
// `kagisearch/kagi-openapi-typescript` repository, specifically the small
// `createConfiguration` / `SearchApi` / `ExtractApi` surface this plugin uses.
// We keep a local copy to avoid npm installing the upstream git dependency and
// running its TypeScript build during consumer installs.

const BASE_URL = "https://kagi.com/api/v1";

type TokenProvider = {
  getToken: () => string | Promise<string>;
};

type AuthMethodsConfiguration = {
  kagi?: {
    tokenProvider: TokenProvider;
  };
};

type MiddlewareContext = {
  setSignal: (signal: AbortSignal) => void;
};

type Middleware = {
  pre?: (context: MiddlewareContext) => MiddlewareContext | Promise<MiddlewareContext>;
  post?: (context: unknown) => unknown | Promise<unknown>;
};

type Configuration = {
  authMethods: AuthMethodsConfiguration;
  middleware: Middleware[];
};

type RequestOptions = {
  middleware?: Middleware[];
};

type HeaderMap = Record<string, string>;

class ApiError extends Error {
  status: number;
  headers: HeaderMap;
  body: unknown;

  constructor(status: number, message: string, headers: HeaderMap, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
}

export function createConfiguration(configuration: Partial<Configuration> = {}): Configuration {
  return {
    authMethods: configuration.authMethods ?? {},
    middleware: configuration.middleware ?? [],
  };
}

async function callKagiApi<T>(
  configuration: Configuration,
  path: string,
  request: unknown,
  options?: RequestOptions,
): Promise<T> {
  const middleware = options?.middleware ?? configuration.middleware;
  const middlewareContext: MiddlewareContext & { signal?: AbortSignal } = {
    setSignal(signal) {
      middlewareContext.signal = signal;
    },
  };

  for (const entry of middleware) {
    if (entry.pre) {
      await entry.pre(middlewareContext);
    }
  }

  const token = await configuration.authMethods.kagi?.tokenProvider.getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json, */*;q=0.8",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal: middlewareContext.signal,
  });

  const headers = Object.fromEntries(response.headers.entries());
  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text();
  const body = parseResponseBody(bodyText, contentType);

  for (const entry of [...middleware].reverse()) {
    if (entry.post) {
      await entry.post({ httpStatusCode: response.status, headers, body });
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Kagi API request failed with status ${response.status}`, headers, body);
  }

  return body as T;
}

function parseResponseBody(bodyText: string, contentType: string): unknown {
  if (bodyText.length === 0) {
    return undefined;
  }

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return JSON.parse(bodyText);
    } catch {
      return bodyText;
    }
  }

  return bodyText;
}

export class SearchApi {
  constructor(private readonly configuration: Configuration) { }

  async search<T>(searchRequest: unknown, options?: RequestOptions): Promise<T> {
    return callKagiApi<T>(this.configuration, "/search", searchRequest, options);
  }
}

export class ExtractApi {
  constructor(private readonly configuration: Configuration) { }

  async extractContent<T>(extractRequest: unknown, options?: RequestOptions): Promise<T> {
    return callKagiApi<T>(this.configuration, "/extract", extractRequest, options);
  }
}
