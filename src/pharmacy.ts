import { Money } from "./money.js";
import type {
  DrugName,
  PatientName,
  PatientSummary,
  PrescriptionEvent,
  RuleRejection,
} from "./types.js";

export const FILL_INCOME = Money.dollars(5);
export const RETURN_PENALTY = Money.dollars(1);

interface Prescription {
  fills: number;
  returns: number;
}

/** The spec's prescription rules for one run. Each run starts with a new, empty `Pharmacy`. */
export class Pharmacy {
  private readonly patients = new Map<
    PatientName,
    Map<DrugName, Prescription>
  >();

  /**
   * Applies one event.
   *
   * Returns `undefined` when the event was applied, or discarded because its prescription hasn't been created
   * (the spec discards fills and returns before `created`). Returns a `duplicate-created` rejection for a second
   * `created` of the same patient and drug, leaving the prescription unchanged. Returns a
   * `nothing-to-return` rejection for a return with no fill left to cancel, with no $1 charged, unless a fill of
   * this prescription was discarded before `created` and no return has used it yet: that return is discarded too.
   */
  apply(_event: PrescriptionEvent): RuleRejection | undefined {
    throw new Error("not implemented");
  }

  /**
   * One summary per patient with at least one created prescription, in no particular order. Net fills are
   * fills minus returns across the patient's prescriptions, and income is `FILL_INCOME` times net fills minus
   * `RETURN_PENALTY` times returns.
   */
  summaries(): PatientSummary[] {
    throw new Error("not implemented");
  }
}
