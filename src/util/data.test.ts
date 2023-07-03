import type { Release } from "@types";
import { describe, it, expect } from "vitest";
import { getReleaseUrl, sortArtistsByName } from "./data";

describe("getReleaseUrl function", () => {
  it("handles single artist per release", () => {
    const release1: Release = {
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

    const release2: Release = {
      id: 456,
      basic_information: {
        title: "American III: Solitary Man",
        artists: [
          {
            name: "Johnny Cash",
          },
        ],
      },
    };

    expect(getReleaseUrl(release1)).toBe("/afi/sing-the-sorrow/");
    expect(getReleaseUrl(release2)).toBe(
      "/johnny-cash/american-iii-solitary-man/"
    );
  });
});

describe("sortArtistsByName function", () => {
  it("sorts artists in the expected order", () => {
    const artists = [
      { name: "Tim Barry", slug: "tim-barry" },
      { name: "Slipknot", slug: "slipknot" },
      // Test for ignoring the definite article, "The"
      { name: "The Menzingers", slug: "the-menzingers" },
      { name: "AFI", slug: "afi" },
    ];
    const result = sortArtistsByName(artists).map((a) => a.name);
    const expectedKeys = ["AFI", "The Menzingers", "Slipknot", "Tim Barry"];
    console.log(result.length, expectedKeys.length);
    expect(result).toStrictEqual(expectedKeys);
  });
});
