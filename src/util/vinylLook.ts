import type { Release } from "@types";
import { getMachineColor } from "@util/data";

export type VinylRecipe =
  | "solid"
  | "marble"
  | "swirl"
  | "smoke"
  | "galaxy"
  | "split"
  | "center";

export type VinylLook = {
  recipe: VinylRecipe;
  base: string;
  accents: string[];
  splatter: boolean;
  opacity: number;
  sheen: boolean;
  seed: number;
};

const recipes: [RegExp, VinylRecipe][] = [
  [/split|half|a-side|b-side/, "split"],
  [/sunburst|starburst|color in color|inset/, "center"],
  [/galaxy/, "galaxy"],
  [/smoke|haze/, "smoke"],
  [/swirl|ripple|kaleidoscope|cornetto/, "swirl"],
  [/marble|merge|mix/, "marble"],
];

export function getVinylLook(release: Release): VinylLook {
  const display = release.display || {};
  const pattern = (display.pattern || "").toLowerCase();
  const texture = (display.texture || "").toLowerCase();
  const colors = (display.cssReadableColors || []).map((c) => c.trim());
  const recipe = recipes.find(([match]) => match.test(pattern))?.[1] ?? "solid";
  const splatter = pattern.includes("splatter");
  const isClear = texture.includes("clear");

  // Clear records with a pattern list the pattern's colors, not the base's
  const clearBase = isClear && colors.length > 1 && (splatter || recipe !== "solid");

  return {
    recipe,
    base: clearBase ? "white" : getMachineColor(release),
    accents: clearBase ? colors : colors.slice(1),
    splatter,
    opacity: isClear ? (clearBase ? 0.35 : 0.55) : /translucent|transparent/.test(texture) ? 0.75 : 1,
    sheen: /metallic|shimmer|pearlescent/.test(texture),
    seed: Number(release.id) % 2147483647 || 1,
  };
}
