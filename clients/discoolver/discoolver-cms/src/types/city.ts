/**
 * City-related types
 */

export interface City {
  idCity: number;
  rawId: string;
  name: string | null;
  description: string | null;
  descriptionShort: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  keyWords: string | null;
  active: boolean | null;
  subregion: string | null;
  latitude: number | null;
  longitude: number | null;
  subtitle: string | null;
  twitter: string | null;
  facebook: string | null;
  instagram: string | null;
  googlePlus: string | null;
}

export type CityListResponse = City[];

/**
 * Represents a destination/subregion
 */
export interface Destination {
  idSubregion: number;
  name: string;
  description: string | null;
  code: string | null;
  rawId: string | null;
  region: string | null;
  cities: string | null;
}

export type DestinationListResponse = Destination[];
