import type { Artist, Release } from "@types";
import slug from "slug";

function getComparableName(name: string): string {
  const hasThe = name.toLowerCase().startsWith("the ");

  if (hasThe) {
    return name.replace("The ", "");
  }

  return name;
}

export function buildUrl(segments: string[]) {
  return segments.reduce((accum, curr) => `${accum}${slug(curr)}/`, "/");
}

// TODO: This could be made generic for use with lists other than Artists
export function sortArtistsByName(list: Artist[]) {
  return list.sort((a, b) => {
    const aName = getComparableName(a.name);
    const bName = getComparableName(b.name);

    if (aName < bName) {
      return -1;
    }

    if (aName > bName) {
      return 1;
    }

    return 0;
  });
}

export function getReleaseUrl(release: Release): string {
  const { title, artists } = release.basic_information;
  return buildUrl([artists[0].name, title]);
}
