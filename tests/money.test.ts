import { describe, expect, it } from "vitest";
import { Money } from "../src/money.js";

describe("Money.dollars: whole dollars only", () => {
  it("creates an amount of whole dollars", () => {
    expect(Money.dollars(5).format()).toBe("$5");
  });

  it("throws a RangeError for an amount that isn't a whole number, such as 4.35", () => {
    expect(() => Money.dollars(4.35)).toThrow(RangeError);
  });

  it("throws a RangeError for NaN and for amounts too large to be exact", () => {
    expect(() => Money.dollars(Number.NaN)).toThrow(RangeError);
    expect(() => Money.dollars(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => Money.dollars(Infinity)).toThrow(RangeError);
  });
});

describe("Money arithmetic", () => {
  it("zero is $0", () => {
    expect(Money.zero.format()).toBe("$0");
  });

  it("add adds two amounts", () => {
    expect(Money.dollars(5).add(Money.dollars(4)).format()).toBe("$9");
  });

  it("subtract subtracts and can go below zero", () => {
    expect(Money.dollars(5).subtract(Money.dollars(1)).format()).toBe("$4");
    expect(Money.dollars(1).subtract(Money.dollars(2)).format()).toBe("-$1");
  });

  it("multiply multiplies by a count", () => {
    expect(Money.dollars(5).multiply(3).format()).toBe("$15");
    expect(Money.dollars(5).multiply(0).format()).toBe("$0");
  });

  it("multiply throws a RangeError for a count that isn't a whole number, such as 1.5", () => {
    expect(() => Money.dollars(5).multiply(1.5)).toThrow(RangeError);
    expect(() => Money.dollars(5).multiply(Number.NaN)).toThrow(RangeError);
  });

  it("returns new amounts and leaves the originals unchanged", () => {
    const five = Money.dollars(5);
    const one = Money.dollars(1);
    five.add(one);
    five.subtract(one);
    five.multiply(3);
    expect(five.format()).toBe("$5");
    expect(one.format()).toBe("$1");
  });
});

describe("Money.format: income format", () => {
  it("prints whole dollars without decimals, as $9", () => {
    expect(Money.dollars(9).format()).toBe("$9");
  });

  it("prints zero as $0", () => {
    expect(Money.dollars(0).format()).toBe("$0");
  });

  it("puts the minus sign before the dollar sign, as -$1", () => {
    expect(Money.dollars(-1).format()).toBe("-$1");
  });

  it("prints large amounts without thousands separators, as $1000", () => {
    expect(Money.dollars(1000).format()).toBe("$1000");
    expect(Money.dollars(-1234567).format()).toBe("-$1234567");
  });
});
