import type { Money } from "./money.js";

export const EVENT_KINDS = ["created", "filled", "returned"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export type PatientName = string;
export type DrugName = string;

export interface PrescriptionEvent {
  readonly patient: PatientName;
  readonly drug: DrugName;
  readonly kind: EventKind;
}

/** Why a line was rejected, with what its stderr message needs (A15, S3). */
export type Rejection =
  | { readonly reason: "wrong-field-count"; readonly fieldCount: number }
  | { readonly reason: "unknown-event"; readonly word: string }
  | { readonly reason: "duplicate-created"; readonly event: PrescriptionEvent }
  | { readonly reason: "nothing-to-return"; readonly event: PrescriptionEvent };

export type RejectReason = Rejection["reason"];

export type ParseResult =
  | { readonly ok: true; readonly event: PrescriptionEvent }
  | { readonly ok: false; readonly rejection: Rejection };

export interface PatientSummary {
  readonly patient: PatientName;
  readonly netFills: number;
  readonly income: Money;
}
