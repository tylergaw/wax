/*
  Using Claude, we enrich our collection data with things like; human readable
  vinyl color, css/js readable vinyl color, pattern, and texture. Bascially
  take record descriptions written by humans in free-form and convert them into
  something we can use for machines and more clarity for humans.
*/
import { persistData } from "./shared.js";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.log(
    "You need a Claude API Key set as a ANTHROPIC_API_KEY env var. See .env.example",
  );
  process.exit(1);
}

// TODO: We'll need to update this for writing to S3.
const collectionFilePath = "./temp/collection.json";
// NOTE: The site reads this file name from S3, so it stays the same for now.
const dataFilePath = "./temp/openAIEnrichments.json";

const model = "claude-opus-5-5";

const systemPrompt = `You are a vinyl record color expert. The user sends a JSON array of records. Each record has an id and a human-written description of a vinyl record. Descriptions usually cover the color, pattern, and texture of the vinyl, but can also include unrelated pressing details like weight, pressing plant, or packaging. Ignore those details.

Return one entry for every record you receive, using the same id, with the description exactly as you received it.

- humanReadableColor: The color, pattern, and texture written the way a person would describe it. Keep the words in the same order as the description, for example "Red Translucent" stays "Red Translucent". Include "translucent" here when the description mentions it. "with" or "&" usually indicate a combination of colors and belong in this field. Do not convert the word "and" into "&".
- cssReadableColors: Only valid, lowercase CSS colors. No other words. Never include "marble" or "marbled". The first color is used to draw the record, so it must be the main base color of the vinyl, the one that covers most of it. For example, "Mint Green With Blue Splatter" starts with a mint green, not a near-white color, and "Milky Clear with Swamp Green" starts with the swamp green, because clear is a texture.
- pattern: For example marble, swirl, splatter, or sunburst. "sunburst" is a pattern.
- texture: For example clear or translucent. "Clear" is a texture, not a color.

If a field has no value, set it to null. If a description has no color, pattern, or texture information at all, set humanReadableColor, cssReadableColors, pattern, and texture to null.`;

const nullable = (schema) => ({ anyOf: [schema, { type: "null" }] });

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
          humanReadableColor: nullable({ type: "string" }),
          cssReadableColors: nullable({
            type: "array",
            items: { type: "string" },
          }),
          pattern: nullable({ type: "string" }),
          texture: nullable({ type: "string" }),
        },
        required: [
          "id",
          "description",
          "humanReadableColor",
          "cssReadableColors",
          "pattern",
          "texture",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["records"],
  additionalProperties: false,
};

const client = new Anthropic({ apiKey, maxRetries: 4 });

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

export const getUserMessages = (descriptions) => {
  return Object.keys(descriptions).map((id) => {
    const description = descriptions[id];
    return JSON.stringify({
      id,
      description,
    });
  });
};

const requestEnrichments = async (batch) => {
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

export const getClaudeEnrichments = async (collection, recordLimit = 15) => {
  const messages = getUserMessages(getDescriptions(collection));
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

  if (errors.length) {
    console.error(errors);
    console.error(
      `There were ${errors.length} errors while interacting with the Claude API.`,
    );
    throw new Error("enrichCollection failed");
  }

  return enrichments;
};

const getCollection = async () => {
  try {
    const collection = await fs.readFile(collectionFilePath, "utf8");
    return JSON.parse(collection);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

if (!process.env.TEST) {
  try {
    const collection = await getCollection();
    const startTime = Date.now();
    const enrichments = await getClaudeEnrichments(collection);
    const duration = Date.now() - startTime;
    try {
      if (enrichments) {
        await persistData(enrichments, dataFilePath);

        console.log("Claude enrichments written to", dataFilePath);
        console.log(
          `\nenrichCollection completed in ${duration / 1000} seconds.\n`,
        );
      } else {
        console.log("No error, but there was no data to write to file");
      }
    } catch (err) {
      console.log(err);
    }

    process.exit(0);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
}
