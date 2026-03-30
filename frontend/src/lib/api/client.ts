import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import config from "@/lib/config";
import type { ApiErrorShape } from "@/types/api";

export class ApiClientError extends Error implements ApiErrorShape {
  status: number;
  code: string;
  details?: unknown;

  constructor({ message, status, code, details }: ApiErrorShape) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildErrorMessage(error: AxiosError): string {
  const detail = error.response?.data;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (detail && typeof detail === "object") {
    const detailRecord = detail as Record<string, unknown>;
    const message = detailRecord.message;
    const detailMessage = detailRecord.detail;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (typeof detailMessage === "string" && detailMessage.trim()) {
      return detailMessage;
    }
  }

  return error.message || "Request failed";
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const detail = error.response?.data;
    let code = error.code || `HTTP_${status}`;

    if (detail && typeof detail === "object") {
      const detailRecord = detail as Record<string, unknown>;
      if (typeof detailRecord.code === "string" && detailRecord.code.trim()) {
        code = detailRecord.code;
      }
    }

    return new ApiClientError({
      message: buildErrorMessage(error),
      status,
      code,
      details: detail,
    });
  }

  if (error instanceof Error) {
    return new ApiClientError({
      message: error.message,
      status: 500,
      code: "UNKNOWN_ERROR",
      details: undefined,
    });
  }

  return new ApiClientError({
    message: "Unknown API error",
    status: 500,
    code: "UNKNOWN_ERROR",
    details: error,
  });
}

function attachErrorNormalizer(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => Promise.reject(normalizeApiError(error))
  );
}

function mergeHeaders(
  current: AxiosRequestConfig["headers"],
  next: Record<string, string> | undefined
) {
  if (!next) return current;
  return {
    ...(typeof current === "object" ? current : {}),
    ...next,
  };
}

export interface ApiClientOptions {
  basePath: string;
  getHeaders?: () => Record<string, string> | undefined;
}

export function createApiClient({ basePath, getHeaders }: ApiClientOptions) {
  const instance = axios.create({
    baseURL: `${config.api.url}/api/v1${basePath}`,
    headers: {
      Accept: "application/json",
    },
  });

  instance.interceptors.request.use((request) => {
    request.headers = mergeHeaders(request.headers, getHeaders?.());
    return request;
  });

  attachErrorNormalizer(instance);

  return {
    instance,
    get: async <T>(url: string = "/", request?: AxiosRequestConfig) => {
      const { data } = await instance.get<T>(url, request);
      return data;
    },
    post: async <T>(url: string, body?: unknown, request?: AxiosRequestConfig) => {
      const { data } = await instance.post<T>(url, body, request);
      return data;
    },
    patch: async <T>(url: string, body?: unknown, request?: AxiosRequestConfig) => {
      const { data } = await instance.patch<T>(url, body, request);
      return data;
    },
    delete: async (url: string, request?: AxiosRequestConfig) => {
      await instance.delete(url, request);
    },
  };
}

function readStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cb_api_key");
}

export function getUserApiHeaders(): Record<string, string> | undefined {
  const localKey = readStoredApiKey();
  const envKey = process.env.NEXT_PUBLIC_CHAINBRIDGE_API_KEY;
  const apiKey = localKey || envKey;

  return apiKey ? { "X-API-Key": apiKey } : undefined;
}
