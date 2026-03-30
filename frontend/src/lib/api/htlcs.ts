import { createApiClient, getUserApiHeaders } from "@/lib/api/client";
import type {
  ApiHTLCBaseRecord,
  ApiHTLCRecord,
  ClaimHTLCPayload,
  CreateHTLCPayload,
  ListHTLCsParams,
} from "@/types/api";

const htlcsClient = createApiClient({
  basePath: "/htlcs",
  getHeaders: getUserApiHeaders,
});

export function listHTLCs(params: ListHTLCsParams = {}) {
  return htlcsClient.get<ApiHTLCRecord[]>("/", { params });
}

export function getHTLC(htlcId: string) {
  return htlcsClient.get<ApiHTLCRecord>(`/${htlcId}`);
}

export function getHTLCStatus(htlcId: string) {
  return htlcsClient.get<ApiHTLCRecord>(`/${htlcId}/status`);
}

export function createHTLC(payload: CreateHTLCPayload) {
  return htlcsClient.post<ApiHTLCBaseRecord>("/", payload);
}

export function claimHTLC(htlcId: string, payload: ClaimHTLCPayload) {
  return htlcsClient.post<ApiHTLCBaseRecord>(`/${htlcId}/claim`, payload);
}

export function refundHTLC(htlcId: string) {
  return htlcsClient.post<ApiHTLCBaseRecord>(`/${htlcId}/refund`, {});
}
