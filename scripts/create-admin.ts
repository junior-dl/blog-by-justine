/**
 * Creates (or resets the password of) the portal admin account.
 * Public sign-up is disabled, so this is the only way to make an account.
 *
 *   npm run admin:create -- you@example.com "Your Name"
 *
 * The password is asked for interactively (not echoed).
 * The email must also be listed in ADMIN_EMAILS.
 */
import "dotenv/config";
import { createInterface } from "node:readline";
import { eq, and } from "drizzle-orm";
import { closeDb, getDb } from "../src/db/client";
import { account, user } from "../src/db/schema";
import { getAuth, isAdminEmail } from "../src/lib/auth";

function ask(question: string, hidden = false): Promise<string> {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        if (hidden) {
            const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
            out._writeToOutput = (s: string) => {
                if (s.startsWith(question)) out.output.write(question);
                else if (s.includes("\n")) out.output.write("\n");
            };
        }
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function main() {
    const email = (process.argv[2] ?? (await ask("Email: "))).trim().toLowerCase();
    const name = (process.argv[3] ?? "Justine").trim();
    if (!isAdminEmail(email)) {
        throw new Error(`${email} is not in ADMIN_EMAILS. Add it to .env first.`);
    }

    const password = process.env.ADMIN_PASSWORD ?? (await ask("Password (min 12 chars): ", true));
    if (password.length < 12) throw new Error("Password must be at least 12 characters.");
    if (!process.env.ADMIN_PASSWORD) {
        const again = await ask("Repeat password: ", true);
        if (again !== password) throw new Error("Passwords do not match.");
    }

    const ctx = await getAuth().$context;
    const hash = await ctx.password.hash(password);
    const db = getDb();

    const [existing] = await db.select().from(user).where(eq(user.email, email));
    if (existing) {
        await db
            .update(account)
            .set({ password: hash, updatedAt: new Date() })
            .where(and(eq(account.userId, existing.id), eq(account.providerId, "credential")));
        console.log(`Password updated for ${email}. Existing two-factor settings were kept.`);
        return;
    }

    const created = await ctx.internalAdapter.createUser({ email, name, emailVerified: true }, { method: "admin" });
    await ctx.internalAdapter.linkAccount({
        userId: created.id,
        providerId: "credential",
        accountId: created.id,
        password: hash,
    });
    console.log(`Admin ${email} created. Sign in at /portal/login and set up two-factor.`);
}

main()
    .catch((err) => {
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    })
    .finally(closeDb);
