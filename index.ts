// Entry point for OpenCode's local plugin loader, which resolves a directory
// configured under `plugins` via a root-level index.ts. The implementation
// lives in src/ and is published through the compiled dist/ output (see
// package.json "exports"). After `npm install` (which builds via the prepare
// script), this file simply re-exports the compiled plugin.
export { default } from "./dist/index.js";
export * from "./dist/index.js";
