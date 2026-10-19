import type { Release } from "@types";
import { describe, it, expect } from "vitest";
import {
  getAddedDate,
  getAddedMonthKey,
  getCurrentMonthKey,
  getLog,
  getLogUrl,
  getMonthKeys,
  getMonthName,
  getReleaseDateParts,
  isInLog,
  toDateAdded,
} from "./log";

const release = (id: number, date_added: string): Release => ({
  id,
  date_added,
  basic_information: {},
});

describe("getAddedDate function", () => {
  it("converts Discogs' Pacific time to Eastern", () => {
    expect(getAddedDate(release(1, "2026-10-14T04:55:23-07:00"))).toBe(
      "2026-10-14 07:55:23"
    );
  });

  it("can move a record into the next month", () => {
    // 10:30 PM Pacific on Jan 31 is 1:30 AM Eastern on Feb 1
    expect(getAddedDate(release(1, "2025-01-31T22:30:00-08:00"))).toBe(
      "2025-02-01 01:30:00"
    );
  });
});

describe("getCurrentMonthKey function", () => {
  it("uses Eastern time", () => {
    // 2 AM UTC on Nov 1 is still October 31 in Eastern time
    expect(getCurrentMonthKey(new Date("2026-11-01T02:00:00Z"))).toBe(
      "2026-10"
    );
  });
});

describe("getMonthKeys function", () => {
  it("includes every month across a year boundary", () => {
    expect(getMonthKeys("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("getLog function", () => {
  const collection = [
    release(1, "2025-03-20T10:00:00-07:00"),
    // Before the log starts
    release(2, "2024-12-26T10:00:00-08:00"),
    release(3, "2025-03-02T10:00:00-08:00"),
    release(4, "2025-01-31T22:30:00-08:00"),
  ];
  const log = getLog(collection, "2025-01", "2025-03");

  it("lists every month newest first, including empty months", () => {
    expect(log.map((m) => m.key)).toEqual(["2025-03", "2025-02", "2025-01"]);
    expect(log[2].releases).toEqual([]);
  });

  it("orders each month's releases oldest added first", () => {
    expect(log[0].releases.map((r) => r.id)).toEqual([3, 1]);
  });

  it("puts releases in their Eastern time month", () => {
    expect(log[1].releases.map((r) => r.id)).toEqual([4]);
  });

  it("splits the month key into year and month", () => {
    expect(log[0]).toMatchObject({ year: "2025", month: "03" });
  });
});

describe("getMonthName function", () => {
  it("returns the month and year", () => {
    expect(getMonthName("2026-10")).toBe("October 2026");
    expect(getMonthName("2025-01")).toBe("January 2025");
  });
});

describe("getLogUrl function", () => {
  it("returns the month page URL", () => {
    expect(getLogUrl("2026-01")).toBe("/log/2026/01/");
  });
});

describe("isInLog function", () => {
  it("is true from the month the log starts", () => {
    expect(isInLog(release(1, "2025-01-01T09:00:00-08:00"))).toBe(true);
    expect(isInLog(release(1, "2024-12-26T09:00:00-08:00"))).toBe(false);
  });
});

describe("getAddedMonthKey function", () => {
  it("returns the Eastern time month", () => {
    expect(getAddedMonthKey(release(1, "2025-01-31T22:30:00-08:00"))).toBe(
      "2025-02"
    );
  });
});

describe("getReleaseDateParts function", () => {
  const text = (r: Release) =>
    getReleaseDateParts(r)
      .map((p) => p.text)
      .join(", ");

  it("shows album year, pressing year, and collected month", () => {
    const r: Release = {
      id: 1,
      date_added: "2026-10-10T09:00:00-07:00",
      album: { year: 1976 },
      basic_information: { year: 2018 },
    };

    expect(text(r)).toBe("Released 1976, this pressing 2018, collected October 2026");
    expect(getReleaseDateParts(r)[2].href).toBe("/log/2026/10/");
  });

  it("leaves out the pressing year when it matches the album", () => {
    const r: Release = {
      id: 1,
      date_added: "2026-10-10T09:00:00-07:00",
      album: { year: 2026 },
      basic_information: { year: 2026 },
    };

    expect(text(r)).toBe("Released 2026, collected October 2026");
  });

  it("leaves out the collected month before the log starts", () => {
    const r: Release = {
      id: 1,
      date_added: "2019-08-18T09:00:00-07:00",
      album: { year: 1994 },
      basic_information: { year: 2014 },
    };

    expect(text(r)).toBe("Released 1994, this pressing 2014");
  });

  it("uses the pressing year as the release year without a master", () => {
    const r: Release = {
      id: 1,
      date_added: "2019-08-18T09:00:00-07:00",
      basic_information: { year: 2017 },
    };

    expect(text(r)).toBe("Released 2017");
  });

  it("capitalizes collected when it's the only part", () => {
    const r: Release = {
      id: 1,
      date_added: "2026-10-10T09:00:00-07:00",
      basic_information: { year: 0 },
    };

    expect(text(r)).toBe("Collected October 2026");
  });
});

describe("toDateAdded function", () => {
  it("turns a month or day into a date in that Eastern month", () => {
    expect(toDateAdded("2026-03")).toBe("2026-03-01T12:00:00-05:00");
    expect(toDateAdded("2026-03-14")).toBe("2026-03-14T12:00:00-05:00");
    expect(getAddedMonthKey(release(1, toDateAdded("2026-03")))).toBe("2026-03");
  });

  it("leaves full timestamps alone", () => {
    expect(toDateAdded("2026-10-18T15:56:57-07:00")).toBe(
      "2026-10-18T15:56:57-07:00"
    );
  });
});
