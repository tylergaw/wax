/*
  Using Claude, we enrich our collection data with things like; human readable
  vinyl color, css/js readable vinyl color, pattern, and texture. Bascially
  take record descriptions written by humans in free-form and convert them into
  something we can use for machines and more clarity for humans.
*/
import { getOption, persistData } from "./shared.js";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";

const collectionFilePath = "../data/collection.json";
const dataFilePath = "../data/enrichments.json";

// Which records to send to Claude:
// - new: records without an enrichment, or whose description changed
// - no-color: new, plus records Claude didn't find a color for last time
// - all: every record with a description
const modes = ["new", "no-color", "all"];

const model = "claude-opus-5-5";

const systemPrompt = `You are a vinyl record color expert. The user sends a JSON array of records. Each record has an id and a human-written description of a vinyl record. Descriptions usually cover the color, pattern, and texture of the vinyl, but can also include unrelated pressing details like weight, pressing plant, or packaging. Ignore those details.

Return one entry for every record you receive, using the same id, with the description exactly as you received it.

- humanReadableColor: The color, pattern, and texture written the way a person would describe it. Keep the words in the same order as the description, for example "Red Translucent" stays "Red Translucent". Include "translucent" here when the description mentions it. "with" or "&" usually indicate a combination of colors and belong in this field. Do not convert the word "and" into "&".
- cssReadableColors: Only valid, lowercase CSS colors. No other words. Never include "marble" or "marbled". The first color is used to draw the record, so it must be the main base color of the vinyl, the one that covers most of it. For example, "Mint Green With Blue Splatter" starts with a mint green, not a near-white color, and "Milky Clear with Swamp Green" starts with the swamp green, because clear is a texture.
- pattern: For example marble, swirl, splatter, or sunburst. "sunburst" is a pattern.
- texture: For example clear or translucent. "Clear" is a texture, not a color.

If a field has no value, set it to null. If a description has no color, pattern, or texture information at all, set humanReadableColor, cssReadableColors, pattern, and texture to null.

Each record also has a discs list with one entry per vinyl format. Each entry has a qty, the number of physical discs it covers, and a text, that entry's description, which may be null. Return discs with one entry per physical disc, in the same order, using the same field rules as above. An entry with qty 2 becomes two discs. If an entry's text describes several discs, like "LP1 Yellow, LP2 Red", give each disc its own look. If a disc has no description of its own, use the record's overall look.`;

const nullable = (schema) => ({ anyOf: [schema, { type: "null" }] });

const lookProperties = {
  humanReadableColor: nullable({ type: "string" }),
  cssReadableColors: nullable({
    type: "array",
    items: { type: "string" },
  }),
  pattern: nullable({ type: "string" }),
  texture: nullable({ type: "string" }),
};
const lookFields = Object.keys(lookProperties);

const responseSchema = {
  type: "object",
  properties: {
    records: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          ...lookProperties,
          discs: {
            type: "array",
            items: {
              type: "object",
              properties: lookProperties,
              required: lookFields,
              additionalProperties: false,
            },
          },
        },
        required: ["id", "description", ...lookFields, "discs"],
        additionalProperties: false,
      },
    },
  },
  required: ["records"],
  additionalProperties: false,
};

let client;

// Build the prompts
// Notes:
// - The bulk of this work is preparing the prompts
// - Munging the data together into a shape that works for Claude
// - And making sure the prompts, requested output, and extra context are correct
export const getDescriptions = (collection) => {
  return collection.reduce((obj, release) => {
    const { formats } = release.basic_information;
    const releaseDescriptions = formats
      .map((f) => {
        const shouldEject = f.name.toLowerCase() !== "vinyl" || !f.text;

        if (shouldEject) {
          return null;
        }

        return f.text;
      })
      .filter((i) => i);

    // If we've filtered null values and have an empty array, don't add it
    if (releaseDescriptions.length > 0) {
      obj[release.id] = releaseDescriptions.join(" and ");
    }

    return obj;
  }, {});
};

export const getDiscEntries = (collection) =>
  collection.reduce((obj, release) => {
    obj[release.id] = release.basic_information.formats
      .filter((f) => f.name.toLowerCase() === "vinyl")
      .map((f) => ({ qty: Number(f.qty) || 1, text: f.text || null }));
    return obj;
  }, {});

