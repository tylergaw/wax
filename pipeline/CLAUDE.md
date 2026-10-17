# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wax Tracks is an ETL pipeline that fetches vinyl collection data from Discogs, enriches it with OpenAI, and uploads it to S3 for consumption by [wax.tylergaw.com](https://wax.tylergaw.com/).

**Pipeline stages:**
1. **Extract:** Fetch collection from Discogs API (`getCollection.js`)
2. **Transform:** Enrich with OpenAI to standardize vinyl color/pattern/texture (`enrichCollection.js`)
3. **Load:** Upload JSON files to S3 (`upload.js`)
4. Trigger Netlify rebuild via webhook

## Working Principles

**IMPORTANT: Follow these principles when working on this project:**

- **Confirm before writing large code changes** - Don't write large chunks of code without checking in first. Propose the approach and get approval.
- **Ask, don't assume** - If there are multiple ways to do something, or if requirements are unclear, ask for clarification rather than making assumptions.
- **Stay humble** - Don't be overconfident about solutions. Present options and trade-offs when appropriate.
- **Work incrementally** - Break changes into small, manageable chunks. Make one focused change at a time rather than sweeping refactors.
- **Do not use emoji**
- **Do not use slang**

## Common Commands

**Run full pipeline (fetch → enrich → upload → rebuild):**
```sh
npm run update
```

**Run tests:**
```sh
npm test              # Run once
npm test:watch        # Watch mode
```

**Individual pipeline stages:**
```sh
npm run fetch              # Fetch from Discogs (with prompt)
npm run fetch:skipPrompt   # Skip confirmation prompt
npm run enrich             # OpenAI enrichment (requires fetch output)
npm run upload             # Upload to S3
npm run rebuild            # Trigger Netlify rebuild
```

**Code formatting:**
```sh
npm run prettier
```

## Architecture Notes

### Node.js Requirements
- Requires Node.js `>=20.6.0` (uses native `--env-file` flag and ES modules)
- All scripts use `node --env-file .env` to load environment variables
- Project uses ES modules (`"type": "module"` in package.json)

### Data Flow
All stages communicate via temporary JSON files in `./temp/`:
- `collection.json` - Output from Discogs fetch (input to enrich)
- `openAIEnrichments.json` - Output from OpenAI enrichment (uploaded to S3)

Both files are uploaded to S3 and consumed by the frontend.

### OpenAI Enrichment Strategy
The enrichment process (`enrichCollection.js`) is the most complex component:

**Batching:** Sends 15 records per OpenAI request (configurable via `recordLimit` parameter)

**System prompt design:** Contains ~20 specific instructions for consistent output format. Key rules:
- Distinguishes between colors, patterns (marble, sunburst), and textures (clear, translucent)
- Converts free-form descriptions to structured JSON with: `id`, `description`, `humanReadableColor`, `cssReadableColors`, `pattern`, `texture`
- Uses `temperature: 0` for deterministic results
- Requests JSON response format explicitly

**Error handling:** Uses `Promise.allSettled()` to allow partial success. If ANY requests fail, logs errors and exits with non-zero code.

### Environment Variables
Required environment variables (see `.env.example`):
- `TOKEN` - Discogs personal access token
- `USERNAME` - Discogs username
- `OPENAI_API_KEY` - OpenAI API key
- `MODEL` - OpenAI model to use (e.g., `gpt-4`)

### Testing Notes
- Uses Node's native test runner (`--test` flag)
- MSW (Mock Service Worker) is configured but currently incompatible with native test runner
- Set `TEST=true` environment variable to prevent scripts from running when imported
- Tests are in `enrichCollection.test.js`

### Shared Utilities
`shared.js` provides two utilities used across scripts:
- `persistData(data, filePath)` - Writes JSON to disk with formatting
- `getFlag(args, flagName, defaultValue)` - Parses CLI flags (e.g., `--skipPagePrompt`)
