import type { Artist, Release } from "@types";
import slug from "slug";

function buildUrl(segments: string[]) {
  return segments.reduce((accum, curr) => `${accum}${slug(curr)}/`, "/");
}

// FIXME: Working here
function getReleasesByArtist(collection: Release[]) {
  const artists = getArtists(collection).sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  });

  return artists.reduce((obj, release) => {
    const name = release.name;

    // FIXME: typing
    if (!obj[name]) {
      obj[name] = {};
    }
    return obj;
  }, {});
}

function getArtists(collection: Release[]): Artist[] {
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

  return artists;
}

function getReleaseUrl(release: Release): string {
  const { title, artists } = release.basic_information;
  return buildUrl([artists[0].name, title]);
}

export { buildUrl, getArtists, getReleasesByArtist, getReleaseUrl };
