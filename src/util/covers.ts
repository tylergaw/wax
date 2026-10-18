import type { Release } from "@types";
import {
  getAlbumKey,
  getArtistDisplayName,
  getCoverUrl,
  getReleaseUrl,
} from "@util/data";

export type CoverAlbum = {
  key: string;
  artist: string;
  title: string;
  url: string;
  coverUrl?: string;
};

export type CoverSection = {
  source: string;
  label: string;
  albums: CoverAlbum[];
};

const sections = [
  { source: "discogs", label: "From Discogs" },
  { source: "none", label: "No cover" },
  { source: "auto", label: "Automatic" },
  { source: "cover-art-archive", label: "From Cover Art Archive" },
  { source: "manual", label: "Yours" },
];

export function getCoverSections(collection: Release[]): CoverSection[] {
  const albums = new Map<string, { album: CoverAlbum; source: string }>();

  collection.forEach((release) => {
    const key = getAlbumKey(release);

    if (!albums.has(key)) {
      const { title, artists } = release.basic_information;
      albums.set(key, {
        source: release.cover?.source ?? "none",
        album: {
          key,
          artist: getArtistDisplayName(artists[0].name),
          title,
          url: getReleaseUrl(release),
          coverUrl: getCoverUrl(release, 600),
        },
      });
    }
  });

  return sections
    .map(({ source, label }) => ({
      source,
      label,
      albums: [...albums.values()]
        .filter((a) => a.source === source)
        .map((a) => a.album)
        .sort(
          (a, b) =>
            a.artist.localeCompare(b.artist, "en", { sensitivity: "base" }) ||
            a.title.localeCompare(b.title)
        ),
    }))
    .filter((section) => section.albums.length);
}
