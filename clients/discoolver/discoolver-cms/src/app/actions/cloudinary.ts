"use server";

import { apiClientV2 } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";
import { ApiError } from "@/types/api";

export type PresignResult = {
  uploadUrl: string;
  key: string;
  publicUrl?: string;
  signedContentType: string;
};

function extFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] ?? "jpg";
}

/**
 * Requests a presigned PUT URL from POST /cms/v2/gallery/{businessId}/presign.
 * Uses CMSAuthorization header via apiClientV2.
 */
export async function presignImageUpload(opts: {
  businessId: number;
  contentType: string;
  filename?: string;
}): Promise<PresignResult> {
  const token = await getAuthToken();
  if (!token) throw new Error("Authentication required");

  const { businessId, contentType, filename } = opts;
  const extension = extFromMimeType(contentType);

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL ?? "(NEXT_PUBLIC_API_URL no definido)"
  ).replace(/\/$/, "");
  const endpoint = `/gallery/${businessId}/presign`;
  const fullUrl = `${apiBaseUrl}/cms/v2${endpoint}`;
  const body = { contentType, extension, filename };

  console.log("[presignImageUpload] request", {
    method: "POST",
    url: fullUrl,
    endpoint,
    body,
    hasToken: Boolean(token),
  });

  try {
    const result = await apiClientV2.post<PresignResult>(endpoint, body, {
      token,
    });
    console.log("[presignImageUpload] ok", {
      key: result.key,
      publicUrl: result.publicUrl,
      signedContentType: result.signedContentType,
      uploadUrlHost: (() => {
        try {
          return new URL(result.uploadUrl).host;
        } catch {
          return "(uploadUrl inválida)";
        }
      })(),
    });
    return result;
  } catch (error) {
    console.error("[presignImageUpload] error", {
      url: fullUrl,
      body,
      error:
        error instanceof ApiError
          ? {
              name: error.name,
              status: error.status,
              exception: error.exception,
              path: error.path,
              message: error.message,
            }
          : error instanceof Error
            ? { name: error.name, message: error.message }
            : error,
    });
    throw error;
  }
}
