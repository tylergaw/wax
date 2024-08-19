import type { Collection, Release } from "@types";
import { describe, it, expect } from "vitest";
import {
  combineDataSources,
  getArtists,
  getReleasesByArtist,
  getVibes,
} from "./store";

describe("combineDataSources function", () => {
  it("returns the expected results", () => {
    const discogsData: Collection = [
      {
        id: 123,
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
    ];

    const openAIEnrichments = [
      {
        id: 123,
        description: "Red Translucent",
        humanReadableColor: "Red Translucent",
        cssReadableColors: ["red"],
        pattern_texture: "translucent",
      },
    ];

    const finalCollection = combineDataSources(discogsData, openAIEnrichments);
    const release = finalCollection[0];

    // First, make sure all standard properties are still in place
    expect(release).toHaveProperty("basic_information");
    expect(release).toHaveProperty("basic_information.title", "Iowa");

    // Next, check for the expected properites from openai enrichment
    expect(release).toHaveProperty("display");
    expect(release).toHaveProperty(
      "display.humanReadableColor",
      "Red Translucent"
    );
    expect(release).toHaveProperty("display.cssReadableColors", ["red"]);
    expect(release).toHaveProperty("display.pattern_texture", "translucent");
  });
});

describe("getArtists function", () => {
  it("handles single artist per release", () => {
    const collection: Collection = [
      {
        id: 123,
        basic_information: {
          id: 123,
          artists: [
            {
              id: 1,
              name: "AFI",
            },
          ],
        },
      },
      {
        id: 456,
        basic_information: {
          id: 456,
          artists: [
            {
              id: 2,
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
        id: 123,
        basic_information: {
          id: 123,
          artists: [
            {
              id: 1,
              name: "Soundgarden",
            },
            {
              id: 2,
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
        id: 123,
        basic_information: {
          id: 123,
          artists: [
            {
              name: "AFI",
            },
          ],
        },
      },
      {
        id: 456,
        basic_information: {
          id: 456,
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

  // This is likely redundant since we test for this in the sortArtistsByName
  // function, but keeping it in place since I wrote this test first.
  it("ignores the definite article artist names", () => {
    const collection: Collection = [
      {
        id: 123,
        basic_information: {
          id: 123,
          title: "Superunknown",
          year: 1994,
          artists: [
            {
              id: 1,
              name: "Soundgarden",
            },
          ],
        },
      },
      {
        id: 456,
        basic_information: {
          id: 456,
          title: "On The Impossible Past",
          year: 2012,
          artists: [
            {
              id: 2,
              name: "The Menzingers",
            },
          ],
        },
      },
      {
        id: 789,
        basic_information: {
          id: 789,
          artists: [
            {
              id: 3,
              name: "AFI",
            },
          ],
        },
      },
    ];
    const artists = getArtists(collection);
    const expectedKeys = ["AFI", "The Menzingers", "Soundgarden"];
    expect(artists.map((a) => a.name)).toStrictEqual(expectedKeys);
  });
});

describe("getReleasesByArtist function", () => {
  it("returns the expected results", () => {
    const collection: Collection = [
      {
        id: 123,
        basic_information: {
          id: 123,
          title: "Iowa",
          year: 2001,
          artists: [
            {
              id: 1,
              name: "Slipknot",
            },
          ],
        },
      },
      {
        id: 456,
        basic_information: {
          id: 456,
          title: "Sing the Sorrow",
          year: 2003,
          artists: [
            {
              id: 2,
              name: "AFI",
            },
          ],
        },
      },
      {
        id: 789,
        basic_information: {
          id: 789,
          title: "On The Impossible Past",
          year: 2012,
          artists: [
            {
              id: 3,
              name: "The Menzingers",
            },
          ],
        },
      },
      {
        id: 111,
        basic_information: {
          id: 111,
          title: "Manchester",
          year: 2011,
          artists: [
            {
              id: 4,
              name: "Tim Barry",
            },
          ],
        },
      },
      {
        id: 222,
        basic_information: {
          id: 222,
          title: "The Art of Drowning",
          year: 2000,
          artists: [
            {
              id: 5,
              name: "AFI",
            },
          ],
        },
      },
      {
        id: 333,
        basic_information: {
          id: 333,
          title: "Superunknown",
          year: 1994,
          artists: [
            {
              id: 6,
              name: "Soundgarden",
            },
          ],
        },
      },
      {
        id: 444,
        basic_information: {
          id: 444,
          title: "Frances The Mute",
          year: 2005,
          artists: [
            {
              id: 7,
              name: "The Mars Volta",
            },
          ],
        },
      },
    ];
    const expectedKeys = [
      "afi",
      "the mars volta",
      "the menzingers",
      "slipknot",
      "soundgarden",
      "tim barry",
    ];
    const result = getReleasesByArtist(collection);

    // Test to make sure we're getting the expected number of keys(artists)
    // This makes sure we don't have duplicate artist entries when we have
    // multiple releases by a single artist, like AFI in the above sample.
    expect(Object.keys(result)).toStrictEqual(expectedKeys);
    expect(result["soundgarden"].length).toBe(1);
    expect(result["afi"].length).toBe(2);

    // Maybe a short-sighted test, but checking to make sure data sorting works.
    const releaseYears = result["afi"].map(
      (release: Release) => release.basic_information.year
    );
    expect(releaseYears).toStrictEqual([2000, 2003]);
  });
});

describe("getVibes function", () => {
  it("returns the expected results", () => {
    const collection: Collection = [
      {
        id: 123,
        basic_information: {
          id: 123,
          title: "Iowa",
          year: 2001,
          artists: [
            {
              id: 1,
              name: "Slipknot",
            },
          ],
          genres: ["Rock", "Acid Jazz"],
          styles: ["Punk", "Country"],
        },
      },
      {
        id: 456,
        basic_information: {
          id: 456,
          title: "Blue Record",
          year: 2010,
          artists: [
            {
              id: 2,
              name: "Baroness",
            },
          ],
          genres: ["Rock"],
          styles: ["Metal", "Stoner Rock"],
        },
      },
    ];

    const vibes = getVibes(collection);
    const expectedKeys = [
      "acid jazz",
      "country",
      "metal",
      "punk",
      "rock",
      "stoner rock",
    ];
    expect(vibes).toStrictEqual(expectedKeys);
  });
});
