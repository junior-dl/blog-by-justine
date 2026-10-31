/** Small status message at the bottom of portal pages. */
export function toast(message: string) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("opacity-0");
    clearTimeout((el as HTMLElement & { _t?: number })._t);
    (el as HTMLElement & { _t?: number })._t = window.setTimeout(() => el.classList.add("opacity-0"), 2200);
}
