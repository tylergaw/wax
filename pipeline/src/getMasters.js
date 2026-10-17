/*
  Fetches album-level data from each release's Discogs master. A master is the
  album itself, while each release in the collection is one pressing of it.
  For now we only keep the album's original year.
*/
import fs from "fs/promises";
import { persistData } from "./shared.js";

const collectionFilePath = "../data/collection.json";
const dataFilePath = "../data/masters.json";

// Discogs allows 60 authenticated requests a minute
const requestDelay = 1100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getMasterIds = (collection) => [
  ...new Set(
    collection
      .map((release) => release.basic_information.master_id)
      .filter((id) => id)
      .map(String),
  ),
];

export const getMasterIdsToFetch = (masterIds, masters) =>
  masterIds.filter((id) => !masters[id]);

// Keep only masters that are still in the collection, sorted by id
export const mergeMasters = (masterIds, masters, results) => {
  const all = { ...masters, ...results };

  return [...masterIds]
    .sort((a, b) => Number(a) - Number(b))
    .filter((id) => all[id])
    .reduce((obj, id) => {
      obj[id] = all[id];
      return obj;
    }, {});
};

const fetchMaster = async (id, attempt = 1) => {
  const res = await fetch(`https://api.discogs.com/masters/${id}`, {
    headers: { Authorization: `Discogs token=${process.env.TOKEN}` },
  });

  if (res.status === 429 && attempt <= 3) {
    console.log("Discogs rate limit hit, waiting a minute...");
    await sleep(60000);
    return fetchMaster(id, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(
      `Discogs request for master ${id} failed: ${res.status} ${res.statusText}`,
    );
  }

  const { year } = await res.json();
  return { year };
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
    if (!process.env.TOKEN) {
      throw new Error(
        "You need a Discogs personal access token exported as a TOKEN env var. See .env.example",
      );
    }

    const collection = await readJSON(collectionFilePath);
    const masters = await readJSON(dataFilePath, {});
    const masterIds = getMasterIds(collection);
    const toFetch = getMasterIdsToFetch(masterIds, masters);
    const results = {};

    console.log(`${toFetch.length} masters to fetch from Discogs.`);

    for (const [i, id] of toFetch.entries()) {
      results[id] = await fetchMaster(id);

      if ((i + 1) % 50 === 0) {
        console.log(`Fetched ${i + 1} of ${toFetch.length}`);
      }

      await sleep(requestDelay);
    }

    await persistData(mergeMasters(masterIds, masters, results), dataFilePath);
    console.log("Masters written to", dataFilePath);
    process.exit(0);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
}
