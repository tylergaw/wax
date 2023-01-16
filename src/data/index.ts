export interface Release {
  basic_information: any;
}

export type Collection = Release[];

interface Artist {
  name: string;
}

function getArtists(collection: Release[]): Artist[] {
  let artistIndex: string[] = [];
  let artists: Artist[] = [];

  collection.forEach((release) => {
    release.basic_information.artists.forEach((artist: any) => {
      const currName = artist.name;

      // First check to make sure don't already have this artist in the list
      if (!artistIndex.includes(currName)) {
        const next: Artist = {
          name: currName,
        };
        artistIndex.push(currName);
        artists.push(next);
      }
    });
  });

  return artists;
}

export { getArtists };
