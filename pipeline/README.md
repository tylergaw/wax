# Wax Tracks

This fetches, enriches, and stores vinyl collection data for [wax.tylergaw.com](https://wax.tylergaw.com/).

The front-end repo for this is [github.com/tylergaw/wax](https://github.com/tylergaw/wax)

## Project overview

- node.js `>=20.6.0`: This uses node features that aren't available in earlier versions
- OpenAI: Used to enrich collection data. Right now, only for determining machine and human readable vinyl color/pattern

## Local setup

## Testing

Run all tests once:

```sh
yarn test
```

Run tests and watch for changes:

```sh
yarn test:watch
```

## Available scripts

Everything is done through scripts in package.json

### Fetch, enrich, upload, rebuild

This is likely what you want. This runs everything needed to fetch latest collection from Discogs, enrich the data with OpenAI, upload the JSON files to S3, and rebuild the site in Netlify.

```sh
yarn update
```

### Fetch

Fetch Discogs collection and prompt to ask if you want all pages:

```sh
yarn fetch
```

Fetch Discogs collection and skip prompt to ask if you want all pages:

```sh
yarn fetch:skipPrompt
```

### Enrich

**This depends on the output file from `fetch`**. Uses OpenAI to enrich the collection data. Right now, this only tries to determine machine and human-readable color of the vinyl based on the descriptions available.

```sh
yarn enrich
```

### Upload

Uploads the generated JSON file(s) to an S3 bucket.

```sh
yarn upload
```

### Rebuild

Rebuilds the Netlify site via web hook.

```sh
yarn rebuild
```
