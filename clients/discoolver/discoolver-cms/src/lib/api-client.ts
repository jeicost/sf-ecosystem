/**
 * Common API client for making requests to the Discoolver API
 */

import { ApiError, type ApiErrorResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const API_VERSION = "v1";

export interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Base API client class
 */
class ApiClient {
  private baseURL: string;
  private authHeader: string;

  constructor(baseURL: string, authHeader = "CMSAuthorization") {
    this.baseURL = baseURL;
    this.authHeader = authHeader;
  }

  /**
   * Constructs the full URL for an endpoint
   */
  private getUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;
    return `${this.baseURL}/${cleanEndpoint}`;
  }

  /**
   * Handles API errors and transforms them into ApiError instances
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      let errorData: ApiErrorResponse;

      try {
        errorData = JSON.parse(text) as ApiErrorResponse;
      } catch {
        const trimmed = text.trim();
        const preview =
          trimmed.length > 500 ? `${trimmed.slice(0, 500)}…` : trimmed;
        throw new ApiError(
          response.status,
          response.statusText,
          "UnknownException",
          "",
          Date.now(),
          trimmed
            ? `Non-JSON error response (${response.status}): ${preview}`
            : `Empty error response body (${response.status} ${response.statusText})`,
        );
      }

      // Check for authorization exceptions and automatically logout
      if (
        errorData.exception ===
          "com.icountries.exception.AuthorizationException" ||
        errorData.exception === "i18n.exception.authorization.exception"
      ) {
        // Import dynamically to avoid circular dependencies
        const { redirect } = await import("next/navigation");
        const { ROUTES } = await import("@/config/routes");

        redirect(`${ROUTES.LOGIN}?session_expired=true`);
      }

      throw new ApiError(
        errorData.status,
        errorData.error,
        errorData.exception,
        errorData.path,
        errorData.timestamp,
        errorData.message
      );
    }

    // Check if response has content before trying to parse JSON
    const text = await response.text();
    if (!text || text.trim() === "") {
      // Return undefined for empty responses (cast to T for type safety)
      return undefined as T;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Failed to parse response as JSON");
    }
  }

  /**
   * Makes a GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (options?.token) {
      headers[this.authHeader] = `Bearer ${options.token}`;
    }

    const url = this.getUrl(endpoint);

    const response = await fetch(url, {
      method: "GET",
      ...options,
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Makes a POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (options?.token) {
      headers[this.authHeader] = `Bearer ${options.token}`;
    }

    const response = await fetch(this.getUrl(endpoint), {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Makes a PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (options?.token) {
      headers[this.authHeader] = `Bearer ${options.token}`;
    }

    const response = await fetch(this.getUrl(endpoint), {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Makes a PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (options?.token) {
      headers[this.authHeader] = `Bearer ${options.token}`;
    }

    const response = await fetch(this.getUrl(endpoint), {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Makes a DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (options?.token) {
      headers[this.authHeader] = `Bearer ${options.token}`;
    }

    const response = await fetch(this.getUrl(endpoint), {
      method: "DELETE",
      headers,
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(`${API_BASE_URL}/cms/${API_VERSION}`);

// Create and export a v2 API client instance
export const apiClientV2 = new ApiClient(`${API_BASE_URL}/cms/v2`);

// Create and export a v3 API client instance (uses V3Authorization header)
export const apiClientV3 = new ApiClient(`${API_BASE_URL}/v3`, "V3Authorization");

// Same /v3 base URL as apiClientV3, but CMS recommendeds endpoints expect CMSAuthorization
export const apiClientV3Cms = new ApiClient(`${API_BASE_URL}/v3`, "CMSAuthorization");
