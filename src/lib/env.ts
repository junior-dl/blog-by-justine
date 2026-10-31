/**
 * Server-only environment access.
 *
 * Reads `process.env` at runtime (Vercel functions, scripts run with tsx) and
 * falls back to `import.meta.env` so `astro dev` picks values up from `.env`.
 * Secrets are never read through `import.meta.env` in production builds,
 * so they are not inlined into the bundle.
 */
function read(key: string): string | undefined {
    const fromProcess = typeof process !== "undefined" ? process.env[key] : undefined;
    if (fromProcess) return fromProcess;
    const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
    return metaEnv?.[key] || undefined;
}

export function env(key: string): string {
    const value = read(key);
    if (!value) throw new Error(`Missing environment variable ${key}. See .env.example.`);
    return value;
}

export function optionalEnv(key: string, fallback = ""): string {
    return read(key) ?? fallback;
}

export const TOPIC_FORM_URL = () =>
    optionalEnv("TOPIC_FORM_URL", "https://jl-labs.up.railway.app/form/byjustine-new-post");
