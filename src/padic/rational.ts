/**
 * Ordinary fractions as p-adic integers.
 *
 * A fraction c / b in lowest terms is a p-adic integer exactly when p does
 * not divide b, because then b is a unit (see `inverse.ts`). Its digits come
 * from the same "take a digit, subtract it, divide by p" process used for
 * integers in `digits.ts`. The only change is how each digit is found:
 *
 *     digit = c · b^{−1} mod p              (for integers b = 1, so digit = c mod p)
 *     c / b ← (c / b − digit) / p           i.e.  c ← (c − digit · b) / p
 *
 * The numerator c stays within a bounded range, so it must eventually repeat
 * a value it had before. From then on the digits repeat too. So:
 *
 *     the p-adic expansion of every fraction is eventually periodic,
 *
 * which matches the familiar fact about decimal expansions of fractions.
 */

import { Digits } from "./digits";
import { gcd, inverseModPrime, mod } from "./modular";

/** A fraction in lowest terms with a positive denominator. */
export interface Rational {
  numerator: bigint;
  denominator: bigint;
}

/** Builds a fraction in lowest terms with a positive denominator. */
export function makeRational(numerator: bigint, denominator: bigint): Rational {
  if (denominator === 0n) throw new Error("Denominator cannot be zero.");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator) || 1n;
  return { numerator: (sign * numerator) / divisor, denominator: (sign * denominator) / divisor };
}

export function integerAsRational(value: bigint): Rational {
  return { numerator: value, denominator: 1n };
}

/** Parses text such as "7", "-3", or "2/5" (spaces allowed). Returns null if it can't. */
export function parseRational(text: string): Rational | null {
  const match = text.trim().match(/^([+-]?\d+)\s*(?:\/\s*([+-]?\d+))?$/);
  if (!match) return null;
  const denominator = BigInt(match[2] ?? "1");
  if (denominator === 0n) return null;
  return makeRational(BigInt(match[1]), denominator);
}

export function addRationals(x: Rational, y: Rational): Rational {
  return makeRational(x.numerator * y.denominator + y.numerator * x.denominator, x.denominator * y.denominator);
}

export function multiplyRationals(x: Rational, y: Rational): Rational {
  return makeRational(x.numerator * y.numerator, x.denominator * y.denominator);
}

export function formatRational(x: Rational): string {
  return x.denominator === 1n ? `${x.numerator}` : `${x.numerator}/${x.denominator}`;
}

/** A fraction is a p-adic integer exactly when p does not divide its (reduced) denominator. */
export function isPAdicInteger(x: Rational, prime: number): boolean {
  return mod(x.denominator, BigInt(prime)) !== 0n;
}

/**
 * The p-adic expansion of a fraction, described exactly: some digits at the
 * start, then a block that repeats forever.
 *
 *     digits = preperiod, period, period, period, ...
 */
export interface RationalExpansion {
  preperiod: Digits;
  period: Digits;
}

/**
 * Finds the exact eventually periodic expansion of a fraction whose
 * denominator is not divisible by p.
 *
 * We run the digit process and remember which numerator we had at each
 * position. When a numerator comes back, the digits from its first
 * appearance onward repeat forever.
 */
export function expandRational(x: Rational, prime: number): RationalExpansion {
  const p = BigInt(prime);
  const inverseOfDenominator = inverseModPrime(x.denominator, prime);
  if (inverseOfDenominator === null) {
    throw new Error(`${formatRational(x)} is not a ${prime}-adic integer: its denominator is divisible by ${prime}.`);
  }

  const digits: Digits = [];
  const positionWhereNumeratorFirstSeen = new Map<bigint, number>();
  let numerator = x.numerator;

  while (!positionWhereNumeratorFirstSeen.has(numerator)) {
    positionWhereNumeratorFirstSeen.set(numerator, digits.length);
    const digit = mod(numerator * BigInt(inverseOfDenominator), p);
    digits.push(Number(digit));
    numerator = (numerator - digit * x.denominator) / p; // exact: numerator − digit·b ≡ 0 (mod p)
  }

  const periodStart = positionWhereNumeratorFirstSeen.get(numerator)!;
  return { preperiod: digits.slice(0, periodStart), period: digits.slice(periodStart) };
}

/** The first `precision` digits of an eventually periodic expansion. */
export function expansionToDigits(expansion: RationalExpansion, precision: number): Digits {
  const { preperiod, period } = expansion;
  const digits: Digits = [];
  for (let position = 0; position < precision; position++) {
    digits.push(
      position < preperiod.length ? preperiod[position] : period[(position - preperiod.length) % period.length],
    );
  }
  return digits;
}

/** Shorthand: the first `precision` p-adic digits of a fraction. */
export function rationalToDigits(x: Rational, prime: number, precision: number): Digits {
  return expansionToDigits(expandRational(x, prime), precision);
}

/**
 * The fraction whose p-adic digits are those of x, except that the digit at
 * `position` goes up by one (wrapping around from p − 1 to 0).
 *
 * Raising digit i by one adds p^i. Wrapping it from p − 1 back to 0 instead
 * subtracts (p − 1)·p^i. Either way, every other digit, including the
 * infinitely many beyond the ones displayed, stays the same.
 */
export function incrementDigitOfRational(x: Rational, position: number, prime: number): Rational {
  const currentDigit = rationalToDigits(x, prime, position + 1)[position];
  const placeValue = BigInt(prime) ** BigInt(position);
  const change = currentDigit < prime - 1 ? placeValue : -BigInt(prime - 1) * placeValue;
  return addRationals(x, makeRational(change, 1n));
}
