import type { APIRoute } from "astro";
import { createPost } from "../../../../lib/posts";
import { errorResponse, parsePostInput, readJson } from "../../../../lib/validate";

export const prerender = false;

/** Create a post from the portal. */
export const POST: APIRoute = async ({ request }) => {
    try {
        const input = parsePostInput(await readJson(request));
        const post = await createPost({ ...input, source: "portal" });
        return Response.json({ post }, { status: 201 });
    } catch (err) {
        return errorResponse(err);
    }
};
