/**
 * Business-related types
 */

import type { Category } from "./category";
import type { City } from "./city";
import type { LanguageCode } from "./language";

export interface ImageUrls {
  normal: string;
  miniature: string;
  ogimage?: string;
}

export interface GalleryImage {
  normal: string;
  miniature: string;
}

export interface BusinessImages {
  tab: ImageUrls;
  main: {
    normal: string;
    miniature: string;
  };
  gallery?: GalleryImage[];
}

export interface ExternalLink {
  label:
    | "Reservar"
    | "Comprar"
    | "Gratis"
    | "No reservable"
    | "Formulario de contacto";
  url: string;
}

export interface Product {
  id: number;
  recommendedBusinessId: number | null;
  internalId: string | null;
  productFringeId: number | null;
  type: string;
  name: string;
  amount: number;
  format: string;
  question: string | null;
  stock: number;
  anticipation: number;
  buyers: unknown[];
  information: string | null;
  message: string | null;
  fringeId: number | null;
  alias: string | null;
  hidden: boolean;
  url: string | null;
  filename: string | null;
  cloudinaryUrl: string | null;
  photo: string | null;
  schedules: unknown[];
  realFringeId: number | null;
  hour: string | null;
  date: string | null;
}

export interface Business {
  id: number;
  rawId: string;
  name: string;
  description: string;
  descriptionShort: string;
  category: string;
  categoryRawId: string;
  categoryName: string;
  subcategory: string;
  subcategoryRawId: string;
  subcategoryName: string;
  relationshipWithTheCity: string;
  categoryPriority: string;
  subcategoryPriority: string;
  showInCalendar: boolean;
  checkType: string;
  checkText: string;
  lastUpdate: number;
  alert: boolean;
  outstanding: boolean;
  sponsored: boolean;
  outstandingInCategory: boolean;
  categoryAdultOnly: string;
  subcategoryAdultOnly: string;
  stateId: number;
  stateName: string;
  typeOfMembership: number;
  urlMembership?: string;
  ogTitle: string;
  ogDescription: string;
  urlTabPicture: string;
  urlMainPicture: string;
  favorite: boolean;
  countryRawId: string;
  destinationRawId: string;
  lastChange: number;
  containsProducts: boolean;
  urlDiscoolver: string;
  recommendatations: string;
  nextSchedule: string;
  relationship: string[];
  nextDateSchedule: number;
  images: BusinessImages;
  instagramHandle: string | null;
  instagramUrl: string | null;
  priceRange: string | null;
  tipsThingsNotToMiss: string | null;
  cashRegisterId: string | null;
  limitTickets: string | null;
  buyNote: string | null;
  gatewayChannel: string | null;
  datesHours: string | null;
  roofTopTerrace: string | null;
  ticketsEntrance: string | null;
  rateStars: string | null;
  menuUrl: string | null;
  veganOptions: string | null;
  petFriendly: string | null;
  wheelchairAccessible: string | null;
  ageRestriction: string | null;
  datesHours2: string | null;
  guidedTours: string | null;
  suggestedVisitDuration: string | null;
  difficultyLevel: string | null;
}

export interface BusinessQueryParams {
  language?: LanguageCode;
  name?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  state?: string;
  outstanding?: number | string;
  outstandingInCategory?: number | string;
  sponsored?: number | string;
}

export type BusinessListResponse = Business[];

/**
 * Individual business detail types
 */

export interface BusinessLocation {
  id: number;
  latitude: number;
  longitude: number;
  address: string | null;
  location: string;
}

export interface BusinessParametersUser {
  password: string;
  idBusiness: number;
  mail: string;
  name: string;
  login: string;
}

