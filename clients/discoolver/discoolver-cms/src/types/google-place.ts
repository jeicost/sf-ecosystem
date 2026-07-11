/**
 * Google Place Types
 * Types for Google Places API integration
 */

/**
 * Represents opening hours for a Google Place
 */
export interface GooglePlaceOpeningHours {
  openNow?: boolean;
  weekdayText?: string[];
  periods?: Array<{
    open: {
      day: number;
      time: string;
    };
    close?: {
      day: number;
      time: string;
    };
  }>;
}

/**
 * Represents a Google Place photo with URL
 */
export interface GooglePlacePhoto {
  photoReference: string;
  url?: string;
  width?: number;
  height?: number;
}

/**
 * Represents a Google Place returned from the search
 */
export interface GooglePlace {
  placeId: string;
  name: string;
  address: string;
  photos: GooglePlacePhoto[];
  phoneNumber?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  userRatingsTotal?: number;
  openingHours?: GooglePlaceOpeningHours;
  types?: string[];
  priceLevel?: number;
}

/**
 * Query parameters for searching Google Places
 */
export interface GooglePlaceQueryParams {
  name: string;
  city: string;
  categoryName: string;
}

/**
 * Response type for Google Place search
 */
export type GooglePlaceListResponse = GooglePlace[];

/**
 * Request body for saving a Google Place
 */
export interface SaveGooglePlaceRequest {
  state: number;
  title: string;
  descriptionShort: string;
  ogTitle: string;
  ogDescription: string;
  subregion?: string;
  city?: string;
  category?: string;
  subcategory?: string;
  showInRecommended?: boolean;
  showInCalendar?: boolean;
  outstanding?: boolean;
  sponsored?: boolean;
  outstandingInCategory?: boolean;
  language?: string;
  stayTime?: string;
  inCity?: string;
  stateCheck?: string;
  relationshipWithTheCityId?: string;
  youGoingWith?: string;
  // Google Places imported data
  phoneNumber?: string;
  web?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  importImages?: boolean;
  selectedPhotoReferences?: string[];
}
