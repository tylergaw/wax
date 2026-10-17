import type { Artist, Collection, DataSource, Release } from "@types";
import { sortArtistsByName } from "@util/data";
import slug from "slug";
import merge from "lodash/fp/merge";

type AllDataSources = {
  discogsData: Collection;
  openAIEnrichments: DataSource;
};

// NOTE: I have this s3 bucket behind Cloudfront, but for these requests, we
// don't need caching, so we go directly to s3.
const dataBaseUrl = "https://tylergaw-assets.s3.amazonaws.com/wax-tracks/data/";

async function getRemoteDataSource(name: string): Promise<unknown> {
  const res = await fetch(`${dataBaseUrl}${name}.json`);
  return await res.json();
}

async function getDataSources(): Promise<AllDataSources> {
  const discogsData = (await getRemoteDataSource("collection")) as Collection;
  const openAIEnrichments = (await getRemoteDataSource(
    "openAIEnrichments"
  )) as DataSource;

  return {
    discogsData,
    openAIEnrichments,
  };
}

/**
 * Combine all possible data sources to produce a final collection.
 * The order is important here
 * - discogs is the foundation
 * - openai enrichments are next
 * - TODO: user enrichments  are most important so can override any others.
 */
export function combineDataSources(
  discogs: Collection,
  openai: DataSource = []
): Collection {
  const discogsById = discogs.reduce((obj: Release, release: Release) => {
    obj[release.id] = release;
    return obj;
  }, {} as Release);

  const openAIEnrichmentsById = openai
    .filter((i) => i)
    .reduce((obj, enrichment) => {
      obj[enrichment.id] = { display: { ...enrichment } };
      return obj;
    }, {} as { [key: string]: any });

  const merged = merge(discogsById, openAIEnrichmentsById);
  const collection: Collection = Object.keys(merged).map((key) => ({
    ...merged[key],
  }));

  return collection;
}

const { discogsData, openAIEnrichments } = await getDataSources();
const finalCollection: Collection = combineDataSources(
  discogsData,
  openAIEnrichments
);

export function getArtists(collection: Release[]): Artist[] {
  let artistIndex: string[] = [];
  let artists: Artist[] = [];

  collection.forEach((release) => {
    release.basic_information.artists.forEach((artist: any) => {
      const currName = artist.name;

      // First check to make sure don't already have this artist in the list
      if (!artistIndex.includes(artist.id)) {
        const next: Artist = {
          id: artist.id,
          name: currName,
          slug: slug(currName),
        };
        artistIndex.push(artist.id);
        artists.push(next);
      }
    });
  });

  return sortArtistsByName(artists);
}

export function getReleasesByArtist(collection: Release[]) {
  const artists = getArtists(collection);

  // Create our object with artist names as keys
  let releases = artists.reduce((obj, artist) => {
    obj[artist.name.toLowerCase()] = [];
    return obj;
  }, {} as { [index: string]: any });

  // Walk the collection and put each release in the releases object at the
  // cooresponding artist key
  collection
    .sort((a, b) => a.basic_information.year - b.basic_information.year)
    .forEach((release) => {
      // Some Discogs releases list the same artist more than once, so only
      // add the release to each artist once.
      let seenArtistKeys: string[] = [];

      release.basic_information.artists.forEach((artist: any) => {
        const key = artist.name.toLowerCase();

        if (!seenArtistKeys.includes(key)) {
          seenArtistKeys.push(key);
          releases[key].push(release);
        }
      });
    });

  return releases;
}

/**
 * Flatten a releasesByArtist object into a single list, keeping the artist
 * and release order. A release with multiple artists is listed under each of
 * them in releasesByArtist, so only keep its first occurrence here.
 */
export function getUniqueReleases(releasesByArtist: {
  [index: string]: Release[];
}): Release[] {
  let releaseIndex: Release["id"][] = [];
  let releases: Release[] = [];

  Object.keys(releasesByArtist).forEach((key) => {
    releasesByArtist[key].forEach((release) => {
      if (!releaseIndex.includes(release.id)) {
        releaseIndex.push(release.id);
        releases.push(release);
      }
    });
  });

  return releases;
}

export function getVibes(collection: Release[]): string[] {
  let vibes: string[] = [];

  collection.forEach((release) => {
    const genres = release.basic_information.genres || [];
    const styles = release.basic_information.styles || [];
    [...genres, ...styles].forEach((k: string) => {
      const item = k.toLowerCase();

      if (!vibes.includes(item)) {
        vibes.push(item);
      }
    });
  });

  return vibes.sort();
}

const store = {
  collection: finalCollection,
  artists: getArtists(finalCollection),
  releasesByArtist: getReleasesByArtist(finalCollection),
  vibes: getVibes(finalCollection),
};

export default store;
