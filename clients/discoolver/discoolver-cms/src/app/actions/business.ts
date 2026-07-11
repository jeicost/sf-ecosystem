"use server";

import {
  apiClient,
  apiClientV2,
  apiClientV3,
  apiClientV3Cms,
} from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";
import { ApiError } from "@/types/api";
import type {
  BusinessDetail,
  BusinessGalleryResponse,
  BusinessListResponse,
  BusinessQueryParams,
  BusinessSEO,
  BusinessStateListResponse,
  Product,
  UpdateBusinessRequest,
} from "@/types/business";
import type { LanguageCode } from "@/types/language";
import { DEFAULT_LANGUAGE } from "@/types/language";

/**
 * Get businesses with optional filters
 * @param params - Optional query parameters to filter businesses
 * @returns List of businesses or throws an error
 */
export async function getBusinesses(
  params?: BusinessQueryParams,
): Promise<BusinessListResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    // Build query string from params
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/business${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<BusinessListResponse>(endpoint, {
      token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Get an individual business by ID and language
 * @param id - Business ID
 * @param language - Language code (e.g., 'es', 'en')
 * @returns Business detail or throws an error
 */
export async function getBusinessById(
  id: number,
  language: LanguageCode = DEFAULT_LANGUAGE,
): Promise<BusinessDetail> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/business/${id}/${language}`;

    const response = await apiClient.get<BusinessDetail>(endpoint, {
      token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Get SEO information for a business by ID and language
 * @param id - Business ID
 * @param language - Language code (e.g., 'es', 'en')
 * @returns Business SEO information or throws an error
 */
export async function getBusinessSEO(
  id: number,
  language: LanguageCode = DEFAULT_LANGUAGE,
): Promise<BusinessSEO> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    // Use v2 API client for SEO endpoint
    const endpoint = `/seo/${id}/${language}`;

    const response = await apiClientV2.get<BusinessSEO>(endpoint, { token });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Get gallery images for a business by ID
 * @param id - Business ID
 * @returns Business gallery images or throws an error
 */
export async function getBusinessGallery(
  id: number,
): Promise<BusinessGalleryResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    // Use v3 API client for images/list endpoint
    const endpoint = `/images/list/${id}`;

    return await apiClientV3.get<BusinessGalleryResponse>(endpoint, {
      token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Create a new business
 * @param businessData - Business data to create
 * @returns Promise that resolves when creation is complete
 */
export async function createBusiness(
  businessData: UpdateBusinessRequest,
): Promise<void> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/cms/recommendeds`;

    // API returns empty 200 OK response on success
    await apiClientV3Cms.put<void>(endpoint, businessData, {
      token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Update a business with new data
 * @param id - Business ID
 * @param businessData - Business data to update
 * @returns Promise that resolves when update is complete
 */
export async function updateBusiness(
  id: number,
  businessData: UpdateBusinessRequest,
): Promise<void> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/cms/recommendeds/${id}`;

    // API returns empty 200 OK response on success
    await apiClientV3Cms.put<void>(endpoint, businessData, {
      token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Delete a business by ID
 * @param id - Business ID
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteBusiness(id: number): Promise<void> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/business/${id}`;

    // API returns empty 200 OK response on success
    await apiClient.delete<void>(endpoint, {
      token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Get business states for a specific language
 * @param language - Language code (e.g., 'es', 'en')
 * @returns List of business states or throws an error
 */
export async function getBusinessStates(
  language: LanguageCode = DEFAULT_LANGUAGE,
): Promise<BusinessStateListResponse> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/state/${language}`;

    const response = await apiClient.get<BusinessStateListResponse>(endpoint, {
      token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors so they can be handled by the client
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Update a business gallery image metadata or link
 * @param businessId - Business ID
 * @param imageData - Image data including the new Cloudinary link
 * @returns Promise that resolves when update is complete
 */
export async function updateBusinessGallery(
  businessId: number,
  imageData: Record<string, unknown>,
  language: LanguageCode = DEFAULT_LANGUAGE,
): Promise<void> {
  try {
    // Get the auth token for authenticated request
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/gallery/${businessId}/${language}`;

    return await apiClientV2.put<void>(endpoint, imageData, { token });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Add a new gallery image to a business
 * @param businessId - Business ID
 * @param imageData - Image data to add
 * @returns Promise that resolves when the image is added
 */
export async function addBusinessGalleryImage(
  businessId: number,
  imageData: Partial<{
    desc: string;
    id: string;
    title: string;
    type: string;
    cloudUrl: string;
    edited: boolean;
    data: string;
    visible: boolean;
  }>,
  language: LanguageCode = DEFAULT_LANGUAGE,
): Promise<void> {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/gallery/${businessId}/${language}`;
    await apiClientV2.post<void>(endpoint, imageData, {
      token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Delete a gallery image from a business
 * @param businessId - Business ID
 * @param imageId - ID of the image to delete
 * @returns Promise that resolves when the image is deleted
 */
export async function deleteBusinessGalleryImage(
  businessId: number,
  imageId: string,
): Promise<void> {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/gallery/${businessId}/${imageId}`;

    await apiClientV2.delete<void>(endpoint, {
      token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Get products for a business by ID and language
 * @param id - Business ID
 * @param language - Language code (e.g., 'es', 'en')
 * @returns List of products or throws an error
 */
export async function getBusinessProducts(
  id: number,
  language: LanguageCode = DEFAULT_LANGUAGE,
): Promise<Product[]> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/market/place/${id}/${language}`;
    const response = await apiClientV2.get<Product[]>(endpoint, {
      token,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Update business external marketplace data
 * @param businessId - Business ID
 * @param data - External data to update
 * @returns Promise that resolves when update is complete
 */
export async function updateBusinessExternalData(
  businessId: number,
  data: {
    typeOfMembership: number;
    urlMembership: string;
    deepLinkToken: string;
  },
): Promise<void> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const endpoint = `/market/place/${businessId}/external/data`;
    await apiClientV2.put<void>(endpoint, data, {
      token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}
