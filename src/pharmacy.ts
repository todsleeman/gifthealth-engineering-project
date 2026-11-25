import { Money } from "./money.js";
import type {
  DrugName,
  PatientName,
  PatientSummary,
  PrescriptionEvent,
  RuleRejection,
} from "./types.js";

const FILL_INCOME = Money.dollars(5);
const RETURN_PENALTY = Money.dollars(1);

/** A created prescription. Returns never exceed fills. */
interface Prescription {
  fills: number;
  returns: number;
}

/** Values kept per prescription, grouped by patient and then by drug. */
type ByPrescription<T> = Map<PatientName, Map<DrugName, T>>;

/** The spec's prescription rules for one run. Each run starts with a new, empty `Pharmacy`. */
export class Pharmacy {
  readonly #patients: ByPrescription<Prescription> = new Map();

  /**
   * Fills discarded because they came before their prescription's `created`, less the returns that have used
   * them up. Kept for prescriptions that are never created too, but never part of `summaries()`.
   */
  readonly #discardedFills: ByPrescription<number> = new Map();

  /**
   * Applies one event.
   *
   * Returns `undefined` when the event was applied, or discarded because its prescription hasn't been created
   * (the spec discards fills and returns before `created`). Returns a `duplicate-created` rejection for a second
   * `created` of the same patient and drug, leaving the prescription unchanged. A return cancels one fill not yet
   * cancelled and costs `RETURN_PENALTY`. With no such fill, the return is discarded with no charge if a fill of
   * this prescription was discarded before `created` and no return has used it yet, since each discarded fill
   * accounts for one return, before or after `created`. Otherwise it returns a `nothing-to-return` rejection,
   * with nothing charged.
   */
  apply(event: PrescriptionEvent): RuleRejection | undefined {
    const prescription = this.#patients.get(event.patient)?.get(event.drug);
    switch (event.kind) {
      case "created":
        if (prescription) {
          return { reason: "duplicate-created", event };
        }
        drugsOf(this.#patients, event.patient).set(event.drug, {
          fills: 0,
          returns: 0,
        });
        return undefined;
      case "filled":
        if (prescription) {
          prescription.fills += 1;
        } else {
          this.#discardFill(event);
        }
        return undefined;
      case "returned":
        if (!prescription) {
          this.#useDiscardedFill(event);
          return undefined;
        }
        if (prescription.returns < prescription.fills) {
          prescription.returns += 1;
          return undefined;
        }
        if (this.#useDiscardedFill(event)) {
          return undefined;
        }
        return { reason: "nothing-to-return", event };
      default: {
        const unknown: never = event.kind;
        throw new Error(`unknown event kind: ${String(unknown)}`);
      }
    }
  }

  /**
   * One summary per patient with at least one created prescription, in no particular order. Net fills are
   * fills minus returns across the patient's prescriptions, and income is `FILL_INCOME` times net fills minus
   * `RETURN_PENALTY` times returns.
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
      const income = FILL_INCOME.times(netFills).minus(
        RETURN_PENALTY.times(returns),
      );
      return { patient, netFills, income };
    });
  }

  #discardFill({ patient, drug }: PrescriptionEvent): void {
    const counts = drugsOf(this.#discardedFills, patient);
    counts.set(drug, (counts.get(drug) ?? 0) + 1);
  }

  /** Uses up one discarded fill of the event's prescription. False if none is left. */
  #useDiscardedFill({ patient, drug }: PrescriptionEvent): boolean {
    const counts = this.#discardedFills.get(patient);
    const count = counts?.get(drug) ?? 0;
    if (count === 0) {
      return false;
    }
    counts?.set(drug, count - 1);
    return true;
  }
}

/** The patient's map of prescriptions, added empty if the patient has none yet. */
function drugsOf<T>(
  byPrescription: ByPrescription<T>,
  patient: PatientName,
): Map<DrugName, T> {
  let drugs = byPrescription.get(patient);
  if (!drugs) {
    drugs = new Map();
    byPrescription.set(patient, drugs);
  }
  return drugs;
}
