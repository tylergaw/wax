import type { Release } from "@types";
import { describe, it, expect } from "vitest";
import {
  getHumanColor,
  getMachineColor,
  getReleaseUrl,
  sortArtistsByName,
} from "./data";

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
