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

// TODO: Tests
export function getHumanColor(release: Release): string {
  let humanColor = "Black";

  if (release.display) {
    const { human_readable_color } = release.display;

    if (!isEmpty(human_readable_color.trim())) {
      humanColor = human_readable_color;
    }
  }

  return `${humanColor} Vinyl`;
}

// TODO: Tests
export function getMachineColor(release: Release): string {
  let color = "#363636";

  if (release.display) {
    const { css_readable_colors } = release.display;

    if (!isEmpty(css_readable_colors)) {
      color = css_readable_colors[0];

      // FIXME: Working here
      // if (css_readable_colors.length > 1) {
      //   console.log(css_readable_colors);
      // }
    }
  }

  return color;
}