export interface BusinessParameters {
  categoryOfInterestId: number | null;
  city: City;
  periodicSchedule: boolean;
  visibleAccess: boolean;
  outstandingInCategory: boolean;
  latitude: number;
  youGoingWith: string;
  ogTitle: string;
  description: string;
  language: LanguageCode;
  blog: string | null;
  bestTimeOfTheYear: string | null;
  urlMembership: string | null;
  typeOfMembership: number;
  deepLinkToken?: string | null;
  checkText: string | null;
  web: string;
  rawId: string;
  timeOfStay: string | null;
  visibleDayOfInterest: boolean;
  longitude: number;
  visibleWeb: boolean;
  checkType: number;
  keyWords: string;
  idBusiness: number;
  address: string | null;
  outstanding: boolean;
  showInCalendar: boolean;
  showInRecommended: boolean;
  visibleBestTimeOfTheYear: boolean;
  stateId: number;
  sponsored: boolean;
  descriptionShort: string;
  ogDescription: string;
  visibleBlog: boolean;
  instagramHandle: string | null;
  instagramUrl: string | null;
  priceRange: string | null;
  tipsThingsNotToMiss: string | null;
  cashRegisterId: string | null;
  limitTickets: string | null;
  buyNote: string | null;
  gatewayChannel: string | null;
  datesHours: string | null;
  roofTopTerrace: string | null;
  ticketsEntrance: string | null;
  rateStars: string | null;
  menuUrl: string | null;
  veganOptions: string | null;
  petFriendly: string | null;
  wheelchairAccessible: string | null;
  ageRestriction: string | null;
  datesHours2: string | null;
  guidedTours: string | null;
  suggestedVisitDuration: string | null;
  difficultyLevel: string | null;
  googleData: string;
  outskirts: boolean;
  subtitle: string | null;
  name: string;
  relationshipWithTheCityId: number | null;
  essential: boolean;
}

export interface BusinessDetail {
  idUser: number | null;
  token: string | null;
  id: number;
  language: LanguageCode;
  accessDataList: unknown | null;
  address: string | null;
  bestTimeOfTheYear: string | null;
  blog: string | null;
  instagramHandle: string | null;
  instagramUrl: string | null;
  priceRange: string | null;
  tipsThingsNotToMiss: string | null;
  cashRegisterId: string | null;
  limitTickets: string | null;
  buyNote: string | null;
  gatewayChannel: string | null;
  datesHours: string | null;
  roofTopTerrace: string | null;
  ticketsEntrance: string | null;
  rateStars: string | null;
  menuUrl: string | null;
  veganOptions: string | null;
  petFriendly: string | null;
  wheelchairAccessible: string | null;
  ageRestriction: string | null;
  datesHours2: string | null;
  guidedTours: string | null;
  suggestedVisitDuration: string | null;
  difficultyLevel: string | null;
  categories: Category[];
  infotabsDataList: unknown | null;
  categoryOfInterestId: number | null;
  city: City;
  contacts: unknown | null;
  description: string;
  descriptionShort: string;
  diaInteresDataList: unknown | null;
  essential: boolean;
  forYou: boolean;
  fridayData: unknown | null;
  fridayLock: boolean;
  horarioDataList: unknown | null;
  images: unknown | null;
  inCalendar: boolean;
  inReccomended: boolean;
  urlMembership: ExternalLink[];
  typeOfMembership: number;
  deepLinkToken?: string | null;
  latitude: number;
  location: string;
  longitude: number;
  mainSubcategoriesId: string | null;
  mondayData: unknown | null;
  mondayLock: boolean;
  note: string | null;
  ogDescription: string;
  ogTitle: string;
  keyWords: string;
  subtitle: string | null;
  outstanding: boolean;
  redesDataList: unknown | null;
  relationshipWithTheCityId: number | null;
  saturdayData: unknown | null;
  saturdayLock: boolean;
  schedule: string[] | null;
  secondarySubcategoriesId: string | null;
  sponsored: boolean;
  stateCheck: number;
  dayCheck: string | null;
  stateId: number;
  stayTime: string | null;
  subcategories: Category[];
  subregionId: number;
  sundayData: unknown | null;
  sundayLock: boolean;
  tags: unknown | null;
  tagsId: string | null;
  thursdayData: unknown | null;
  thursdayLock: boolean;
  title: string;
  tuesdayData: unknown | null;
  tuesdayLock: boolean;
  url: string | null;
  user: unknown | null;
  password: string;
  visibleBlog: boolean;
  visibleWeb: boolean;
  web: string;
  wednesdayData: unknown | null;
  wednesdayLock: boolean;
  notLoose: unknown | null;
  inCity: boolean;
  youGoingWith: string;
  products: unknown | null;
  login: string;
  locations: BusinessLocation[];
  rawId: string;
  urlDiscoolver: string;
  previewDiscoolver: string;
  parametersUser: BusinessParametersUser;
  allCategories: Category[];
  schedules: unknown[];
  parameters: BusinessParameters;
}

