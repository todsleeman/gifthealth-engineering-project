import {
  add,
  dinero,
  multiply,
  subtract,
  toUnits,
  USD,
  type Dinero,
} from "dinero.js";

const CENTS_PER_DOLLAR = 100;

/** An amount of money in whole US dollars, stored as integer cents by Dinero.js. Immutable. */
export class Money {
  private constructor(private readonly value: Dinero<number>) {}

  /** $0. */
  static get zero(): Money {
    return Money.dollars(0);
  }

  /**
   * `amount` whole dollars. Throws a `RangeError` unless `amount` is a whole number small enough that its value
   * in cents is a safe integer, so it is stored exactly.
   */
  static dollars(amount: number): Money {
    const cents = amount * CENTS_PER_DOLLAR;
    if (!Number.isInteger(amount) || !Number.isSafeInteger(cents)) {
      throw new RangeError(`expected a whole number of dollars, got ${amount}`);
    }
    return new Money(dinero({ amount: cents, currency: USD }));
  }

  /** A new amount, this plus `other`. */
  plus(other: Money): Money {
    return new Money(add(this.value, other.value));
  }

  /** A new amount, this minus `other`. May be negative. */
  minus(other: Money): Money {
    return new Money(subtract(this.value, other.value));
  }

  /** A new amount, this times `count`, which must be a whole number. */
  times(count: number): Money {
    return new Money(multiply(this.value, count));
  }

  /** Whole dollars with the minus sign before the dollar sign and no separators: `$9`, `-$1`, `$0`. */
  format(): string {
    const [dollars = 0] = toUnits(this.value);
    return dollars < 0 ? `-$${-dollars}` : `$${dollars}`;
  }
}
