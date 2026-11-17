/**
 * The SERIES representation of a p-adic integer:
 *
 *     a_0 + a_1 p + a_2 p^2 + a_3 p^3 + ...      with each a_i in {0, ..., p-1}
 *
 * A computer can only hold finitely many digits, so throughout this project a
 * p-adic integer is represented by its first `precision` digits:
 *
 *     digits[i] = a_i      (the coefficient of p^i)
 *
 * Knowing the first n digits is exactly the same as knowing the number
 * modulo p^n, which is the link to the sequence representation in `sequences.ts`.
 */

import { mod, primePower } from "./modular";

/** The first `precision` p-adic digits of a p-adic integer, lowest first. */
export type Digits = number[];

/**
 * The p-adic digits of an ordinary integer.
 *
 * This is the familiar "repeatedly divide by p and record the remainder"
 * algorithm for writing a number in base p:
 *
 *     a_i = (remaining value) mod p
 *     remaining value ← (remaining value − a_i) / p
 *
 * For a non-negative integer the remaining value eventually reaches 0, and
 * every later digit is 0: the expansion is finite, and it is just the
 * base-p representation.
 *
 * The same algorithm works unchanged for negative integers, but the
 * remaining value never reaches 0. It settles at −1 instead, and
 * −1 = (p−1) + p·(−1) produces the digit p−1 forever. So
 *
 *     −1 = (p−1) + (p−1)p + (p−1)p^2 + ...
 */
export function integerToDigits(value: bigint, prime: number, precision: number): Digits {
  const p = BigInt(prime);
  const digits: Digits = [];
  let remaining = value;
  for (let position = 0; position < precision; position++) {
    const digit = mod(remaining, p);
    digits.push(Number(digit));
    remaining = (remaining - digit) / p; // exact division: remaining − digit is a multiple of p
  }
  return digits;
}

/**
 * The integer a_0 + a_1 p + ... + a_{n−1} p^{n−1} described by the first n
 * digits. It always lies in [0, p^n) and is the p-adic number's residue
 * modulo p^n.
 */
export function digitsToInteger(digits: Digits, prime: number): bigint {
  let total = 0n;
  digits.forEach((digit, position) => {
    total += BigInt(digit) * primePower(prime, position);
  });
  return total;
}

/**
 * The index of the highest non-zero digit, or −1 if every digit is zero.
 * For a non-negative integer, every digit past this index is zero.
 */
export function highestNonzeroPosition(digits: Digits): number {
  for (let position = digits.length - 1; position >= 0; position--) {
    if (digits[position] !== 0) return position;
  }
  return -1;
}

/** Checks that every digit is an integer in the range [0, p). */
export function areValidDigits(digits: Digits, prime: number): boolean {
  return digits.every((digit) => Number.isInteger(digit) && digit >= 0 && digit < prime);
}
