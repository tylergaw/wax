import type { Artist, Release } from "@types";
import slug from "slug";

function buildUrl(segments: string[]) {
  return segments.reduce((accum, curr) => `${accum}${slug(curr)}/`, "/");
}

// TODO: This could be made generic for use with lists other than Artists
function sortArtistsByName(list: Artist[]) {
  // TODO: Ignore "The" in artist names when sorting
  return list.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  });
}

function getReleasesByArtist(collection: Release[]) {
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

  return sortArtistsByName(artists);
}

function getReleaseUrl(release: Release): string {
  const { title, artists } = release.basic_information;
  return buildUrl([artists[0].name, title]);
}

export { buildUrl, getArtists, getReleasesByArtist, getReleaseUrl };
