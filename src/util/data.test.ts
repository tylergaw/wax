import type { Release } from "@types";
import { describe, it, expect } from "vitest";
import {
  getAlbumKey,
  getArtistDisplayName,
  getCoverUrl,
  getDiscCount,
  getFormatLabel,
  getHumanColor,
  getMachineColor,
  getReleaseUrl,
  sortArtistsByName,
  toSlug,
} from "./data";

describe("getReleaseUrl function", () => {
  it("handles single artist per release", () => {
    const release1: Release = {
      id: 123,
      basic_information: {
        id: 123,
        title: "Sing The Sorrow",
        artists: [
          {
            name: "AFI",
          },
        ],
      },
    };

    const release2: Release = {
      id: 456,
      basic_information: {
        id: 456,
        title: "American III: Solitary Man",
        artists: [
          {
            name: "Johnny Cash",
          },
        ],
      },
    };

    expect(getReleaseUrl(release1)).toBe("/afi/sing-the-sorrow-123/");
    expect(getReleaseUrl(release2)).toBe(
      "/johnny-cash/american-iii-solitary-man-456/"
    );
  });

  it("treats slashes in names as word breaks", () => {
    const release: Release = {
      id: 789,
      basic_information: {
        id: 789,
        title: "In/Casino/Out",
        artists: [
          {
            name: "Bad Cop/Bad Cop",
          },
        ],
      },
    };

    expect(getReleaseUrl(release)).toBe(
      "/bad-cop-bad-cop/in-casino-out-789/"
    );
  });
});

describe("toSlug function", () => {
  it("treats slashes as word breaks", () => {
    expect(toSlug("Bad Cop/Bad Cop")).toBe("bad-cop-bad-cop");
    expect(toSlug("Live/1975-85")).toBe("live-1975-85");
  });
});

describe("sortArtistsByName function", () => {
  it("sorts artists in the expected order", () => {
    const artists = [
      { id: 1, name: "Tim Barry", slug: "tim-barry" },
      { id: 2, name: "Slipknot", slug: "slipknot" },
      // Test for ignoring the definite article, "The"
      { id: 3, name: "The Menzingers", slug: "the-menzingers" },
      { id: 4, name: "AFI", slug: "afi" },
    ];
    const result = sortArtistsByName(artists).map((a) => a.name);
    const expectedKeys = ["AFI", "The Menzingers", "Slipknot", "Tim Barry"];
    expect(result).toStrictEqual(expectedKeys);
  });

  it("ignores case, accents, and a lowercase the", () => {
    const artists = [
      { id: 1, name: "ZZ Top", slug: "zz-top" },
      { id: 2, name: "of Montreal", slug: "of-montreal" },
      { id: 3, name: "the Get Up Kids", slug: "the-get-up-kids" },
      { id: 4, name: "Múm", slug: "mum" },
      { id: 5, name: "Mudhoney", slug: "mudhoney" },
    ];
    const result = sortArtistsByName(artists).map((a) => a.name);
    expect(result).toStrictEqual([
      "the Get Up Kids",
      "Mudhoney",
      "Múm",
      "of Montreal",
      "ZZ Top",
    ]);
  });
});

describe("getHumanColor function", () => {
  it("handles default color", () => {
    const release: Release = {
      id: 123,
      basic_information: {
        title: "Sing The Sorrow",
        artists: [
          {
            name: "AFI",
          },
        ],
      },
    };

    expect(getHumanColor(release)).toBe("Black Vinyl");
  });

  it("handles custom color", () => {
    const release: Release = {
      id: 123,
      basic_information: {
        title: "Sing The Sorrow",
        artists: [
          {
            name: "AFI",
          },
        ],
      },
      display: {
        humanReadableColor: "Coke Bottle Clear",
      },
    };

    expect(getHumanColor(release)).toBe("Coke Bottle Clear Vinyl");
  });
});

describe("getMachineColor function", () => {
  it("handles default color", () => {
    const release: Release = {
      id: 123,
      basic_information: {
        title: "Sing The Sorrow",
        artists: [
          {
            name: "AFI",
          },
        ],
      },
    };

    expect(getMachineColor(release)).toBe("var(--color-primary-dark)");
  });

  it("handles custom color", () => {
    const release: Release = {
      id: 123,
      basic_information: {
        title: "Sing The Sorrow",
        artists: [
          {
            name: "AFI",
          },
        ],
      },
      display: {
        cssReadableColors: ["rgb(100,120,100)"],
      },
    };

    expect(getMachineColor(release)).toBe("rgb(100,120,100)");
  });
});

