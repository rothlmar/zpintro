import { describe, expect, it } from "vitest";
import {
  addDigits,
  addDigitsWithColumns,
  addSequences,
  countAgreeingLowDigits,
  digitsToInteger,
  digitsToSequence,
  digitsValuation,
  divideDigits,
  divideDigitsWithSteps,
  expandRational,
  findCoherenceProblem,
  highestNonzeroPosition,
  integerToDigits,
  integerValuation,
  inverseDigits,
  inverseModPrime,
  absoluteValue,
  makeRational,
  multiplyDigits,
  multiplySequences,
  parseRational,
  rationalToDigits,
  rationalValuation,
  sequenceToDigits,
  addRationals,
  multiplyRationals,
  incrementDigitOfRational,
} from "./index";

const PRIMES = [2, 3, 5, 7, 11, 13];
const PRECISION = 12;

describe("integerToDigits", () => {
  it("gives the base-p representation of a non-negative integer", () => {
    // 38 = 3 + 2·5 + 1·25
    expect(integerToDigits(38n, 5, 5)).toEqual([3, 2, 1, 0, 0]);
    expect(highestNonzeroPosition(integerToDigits(38n, 5, 10))).toBe(2);
  });

  it("gives trailing (p−1)s for negative integers", () => {
    expect(integerToDigits(-1n, 5, 6)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(integerToDigits(-1n, 2, 4)).toEqual([1, 1, 1, 1]);
  });

  it("agrees with reduction mod p^n", () => {
    for (const prime of PRIMES) {
      for (const value of [0n, 1n, -1n, 17n, -123n, 10_000n]) {
        const modulus = BigInt(prime) ** BigInt(PRECISION);
        const expected = ((value % modulus) + modulus) % modulus;
        expect(digitsToInteger(integerToDigits(value, prime, PRECISION), prime)).toBe(expected);
      }
    }
  });
});

describe("sequences", () => {
  it("converts digits to partial sums and back", () => {
    const digits = [2, 3, 1, 3, 1];
    const terms = digitsToSequence(digits, 5);
    expect(terms).toEqual([2n, 17n, 42n, 417n, 1042n]);
    expect(findCoherenceProblem(terms, 5)).toBeNull();
    expect(sequenceToDigits(terms, 5)).toEqual(digits);
  });

  it("detects incoherent sequences", () => {
    expect(findCoherenceProblem([2n, 18n], 5)).toEqual({ n: 2, reason: "incompatible" });
    expect(findCoherenceProblem([7n], 5)).toEqual({ n: 1, reason: "out-of-range" });
  });

  it("termwise operations match digit arithmetic", () => {
    for (const prime of PRIMES) {
      const a = integerToDigits(-37n, prime, PRECISION);
      const b = rationalToDigits(makeRational(2n, prime === 7 ? 3n : 7n), prime, PRECISION);
      const sa = digitsToSequence(a, prime);
      const sb = digitsToSequence(b, prime);
      expect(sequenceToDigits(addSequences(sa, sb, prime), prime)).toEqual(addDigits(a, b, prime));
      expect(sequenceToDigits(multiplySequences(sa, sb, prime), prime)).toEqual(multiplyDigits(a, b, prime));
      expect(findCoherenceProblem(multiplySequences(sa, sb, prime), prime)).toBeNull();
    }
  });
});

describe("arithmetic", () => {
  it("adds and multiplies integers correctly", () => {
    for (const prime of PRIMES) {
      for (const [x, y] of [[12n, 30n], [-1n, 1n], [-45n, 17n], [99n, -100n]]) {
        const dx = integerToDigits(x, prime, PRECISION);
        const dy = integerToDigits(y, prime, PRECISION);
        expect(addDigits(dx, dy, prime)).toEqual(integerToDigits(x + y, prime, PRECISION));
        expect(multiplyDigits(dx, dy, prime)).toEqual(integerToDigits(x * y, prime, PRECISION));
      }
    }
  });

  it("−1 + 1 carries all the way", () => {
    const { sum, columns } = addDigitsWithColumns(integerToDigits(-1n, 5, 6), integerToDigits(1n, 5, 6), 5);
    expect(sum).toEqual([0, 0, 0, 0, 0, 0]);
    expect(columns.every((column) => column.carryOut === 1)).toBe(true);
  });
});

describe("division and inverses", () => {
  it("finds inverses mod p", () => {
    expect(inverseModPrime(3n, 5)).toBe(2);
    expect(inverseModPrime(0n, 5)).toBeNull();
    expect(inverseModPrime(-1n, 7)).toBe(6);
  });

  it("1/3 in Z_5 is …131313132", () => {
    const third = inverseDigits(integerToDigits(3n, 5, 9), 5);
    expect(third).toEqual([2, 3, 1, 3, 1, 3, 1, 3, 1]);
    expect(multiplyDigits(third, integerToDigits(3n, 5, 9), 5)).toEqual(integerToDigits(1n, 5, 9));
  });

  it("each step clears one more digit of the remainder", () => {
    const { steps } = divideDigitsWithSteps(integerToDigits(1n, 7, 8), integerToDigits(3n, 7, 8), 7);
    steps.forEach((step) => {
      expect(digitsValuation(step.remainderAfter)).toBeGreaterThan(step.position);
    });
  });

  it("long division agrees with the rational expansion", () => {
    for (const prime of PRIMES) {
      for (const [c, b] of [[1n, 3n], [-2n, 7n], [5n, 12n], [22n, 7n], [1n, 1n]]) {
        if (b % BigInt(prime) === 0n) continue;
        const quotient = divideDigits(integerToDigits(c, prime, PRECISION), integerToDigits(b, prime, PRECISION), prime);
        expect(quotient).toEqual(rationalToDigits(makeRational(c, b), prime, PRECISION));
      }
    }
  });

  it("refuses to divide by a non-unit", () => {
    expect(() => divideDigits([1, 0, 0], [0, 1, 0], 5)).toThrow();
  });

  it("counts agreeing digits", () => {
    expect(countAgreeingLowDigits([1, 2, 3], [1, 2, 4])).toBe(2);
  });
});

describe("rational expansions", () => {
  it("finds the exact period", () => {
    expect(expandRational(makeRational(1n, 3n), 5)).toEqual({ preperiod: [2], period: [3, 1] });
    expect(expandRational(makeRational(-1n, 1n), 5)).toEqual({ preperiod: [], period: [4] });
    expect(expandRational(makeRational(38n, 1n), 5)).toEqual({ preperiod: [3, 2, 1], period: [0] });
  });

  it("increments one digit and leaves the rest alone", () => {
    const third = makeRational(1n, 3n); // …1313132 in Z_5
    const bumped = incrementDigitOfRational(third, 1, 5); // digit 1: 3 → 4
    expect(bumped).toEqual(makeRational(16n, 3n));
    expect(rationalToDigits(bumped, 5, 8)).toEqual([2, 4, 1, 3, 1, 3, 1, 3]);
    const minusOne = makeRational(-1n, 1n); // …4444, digit 0 wraps 4 → 0
    expect(rationalToDigits(incrementDigitOfRational(minusOne, 0, 5), 5, 6)).toEqual([0, 4, 4, 4, 4, 4]);
  });

  it("parses fractions", () => {
    expect(parseRational(" -6 / 4 ")).toEqual({ numerator: -3n, denominator: 2n });
    expect(parseRational("3/-9")).toEqual({ numerator: -1n, denominator: 3n });
    expect(parseRational("1/0")).toBeNull();
    expect(parseRational("abc")).toBeNull();
  });

  it("rational arithmetic matches p-adic arithmetic", () => {
    const x = makeRational(2n, 3n);
    const y = makeRational(-5n, 7n);
    const prime = 5;
    const dx = rationalToDigits(x, prime, PRECISION);
    const dy = rationalToDigits(y, prime, PRECISION);
    expect(addDigits(dx, dy, prime)).toEqual(rationalToDigits(addRationals(x, y), prime, PRECISION));
    expect(multiplyDigits(dx, dy, prime)).toEqual(rationalToDigits(multiplyRationals(x, y), prime, PRECISION));
  });
});

describe("valuation", () => {
  it("counts factors of p", () => {
    expect(integerValuation(50n, 5)).toBe(2);
    expect(integerValuation(-24n, 2)).toBe(3);
    expect(integerValuation(0n, 3)).toBe(Infinity);
    expect(rationalValuation(makeRational(3n, 50n), 5)).toBe(-2);
  });

  it("matches the lowest non-zero digit", () => {
    expect(digitsValuation(integerToDigits(75n, 5, 6))).toBe(2);
  });

  it("satisfies the strong triangle inequality", () => {
    const samples = [1n, 3n, 10n, 25n, -50n, 7n, 125n, -4n].map((n) => makeRational(n, 1n));
    for (const x of samples) {
      for (const y of samples) {
        const sum = addRationals(x, y);
        const vx = rationalValuation(x, 5);
        const vy = rationalValuation(y, 5);
        expect(rationalValuation(sum, 5)).toBeGreaterThanOrEqual(Math.min(vx, vy));
        if (vx !== vy) expect(rationalValuation(sum, 5)).toBe(Math.min(vx, vy));
      }
    }
  });

  it("computes |x|_p", () => {
    expect(absoluteValue(makeRational(50n, 1n), 5)).toEqual({ numerator: 1n, denominator: 25n });
    expect(absoluteValue(makeRational(1n, 5n), 5)).toEqual({ numerator: 5n, denominator: 1n });
  });
});
