# opencode-kagi-search

Kagi Search and Extract tools for OpenCode

Requires OpenCode 2 (plugin API v2).

## Requirements

Set `KAGI_API_KEY` in the environment of the OpenCode server process before starting OpenCode.

## Install

### OpenCode

Install the package:

```bash
npm install -g opencode-kagi-search
```

Add to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-kagi-search"],
  // Add to prefer kagi for search
  "permission": { "websearch": "deny", "webfetch": "deny" }
}
```

Local checkout:

```bash
npm install
```

Add to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-kagi-search"]
}
```

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

Make sure you are logged in to npm first:

```bash
npm whoami
```

Build and verify the package locally:

```bash
npm install
npm run typecheck
npm run build
```

Bump the version you want to release:

```bash
npm version patch
```

Publish to npm:

```bash
npm publish
```
