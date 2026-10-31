import type { PostUpdate } from "./posts";

/** Thrown for bad client input; turned into a 400 response. */
export class InputError extends Error {}

const LIMITS = { title: 200, slug: 120, description: 400, author: 80, body: 200_000 } as const;

function str(v: unknown, field: keyof typeof LIMITS, required = false): string | undefined {
    if (v === undefined || v === null) {
        if (required) throw new InputError(`${field} is required`);
        return undefined;
    }
    if (typeof v !== "string") throw new InputError(`${field} must be a string`);
    const s = field === "body" ? v.replace(/\r\n/g, "\n") : v.trim();
    if (required && !s) throw new InputError(`${field} is required`);
    if (s.length > LIMITS[field]) throw new InputError(`${field} is too long (max ${LIMITS[field]})`);
    return s;
}

function date(v: unknown): Date | undefined {
    if (v === undefined || v === null || v === "") return undefined;
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) throw new InputError("pubDate is not a valid date");
    return d;
}

function bool(v: unknown, field: string): boolean | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v !== "boolean") throw new InputError(`${field} must be true or false`);
    return v;
}

/** Validates a full post (create). */
export function parsePostInput(raw: unknown) {
    if (!raw || typeof raw !== "object") throw new InputError("Expected a JSON object");
    const r = raw as Record<string, unknown>;
    return {
        title: str(r.title, "title", true)!,
        slug: str(r.slug, "slug"),
        description: str(r.description, "description") ?? "",
        body: str(r.body, "body") ?? "",
        author: str(r.author, "author") || "Justine",
        published: bool(r.published, "published") ?? false,
        pubDate: date(r.pubDate),
    };
}

/** Validates a partial update; only provided fields are returned. */
export function parsePostPatch(raw: unknown): PostUpdate {
    if (!raw || typeof raw !== "object") throw new InputError("Expected a JSON object");
    const r = raw as Record<string, unknown>;
    const out: PostUpdate = {};
    if ("title" in r) out.title = str(r.title, "title", true);
    if ("slug" in r) out.slug = str(r.slug, "slug", true);
    if ("description" in r) out.description = str(r.description, "description") ?? "";
    if ("body" in r) out.body = str(r.body, "body") ?? "";
    if ("author" in r) out.author = str(r.author, "author") || "Justine";
    if ("published" in r) out.published = bool(r.published, "published");
    if ("pubDate" in r) out.pubDate = date(r.pubDate);
    for (const k of Object.keys(out) as (keyof PostUpdate)[]) if (out[k] === undefined) delete out[k];
    return out;
}

export async function readJson(request: Request): Promise<unknown> {
    try {
        return await request.json();
    } catch {
        throw new InputError("Body must be valid JSON");
    }
}

export function errorResponse(err: unknown): Response {
    if (err instanceof InputError) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
}
