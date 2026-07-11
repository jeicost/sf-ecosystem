/**
 * Category-related types
 */

export interface Category {
  idCategory: number;
  rawId: string;
  idParentCategory: number | null;
  name: string;
  description: string | null;
  descriptionShort: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  keyWords: string | null;
  image: string;
  priority: number | null;
  esTag: boolean;
  esPrincipal: boolean;
  adultOnly: boolean;
  filterId: number | null;
  filterName: string | null;
  subtitle: string | null;
  stateCheck: string | null;
  stayTime: string | null;
  images: string[] | null;
}

export type CategoryListResponse = Category[];
