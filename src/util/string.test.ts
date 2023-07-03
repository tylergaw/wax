import { describe, it, expect } from "vitest";
import { pluralize } from "./string";

describe("pluralize function", () => {
  it("makes good choices", () => {
    expect(pluralize("dog", 10)).toBe("dogs");
    expect(pluralize("dog", 0)).toBe("dogs");
    expect(pluralize("dog", 1)).toBe("dog");
  });
});
