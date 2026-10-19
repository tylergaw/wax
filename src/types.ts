interface SourceObject {
  id: string | number;
  [key: string]: any;
}

export type DataSource = SourceObject[];

export type ReleaseDisplay = {
  id?: string;
  description?: string;
  humanReadableColor?: string | null;
  cssReadableColors?: string[] | null;
  pattern?: string | null;
  texture?: string | null;
  discs?: ReleaseDisplay[];
};

// Album-level data from the release's Discogs master. A release is one
// pressing of an album.
export type Album = {
  year?: number;
};

export type Cover = {
  key: string;
  source: string;
  version: string;
};

export interface Release {
  id: string | number;
  basic_information: any;
  display?: ReleaseDisplay;
  album?: Album;
  cover?: Cover;
  [key: string]: any;
}

export type Collection = Release[];

export interface Artist {
  id: number;
  name: string;
  slug: string;
}
