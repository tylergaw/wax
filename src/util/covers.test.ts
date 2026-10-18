import type { Release } from "@types";
import { describe, it, expect } from "vitest";
import { getCoverSections } from "./covers";

const release = (
  id: number,
  master_id: number,
  artist: string,
  title: string,
  source?: string
): Release => ({
  id,
  basic_information: { id, master_id, title, artists: [{ name: artist }] },
  cover: source ? { key: String(master_id || `r${id}`), source, version: "v1" } : undefined,
});

describe("getCoverSections function", () => {
  const sections = getCoverSections([
    release(1, 20, "Weezer", "Pinkerton", "cover-art-archive"),
    // Another pressing of the same album
    release(2, 20, "Weezer", "Pinkerton", "cover-art-archive"),
    release(3, 30, "AFI", "Sing The Sorrow", "discogs"),
    release(4, 40, "Bauhaus", "In The Flat Field", "discogs"),
    release(5, 0, "Baroness", "Morningstar", "manual"),
    release(6, 60, "Lard", "Pure Chewing Satisfaction"),
  ]);

  it("groups albums by source, Discogs first, skipping empty sections", () => {
    expect(sections.map((s) => s.source)).toEqual([
      "discogs",
      "none",
      "cover-art-archive",
      "manual",
    ]);
  });

  it("lists each album once, sorted by artist", () => {
    expect(sections[0].albums.map((a) => a.artist)).toEqual(["AFI", "Bauhaus"]);
    expect(sections[2].albums).toHaveLength(1);
  });

  it("includes the album key for the upload path", () => {
    expect(sections[3].albums[0].key).toBe("r5");
    expect(sections[1].albums[0].coverUrl).toBeUndefined();
  });
});
