import type { Dinero } from "dinero.js";

/** An amount of money in whole US dollars, stored as integer cents by Dinero.js (A6, A7). Immutable. */
export class Money {
  private constructor(private readonly value: Dinero<number>) {}

  /** $0. */
  static get zero(): Money {
    throw new Error("not implemented");
  }

  /** `amount` whole dollars. Throws a `RangeError` unless `amount` is a safe integer (A7). */
  static dollars(_amount: number): Money {
    throw new Error("not implemented");
  }

  /** A new amount, this plus `other`. */
  plus(_other: Money): Money {
    throw new Error("not implemented");
  }

  /** A new amount, this minus `other`. May be negative. */
  minus(_other: Money): Money {
    throw new Error("not implemented");
  }

  /** A new amount, this times a whole `count`. */
  times(_count: number): Money {
    throw new Error("not implemented");
  }

  /** Whole dollars with the minus sign before the dollar sign and no separators: `$9`, `-$1`, `$0` (A7). */
  format(): string {
    throw new Error("not implemented");
  }
}
