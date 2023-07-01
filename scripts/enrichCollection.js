/*
  Using OpenAI's GPT completions, we enrich our collection data with things like;
  human readable vinyl color, css/js readable vinyl color, and texture. Bascially
  take record descriptions written by humans in free-form and convert them into
  something we can use for machines and more clarity for humans.
*/
import * as dotenv from "dotenv";
import fullCollection from "../src/data/collection.json" assert { type: "json" };
import { persistData } from "./shared.js";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.log(
    "You need an OpenAI API Key set as a OPENAI_API_KEY env var. See .env.example"
  );
  process.exit(1);
}

const openAIConf = new Configuration({ apiKey });
const openai = new OpenAIApi(openAIConf);

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

export const getDescriptionPrompts = (descriptions) => {
  const instructions = [
    "Given the following description of a vinyl record, please return JSON with the example shape below.",
    "Please treat 'translucent' as part of the human color if it's in the description as well as listing it as the pattern/texture.",
    "The presence of 'with' or '&' usually indicate a combination of colors, those tokens should go in the human readable color.",
    "Make sure the description field is present.",
    "css_readable_colors should only include valid css/js colors, no other tokens.",
    "'marble', 'marbled' should never be included in css_readable_colors.",
    "Don't convert the word 'and' into an '&'.",
    "Make values for css_readable_colors lowercase",
    "'Clear' should be considered a texture NOT a color",
  ];

  return Object.keys(descriptions).map((id) => {
    const description = descriptions[id];

    return `{
      "instructions": "${instructions.join(" ")}",
      "id": "${id}",
      "description": "${description}",
      "human_readable_color": "",
      "css_readable_colors": [],
      "pattern_texture": ""
    }`;
  });
};

export const getOpenAIEnrichments = async (collection, promptLimit = 20) => {
  const prompts = getDescriptionPrompts(getDescriptions(collection));
  const requestsNeeded = Math.round(prompts.length / promptLimit);

  const completionConf = {
    model: "text-davinci-003",
    max_tokens: 200,
    temperature: 0,
  };

  const requests = Array.from(Array(requestsNeeded)).map((_, i) => {
    const start = i * promptLimit;
    const end = start + promptLimit;

    return openai.createCompletion({
      ...completionConf,
      prompt: prompts.slice(start, end),
    });
  });

  const responses = await Promise.allSettled(requests);
  const data = responses.map((res) => res.value.data.choices).flat();
  const enrichments = getTransformedChoices(data);
  return enrichments;
};

export const getTransformedChoices = (data) => {
  const transformed = data.map((c) => {
    try {
      return JSON.parse(c.text);
    } catch (e) {
      console.log(c.text);
    }
  });

  return transformed;
};

if (!process.env.TEST) {
  try {
    const enrichments = await getOpenAIEnrichments(fullCollection);

    await persistData(enrichments, "./src/data/openAIEnrichments.json");
    console.log("Open AI enrichments written to file.");
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
