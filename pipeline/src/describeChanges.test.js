import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeChanges, getNewRecords } from "./describeChanges.js";

const record = (instance_id, artist, title) => ({
  instance_id,
  basic_information: { title, artists: [{ name: artist }] },
});

const before = [record(1, "AFI", "Sing The Sorrow")];
const after = [
  record(1, "AFI", "Sing The Sorrow"),
  record(2, "PUP (2)", "Morbid Stuff"),
  // A second pressing of an album already in the collection
  record(3, "AFI", "Sing The Sorrow"),
];

describe("getNewRecords function", () => {
  it("finds records that weren't in the collection before", () => {
    assert.deepEqual(
      getNewRecords(before, after).map((r) => r.instance_id),
      [2, 3],
    );
  });
});

describe("describeChanges function", () => {
  it("lists new records as artist - album", () => {
    assert.equal(
      describeChanges(before, after),
      "New records:\n\n- PUP - Morbid Stuff\n- AFI - Sing The Sorrow",
    );
  });

  it("returns nothing when no records are new", () => {
    assert.equal(describeChanges(before, before), "");
  });
});
