import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins";

/** Browser-side auth client used by the portal pages. */
export const authClient = createAuthClient({
    plugins: [twoFactorClient()],
});
