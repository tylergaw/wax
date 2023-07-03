interface SourceObject {
  id: string | number;
  [key: string]: any;
}

export type DataSource = SourceObject[];

export interface Release {
  id: string | number;
  basic_information: any;
  [key: string]: any;
}

export type Collection = Release[];

export interface Artist {
  name: string;
  slug: string;
}
