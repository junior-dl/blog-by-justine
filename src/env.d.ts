/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        user?: import("better-auth").User & { twoFactorEnabled?: boolean | null };
        session?: import("better-auth").Session;
    }
}
