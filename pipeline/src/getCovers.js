import fs from "fs/promises";
import sharp from "sharp";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getOption, persistData } from "./shared.js";

const collectionFilePath = "../data/collection.json";
const dataFilePath = "../data/covers.json";
const Bucket = "tylergaw-assets";
const prefix = "wax/covers/";
const sizes = [600, 1200];
const userAgent = "wax.tylergaw.com/1.0 ( https://wax.tylergaw.com )";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAlbumKey = (release) => {
  const { master_id, id } = release.basic_information;
  return master_id ? String(master_id) : `r${id}`;
};

export const getAlbums = (collection) => [
  ...collection
    .reduce((albums, release) => {
      const key = getAlbumKey(release);

      if (!albums.has(key)) {
        albums.set(key, {
          key,
          masterId: release.basic_information.master_id || null,
          discogsImage: release.basic_information.cover_image || null,
        });
      }

      return albums;
    }, new Map())
    .values(),
];

export const parseObjects = (objects) =>
  objects.reduce(
    (parsed, object) => {
      const path = object.Key.slice(prefix.length);
      const auto = path.match(/^auto\/([^/]+)\.jpg$/);
      const manual = path.match(/^([^/]+)\.(jpe?g|png|webp)$/i);

      if (auto) {
        parsed.auto[auto[1]] = object;
      } else if (manual) {
        parsed.manual[manual[1]] = object;
      } else if (path.startsWith("sized/")) {
        parsed.sized.add(path);
      }

      return parsed;
    },
    { manual: {}, auto: {}, sized: new Set() },
  );

export const getVersion = (object) => object.ETag.replaceAll('"', "").slice(0, 8);

export const getSizedPath = (key, version, size) =>
  `sized/${key}-${version}-${size}.jpg`;

export const pickCover = (key, manual, auto, existing, fetchedSources) => {
  if (manual[key]) {
    return { object: manual[key], source: "manual" };
  }

  if (auto[key]) {
    const previous = existing[key]?.source;
    const source =
      fetchedSources[key] ??
      (previous && previous !== "manual" ? previous : "auto");

    return { object: auto[key], source };
  }

  return null;
};

export const sortCovers = (covers) =>
  Object.keys(covers)
    .sort((a, b) => {
      const [x, y] = [a, b].map((k) => (k.startsWith("r") ? NaN : Number(k)));
      if (isNaN(x) || isNaN(y)) return isNaN(x) - isNaN(y) || a.localeCompare(b);
      return x - y;
    })
    .reduce((obj, key) => {
      obj[key] = covers[key];
      return obj;
    }, {});

const fetchWithRetry = async (url, options = {}, attempts = 4) => {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: { "User-Agent": userAgent, ...options.headers },
    });

    if (![429, 500, 502, 503, 504].includes(res.status) || attempt === attempts) {
      return res;
    }

    await sleep(res.status === 429 ? 30000 : 2000 * attempt);
  }
};

const getReleaseGroupId = async (masterId) => {
  const resource = encodeURIComponent(
    `https://www.discogs.com/master/${masterId}`,
  );
  const res = await fetchWithRetry(
    `https://musicbrainz.org/ws/2/url?resource=${resource}&inc=release-group-rels&fmt=json`,
    { headers: { Accept: "application/json" } },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`MusicBrainz lookup failed: ${res.status}`);
  }

  const { relations = [] } = await res.json();
  return relations.find((r) => r.release_group)?.release_group.id ?? null;
};

const fetchImage = async (url) => {
  const res = await fetchWithRetry(url);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Image request failed: ${res.status} ${url}`);
  }

  return Buffer.from(await res.arrayBuffer());
};

const findCover = async (album) => {
  if (album.masterId) {
    const releaseGroupId = await getReleaseGroupId(album.masterId);

    if (releaseGroupId) {
      const base = `https://coverartarchive.org/release-group/${releaseGroupId}`;
      const image =
        (await fetchImage(`${base}/front-1200`).catch(() => null)) ??
        (await fetchImage(`${base}/front`));

      if (image) {
        return { image, source: "cover-art-archive" };
      }
    }
  }

  if (album.discogsImage) {
    const image = await fetchImage(album.discogsImage);

    if (image) {
      return { image, source: "discogs" };
    }
  }

  return null;
};

const listObjects = async (s3) => {
  const objects = [];
  let ContinuationToken;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken }),
    );
    objects.push(...(res.Contents ?? []));
    ContinuationToken = res.NextContinuationToken;
  } while (ContinuationToken);

  return objects;
};

const putImage = (s3, path, Body) =>
  s3.send(
    new PutObjectCommand({
      Bucket,
      Key: `${prefix}${path}`,
      Body,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

const getObject = async (s3, Key) => {
  const res = await s3.send(new GetObjectCommand({ Bucket, Key }));
  return Buffer.from(await res.Body.transformToByteArray());
};

const readJSON = async (filePath, fallback) => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT" && fallback !== undefined) {
      return fallback;
    }

    throw err;
  }
};

if (!process.env.TEST) {
  try {
    const s3 = new S3Client({ region: "us-east-1" });
    const albums = getAlbums(await readJSON(collectionFilePath));
    const existing = await readJSON(dataFilePath, {});
    const { manual, auto, sized } = parseObjects(await listObjects(s3));
    const limit = Number(getOption(process.argv.slice(2), "limit", Infinity));
    const toFetch = albums
      .filter((a) => !manual[a.key] && !auto[a.key])
      .slice(0, limit);
    const fetchedSources = {};
    const skipped = [];

    console.log(`${toFetch.length} albums to look up covers for.`);

    for (const [i, album] of toFetch.entries()) {
      try {
        const found = await findCover(album);

        if (found) {
          const jpeg = await sharp(found.image).jpeg({ quality: 90 }).toBuffer();
          const { ETag } = await putImage(s3, `auto/${album.key}.jpg`, jpeg);
          auto[album.key] = { Key: `${prefix}auto/${album.key}.jpg`, ETag };
          fetchedSources[album.key] = found.source;
        }
      } catch (err) {
        skipped.push(`${album.key}: ${err.message}`);
      }

      if ((i + 1) % 25 === 0) {
        console.log(`Looked up ${i + 1} of ${toFetch.length}`);
      }

      await sleep(1100);
    }

    const covers = {};
    let resized = 0;

    for (const album of albums) {
      const cover = pickCover(album.key, manual, auto, existing, fetchedSources);

      if (!cover) {
        continue;
      }

      const version = getVersion(cover.object);
      const missing = sizes.filter(
        (size) => !sized.has(getSizedPath(album.key, version, size)),
      );

      if (missing.length) {
        const original = await getObject(s3, cover.object.Key);

        for (const size of missing) {
          const jpeg = await sharp(original)
            .resize(size, size, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();
          await putImage(s3, getSizedPath(album.key, version, size), jpeg);
        }

        resized++;
      }

      covers[album.key] = { source: cover.source, version };
    }

    await persistData(sortCovers(covers), dataFilePath);

    console.log(
      `${Object.keys(covers).length} of ${albums.length} albums have covers. Resized ${resized}.`,
    );

    if (skipped.length) {
      console.log(
        `Skipped ${skipped.length} lookups, they'll be retried next run:\n${skipped.join("\n")}`,
      );
    }

    process.exit(0);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
}
