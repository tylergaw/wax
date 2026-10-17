import { rest } from "msw";

// FIXME: msw isn't included after sitching to native node test runner
export const handlers = [
  rest.get("https://api.openai.com/v1/chat/completions", (_, res, ctx) => {
    return res(ctx.status(200), ctx.json(chatCompletionsFixture));
  }),
];

export const openAIEnrichmentsFixture = [
  {
    id: "100245",
    description: "James Booker credit",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "",
  },
  {
    id: "370135",
    description: "Los Angeles Pressing",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "",
  },
  {
    id: "513594",
    description: "180g",
    human_readable_color: "Translucent",
    css_readable_colors: [],
    pattern_texture: "Translucent",
  },
  {
    id: "677375",
    description: "Gatefold",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "translucent",
  },
  {
    id: "770027",
    description: "Specialty Pressing",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "translucent",
  },
  {
    id: "965631",
    description: "Red Translucent",
    human_readable_color: "Red Translucent",
    css_readable_colors: ["red"],
    pattern_texture: "translucent",
  },
  {
    id: "993128",
    description: "180 g",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "clear",
  },
  {
    id: "1018597",
    description: "Hollywood Pressing",
    human_readable_color: "Translucent",
    css_readable_colors: [],
    pattern_texture: "Translucent",
  },
  {
    id: "1192308",
    description: "Yellow",
    human_readable_color: "Yellow",
    css_readable_colors: ["yellow"],
    pattern_texture: "",
  },
  {
    id: "1563150",
    description: "Punchout Centers",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "translucent",
  },
  {
    id: "1597466",
    description: "Pink",
    human_readable_color: "Pink",
    css_readable_colors: ["pink"],
    pattern_texture: "",
  },
  {
    id: "1597615",
    description: "Red",
    human_readable_color: "Red",
    css_readable_colors: ["red"],
    pattern_texture: "",
  },
  {
    id: "1684889",
    description: "Grey Marbled",
    human_readable_color: "Grey",
    css_readable_colors: ["grey"],
    pattern_texture: "Marbled",
  },
  {
    id: "1684896",
    description: "Grey Marbled",
    human_readable_color: "Grey",
    css_readable_colors: ["grey"],
    pattern_texture: "Marbled",
  },
  {
    id: "1748265",
    description: "United Record Pressing, 180g, Gatefold",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "",
  },
  {
    id: "1790723",
    description: "Blue Translucent",
    human_readable_color: "Blue Translucent",
    css_readable_colors: ["blue"],
    pattern_texture: "translucent",
  },
  {
    id: "1949892",
    description: "White",
    human_readable_color: "White",
    css_readable_colors: ["white"],
    pattern_texture: "",
  },
  {
    id: "2101658",
    description: "Green",
    human_readable_color: "Green",
    css_readable_colors: ["green"],
    pattern_texture: "",
  },
  {
    id: "2113642",
    description: "Clear",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "translucent",
  },
  {
    id: "2151825",
    description: "Clear",
    human_readable_color: "",
    css_readable_colors: [],
    pattern_texture: "clear",
  },
];

const chatCompletionsFixture = {
  id: "chatcmpl-8T1gvc0wtaY4glnAc8flg81uj0oNy",
  object: "chat.completion",
  created: 1701928705,
  model: "gpt-4-1106-preview",
  choices: [
    {
      index: 0,
      message: [
        {
          content: {
            records: [
              {
                id: 112,
                description: "Purple and orange sunburst",
                humanReadableColor: "Purple and orange sunburst",
                cssReadableColors: ["purple", "orange"],
                pattern: "sunburst",
                texture: null,
              },
              {
                id: 123,
                description: "Purple Marbled Translucent, 180 Gram",
                humanReadableColor: "Purple marbled translucent",
                cssReadableColors: ["purple"],
                pattern: "marbled",
                texture: "translucent",
              },
              {
                id: 134,
                description: "Hot pink",
                humanReadableColor: "Hot pink",
                cssReadableColors: ["hotpink"],
                pattern: null,
                texture: null,
              },
              {
                id: 156,
                description: "Marbled green vinyl",
                humanReadableColor: "Marbled green",
                cssReadableColors: ["green"],
                pattern: "marbled",
                texture: null,
              },
              {
                id: 456,
                description: "Black/Silver Swirl",
                humanReadableColor: "Black with silver swirl",
                cssReadableColors: ["black", "silver"],
                pattern: "swirl",
                texture: null,
              },
              {
                id: 789,
                description: "Silver/red swirl",
                humanReadableColor: "Silver with red swirl",
                cssReadableColors: ["silver", "red"],
                pattern: "swirl",
                texture: null,
              },
            ],
          },
        },
      ],
      finish_reason: "stop",
    },
  ],
  usage: { prompt_tokens: 332, completion_tokens: 357, total_tokens: 689 },
  system_fingerprint: "fp_a24b4d720c",
};
