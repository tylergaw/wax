/*
  Using OpenAI's GPT completions, we enrich our collection data with things like;
  human readable vinyl color, css/js readable vinyl color, and texture. Bascially
  take record descriptions written by humans in free-form and convert them into
  something we can use for machines and more clarity for humans.
*/
import { persistData } from "./shared.js";
import OpenAIApi from "openai";
import fs from "fs/promises";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.log(
    "You need an OpenAI API Key set as a OPENAI_API_KEY env var. See .env.example",
  );
  process.exit(1);
}

// TODO: We'll need to update this for writing to S3.
const collectionFilePath = "./temp/collection.json";
const dataFilePath = "./temp/openAIEnrichments.json";

const chatCompletionConf = {
  model: process.env.MODEL,
  temperature: 0,
};

const systemInstructions = [
  "You are a vinyl record color expert. Given a JSON string that contains and id and human-written description of the color, pattern, and texture of records, you should respond with machine-readable colors in JSON format. Keep in mind all of the following:",
  "Make sure your response is always in the shape; { records: [ {<record>} ]} ",
  "The user is going to send you a stringified JSON array, you need to parse it as JSON then iterate over each record in the array",
  "In the JSON please include the id value for each record",
  "Please omit the 'id' value from the JSON description member",
  "In the JSON for each please include a 'humanReadableColor' field that contains color/text/pattern information in a way that makes sense to humans",
  "Please treat 'translucent' as part of the human color if it's in the description as well as listing it as the pattern/texture.",
  "The presence of 'with' or '&' usually indicate a combination of colors, those tokens should go in the human readable color.",
  "Make sure every JSON object includes the fields; id, description, humanReadableColor, cssReadableColors, pattern, texture. If any don't have a value, set them to null.",
  "cssReadableColors should only include valid css/js colors, no other tokens.",
  "'marble', 'marbled' should never be included in css_readable_colors.",
  "Don't convert the word 'and' into an '&'.",
  "Make values for cssReadableColors lowercase.",
  "'Clear' should be considered a texture NOT a color.",
  "'sunburst' should be considered a pattern.",
  "The description should be the value of the description member as you receive it.",
  "Most important, if you don't find a cssReadableColor, pattern, or texture, don't include an object for it in your response.",
];

const systemMessage = {
  role: "system",
  content: systemInstructions.join(" "),
};

const openai = new OpenAIApi({ apiKey });

// Build the prompts
// Notes:
// - The bulk of this work is preparing the prompts
// - Munging the data together into a shape that works for openai
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

export const getOpenAIEnrichments = async (collection, recordLimit = 15) => {
  const messages = getUserMessages(getDescriptions(collection));
  const requestsNeeded = Math.round(messages.length / recordLimit);

  console.log("Starting OpenAI requests...");
  const requests = Array.from(Array(requestsNeeded)).map((_, i) => {
    const start = i * recordLimit;
    const end = start + recordLimit;

    const requestConfig = {
      ...chatCompletionConf,
      messages: [
        systemMessage,
        {
          role: "user",
          content: `[${messages.slice(start, end).join(",")}]`,
        },
      ],
      response_format: { type: "json_object" },
    };

    return openai.chat.completions.create(requestConfig);
  });

  const responses = await Promise.allSettled(requests);
  const errorResponses = responses
    .filter((r) => r.status === "rejected")
    .map((err) => ({
      ...err.reason.error,
    }));

  if (errorResponses.length) {
    console.error(errorResponses);
    console.error(
      `There were ${errorResponses.length} errors while interacting with the openai API.`,
    );
    throw new Error("enrichCollection failed");
  }

  const enrichments = responses
    .map((res) => JSON.parse(res.value.choices[0].message.content).records)
    .flat();
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
    const enrichments = await getOpenAIEnrichments(collection);
    const duration = Date.now() - startTime;
    try {
      if (enrichments) {
        await persistData(enrichments, dataFilePath);

        console.log("Open AI enrichments written to", dataFilePath);
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
    if (err.response) {
      console.log(err);
      console.log("----");
      console.log(err.response.headers);
      console.log(err.response.status);
      console.log(err.response.data);
    } else {
      console.log(err.message);
    }

    process.exit(1);
  }
}
