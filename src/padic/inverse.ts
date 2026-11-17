/**
 * Division of p-adic integers: long division done from the RIGHT.
 *
 * To compute a / b we look for digits q_0, q_1, q_2, ... with b · q = a.
 * We find them one at a time, lowest first:
 *
 *   - Keep a running remainder r = a − b · (quotient so far). Its lowest k
 *     digits are already zero.
 *   - To zero out digit k as well, choose q_k with
 *         b_0 · q_k ≡ r_k   (mod p)
 *     that is, q_k = r_k · b_0^{−1} mod p.
 *   - Subtract q_k · p^k · b from the remainder and continue.
 *
 * The only thing we ever divide by is b_0, the lowest digit of b, and only
 * modulo the prime p. So the division never gets stuck as long as b_0 ≠ 0,
 * however large the numbers get. That is the theorem this module
 * illustrates:
 *
 *     a p-adic integer is a unit (invertible) exactly when its lowest
 *     digit is not 0, i.e. when it is not divisible by p.
 */

import { Digits, digitsToInteger, integerToDigits } from "./digits";
import { inverseModPrime, mod, primePower } from "./modular";

/** A p-adic integer is invertible exactly when its lowest digit is non-zero. */
export function isUnit(digits: Digits): boolean {
  return digits[0] !== 0;
}

/** One step of right-to-left long division, for step-by-step display. */
export interface DivisionStep {
  position: number; // k
  remainderBefore: Digits; // digits 0 .. k−1 are zero
  remainderDigit: number; // r_k, the digit we need to cancel
  quotientDigit: number; // q_k = r_k · b_0^{−1} mod p
  remainderAfter: Digits; // digits 0 .. k are zero
}

/**
 * Computes numerator / denominator to the precision of the inputs, recording
 * every step. Throws if the denominator is not a unit.
 */
export function divideDigitsWithSteps(
  numerator: Digits,
  denominator: Digits,
  prime: number,
): { quotient: Digits; steps: DivisionStep[] } {
  const precision = numerator.length;
  const lowestDenominatorDigit = BigInt(denominator[0]);
  const inverseOfLowestDigit = inverseModPrime(lowestDenominatorDigit, prime);
  if (inverseOfLowestDigit === null) {
    throw new Error("The denominator is divisible by p, so it has no inverse.");
  }

  const modulus = primePower(prime, precision); // we only track the number mod p^precision
  const denominatorValue = digitsToInteger(denominator, prime);
  let remainder = digitsToInteger(numerator, prime);

  const quotient: Digits = [];
  const steps: DivisionStep[] = [];
  for (let position = 0; position < precision; position++) {
    const remainderBefore = integerToDigits(remainder, prime, precision);
    const remainderDigit = remainderBefore[position];
    const quotientDigit = (remainderDigit * inverseOfLowestDigit) % prime;

    remainder = mod(remainder - BigInt(quotientDigit) * primePower(prime, position) * denominatorValue, modulus);

    quotient.push(quotientDigit);
    steps.push({
      position,
      remainderBefore,
      remainderDigit,
      quotientDigit,
      remainderAfter: integerToDigits(remainder, prime, precision),
    });
  }
  return { quotient, steps };
}

export function divideDigits(numerator: Digits, denominator: Digits, prime: number): Digits {
  return divideDigitsWithSteps(numerator, denominator, prime).quotient;
}

/** The multiplicative inverse 1 / b of a unit b. */
export function inverseDigits(unit: Digits, prime: number): Digits {
  const one = integerToDigits(1n, prime, unit.length);
  return divideDigits(one, unit, prime);
}

/**
 * How many of the lowest digits of `a` and `b` agree. Used to check a guessed
 * quotient: if b · q agrees with a in its lowest k digits, then q is correct
 * modulo p^k.
 */
export function countAgreeingLowDigits(a: Digits, b: Digits): number {
  let count = 0;
  while (count < a.length && count < b.length && a[count] === b[count]) {
    count++;
  }
  return count;
}
