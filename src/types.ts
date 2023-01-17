export interface Release {
  basic_information: any;
}

export type Collection = Release[];

export interface Artist {
  name: string;
  slug: string;
}
