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

export type RejectReason =
  | "wrong-field-count"
  | "unknown-event"
  | "duplicate-created"
  | "nothing-to-return";

export type ParseResult =
  | { readonly ok: true; readonly event: PrescriptionEvent }
  | {
      readonly ok: false;
      readonly lineNumber: number;
      readonly reason: RejectReason;
    };

export interface PatientSummary {
  readonly patient: PatientName;
  readonly netFills: number;
  readonly income: Money;
}
