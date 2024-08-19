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

export function buildUrl(segments: string[]): string {
  return segments.reduce(
    (accum, curr) => `${accum}${slug(curr.replaceAll("/", " "))}/`,
    "/"
  );
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
