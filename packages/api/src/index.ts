/**
 * Public surface of the API layer.
 *
 * `auth-normalize` is deliberately not re-exported here: `client` already
 * re-exports the three symbols of it that callers need, and a second
 * `export *` over the same names would make them ambiguous and silently
 * disappear from this barrel.
 */
export * from "./types";
export * from "./client";
export * from "./endpoints";
export * from "./limits";

export { configureApi } from "./config";
export type { ApiConfig, TokenStore } from "./config";
