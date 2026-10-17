import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDescriptions,
  getUserMessages,
  getOpenAIEnrichments,
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

describe("getOpenAIEnrichments function", async () => {
  const collection = [
    {
      id: 123,
      basic_information: {
        formats: [
          {
            name: "Vinyl",
            text: "Purple Marbled Translucent, 180 Gram",
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
            text: "Black/Silver Swirl",
          },
        ],
      },
    },
    {
      id: 789,
      basic_information: {
        formats: [
          {
            name: "Vinyl",
            text: "Silver/red swirl",
          },
        ],
      },
    },
    {
      id: 112,
      basic_information: {
        formats: [
          {
            name: "Vinyl",
            text: "Purple and orange sunburst",
          },
        ],
      },
    },
    {
      id: 134,
      basic_information: {
        formats: [
          {
            name: "Vinyl",
            text: "Hot pink",
          },
        ],
      },
    },
    {
      id: 156,
      basic_information: {
        formats: [
          {
            name: "Vinyl",
            text: "Marbled green vinyl",
          },
        ],
      },
    },
  ];
  const enrichments = await getOpenAIEnrichments(collection);
  console.log("in the test", enrichments);
  // FIXME:
  // NOTE: This is a brittle test
  // TODO: Maybe don't make a brittle test?
  // it("return the expected enrichment data", async () => {
  //   const enrichments = await getOpenAIEnrichments(collection, 2);
  //   const expectedKeys = [
  //     "id",
  //     "description",
  //     "human_readable_color",
  //     "css_readable_colors",
  //     "pattern_texture",
  //   ];

  //   enrichments.forEach((obj) => {
  //     Object.keys(obj).forEach((key, i) => {
  //       assert.equal(key, expectedKeys[i]);
  //     });
  //   });
  // });
});
