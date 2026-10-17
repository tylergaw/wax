import type { Release } from "@types";
import { getAlbumYear } from "@util/data";

// Before this, records were added to Discogs in catch-up batches, so their
// dates don't say when they were bought
export const LOG_START = "2025-01";

const TIME_ZONE = "America/New_York";

export type LogMonth = {
  key: string;
  year: string;
  month: string;
  releases: Release[];
};

function toEastern(date: Date): string {
  return date.toLocaleString("sv-SE", { timeZone: TIME_ZONE });
}

export function getAddedDate(release: Release): string {
  return toEastern(new Date(release.date_added));
}

export function getAddedMonthKey(release: Release): string {
  return getAddedDate(release).slice(0, 7);
}

export function isInLog(release: Release): boolean {
  return getAddedMonthKey(release) >= LOG_START;
}

export function getCurrentMonthKey(now: Date = new Date()): string {
  return toEastern(now).slice(0, 7);
}

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
