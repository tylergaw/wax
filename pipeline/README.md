# Pipeline

Fetches the collection from Discogs, fetches each album's original year from its Discogs master, and uses Claude to work out each record's vinyl color. The results are committed to [`data/`](../data/), and the site builds from those files.

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

The workflow needs the repository secrets `TOKEN` and `USERNAME` (Discogs) and `ANTHROPIC_API_KEY`.

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
yarn pipeline:enrich --mode=no-color # enrich only, with a mode
yarn pipeline:test
```

Local runs write to `data/`. Commit the changes yourself.
