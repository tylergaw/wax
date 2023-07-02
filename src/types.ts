interface SourceObject {
  id: string | number;
  [key: string]: any;
}

export type DataSource = SourceObject[];

export interface Release {
  basic_information: any;
}

export type Collection = Release[];

export interface Artist {
  name: string;
  slug: string;
}