export const getUserMessages = (descriptions, discEntries = {}) => {
  return Object.keys(descriptions).map((id) => {
    const description = descriptions[id];
    return JSON.stringify({
      id,
      description,
      discs: discEntries[id] ?? [],
    });
  });
};

const requestEnrichments = async (batch) => {
  client ??= new Anthropic({ maxRetries: 4 });
  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    // If Claude declines a request, retry it on Anthropic's recommended
    // fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: responseSchema },
    },
    system: systemPrompt,
    messages: [{ role: "user", content: `[${batch.join(",")}]` }],
  });

  if (response.stop_reason !== "end_turn") {
    throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
  }

  const text = response.content.find((block) => block.type === "text");
  return JSON.parse(text.text).records;
};

export const getRecordsToEnrich = (descriptions, enrichments, mode = "new") => {
  const existingById = new Map(enrichments.map((e) => [String(e.id), e]));

  return Object.keys(descriptions).reduce((obj, id) => {
    const existing = existingById.get(id);
    const isNew = !existing || existing.description !== descriptions[id];
    const hasNoColor = !existing?.cssReadableColors?.length;

    if (
      mode === "all" ||
      isNew ||
      (mode === "no-color" && hasNoColor)
    ) {
      obj[id] = descriptions[id];
    }

    return obj;
  }, {});
};

// Combine existing enrichments with new results. Only records that still
// have a description are kept, and the description always comes from our
// data so we can tell later if it changed.
export const mergeEnrichments = (descriptions, enrichments, results) => {
  const byId = new Map(enrichments.map((e) => [String(e.id), e]));
  results.forEach((r) => byId.set(String(r.id), r));

  return Object.keys(descriptions)
    .filter((id) => byId.has(id))
    .sort((a, b) => Number(a) - Number(b))
    .map((id) => ({ ...byId.get(id), id, description: descriptions[id] }));
};

export const getClaudeEnrichments = async (
  descriptions,
  discEntries = {},
  recordLimit = 15,
) => {
  const messages = getUserMessages(descriptions, discEntries);
  const requestsNeeded = Math.ceil(messages.length / recordLimit);
  const enrichments = [];
  const errors = [];

  console.log(`Starting ${requestsNeeded} Claude requests...`);

  // Requests run one at a time to stay under API rate limits.
  for (let i = 0; i < requestsNeeded; i++) {
    const start = i * recordLimit;
    const batch = messages.slice(start, start + recordLimit);

    try {
      enrichments.push(...(await requestEnrichments(batch)));
      console.log(`Finished request ${i + 1} of ${requestsNeeded}`);
    } catch (err) {
      errors.push({ request: i + 1, status: err.status, message: err.message });
    }
  }

  const returnedIds = new Set(enrichments.map((e) => String(e.id)));
  const missingIds = Object.keys(descriptions).filter(
    (id) => !returnedIds.has(id),
  );

  if (missingIds.length) {
    errors.push({ message: `No enrichment returned for ${missingIds}` });
  }

  if (errors.length) {
    console.error(errors);
    console.error(
      `There were ${errors.length} errors while interacting with the Claude API.`,
    );
    throw new Error("enrichCollection failed");
  }

  return enrichments;
};

const readJSON = async (filePath, fallback) => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT" && fallback !== undefined) {
      return fallback;
    }

    throw err;
  }
};

if (!process.env.TEST) {
  try {
    const mode = getOption(process.argv.slice(2), "mode", "new");

    if (!modes.includes(mode)) {
      throw new Error(`Unknown mode "${mode}". Use one of: ${modes}`);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "You need a Claude API Key set as a ANTHROPIC_API_KEY env var. See .env.example",
      );
    }

    const collection = await readJSON(collectionFilePath);
    const enrichments = await readJSON(dataFilePath, []);
    const descriptions = getDescriptions(collection);
    const toEnrich = getRecordsToEnrich(descriptions, enrichments, mode);
    const count = Object.keys(toEnrich).length;

    console.log(`Mode "${mode}": ${count} records to send to Claude.`);

    const startTime = Date.now();
    const results = count
      ? await getClaudeEnrichments(toEnrich, getDiscEntries(collection))
      : [];
    const duration = Date.now() - startTime;

    await persistData(
      mergeEnrichments(descriptions, enrichments, results),
      dataFilePath,
    );

    console.log("Enrichments written to", dataFilePath);
    console.log(`\nenrichCollection completed in ${duration / 1000} seconds.\n`);
    process.exit(0);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
}
