import type { Dinero } from "dinero.js";

export class Money {
  private constructor(private readonly value: Dinero<number>) {}

  static get zero(): Money {
    throw new Error("not implemented");
  }

  static dollars(_amount: number): Money {
    throw new Error("not implemented");
  }

  plus(_other: Money): Money {
    throw new Error("not implemented");
  }

  minus(_other: Money): Money {
    throw new Error("not implemented");
  }

  times(_count: number): Money {
    throw new Error("not implemented");
  }

  format(): string {
    throw new Error("not implemented");
  }
}
