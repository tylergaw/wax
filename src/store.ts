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
      if (!artistIndex.includes(currName)) {
        const next: Artist = {
          name: currName,
          slug: slug(currName),
        };
        artistIndex.push(currName);
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
    obj[artist.name] = [];
    return obj;
  }, {} as { [index: string]: any });

  // Walk the collection and put each release in the releases object at the
  // cooresponding artist key
  collection
    .sort((a, b) => a.basic_information.year - b.basic_information.year)
    .forEach((release) => {
      release.basic_information.artists.forEach((artist: any) => {
        releases[artist.name].push(release);
      });
    });

  return releases;
}

const store = {
  collection: finalCollection,
  artists: getArtists(finalCollection),
  releasesByArtist: getReleasesByArtist(finalCollection),
};

export default store;
