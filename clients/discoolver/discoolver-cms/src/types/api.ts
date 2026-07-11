/**
 * Common API types
 */

export interface ApiErrorResponse {
  timestamp: number;
  status: number;
  error: string;
  exception: string;
  message: string;
  path: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    public exception: string,
    public path: string,
    public timestamp: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
