# Wax [![Netlify Status](https://api.netlify.com/api/v1/badges/683b9d37-a7c7-4a6a-b160-43f8b29c869b/deploy-status)](https://app.netlify.com/sites/on-wax/deploys)

A record collection viewer with data from Discogs.

- Production: [wax.tylergaw.com](https://wax.tylergaw.com/)
- Staging: Every pull request gets a preview deploy URL

> [!IMPORTANT]
>
> Fetching, enriching, and uploading collection data happens in [github.com/tylergaw/wax-tracks](https://github.com/tylergaw/wax-tracks).

## Technology overview

- This is a static site built with [Astro](https://astro.build/)
- Data fetcher/munger/uploader [github.com/tylergaw/wax-tracks](https://github.com/tylergaw/wax-tracks)
- Discogs API [discogs.com/developers/](https://www.discogs.com/developers/)
- Node >= v17.0.0
- Hosted on Netlify
- OpenAI API for data enrichment

## Local setup

**Install dependencies**

```
yarn
```

**Start development server**

```
yarn start
```

The site will be available at [http://localhost:3000](http://localhost:3000)

**Preview production**

Do a production build and local server to mimic a production environment. Note that there's no reload when files are changed.

```
yarn preview
```

**Build for production**

Generates static content into the `dist` directory that can be served using any static content hosting service.

```
yarn build
```

## Tests

This project can have a little tests, as a snack. Run using `vitest` with

```
yarn test
```

## Deployment

### To production

This site is hosted on Netlify. Anything merged into the `main` branch is deployed to production.

### To staging

This site uses Netlify preview builds. To see any branch in a live environment, push the branch to the remote and open a pull request.
