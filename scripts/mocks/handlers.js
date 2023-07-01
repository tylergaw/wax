import { rest } from "msw";

export const handlers = [
  rest.post("https://api.openai.com/v1/completions", (_, res, ctx) => {
    return res(ctx.status(200), ctx.json(openAICompletions));
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

// Open AI completions response fixture
const openAICompletions = {
  id: "cmpl-7XX1Y2jQJmYGn8Tshf1CduJhzlhEN",
  object: "text_completion",
  created: 1688226124,
  model: "text-davinci-003",
  choices: [
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "100245",\n' +
        '  "description": "James Booker credit",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": ""\n' +
        "}",
      index: 0,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "370135",\n' +
        '  "description": "Los Angeles Pressing",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": ""\n' +
        "}",
      index: 1,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "513594",\n' +
        '  "description": "180g",\n' +
        '  "human_readable_color": "Translucent",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "Translucent"\n' +
        "}",
      index: 2,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "677375",\n' +
        '  "description": "Gatefold",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "translucent"\n' +
        "}",
      index: 3,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "770027",\n' +
        '  "description": "Specialty Pressing",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "translucent"\n' +
        "}",
      index: 4,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "965631",\n' +
        '  "description": "Red Translucent",\n' +
        '  "human_readable_color": "Red Translucent",\n' +
        '  "css_readable_colors": ["red"],\n' +
        '  "pattern_texture": "translucent"\n' +
        "}",
      index: 5,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "993128",\n' +
        '  "description": "180 g",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "clear"\n' +
        "}",
      index: 6,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1018597",\n' +
        '  "description": "Hollywood Pressing",\n' +
        '  "human_readable_color": "Translucent",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "Translucent"\n' +
        "}",
      index: 7,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1192308",\n' +
        '  "description": "Yellow",\n' +
        '  "human_readable_color": "Yellow",\n' +
        '  "css_readable_colors": ["yellow"],\n' +
        '  "pattern_texture": ""\n' +
        "}",
      index: 8,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1563150",\n' +
        '  "description": "Punchout Centers",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "translucent"\n' +
        "}",
      index: 9,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1597466",\n' +
        '  "description": "Pink",\n' +
        '  "human_readable_color": "Pink",\n' +
        '  "css_readable_colors": ["pink"],\n' +
        '  "pattern_texture": ""\n' +
        "}",
      index: 10,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1597615",\n' +
        '  "description": "Red",\n' +
        '  "human_readable_color": "Red",\n' +
        '  "css_readable_colors": ["red"],\n' +
        '  "pattern_texture": ""\n' +
        "}",
      index: 11,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1684889",\n' +
        '  "description": "Grey Marbled",\n' +
        '  "human_readable_color": "Grey",\n' +
        '  "css_readable_colors": ["grey"],\n' +
        '  "pattern_texture": "Marbled"\n' +
        "}",
      index: 12,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1684896",\n' +
        '  "description": "Grey Marbled",\n' +
        '  "human_readable_color": "Grey",\n' +
        '  "css_readable_colors": ["grey"],\n' +
        '  "pattern_texture": "Marbled"\n' +
        "}",
      index: 13,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "1790723",\n' +
        '  "description": "Blue Translucent",\n' +
        '  "human_readable_color": "Blue Translucent",\n' +
        '  "css_readable_colors": ["blue"],\n' +
        '  "pattern_texture": "translucent"\n' +
        "}",
      index: 15,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "2113642",\n' +
        '  "description": "Clear",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "translucent"\n' +
        "}",
      index: 18,
      logprobs: null,
      finish_reason: "stop",
    },
    {
      text:
        "\n" +
        "\n" +
        "{\n" +
        '  "id": "2151825",\n' +
        '  "description": "Clear",\n' +
        '  "human_readable_color": "",\n' +
        '  "css_readable_colors": [],\n' +
        '  "pattern_texture": "clear"\n' +
        "}",
      index: 19,
      logprobs: null,
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 4472,
    completion_tokens: 1173,
    total_tokens: 5645,
  },
};
