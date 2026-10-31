import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { getDb } from "../db/client";
import * as schema from "../db/schema";
import { env, optionalEnv } from "./env";

function createAuth() {
    return betterAuth({
        appName: "By Justine",
        baseURL: optionalEnv("BETTER_AUTH_URL") || undefined,
        secret: env("BETTER_AUTH_SECRET"),
        database: drizzleAdapter(getDb(), {
            provider: "pg",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
                twoFactor: schema.twoFactor,
                rateLimit: schema.rateLimit,
            },
        }),
        emailAndPassword: {
            enabled: true,
            // Single-admin site: accounts are created with `npm run admin:create`.
            disableSignUp: true,
            minPasswordLength: 12,
        },
        session: {
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            updateAge: 60 * 60 * 24,
        },
        rateLimit: {
            enabled: true,
            storage: "database",
            window: 60,
            max: 30,
            customRules: {
                "/sign-in/email": { window: 60, max: 5 },
                "/two-factor/verify-totp": { window: 60, max: 5 },
                "/two-factor/verify-backup-code": { window: 60, max: 5 },
            },
        },
        plugins: [
            twoFactor({
                issuer: "By Justine",
            }),
        ],
    });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;

/** Lazily created so pages that never touch auth don't need its env vars. */
export function getAuth(): Auth {
    instance ??= createAuth();
    return instance;
}

export function isAdminEmail(email: string | null | undefined): boolean {
    const allowed = optionalEnv("ADMIN_EMAILS")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return !!email && allowed.includes(email.toLowerCase());
}
