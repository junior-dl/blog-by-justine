import {
    bigint,
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Blog                                                                 */
/* ------------------------------------------------------------------ */

export const posts = pgTable(
    "posts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        slug: text("slug").notNull().unique(),
        title: text("title").notNull(),
        description: text("description").notNull().default(""),
        /** Markdown body (no frontmatter). */
        body: text("body").notNull().default(""),
        author: text("author").notNull().default("Justine"),
        /** Only published posts are visible on the public site. */
        published: boolean("published").notNull().default(false),
        pubDate: timestamp("pub_date", { withTimezone: true }).notNull().defaultNow(),
        /** Where the post came from: import | n8n | portal */
        source: text("source").notNull().default("portal"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (t) => [index("posts_published_pub_date_idx").on(t.published, t.pubDate)],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

/* ------------------------------------------------------------------ */
/* Better Auth (email + password, two-factor plugin, DB rate limit)     */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const twoFactor = pgTable(
    "two_factor",
    {
        id: text("id").primaryKey(),
        secret: text("secret").notNull(),
        backupCodes: text("backup_codes").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        verified: boolean("verified").default(true),
        failedVerificationCount: integer("failed_verification_count").default(0),
        lockedUntil: timestamp("locked_until"),
    },
    (t) => [index("two_factor_secret_idx").on(t.secret), index("two_factor_user_id_idx").on(t.userId)],
);

export const rateLimit = pgTable("rate_limit", {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
