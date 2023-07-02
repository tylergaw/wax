import type { Artist, Collection, DataSource, Release } from "@types";
import discogsData from "@data/collection.json";
import openAIEnrichments from "@data/openAIEnrichments.json";
import { sortArtistsByName } from "@util/data";
import slug from "slug";

// FIXME: Working here
// Munge all data sources together
// Order matters for importance.
function mungeDataSources(
  discogs: Collection,
  openai: DataSource = [],
  user: DataSource = []
) {
  return discogs;
}

const finalCollection: Collection = mungeDataSources(
  discogsData,
  openAIEnrichments as DataSource
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
