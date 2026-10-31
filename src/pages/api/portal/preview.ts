import type { APIRoute } from "astro";
import { renderMarkdown } from "../../../lib/markdown";
import { errorResponse, readJson } from "../../../lib/validate";

export const prerender = false;

/** Renders Markdown exactly like the public post page does. */
export const POST: APIRoute = async ({ request }) => {
    try {
        const { body } = (await readJson(request)) as { body?: unknown };
        return Response.json({ html: renderMarkdown(typeof body === "string" ? body : "") });
    } catch (err) {
        return errorResponse(err);
    }
};