/**
 * Business SEO information
 */
export interface BusinessSEO {
  title: string;
  description: string;
  tags: string[];
  selectedTags: string[];
}

/**
 * Business update request payload
 */
export interface UpdateBusinessRequest {
  language: LanguageCode;
  stateId: number;
  title: string;
  inReccomended: boolean;
  inCalendar: boolean;
  ogTitle: string;
  ogDescription: string;
  keyWords: string;
  subtitle: string | null;
  descriptionShort: string;
  subregionId: number;
  city: {
    idCity: number;
  };
  categories: number[];
  subcategories: number[];
  forYou: boolean;
  outstanding: boolean;
  sponsored: boolean;
  location: string;
  address: string | null;
  latitude: number;
  longitude: number;
  description: string;
  instagramHandle: string | null;
  instagramUrl: string | null;
  priceRange: string | null;
  tipsThingsNotToMiss: string | null;
  cashRegisterId: string | null;
  limitTickets: string | null;
  buyNote: string | null;
  gatewayChannel: string | null;
  datesHours: string | null;
  roofTopTerrace: string | null;
  ticketsEntrance: string | null;
  rateStars: string | null;
  menuUrl: string | null;
  veganOptions: string | null;
  petFriendly: string | null;
  wheelchairAccessible: string | null;
  ageRestriction: string | null;
  datesHours2: string | null;
  guidedTours: string | null;
  suggestedVisitDuration: string | null;
  difficultyLevel: string | null;
  mondayData: string | null;
  mondayLock: boolean;
  tuesdayData: string | null;
  tuesdayLock: boolean;
  wednesdayData: string | null;
  wednesdayLock: boolean;
  thursdayData: string | null;
  thursdayLock: boolean;
  fridayData: string | null;
  fridayLock: boolean;
  saturdayData: string | null;
  saturdayLock: boolean;
  sundayData: string | null;
  sundayLock: boolean;
  web?: string | null;
  blog?: string | null;
  stateCheck?: number | null;
  schedule?: string[] | null;
  youGoingWith?: string | null;
  bestTimeOfTheYear?: string | null;
  stayTime?: string | null;
  visibleWeb?: boolean;
  visibleBlog?: boolean;
  inCity?: boolean;
  essential?: boolean;
}

/**
 * Business Gallery Image
 */
export interface BusinessGalleryImage {
  alt: string | null;
  aspect: number;
  caption: string | null;
  desc: string;
  id: string;
  ratio: number;
  size: number;
  title: string;
  type: string;
  cloudUrl: string;
  edited: boolean;
}

export interface BusinessGalleryResponse {
  rows: BusinessGalleryImage[];
}

/**
 * Business State
 */
export interface BusinessState {
  id: number;
  name: string;
}

export type BusinessStateListResponse = BusinessState[];

/**
 * Business External Data Update Request
 */
export interface UpdateBusinessExternalDataRequest {
  typeOfMembership: number;
  urlMembership: string;
  deepLinkToken: string;
}
