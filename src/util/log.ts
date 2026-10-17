import type { Release } from "@types";
import { getAlbumYear } from "@util/data";

// The log starts here. Before this, records were added to Discogs in big
// catch-up batches, so their dates don't say when they were bought.
export const LOG_START = "2025-01";

const TIME_ZONE = "America/New_York";

export type LogMonth = {
  // "2026-10"
  key: string;
  year: string;
  month: string;
  // Oldest added first
  releases: Release[];
};

// Formats a date in Eastern time as "2026-10-14 07:55:23", which sorts as text
function toEastern(date: Date): string {
  return date.toLocaleString("sv-SE", { timeZone: TIME_ZONE });
}

/**
 * When the release was added to the collection, in Eastern time. Discogs
 * gives these in Pacific time, so a record added late on the last day of a
 * month in Pacific time can belong to the next month here.
 */
export function getAddedDate(release: Release): string {
  return toEastern(new Date(release.date_added));
}

// "2026-10", the log month the release was added in
export function getAddedMonthKey(release: Release): string {
  return getAddedDate(release).slice(0, 7);
}

// Whether the release was added after the log starts, when dates are reliable
export function isInLog(release: Release): boolean {
  return getAddedMonthKey(release) >= LOG_START;
}

export function getCurrentMonthKey(now: Date = new Date()): string {
  return toEastern(now).slice(0, 7);
}

// Every month from start to end, inclusive, oldest first
export function getMonthKeys(start: string, end: string): string[] {
  let [year, month] = start.split("-").map(Number);
  const keys: string[] = [];

  while (`${year}-${String(month).padStart(2, "0")}` <= end) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;

    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return keys;
}

/**
 * Releases grouped by the month they were added, newest month first. Includes
 * months where nothing was added.
 */
export function getLog(
  collection: Release[],
  start: string = LOG_START,
  end: string = getCurrentMonthKey()
): LogMonth[] {
  const byMonth = collection.reduce((obj, release) => {
    const key = getAddedMonthKey(release);
    (obj[key] ||= []).push(release);
    return obj;
  }, {} as { [key: string]: Release[] });

  return getMonthKeys(start, end)
    .reverse()
    .map((key) => {
      const [year, month] = key.split("-");
      const releases = [...(byMonth[key] || [])].sort((a, b) =>
        getAddedDate(a).localeCompare(getAddedDate(b))
      );

      return { key, year, month, releases };
    });
}

// "2026-10" to "October 2026"
export function getMonthName(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getLogUrl(key: string): string {
  const [year, month] = key.split("-");
  return `/log/${year}/${month}/`;
}

export type DatePart = { text: string; href?: string };

/**
 * The dates shown on a release page, like "Released 1976, this pressing 2018,
 * collected October 2026". The month links to its log page. The pressing
 * year only shows when it differs from the album year, and the collected
 * month only shows for releases in the log.
 */
export function getReleaseDateParts(release: Release): DatePart[] {
  const albumYear = getAlbumYear(release);
  const pressingYear = release.basic_information.year;
  const parts: DatePart[] = [];

  if (albumYear) {
    parts.push({ text: `released ${albumYear}` });
  }

  if (release.album?.year && pressingYear && pressingYear !== albumYear) {
    parts.push({ text: `this pressing ${pressingYear}` });
  }

  if (isInLog(release)) {
    const monthKey = getAddedMonthKey(release);
    parts.push({
      text: `collected ${getMonthName(monthKey)}`,
      href: getLogUrl(monthKey),
    });
  }

  if (parts.length) {
    parts[0].text = parts[0].text[0].toUpperCase() + parts[0].text.slice(1);
  }

  return parts;
}
