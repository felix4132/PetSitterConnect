// Utility helpers for tests to generate ISO date strings relative to today

/**
 * Returns ISO date string (YYYY-MM-DD) for today + offsetDays.
 * @param offsetDays number of days to add (can be negative)
 */
export function isoDatePlus(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    // Ensure we don't get time zone offsets affecting the date
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/** ISO date string for today */
export function isoDate(): string {
    return isoDatePlus(0);
}

/** ISO date string for yesterday */
export function isoYesterday(): string {
    return isoDatePlus(-1);
}
