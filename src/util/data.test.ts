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
          artists: [
            {
              name: "Slipknot",
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
      {
        basic_information: {
          artists: [
            {
              name: "Tim Barry",
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
    const expectedKeys = ["AFI", "Slipknot", "Soundgarden", "Tim Barry"];
    expect(Object.keys(getReleasesByArtist(collection))).toBe(expectedKeys);
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