describe("getArtistDisplayName function", () => {
  it("returns cleaned up names when expected", () => {
    expect(getArtistDisplayName("Battle Royale (2)")).toBe("Battle Royale");
    expect(getArtistDisplayName("H20 (7)")).toBe("H20");
    expect(getArtistDisplayName("Pup (3)")).toBe("Pup");
  });

  it("leaves names alone when expected", () => {
    expect(getArtistDisplayName("A (strange) Artist Name")).toBe(
      "A (strange) Artist Name"
    );
    expect(getArtistDisplayName("(International) Noise Conspiracy")).toBe(
      "(International) Noise Conspiracy"
    );
  });
});

describe("getAlbumKey function", () => {
  it("uses the master id, or the release id without a master", () => {
    expect(getAlbumKey({ id: 1, basic_information: { id: 1, master_id: 20 } })).toBe("20");
    expect(getAlbumKey({ id: 5, basic_information: { id: 5, master_id: 0 } })).toBe("r5");
  });
});

describe("getCoverUrl function", () => {
  it("builds the sized cover URL", () => {
    const release: Release = {
      id: 1,
      basic_information: {},
      cover: { key: "20", source: "manual", version: "abc123" },
    };

    expect(getCoverUrl(release, 600)).toBe(
      "https://stuff.tylergaw.com/wax/covers/sized/20-abc123-600.jpg"
    );
  });

  it("returns undefined without a cover", () => {
    expect(getCoverUrl({ id: 1, basic_information: {} }, 600)).toBeUndefined();
  });
});

describe("getDiscCount and getFormatLabel functions", () => {
  const release = (...formats: [string, string, string[]][]): Release => ({
    id: 1,
    basic_information: {
      formats: formats.map(([name, qty, descriptions]) => ({
        name,
        qty,
        descriptions,
      })),
    },
  });

  it("adds up vinyl discs across format entries", () => {
    const r = release(["Vinyl", "2", ["LP"]], ["Vinyl", "1", ["LP"]], ["CD", "1", []]);
    expect(getDiscCount(r)).toBe(3);
    expect(getFormatLabel(r)).toBe("3xLP");
  });

  it("uses the record size for multiple small records", () => {
    expect(getFormatLabel(release(["Vinyl", "3", ['7"']]))).toBe('3x7"');
  });

  it("only shows the size for single 7 and 10 inch records", () => {
    expect(getFormatLabel(release(["Vinyl", "1", ['7"']]))).toBe('7"');
    expect(getFormatLabel(release(["Vinyl", "1", ['10"', "EP"]]))).toBe('10"');
    expect(getFormatLabel(release(["Vinyl", "1", ["LP"]]))).toBeNull();
    expect(getFormatLabel(release(["Vinyl", "1", ['12"', "EP"]]))).toBeNull();
  });

  it("counts each size in mixed sets", () => {
    const boxSet = release(
      ["Box Set", "1", []],
      ["Vinyl", "2", ["LP"]],
      ["Vinyl", "1", ['7"']],
      ["Vinyl", "1", ['7"']],
      ["Vinyl", "3", ['7"']]
    );
    expect(getDiscCount(boxSet)).toBe(2);
    expect(getFormatLabel(boxSet)).toBe('2xLP + 5x7"');
    expect(
      getFormatLabel(release(["Vinyl", "1", ['12"']], ["Vinyl", "1", ['7"']]))
    ).toBe('LP + 7"');
  });

  it("ignores formats that aren't vinyl", () => {
    expect(getFormatLabel(release(["CD", "1", ['7"']], ["Vinyl", "1", ["LP"]]))).toBeNull();
  });

  it("counts every disc when there are no LPs", () => {
    expect(getDiscCount(release(["Vinyl", "11", ['7"']]))).toBe(11);
  });

  it("counts at least one disc", () => {
    expect(getDiscCount({ id: 1, basic_information: {} })).toBe(1);
  });
});
