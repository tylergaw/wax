# Pipeline

Fetches the collection from Discogs, fetches each album's original year from its Discogs master, finds album covers, and uses Claude to work out each record's vinyl color. The results are committed to [`data/`](../data/), and the site builds from those files.

## How it runs

The [Update collection data](../.github/workflows/pipeline.yml) workflow runs every morning, and can be run by hand from the Actions tab or with:

```sh
gh workflow run pipeline.yml -R tylergaw/wax
```

When the data changes, the workflow opens a PR. Routine runs merge themselves. A manual run can pick which records to send to Claude:

- `new` (default): records without colors yet, or whose Discogs description changed
- `no-color`: `new`, plus records Claude didn't find a color for
- `all`: every record. Use after changing the model or prompt

`no-color` and `all` PRs wait for review.

The workflow needs the repository secrets `TOKEN` and `USERNAME` (Discogs), `ANTHROPIC_API_KEY`, and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (covers).

## Album covers

Covers live in the `tylergaw-assets` S3 bucket under `wax/covers/`, served from `https://stuff.tylergaw.com/wax/covers/`. They're keyed by Discogs master id, or `r<release id>` for releases without a master.

The pipeline looks up covers for new albums in the Cover Art Archive, falling back to the Discogs image, and saves them to `wax/covers/auto/`. To use your own cover, upload it as `wax/covers/<key>.jpg` (or `.png`/`.webp`):

```sh
aws s3 cp cover.jpg s3://tylergaw-assets/wax/covers/1198.jpg
```

Your covers always win over automatic ones and are never overwritten. The next run picks them up and makes the resized copies the site uses.

## Hand fixes

Put corrections in [`data/overrides.json`](../data/overrides.json), keyed by release id. They win over Claude's data and the pipeline never changes them:

```json
{
  "123": {
    "humanReadableColor": "Cranberry Bog",
    "cssReadableColors": ["#9f1d35"]
  }
}
```

## Running locally

Copy `.env.example` to `pipeline/.env` and fill in the values, then from the repo root:

```sh
yarn pipeline:update                 # fetch, then enrich new records
yarn pipeline:fetch                  # fetch only
yarn pipeline:masters                # fetch album years for new albums
yarn pipeline:covers                 # find covers for new albums, resize changed ones
yarn pipeline:enrich --mode=no-color # enrich only, with a mode
yarn pipeline:test
```

Local runs write to `data/`. Commit the changes yourself.
