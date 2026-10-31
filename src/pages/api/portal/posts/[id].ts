import type { APIRoute } from "astro";
import { deletePost, getPostById, updatePost } from "../../../../lib/posts";
import { errorResponse, parsePostPatch, readJson } from "../../../../lib/validate";

export const prerender = false;

const notFound = () => Response.json({ error: "Post not found" }, { status: 404 });

/** Partial update: { published }, or any edited fields. */
export const PATCH: APIRoute = async ({ params, request }) => {
    try {
        if (!(await getPostById(params.id!))) return notFound();
        const patch = parsePostPatch(await readJson(request));
        const post = await updatePost(params.id!, patch);
        return Response.json({ post });
    } catch (err) {
        return errorResponse(err);
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        return (await deletePost(params.id!)) ? Response.json({ ok: true }) : notFound();
    } catch (err) {
        return errorResponse(err);
    }
};
