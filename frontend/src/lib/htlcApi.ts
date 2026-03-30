import {
  claimHTLC as claimHTLCRequest,
  getHTLCStatus,
  listHTLCs,
  refundHTLC as refundHTLCRequest,
} from "@/lib/api";
import type { ApiHTLCRecord, HTLCTimelineEvent, ListHTLCsParams } from "@/types/api";

export type HTLCRecord = ApiHTLCRecord;
export type HTLCQuery = ListHTLCsParams;
export type { HTLCTimelineEvent };

export function fetchHTLCs(query: HTLCQuery = {}): Promise<HTLCRecord[]> {
  return listHTLCs(query);
}

export function claimHTLC(id: string, secret: string): Promise<HTLCRecord> {
  return claimHTLCRequest(id, { secret }).then(() => getHTLCStatus(id));
}

export function refundHTLC(id: string): Promise<HTLCRecord> {
  return refundHTLCRequest(id).then(() => getHTLCStatus(id));
}
