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
};

export interface Release {
  id: string | number;
  basic_information: any;
  display?: ReleaseDisplay;
  [key: string]: any;
}

export type Collection = Release[];

export interface Artist {
  name: string;
  slug: string;
}
