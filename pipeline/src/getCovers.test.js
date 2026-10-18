import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAlbumKey,
  getAlbums,
  getSizedPath,
  getVersion,
  parseObjects,
  pickCover,
  sortCovers,
} from "./getCovers.js";

const release = (id, master_id, cover_image = `https://img/${id}.jpg`) => ({
  basic_information: { id, master_id, cover_image },
});

describe("getAlbumKey function", () => {
  it("uses the master id, or the release id without a master", () => {
    assert.equal(getAlbumKey(release(1, 20)), "20");
    assert.equal(getAlbumKey(release(5, 0)), "r5");
  });
});

describe("getAlbums function", () => {
  it("returns each album once", () => {
    const albums = getAlbums([release(1, 20), release(2, 20), release(5, 0)]);

    assert.deepEqual(albums, [
      { key: "20", masterId: 20, discogsImage: "https://img/1.jpg" },
      { key: "r5", masterId: null, discogsImage: "https://img/5.jpg" },
    ]);
  });
});

describe("parseObjects function", () => {
  it("sorts bucket objects into manual, auto, and sized", () => {
    const objects = [
      { Key: "wax/covers/" },
      { Key: "wax/covers/.permission-check" },
      { Key: "wax/covers/20.png" },
      { Key: "wax/covers/auto/20.jpg" },
      { Key: "wax/covers/auto/r5.jpg" },
      { Key: "wax/covers/sized/20-abc-600.jpg" },
    ];
    const { manual, auto, sized } = parseObjects(objects);

    assert.deepEqual(Object.keys(manual), ["20"]);
    assert.deepEqual(Object.keys(auto), ["20", "r5"]);
    assert.deepEqual([...sized], ["sized/20-abc-600.jpg"]);
  });
});

describe("pickCover function", () => {
  const manual = { 20: { Key: "wax/covers/20.png" } };
  const auto = {
    20: { Key: "wax/covers/auto/20.jpg" },
    30: { Key: "wax/covers/auto/30.jpg" },
  };

  it("prefers a manual cover", () => {
    assert.equal(pickCover("20", manual, auto, {}, {}).source, "manual");
  });

  it("uses the source found this run, or the one from last run", () => {
    assert.equal(
      pickCover("30", {}, auto, {}, { 30: "discogs" }).source,
      "discogs",
    );
    assert.equal(
      pickCover("30", {}, auto, { 30: { source: "cover-art-archive" } }, {})
        .source,
      "cover-art-archive",
    );
  });

  it("doesn't call an auto cover manual after a manual one is removed", () => {
    assert.equal(
      pickCover("30", {}, auto, { 30: { source: "manual" } }, {}).source,
      "auto",
    );
  });

  it("returns null without a cover", () => {
    assert.equal(pickCover("40", manual, auto, {}, {}), null);
  });
});

describe("getVersion and getSizedPath functions", () => {
  it("builds a versioned path from the ETag", () => {
    const version = getVersion({ ETag: '"0123456789abcdef"' });
    assert.equal(version, "01234567");
    assert.equal(getSizedPath("20", version, 600), "sized/20-01234567-600.jpg");
  });
});

describe("sortCovers function", () => {
  it("sorts master ids numerically, then release keys", () => {
    const sorted = sortCovers({ r5: 1, 100: 1, 20: 1, r3: 1 });
    assert.deepEqual(Object.keys(sorted), ["20", "100", "r3", "r5"]);
  });
});
