import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        // Use the direct (non-pooled) Neon URL for migrations if you have one.
        url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
    },
});
