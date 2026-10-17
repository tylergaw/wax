import type { Artist, Release } from "@types";
import slug from "slug";
import isEmpty from "lodash/fp/isEmpty";

function getComparableName(name: string): string {
  const hasThe = name.toLowerCase().startsWith("the ");

  if (hasThe) {
    return name.replace("The ", "");
  }

  return name;
}

/**
 * Slugs a single URL segment. Slashes become spaces first so names like
 * "Bad Cop/Bad Cop" become "bad-cop-bad-cop" instead of "bad-copbad-cop".
 * Use this anywhere we build a URL or a page path so they always match.
 */
export function toSlug(str: string): string {
  return slug(str.replaceAll("/", " "));
}

export function buildUrl(segments: string[]): string {
  return segments.reduce((accum, curr) => `${accum}${toSlug(curr)}/`, "/");
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
  const { title, artists, id } = release.basic_information;
  return buildUrl([artists[0].name, `${title}-${id}`]);
}

export function getHumanColor(release: Release): string {
  let humanColor = "Black";

  if (release.display) {
    const { humanReadableColor } = release.display;

    if (!isEmpty(humanReadableColor)) {
      humanColor = humanReadableColor.trim();
    }
  }

  return `${humanColor} Vinyl`;
}

export function getMachineColor(release: Release): string {
  let color = "var(--color-primary-dark)";

  if (release.display) {
    const { cssReadableColors = [] } = release.display;

    if (!isEmpty(cssReadableColors)) {
      color = cssReadableColors![0].trim();
      // TODO: Handle more than one color here
    }
  }

  return color;
}

/**
 * In Discogs, if there are duplicate artist names, they append parens and a
 * number to the name so we end up with some ugly names like; "PUP (2)".
 * Since we know the do "<original-name> (<number)", this function looks for
 * that and strips it out so. We only use this for display that way if we do
 * have duplicate artists, we'll keep the parens and number in place for things
 * like slugs for URLs and lookups.
 */
export function getArtistDisplayName(name: string): string {
  return name.replace(/\s?\(\d+\)$/, "").trim();
}
