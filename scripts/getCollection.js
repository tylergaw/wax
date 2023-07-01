import * as dotenv from "dotenv";
dotenv.config();

import readline from "readline/promises";
import fetch from "node-fetch";

import { dataFilePath, persistData } from "./shared.js";

const token = process.env.TOKEN;
const username = process.env.USERNAME;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (!token) {
  console.log(
    "You need a Discogs personal access token exported as a TOKEN env var. See .env.example"
  );
  process.exit(1);
}

if (!username) {
  console.log(
    "You need a Discogs username exported as a USERNAME env var. See .env.example"
  );
  process.exit(1);
}

const baseUrl = `https://api.discogs.com/users/${username}/collection/folders/0/releases?per_page=100`;

async function prompt(q) {
  try {
    const answer = await rl.question(`${q} [y/n] `);
    const a = !answer ? "y" : answer.toLowerCase();

    if (a === "n") {
      console.log("OK, exiting without fetching.");
      rl.close();
      return false;
    }

    return true;
  } catch (err) {
    console.log(err);
  } finally {
    rl.close();
  }
}

async function fetchJSON(url) {
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${token}`,
    },
  });
  const json = await res.json();
  return json;
}

try {
  console.log("Fetching first page from the Discogs API...");
  const firstPage = await fetchJSON(baseUrl);
  const numPages = firstPage.pagination.pages;

  console.log(`Fetched the 1st page of ${numPages} pages.`);
  const p = await prompt("Do you want to fetch all pages of releases?");

  if (p) {
    const nextPages = await Promise.all(
      Array.from(Array(numPages - 1)).map((_, i) =>
        fetchJSON(`${baseUrl}&page=${i + 2}`)
      )
    );

    const allPages = [firstPage, ...nextPages];
    const allReleases = allPages.reduce((accum, curr) => {
      accum.push(...curr.releases);
      return accum;
    }, []);

    await persistData(allReleases, dataFilePath);
    console.log(`Wrote data to ${dataFilePath}. All done.`);
  }

  process.exit(0);
} catch (err) {
  console.log(err);
  process.exit(1);
}
