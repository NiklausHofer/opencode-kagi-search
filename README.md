# opencode-kagi-search

OpenCode plugin that exposes Kagi v1 Search and Extract APIs as explicit tools, using the official OpenAPI TypeScript client from `kagisearch/kagi-openapi-typescript` via a Git dependency.

## Install

Add to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-kagi-search"],
  // Optionally disable EXA search
  "permission": { "websearch": "deny" }
}
```

## Required Environment Variable

Set `KAGI_API_KEY` in your shell environment before starting OpenCode.

## Tools

### `kagi_search`
- Calls `POST https://kagi.com/api/v1/search`
- Input: full passthrough search request object (requires `query`)
- Returns: normalized JSON envelope with `ok`, `data` or `error`, and `meta`

### `kagi_extract`
- Calls `POST https://kagi.com/api/v1/extract`
- Input: full passthrough extract request object (requires `pages`, max 10)
- Returns: normalized JSON envelope with `ok`, `data` or `error`, and `meta`

## Error Model

Non-2xx responses are normalized as:

```json
{
  "ok": false,
  "error": {
    "status": 429,
    "tool": "kagi_search",
    "endpoint": "/search",
    "retriable": true,
    "message": "Kagi API request failed with status 429",
    "body": { "error": "..." }
  },
  "meta": {
    "ok": false,
    "duration_ms": 123,
    "retries_used": 1
  }
}
```

Retry applies to `429` and `5xx` only.

## Development

```bash
npm install
npm run typecheck
npm run build
```

## Publish

```bash
npm version patch
npm publish
```
