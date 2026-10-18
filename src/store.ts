import type {
  Album,
  Artist,
  Collection,
  Cover,
  DataSource,
  Release,
  ReleaseDisplay,
} from "@types";
import {
  getAlbumKey,
  getAlbumYear,
  sortArtistsByName,
  toSlug,
} from "@util/data";
import { getLog } from "@util/log";
import discogsData from "../data/collection.json";
import enrichmentsData from "../data/enrichments.json";
import overridesData from "../data/overrides.json";
import mastersData from "../data/masters.json";
import coversData from "../data/covers.json";

// Hand fixes keyed by release id, for example:
// { "123": { "humanReadableColor": "Cranberry Bog", "cssReadableColors": ["#9f1d35"] } }
export type Overrides = { [id: string]: ReleaseDisplay };

// Album data keyed by Discogs master id
export type Masters = { [masterId: string]: Album };

export type Covers = { [albumKey: string]: Omit<Cover, "key"> };

/**
 * Combine all data sources to produce a final collection. Later sources win:
 * - discogs is the foundation
 * - Claude enrichments set each release's display colors
 * - overrides (data/overrides.json) are hand fixes and win over everything
 * Album data from masters goes on each release as `album`.
 */
export function combineDataSources(
  discogs: Collection,
  enrichments: DataSource = [],
  overrides: Overrides = {},
  masters: Masters = {},
  covers: Covers = {}
): Collection {
  const enrichmentsById = enrichments
    .filter((i) => i)
    .reduce((obj, enrichment) => {
      obj[enrichment.id] = enrichment;
      return obj;
    }, {} as { [key: string]: ReleaseDisplay });

  // Keyed by id so a release that's in the collection twice only shows once
  const releasesById = discogs.reduce((obj, release) => {
    const albumKey = getAlbumKey(release);
    obj[release.id] = {
      ...release,
      display: { ...enrichmentsById[release.id], ...overrides[release.id] },
      album: masters[release.basic_information.master_id],
      cover: covers[albumKey] && { key: albumKey, ...covers[albumKey] },
    };
    return obj;
  }, {} as { [key: string]: Release });

  return Object.values(releasesById);
}

const finalCollection: Collection = combineDataSources(
  discogsData as Collection,
  enrichmentsData as DataSource,
  overridesData as Overrides,
  mastersData as Masters,
  coversData as Covers
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

// Returns a copy sorted by album year, oldest first, without changing the
// original order. Pressings of albums from the same year sort by pressing year.
export function sortByAlbumYear(releases: Release[]): Release[] {
  return [...releases].sort(
    (a, b) =>
      getAlbumYear(a) - getAlbumYear(b) ||
      a.basic_information.year - b.basic_information.year
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
  sortByAlbumYear(collection).forEach((release) => {
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
  log: getLog(finalCollection),
};

export default store;
