import type { Artist, Release } from "@types";
import slug from "slug";
import isEmpty from "lodash/fp/isEmpty";

// Ignore a leading "The", in any case, when sorting by name
function getComparableName(name: string): string {
  return name.replace(/^the /i, "");
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
  // Case and accent insensitive, so "of Montreal" and "múm" sort with the
  // rest instead of after "Z"
  return list.sort((a, b) =>
    getComparableName(a.name).localeCompare(getComparableName(b.name), "en", {
      sensitivity: "base",
    })
  );
}

/**
 * The year the album first came out, from its Discogs master. Falls back to
 * the year of this pressing for releases without a master.
 */
export function getAlbumYear(release: Release): number {
  return release.album?.year || release.basic_information.year;
}

export function getAlbumKey(release: Release): string {
  const { master_id, id } = release.basic_information;
  return master_id ? String(master_id) : `r${id}`;
}

export function getCoverUrl(
  release: Release,
  size: 600 | 1200
): string | undefined {
  if (!release.cover) {
    return undefined;
  }

  const { key, version } = release.cover;
  return `https://stuff.tylergaw.com/wax/covers/sized/${key}-${version}-${size}.jpg`;
}

const getVinylFormats = (release: Release): any[] =>
  (release.basic_information.formats || []).filter(
    (f: any) => f.name === "Vinyl"
  );

// "LP" without a size means 12"
const getFormatSize = (format: any): string => {
  const descriptions: string[] = format.descriptions || [];
  return ['10"', '7"'].find((size) => descriptions.includes(size)) ?? '12"';
};

// Positions of the physical discs to draw, in order. Only LPs are drawn.
// Releases with no LPs, like a set of 7"s, draw them all
export function getDrawnDiscs(release: Release): number[] {
  const sizes: string[] = getVinylFormats(release).flatMap((f) =>
    Array(Number(f.qty) || 1).fill(getFormatSize(f))
  );
  const lps = sizes.flatMap((size, i) => (size === '12"' ? [i] : []));
  const drawn = lps.length ? lps : sizes.map((_, i) => i);

  return drawn.length ? drawn : [0];
}

export function getFormatLabel(release: Release): string | null {
  const counts = getVinylFormats(release).reduce((obj, f) => {
    const size = getFormatSize(f);
    obj[size] = (obj[size] || 0) + (Number(f.qty) || 1);
    return obj;
  }, {} as { [size: string]: number });

  const sizes = ['12"', '10"', '7"'].filter((size) => counts[size]);

  const isSingle12 =
    sizes.length === 1 && sizes[0] === '12"' && counts['12"'] === 1;

  if (!sizes.length || isSingle12) {
    return null;
  }

  return sizes
    .map((size) => {
      const name = size === '12"' ? "LP" : size;
      return counts[size] > 1 ? `${counts[size]}x${name}` : name;
    })
    .join(" + ");
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
