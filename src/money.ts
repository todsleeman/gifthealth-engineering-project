import {
  dinero,
  multiply,
  subtract,
  toUnits,
  USD,
  type Dinero,
} from "dinero.js";

const CENTS_PER_DOLLAR = 100;

/**
 * An amount of money in US dollars, stored as integer cents by Dinero.js. Immutable. Only `dollars` creates an
 * amount and it takes whole dollars, so every amount is a whole number of dollars and `format` prints no cents.
 */
export class Money {
  private constructor(private readonly value: Dinero<number>) {}

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

  /** A new amount, `other` subtracted from this. May be negative. */
  subtract(other: Money): Money {
    return new Money(subtract(this.value, other.value));
  }

  /** A new amount, this multiplied by `count`. Throws a `RangeError` unless `count` is a whole number. */
  multiply(count: number): Money {
    if (!Number.isInteger(count)) {
      throw new RangeError(
        `expected a whole number to multiply by, got ${count}`,
      );
    }
    return new Money(multiply(this.value, count));
  }

  /** Whole dollars with the minus sign before the dollar sign and no separators: `$9`, `-$1`, `$0`. */
  format(): string {
    const [dollars = 0] = toUnits(this.value);
    return dollars < 0 ? `-$${-dollars}` : `$${dollars}`;
  }
}
