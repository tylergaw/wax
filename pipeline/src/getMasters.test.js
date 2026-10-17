import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getMasterIds,
  getMasterIdsToFetch,
  mergeMasters,
} from "./getMasters.js";

const collection = [
  { basic_information: { master_id: 20 } },
  { basic_information: { master_id: 3 } },
  // Another pressing of the same album
  { basic_information: { master_id: 20 } },
  // A release with no master
  { basic_information: { master_id: 0 } },
];

describe("getMasterIds function", () => {
  it("returns each master once, skipping releases without one", () => {
    assert.deepEqual(getMasterIds(collection), ["20", "3"]);
  });
});

describe("getMasterIdsToFetch function", () => {
  it("only returns masters we don't have yet", () => {
    assert.deepEqual(getMasterIdsToFetch(["20", "3"], { 20: { year: 1994 } }), [
      "3",
    ]);
  });
});

describe("mergeMasters function", () => {
  it("adds results, drops masters no longer in the collection, sorts by id", () => {
    const masters = { 20: { year: 1994 }, 99: { year: 1980 } };
    const results = { 3: { year: 2003 } };
    const merged = mergeMasters(["20", "3"], masters, results);

    assert.deepEqual(merged, { 3: { year: 2003 }, 20: { year: 1994 } });
  });
});
