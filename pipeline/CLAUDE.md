# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The pipeline fetches vinyl collection data from Discogs, enriches it with Claude, and writes JSON files to `data/` at the repo root. The site ([wax.tylergaw.com](https://wax.tylergaw.com/)) imports those files at build time.

**Pipeline stages:**
1. **Extract:** Fetch collection from Discogs API (`getCollection.js`) to `data/collection.json`
2. **Transform:** Enrich with Claude to standardize vinyl color/pattern/texture (`enrichCollection.js`) to `data/enrichments.json`
3. **Load:** The `.github/workflows/pipeline.yml` workflow runs both daily and opens a PR when `data/` changes. Routine PRs merge themselves; Netlify deploys on merge

## Working Principles

**IMPORTANT: Follow these principles when working on this project:**

- **Confirm before writing large code changes** - Don't write large chunks of code without checking in first. Propose the approach and get approval.
- **Ask, don't assume** - If there are multiple ways to do something, or if requirements are unclear, ask for clarification rather than making assumptions.
- **Stay humble** - Don't be overconfident about solutions. Present options and trade-offs when appropriate.
- **Work incrementally** - Break changes into small, manageable chunks. Make one focused change at a time rather than sweeping refactors.
- **Do not use emoji**
- **Do not use slang**

## Common Commands

All commands are scripts in the root `package.json` and run from the repo root. Each script changes into `pipeline/` before running, so paths in the source are relative to `pipeline/`.

**Run fetch and enrich locally (commit the `data/` changes yourself):**
```sh
yarn pipeline:update
```

**Run tests:**
```sh
yarn pipeline:test
```

**Individual pipeline stages:**
```sh
yarn pipeline:fetch              # Fetch from Discogs (with prompt)
yarn pipeline:fetch:skipPrompt   # Skip confirmation prompt
yarn pipeline:enrich             # Claude enrichment (requires fetch output)
yarn pipeline:enrich --mode=all  # Modes: new (default), no-color, all
```

## Architecture Notes

### Node.js Requirements
- Requires Node.js `>=20.6.0` (uses native `--env-file` flag and ES modules)
- All scripts use `node --env-file .env` to load environment variables from `pipeline/.env`
- Project uses ES modules (`"type": "module"` in the root package.json)

### Data Flow
Files in `data/` at the repo root:
- `collection.json` - Output from Discogs fetch, sorted by date added (input to enrich)
- `enrichments.json` - Output from Claude enrichment, sorted by release id
- `overrides.json` - Hand fixes keyed by release id. The pipeline never writes it; the site applies it last

**Which records get enriched:** each enrichment stores the description it was made from. Mode `new` sends records with no enrichment or a changed description, `no-color` also sends records without `cssReadableColors`, and `all` sends everything. Enrichments for records no longer in the collection are dropped.

### Claude Enrichment Strategy
The enrichment process (`enrichCollection.js`) is the most complex component:

**Batching:** Sends 15 records per Claude request, one request at a time (configurable via `recordLimit` parameter)

**Model:** `claude-opus-5-5` with `effort: "low"`. Refusal fallbacks are on (`fallbacks: "default"`), so a declined request is retried server-side on Anthropic's recommended fallback model.

**Output format:** Uses structured outputs (`output_config.format` with a JSON schema), so every response matches the shape: `{ records: [{ id, description, humanReadableColor, cssReadableColors, pattern, texture }] }`. Every record sent gets an entry back; fields without a value are null.

**System prompt design:** Covers only the vinyl-specific rules, since the schema handles the JSON shape. Key rules:
- Distinguishes between colors, patterns (marble, sunburst), and textures (clear, translucent)
- `cssReadableColors` contains only valid lowercase CSS colors

**Error handling:** All or nothing. If any request fails or a record comes back missing, nothing is written and the script exits non-zero, so the workflow commits nothing and the next run retries.

### Environment Variables
Required environment variables (see `.env.example`):
- `TOKEN` - Discogs personal access token
- `USERNAME` - Discogs username
- `ANTHROPIC_API_KEY` - Claude API key

### Testing Notes
- Uses Node's native test runner (`--test` flag). The site's Vitest config excludes `pipeline/`
- Set `TEST=true` environment variable to prevent scripts from running when imported
- Tests are in `enrichCollection.test.js`

### Shared Utilities
`shared.js` provides utilities used across scripts:
- `persistData(data, filePath)` - Writes JSON to disk with formatting
- `getFlag(args, flagName, defaultValue)` - Parses CLI flags (e.g., `--skipPagePrompt`)
- `getOption(args, optionName, defaultValue)` - Parses CLI options with values (e.g., `--mode=all`)
