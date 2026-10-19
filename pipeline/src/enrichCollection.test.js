import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDescriptions,
  getDiscEntries,
  getUserMessages,
  getRecordsToEnrich,
  mergeEnrichments,
} from "./enrichCollection.js";

const collection = [
  {
    id: 123,
    basic_information: {
      formats: [
        {
          name: "Vinyl",
          qty: "1",
          text: "Purple Marbled Translucent, 180 Gram",
          descriptions: ["LP", "Album", "Limited Edition"],
        },
      ],
    },
  },
  {
    id: 456,
    basic_information: {
      formats: [
        {
          name: "Vinyl",
          qty: "1",
          text: "Black/Silver Swirl",
          descriptions: [
            "LP",
            "Single Sided",
            "EP",
            "Etched",
            "Limited Edition",
          ],
        },
        {
          name: "Vinyl",
          qty: "1",
          text: "Silver/red swirl",
        },
      ],
    },
  },
  {
    id: 567,
    basic_information: {
      formats: [
        {
          name: "Vinyl",
          qty: "4",
          descriptions: ["LP", "Limited Edition", "Remastered"],
        },
      ],
    },
  },
];

describe("getDescriptions function", () => {
  const descriptions = getDescriptions(collection);

  /**
   * We're generally testing to make sure we have the correct shape we need.
   * An object with keys that are release ids
   * and values that match the `text` property of formats
   */
  it("contains the correct release ids a keys", () => {
    assert.equal(descriptions.hasOwnProperty("123"), true);
    assert.equal(descriptions.hasOwnProperty("456"), true);
  });

  it("contains correct format descriptions as values", () => {
    assert.equal(descriptions["123"], "Purple Marbled Translucent, 180 Gram");

    // This one tests how we join when there are multiple formats. Instead
    // of a multi-item array, we join to a single string with "and"
    assert.equal(
      descriptions["456"],
      "Black/Silver Swirl and Silver/red swirl",
    );
  });

  it("filters release formats without the needed info", () => {
    assert.equal(Object.keys(descriptions).length, 2);
  });
});

describe("getUserMessages function", () => {
  const descriptions = {
    123: "Purple Marbled Translucent, 180 Gram",
    456: "Black/Silver Swirl and Silver/red swirl",
  };
  const messages = getUserMessages(descriptions);

  it("should return the expected shape", () => {
    assert(Array.isArray(messages));
  });
});

describe("getRecordsToEnrich function", () => {
  const descriptions = {
    1: "Red",
    2: "Cranberry Bog",
    3: "Blue Marble",
    4: "Green",
  };
  const enrichments = [
    { id: "1", description: "Red", cssReadableColors: ["red"] },
    { id: "2", description: "Cranberry Bog", cssReadableColors: null },
    { id: "3", description: "Blue", cssReadableColors: ["blue"] },
  ];

  it("new: only records without an enrichment or with a changed description", () => {
    const records = getRecordsToEnrich(descriptions, enrichments, "new");
    assert.deepEqual(Object.keys(records), ["3", "4"]);
  });

  it("no-color: new records plus records without a color", () => {
    const records = getRecordsToEnrich(descriptions, enrichments, "no-color");
    assert.deepEqual(Object.keys(records), ["2", "3", "4"]);
  });

  it("all: every record with a description", () => {
    const records = getRecordsToEnrich(descriptions, enrichments, "all");
    assert.deepEqual(Object.keys(records), ["1", "2", "3", "4"]);
  });
});

describe("mergeEnrichments function", () => {
  it("adds results, keeps existing, drops removed records, sorts by id", () => {
    const descriptions = { 10: "Red", 2: "Blue" };
    const enrichments = [
      { id: "10", description: "Red", cssReadableColors: ["red"] },
      { id: "99", description: "Removed from collection" },
    ];
    const results = [
      { id: "2", description: "blue (as Claude wrote it)", cssReadableColors: ["blue"] },
    ];

    assert.deepEqual(mergeEnrichments(descriptions, enrichments, results), [
      { id: "2", description: "Blue", cssReadableColors: ["blue"] },
      { id: "10", description: "Red", cssReadableColors: ["red"] },
    ]);
  });
});

describe("getDiscEntries function", () => {
  it("lists each vinyl format with its count and description", () => {
    const entries = getDiscEntries([
      {
        id: 1,
        basic_information: {
          formats: [
            { name: "Vinyl", qty: "2", text: "Magenta Translucent" },
            { name: "Vinyl", qty: "1" },
            { name: "CD", qty: "1", text: "Ignored" },
          ],
        },
      },
    ]);

    assert.deepEqual(entries, {
      1: [
        { qty: 2, text: "Magenta Translucent" },
        { qty: 1, text: null },
      ],
    });
  });

  it("is sent to Claude with each record", () => {
    const [message] = getUserMessages(
      { 1: "Pink Baby and Yellow Piss" },
      { 1: [{ qty: 1, text: "Pink Baby" }, { qty: 1, text: "Yellow Piss" }] },
    );

    assert.deepEqual(JSON.parse(message).discs, [
      { qty: 1, text: "Pink Baby" },
      { qty: 1, text: "Yellow Piss" },
    ]);
  });
});
