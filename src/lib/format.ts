/** Display helpers shared by the public blog pages. */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
});

export function formatDate(date: Date): string {
    return dateFormatter.format(date);
}

/** ISO date (YYYY-MM-DD) for <time datetime>. */
export function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/** Rough reading time at 200 words per minute, minimum 1 minute. */
export function readingTime(body: string): number {
    const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}
