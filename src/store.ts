import type {
  Artist,
  Collection,
  DataSource,
  Release,
  ReleaseDisplay,
} from "@types";
import { sortArtistsByName, toSlug } from "@util/data";
import discogsData from "../data/collection.json";
import enrichmentsData from "../data/enrichments.json";
import overridesData from "../data/overrides.json";

// Hand fixes keyed by release id, for example:
// { "123": { "humanReadableColor": "Cranberry Bog", "cssReadableColors": ["#9f1d35"] } }
export type Overrides = { [id: string]: ReleaseDisplay };

/**
 * Combine all data sources to produce a final collection. Later sources win:
 * - discogs is the foundation
 * - Claude enrichments set each release's display colors
 * - overrides (data/overrides.json) are hand fixes and win over everything
 */
export function combineDataSources(
  discogs: Collection,
  enrichments: DataSource = [],
  overrides: Overrides = {}
): Collection {
  const enrichmentsById = enrichments
    .filter((i) => i)
    .reduce((obj, enrichment) => {
      obj[enrichment.id] = enrichment;
      return obj;
    }, {} as { [key: string]: ReleaseDisplay });

  // Keyed by id so a release that's in the collection twice only shows once
  const releasesById = discogs.reduce((obj, release) => {
    obj[release.id] = {
      ...release,
      display: { ...enrichmentsById[release.id], ...overrides[release.id] },
    };
    return obj;
  }, {} as { [key: string]: Release });

  return Object.values(releasesById);
}

const finalCollection: Collection = combineDataSources(
  discogsData as Collection,
  enrichmentsData as DataSource,
  overridesData as Overrides
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
          slug: toSlug(currName),
        };
        artistIndex.push(artist.id);
        artists.push(next);
      }
    });
  });

  return sortArtistsByName(artists);
}

// Returns a copy, oldest first, without changing the original order
export function sortByYear(releases: Release[]): Release[] {
  return [...releases].sort(
    (a, b) => a.basic_information.year - b.basic_information.year
  );
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
  sortByYear(collection).forEach((release) => {
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
