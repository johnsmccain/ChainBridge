import { createApiClient, getUserApiHeaders } from "@/lib/api/client";
import type {
  ApiSwapRecord,
  ListSwapsParams,
  VerifySwapProofPayload,
  VerifySwapProofResponse,
} from "@/types/api";

const swapsClient = createApiClient({
  basePath: "/swaps",
  getHeaders: getUserApiHeaders,
});

export function listSwaps(params: ListSwapsParams = {}) {
  return swapsClient.get<ApiSwapRecord[]>("/", { params });
}

export function getSwap(swapId: string) {
  return swapsClient.get<ApiSwapRecord>(`/${swapId}`);
}

export function verifySwapProof(swapId: string, payload: VerifySwapProofPayload) {
  return swapsClient.post<VerifySwapProofResponse>(`/${swapId}/verify-proof`, payload);
}
