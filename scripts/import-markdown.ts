/**
 * One-time import of the old Markdown posts into the database.
 *
 *   npm run posts:import            # imports legacy/blog/*.md
 *   npm run posts:import -- <dir>   # or any other folder
 *
 * Safe to re-run: posts whose slug already exists are skipped.
 * Imported posts keep their original date and are published.
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db/client";
import { posts } from "../src/db/schema";

function parseFrontmatter(src: string): { data: Record<string, string>; body: string } {
    const text = src.replace(/^﻿/, "").replace(/\r\n/g, "\n");
    const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { data: {}, body: text };
    const data: Record<string, string> = {};
    for (const line of match[1].split("\n")) {
        const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!m) continue;
        let value = m[2].trim();
        if (value.startsWith('"')) {
            try {
                value = JSON.parse(value);
            } catch {
                value = value.slice(1, -1);
            }
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1).replace(/''/g, "'");
        }
        data[m[1]] = value;
    }
    return { data, body: match[2].trim() + "\n" };
}

async function main() {
    const dir = process.argv[2] ?? "legacy/blog";
    const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
    const db = getDb();
    let imported = 0;

    for (const file of files) {
        const slug = basename(file, ".md");
        const [exists] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug));
        if (exists) {
            console.log(`skip   ${slug} (already in database)`);
            continue;
        }
        const { data, body } = parseFrontmatter(await readFile(join(dir, file), "utf8"));
        if (!data.title) {
            console.warn(`skip   ${slug} (no title in frontmatter)`);
            continue;
        }
        await db.insert(posts).values({
            slug,
            title: data.title,
            description: data.description ?? "",
            body,
            author: data.author || "Justine",
            pubDate: data.pubDate ? new Date(data.pubDate) : new Date(),
            published: true,
            source: "import",
        });
        imported++;
        console.log(`import ${slug}`);
    }
    console.log(`\nDone: ${imported} imported, ${files.length - imported} skipped.`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(closeDb);
