# Pipeline

This fetches, enriches, and stores vinyl collection data for [wax.tylergaw.com](https://wax.tylergaw.com/).

This was previously its own repo, [github.com/tylergaw/wax-tracks](https://github.com/tylergaw/wax-tracks).

## Project overview

- node.js `>=20.6.0`: This uses node features that aren't available in earlier versions
- OpenAI: Used to enrich collection data. Right now, only for determining machine and human readable vinyl color/pattern

## Local setup

Copy `.env.example` to `pipeline/.env` and fill in the values. Dependencies are installed with the rest of the project by running `yarn` from the repo root.

## Testing

Run all tests once:

```sh
yarn pipeline:test
```

## Available scripts

Everything is done through scripts in the root package.json. Run them from the repo root.

### Fetch, enrich, upload, rebuild

This is likely what you want. This runs everything needed to fetch latest collection from Discogs, enrich the data with OpenAI, upload the JSON files to S3, and rebuild the site in Netlify.

```sh
yarn pipeline:update
```

### Fetch

Fetch Discogs collection and prompt to ask if you want all pages:

```sh
yarn pipeline:fetch
```

Fetch Discogs collection and skip prompt to ask if you want all pages:

```sh
yarn pipeline:fetch:skipPrompt
```

### Enrich

**This depends on the output file from `fetch`**. Uses OpenAI to enrich the collection data. Right now, this only tries to determine machine and human-readable color of the vinyl based on the descriptions available.

```sh
yarn pipeline:enrich
```

### Upload

Uploads the generated JSON file(s) to an S3 bucket.

```sh
yarn pipeline:upload
```

### Rebuild

Rebuilds the Netlify site via web hook.

```sh
yarn pipeline:rebuild
```
