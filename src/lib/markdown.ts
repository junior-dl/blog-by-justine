import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";

const marked = new Marked({ gfm: true, breaks: false });

/** Markdown → sanitized HTML. Links open in a new tab when external. */
export function renderMarkdown(md: string): string {
    const raw = marked.parse(md ?? "", { async: false }) as string;
    return sanitizeHtml(raw, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "del"]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            a: ["href", "title", "target", "rel"],
            img: ["src", "alt", "title", "loading"],
            code: ["class"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
            a: (tagName, attribs) => {
                const external = /^https?:\/\//i.test(attribs.href ?? "");
                return {
                    tagName,
                    attribs: external
                        ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
                        : attribs,
                };
            },
            img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
        },
    });
}
