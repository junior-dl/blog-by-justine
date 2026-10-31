import { and, desc, eq, ne } from "drizzle-orm";
import { getDb } from "../db/client";
import { posts, type NewPost, type Post } from "../db/schema";

export type { Post };

export function slugify(input: string): string {
    return input
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}

/* ---------------- public ---------------- */

export async function listPublishedPosts(limit?: number): Promise<Post[]> {
    const q = getDb()
        .select()
        .from(posts)
        .where(eq(posts.published, true))
        .orderBy(desc(posts.pubDate));
    return limit ? q.limit(limit) : q;
}

export async function getPublishedPostBySlug(slug: string): Promise<Post | undefined> {
    const [row] = await getDb()
        .select()
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.published, true)))
        .limit(1);
    return row;
}

/* ---------------- portal ---------------- */

export async function listAllPosts(): Promise<Post[]> {
    return getDb().select().from(posts).orderBy(desc(posts.pubDate));
}

export async function getPostById(id: string): Promise<Post | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const [row] = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
    return row;
}

/** Returns a slug that no other post uses (appends -2, -3, ...). */
export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
    const root = slugify(base) || "post";
    for (let i = 1; i < 100; i++) {
        const candidate = i === 1 ? root : `${root}-${i}`;
        const where = exceptId
            ? and(eq(posts.slug, candidate), ne(posts.id, exceptId))
            : eq(posts.slug, candidate);
        const [hit] = await getDb().select({ id: posts.id }).from(posts).where(where).limit(1);
        if (!hit) return candidate;
    }
    return `${root}-${Date.now()}`;
}

export async function createPost(
    input: Omit<NewPost, "id" | "createdAt" | "updatedAt" | "slug"> & { slug?: string },
): Promise<Post> {
    const slug = await uniqueSlug(input.slug || input.title);
    const [row] = await getDb().insert(posts).values({ ...input, slug }).returning();
    return row;
}

export type PostUpdate = Partial<
    Pick<Post, "title" | "slug" | "description" | "body" | "author" | "published" | "pubDate">
>;

export async function updatePost(id: string, patch: PostUpdate): Promise<Post | undefined> {
    const values: PostUpdate = { ...patch };
    if (values.slug !== undefined) values.slug = await uniqueSlug(values.slug, id);
    const [row] = await getDb().update(posts).set(values).where(eq(posts.id, id)).returning();
    return row;
}

export async function deletePost(id: string): Promise<boolean> {
    const rows = await getDb().delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
    return rows.length > 0;
}
