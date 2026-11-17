/**
 * The p-adic valuation: how many times p divides a number.
 *
 *     v_p(n) = the largest k such that p^k divides n,      v_p(0) = ∞
 *     v_p(c / b) = v_p(c) − v_p(b)
 *
 * It behaves like a logarithm (v(xy) = v(x) + v(y)), and it satisfies the
 * strong triangle inequality:
 *
 *     v(x + y) ≥ min(v(x), v(y)),   with equality whenever v(x) ≠ v(y).
 *
 * The fractions with v_p ≥ 0 are exactly the ones whose denominator is not
 * divisible by p, i.e. the fractions that are p-adic integers. The strong
 * triangle inequality says that set is closed under addition.
 */

import { Digits } from "./digits";
import { mod } from "./modular";
import { Rational } from "./rational";

/** v_p(n) for an ordinary integer; Infinity for 0. */
export function integerValuation(value: bigint, prime: number): number {
  if (value === 0n) return Infinity;
  const p = BigInt(prime);
  let count = 0;
  let remaining = value;
  while (mod(remaining, p) === 0n) {
    remaining /= p;
    count++;
  }
  return count;
}

/** v_p(c / b) = v_p(c) − v_p(b); Infinity for 0. */
export function rationalValuation(x: Rational, prime: number): number {
  if (x.numerator === 0n) return Infinity;
  return integerValuation(x.numerator, prime) - integerValuation(x.denominator, prime);
}

/**
 * The valuation read off the digits: the position of the lowest non-zero
 * digit. If all known digits are zero, we can only say v ≥ precision, and we
 * report Infinity.
 */
export function digitsValuation(digits: Digits): number {
  const position = digits.findIndex((digit) => digit !== 0);
  return position === -1 ? Infinity : position;
}

/**
 * The p-adic absolute value |x|_p = p^(−v_p(x)), returned as a fraction.
 * Numbers divisible by a high power of p are SMALL.
 */
export function absoluteValue(x: Rational, prime: number): Rational {
  const valuation = rationalValuation(x, prime);
  if (valuation === Infinity) return { numerator: 0n, denominator: 1n };
  const scale = BigInt(prime) ** BigInt(Math.abs(valuation));
  return valuation >= 0 ? { numerator: 1n, denominator: scale } : { numerator: scale, denominator: 1n };
}
