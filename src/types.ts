import type { Money } from "./money.js";

/** The event names the input can hold, matched exactly, case included. */
export const EVENT_KINDS = ["created", "filled", "returned"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** A patient's name as written in the input: any text without spaces. */
export type PatientName = string;
/** A drug's name as written in the input: any text without spaces. */
export type DrugName = string;

/** One line of input. A prescription is identified by its patient and drug together. */
export interface PrescriptionEvent {
  readonly patient: PatientName;
  readonly drug: DrugName;
  readonly kind: EventKind;
}

/** Why a line was rejected, with what its stderr message needs. */
export type Rejection =
  | { readonly reason: "wrong-field-count"; readonly fieldCount: number }
  | { readonly reason: "unknown-event"; readonly word: string }
  | { readonly reason: "duplicate-created"; readonly event: PrescriptionEvent }
  | { readonly reason: "nothing-to-return"; readonly event: PrescriptionEvent };

/** The rejections the pharmacy rules can return: a second `created` or a return with nothing to cancel. */
export type RuleRejection = Extract<
  Rejection,
  { reason: "duplicate-created" | "nothing-to-return" }
>;

/** A parsed line: its event, or why it can't be one. */
export type ParseResult =
  | { readonly ok: true; readonly event: PrescriptionEvent }
  | { readonly ok: false; readonly rejection: Rejection };

/** One patient's line of the report. `netFills` is fills less the returns that cancelled them. */
export interface PatientSummary {
  readonly patient: PatientName;
  readonly netFills: number;
  readonly income: Money;
}
