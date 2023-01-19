import type { Collection, Release } from "@types";
import { describe, it, expect } from "vitest";
import { getArtists, getReleasesByArtist, getReleaseUrl } from "./data";

describe("getArtists function", () => {
  it("handles single artist per release", () => {
    const collection: Collection = [
      {
        basic_information: {
          artists: [
            {
              name: "AFI",
            },
          ],
        },
      },
      {
        basic_information: {
          artists: [
            {
              name: "Soundgarden",
            },
          ],
        },
      },
    ];
    const artists = getArtists(collection);
    expect(artists.length).toBe(2);
  });

  it("handles multiple artists per release", () => {
    const collection: Collection = [
      {
        basic_information: {
          artists: [
            {
              name: "Soundgarden",
            },
            {
              name: "Pearl Jam",
            },
          ],
        },
      },
    ];
    const artists = getArtists(collection);
    expect(artists.length).toBe(2);
  });

  it("does not duplicate artists", () => {
    const collection: Collection = [
      {
        basic_information: {
          artists: [
            {
              name: "AFI",
            },
          ],
        },
      },
      {
        basic_information: {
          artists: [
            {
              name: "AFI",
            },
          ],
        },
      },
    ];
    const artists = getArtists(collection);
    expect(artists.length).toBe(1);
  });
});

describe("getReleasesByArtist function", () => {
  it("returns the expected results", () => {
    const collection: Collection = [
      {
        basic_information: {
          title: "Iowa",
          year: 2001,
          artists: [
            {
              name: "Slipknot",
            },
          ],
        },
      },
      {
        basic_information: {
          title: "Sing the Sorrow",
          year: 2003,
          artists: [
            {
              name: "AFI",
            },
          ],
        },
      },
      {
        basic_information: {
          title: "Manchester",
          year: 2011,
          artists: [
            {
              name: "Tim Barry",
            },
          ],
        },
      },
      {
        basic_information: {
          title: "The Art of Drowning",
          year: 2000,
          artists: [
            {
              name: "AFI",
            },
          ],
        },
      },
      {
        basic_information: {
          title: "Superunknown",
          year: 1994,
          artists: [
            {
              name: "Soundgarden",
            },
          ],
        },
      },
    ];
    const expectedKeys = ["AFI", "Slipknot", "Soundgarden", "Tim Barry"];
    const result = getReleasesByArtist(collection);

    // Test to make sure we're getting the expected number of keys(artists)
    // This makes sure we don't have duplicate artist entries when we have
    // multiple releases by a single artist, like AFI in the above sample.
    expect(Object.keys(result)).toStrictEqual(expectedKeys);
    expect(result["Soundgarden"].length).toBe(1);
    expect(result["AFI"].length).toBe(2);

    // Maybe a short-sighted test, but checking to make sure data sorting works.
    const releaseYears = result["AFI"].map(
      (release: Release) => release.basic_information.year
    );
    expect(releaseYears).toStrictEqual([2000, 2003]);
  });
});

describe("getReleaseUrl function", () => {
  it("handles single artist per release", () => {
    const release1: Release = {
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
