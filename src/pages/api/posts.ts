import type { APIRoute } from "astro";
import { timingSafeEqual } from "node:crypto";
import { optionalEnv } from "../../lib/env";
import { createPost } from "../../lib/posts";
import { errorResponse, parsePostInput, readJson } from "../../lib/validate";

export const prerender = false;

function authorized(request: Request): boolean {
    const expected = optionalEnv("INGEST_API_KEY");
    if (expected.length < 32) return false; // refuse weak / missing keys
    const header = request.headers.get("authorization") ?? "";
    const given = header.replace(/^Bearer\s+/i, "");
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Ingest endpoint for the n8n "byJustine Blog Writer" workflow.
 * Posts arrive hidden unless `published: true` is sent.
 *
 *   POST /api/posts
 *   Authorization: Bearer <INGEST_API_KEY>
 *   { "title", "description", "body", "slug"?, "pubDate"?, "author"?, "published"? }
 */
export const POST: APIRoute = async ({ request, url }) => {
    if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const input = parsePostInput(await readJson(request));
        const post = await createPost({ ...input, source: "n8n" });
        return Response.json(
            {
                id: post.id,
                slug: post.slug,
                published: post.published,
                url: `${url.origin}/blog/${post.slug}/`,
                editUrl: `${url.origin}/portal/posts/${post.id}`,
            },
            { status: 201 },
        );
    } catch (err) {
        return errorResponse(err);
    }
};
