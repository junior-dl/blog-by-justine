import { defineMiddleware } from "astro:middleware";
import { getAuth, isAdminEmail } from "./lib/auth";

/** Portal pages anyone may open (they handle their own state). */
const PUBLIC_PORTAL_PAGES = new Set(["/portal/login", "/portal/two-factor"]);
/** Pages a signed-in admin may open before turning on MFA. */
const MFA_SETUP_PAGES = new Set(["/portal/security"]);

function stripSlash(path: string) {
    return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
    const path = stripSlash(ctx.url.pathname);
    const isPortalPage = path === "/portal" || path.startsWith("/portal/");
    const isPortalApi = path.startsWith("/api/portal/");

    if (!isPortalPage && !isPortalApi) return next();

    const deny = (status: number, message: string) =>
        isPortalApi
            ? Response.json({ error: message }, { status })
            : ctx.redirect(`/portal/login${status === 403 ? "?error=forbidden" : ""}`);

    if (!PUBLIC_PORTAL_PAGES.has(path)) {
        const result = await getAuth().api.getSession({ headers: ctx.request.headers });
        if (!result) return deny(401, "Not signed in");
        if (!isAdminEmail(result.user.email)) return deny(403, "Not allowed");

        // MFA is mandatory: until it is on, only the security page is reachable.
        if (!result.user.twoFactorEnabled && !MFA_SETUP_PAGES.has(path)) {
            return isPortalApi
                ? Response.json({ error: "Two-factor authentication required" }, { status: 403 })
                : ctx.redirect("/portal/security");
        }
        ctx.locals.user = result.user;
        ctx.locals.session = result.session;
    }

    const response = await next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
});
