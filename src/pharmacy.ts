import { Money } from "./helpers/money.js";
import type {
  DrugName,
  PatientName,
  PatientSummary,
  PrescriptionEvent,
  RuleRejection,
} from "./types.js";

/** Income from each fill that no return has cancelled. */
const FILL_INCOME = Money.dollars(5);
/** The cost of each return, kept even if the prescription is filled again later. */
const RETURN_PENALTY = Money.dollars(1);

/** A created prescription's counts. Returns never exceed fills. */
interface Prescription {
  fills: number;
  returns: number;
}

/** The spec's prescription rules for one run. Each run starts with a new, empty `Pharmacy`. */
export class Pharmacy {
  /** Created prescriptions, grouped by patient and then by drug. */
  readonly #patients = new Map<PatientName, Map<DrugName, Prescription>>();

  /**
   * Applies one event. Returns `undefined` when the event was applied or discarded, or a rejection for an
   * event the spec says can't happen, in which case nothing changes.
   *
   * - `created` creates the prescription with no fills. A second `created` for the same patient and drug is a
   *   `duplicate-created` rejection.
   * - `filled` adds one fill, worth $5. Before `created` it is discarded and never counts.
   * - `returned` cancels one fill not yet cancelled and costs $1. Before `created` it is discarded. After
   *   `created`, a return with no fill left to cancel is a `nothing-to-return` rejection, even if a fill came
   *   before `created`, since that fill was discarded.
   */
  apply(event: PrescriptionEvent): RuleRejection | undefined {
    const prescription = this.#patients.get(event.patient)?.get(event.drug);
    switch (event.kind) {
      case "created":
        if (prescription) {
          return { reason: "duplicate-created", event };
        }
        this.#drugsOf(event.patient).set(event.drug, {
          fills: 0,
          returns: 0,
        });
        return undefined;
      case "filled":
        if (prescription) {
          prescription.fills += 1;
        }
        return undefined;
      case "returned":
        if (!prescription) {
          return undefined;
        }
        if (prescription.returns === prescription.fills) {
          return { reason: "nothing-to-return", event };
        }
        prescription.returns += 1;
        return undefined;
      default: {
        const unknown: never = event.kind;
        throw new Error(`unknown event kind: ${String(unknown)}`);
      }
    }
  }

  /**
   * One summary per patient with at least one created prescription, in no particular order. Net fills are
   * fills minus returns across the patient's prescriptions, and income is $5 per net fill less $1 per return.
   */
  summaries(): PatientSummary[] {
    return Array.from(this.#patients, ([patient, prescriptions]) => {
      let fills = 0;
      let returns = 0;
      for (const prescription of prescriptions.values()) {
        fills += prescription.fills;
        returns += prescription.returns;
      }
      const netFills = fills - returns;
      const income = FILL_INCOME.multiply(netFills).subtract(
        RETURN_PENALTY.multiply(returns),
      );
      return { patient, netFills, income };
    });
  }

  /** The patient's prescriptions, added empty if the patient has none yet. */
  #drugsOf(patient: PatientName): Map<DrugName, Prescription> {
    let drugs = this.#patients.get(patient);
    if (!drugs) {
      drugs = new Map();
      this.#patients.set(patient, drugs);
    }
    return drugs;
  }
}
