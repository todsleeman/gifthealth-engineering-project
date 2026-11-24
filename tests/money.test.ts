import { describe, it } from "vitest";

describe("Money.dollars: whole dollars only (A7)", () => {
  it.todo("creates an amount of whole dollars");
  it.todo(
    "throws a RangeError for an amount that isn't a whole number, such as 4.35",
  );
  it.todo("throws a RangeError for NaN and for amounts too large to be exact");
});

describe("Money arithmetic", () => {
  it.todo("zero is $0");
  it.todo("plus adds two amounts");
  it.todo("minus subtracts and can go below zero");
  it.todo("times multiplies by a count");
  it.todo("returns new amounts and leaves the originals unchanged");
});

describe("Money.format: income format (A7)", () => {
  it.todo("prints whole dollars without decimals, as $9");
  it.todo("prints zero as $0");
  it.todo("puts the minus sign before the dollar sign, as -$1");
  it.todo("prints large amounts without thousands separators, as $1000");
});
