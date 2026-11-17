const CAIRO_TIME_ZONE = "Africa/Cairo";
const DAY_MS = 24 * 60 * 60 * 1000;

function partsFor(date: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CAIRO_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, part.value]),
  );
}

/** The persisted day key is always a Cairo calendar date, never server UTC. */
export function cairoDate(date: Date): string {
  const parts = partsFor(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dateKeyToUtc(key: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`Invalid Cairo date key: ${key}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function addCairoDays(key: string, days: number): string {
  const date = new Date(dateKeyToUtc(key) + days * DAY_MS);
  return date.toISOString().slice(0, 10);
}

export function differenceInCairoDays(fromKey: string, toKey: string): number {
  return Math.round((dateKeyToUtc(toKey) - dateKeyToUtc(fromKey)) / DAY_MS);
}

export function cairoDateForDay(start: Date, dayIndex: number): string {
  return addCairoDays(cairoDate(start), dayIndex - 1);
}

export function currentDayNumber(
  start: Date,
  totalDays: number,
  now = new Date(),
): number {
  const difference = differenceInCairoDays(cairoDate(start), cairoDate(now));
  if (difference < 0) return 0;
  return difference + 1;
}

export function endDateForDuration(start: Date, durationDays: number): Date {
  // Expiry is the first instant of the next Cairo calendar day. Binary search
  // also handles the spring DST night when local midnight itself is skipped.
  const endKey = addCairoDays(cairoDate(start), durationDays);
  const center = dateKeyToUtc(endKey);
  let low = center - DAY_MS;
  let high = center + DAY_MS;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (cairoDate(new Date(middle)) < endKey) low = middle + 1;
    else high = middle;
  }
  return new Date(low);
}

export function asDate(value: Date | string | number): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date;
}

export { CAIRO_TIME_ZONE };
