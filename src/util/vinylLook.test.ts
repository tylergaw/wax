import type { Release } from "@types";
import { describe, it, expect } from "vitest";
import { getVinylLook } from "./vinylLook";

const release = (
  pattern: string | null,
  texture: string | null,
  colors: string[] | null
): Release => ({
  id: 42,
  basic_information: {},
  display: { pattern, texture, cssReadableColors: colors },
});

describe("getVinylLook function", () => {
  it("defaults to solid black without color info", () => {
    expect(getVinylLook({ id: 1, basic_information: {} })).toMatchObject({
      recipe: "solid",
      base: "var(--color-primary-dark)",
      accents: [],
      splatter: false,
      opacity: 1,
    });
  });

  it("uses the first color as the base and the rest as accents", () => {
    expect(getVinylLook(release("swirl", null, ["blue", "white"]))).toMatchObject({
      recipe: "swirl",
      base: "blue",
      accents: ["white"],
    });
  });

  it("maps pattern words to recipes", () => {
    const recipe = (pattern: string) =>
      getVinylLook(release(pattern, null, ["red"])).recipe;

    expect(recipe("marble")).toBe("marble");
    expect(recipe("merge")).toBe("marble");
    expect(recipe("split")).toBe("split");
    expect(recipe("a-side/b-side")).toBe("split");
    expect(recipe("sunburst")).toBe("center");
    expect(recipe("color in color")).toBe("center");
    expect(recipe("galaxy")).toBe("galaxy");
    expect(recipe("smoke")).toBe("smoke");
  });

  it("layers splatter over another recipe", () => {
    expect(
      getVinylLook(release("split, splatter", null, ["pink", "blue", "white"]))
    ).toMatchObject({ recipe: "split", splatter: true });
    expect(
      getVinylLook(release("splatter", null, ["white", "red"]))
    ).toMatchObject({ recipe: "solid", splatter: true, accents: ["red"] });
  });

  it("treats clear records with patterns as a clear base", () => {
    expect(
      getVinylLook(release("splatter", "clear", ["red", "orange", "yellow"]))
    ).toMatchObject({
      base: "white",
      accents: ["red", "orange", "yellow"],
      opacity: 0.35,
    });
  });

  it("tints single-color clear and translucent records", () => {
    expect(getVinylLook(release(null, "clear", ["palegreen"]))).toMatchObject({
      base: "palegreen",
      opacity: 0.55,
    });
    expect(
      getVinylLook(release(null, "translucent", ["red"])).opacity
    ).toBe(0.75);
  });

  it("adds a sheen to metallic records", () => {
    expect(getVinylLook(release(null, "metallic", ["gold"])).sheen).toBe(true);
  });
});
