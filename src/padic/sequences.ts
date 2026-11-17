/**
 * The SEQUENCE representation of a p-adic integer:
 *
 *     (x_1, x_2, x_3, ...)    with x_n in Z/p^nZ   and   x_{n+1} ≡ x_n (mod p^n)
 *
 * We always use the canonical representative 0 ≤ x_n < p^n, so a sequence is
 * "coherent": each term is the previous term plus a multiple of p^n.
 *
 * Array convention: a sequence of length N is stored as `terms`, where
 *
 *     terms[n − 1] = x_n      for n = 1, ..., N.
 *
 * So `terms[0]` is x_1 (the number mod p), `terms[1]` is x_2 (mod p^2), etc.
 */

import { Digits } from "./digits";
import { mod, primePower } from "./modular";

/** The terms x_1, ..., x_N of a coherent sequence (see the array convention above). */
export type CoherentSequence = bigint[];

/**
 * Series → sequence. Each term is a partial sum of the series:
 *
 *     x_n = a_0 + a_1 p + ... + a_{n−1} p^{n−1}
 *
 * Each partial sum is the previous one plus a_{n−1} p^{n−1}.
 */
export function digitsToSequence(digits: Digits, prime: number): CoherentSequence {
  const terms: CoherentSequence = [];
  let partialSum = 0n;
  digits.forEach((digit, position) => {
    partialSum += BigInt(digit) * primePower(prime, position);
    terms.push(partialSum);
  });
  return terms;
}

/**
 * Sequence → series. Consecutive terms differ by exactly one digit's worth:
 *
 *     a_0 = x_1
 *     a_n = (x_{n+1} − x_n) / p^n
 *
 * The input must be coherent (see `findCoherenceProblem`).
 */
export function sequenceToDigits(terms: CoherentSequence, prime: number): Digits {
  return terms.map((term, index) => {
    const previousTerm = index === 0 ? 0n : terms[index - 1];
    return Number((term - previousTerm) / primePower(prime, index));
  });
}

/** Describes the first place where a proposed sequence fails to be coherent. */
export interface CoherenceProblem {
  /** The n for which x_n is at fault. */
  n: number;
  reason: "out-of-range" | "incompatible";
}

/**
 * Checks the two rules a canonical coherent sequence must obey:
 *   1. 0 ≤ x_n < p^n                           (x_n is a residue mod p^n)
 *   2. x_n ≡ x_{n−1} (mod p^{n−1}) for n ≥ 2   (each term extends the last)
 * Returns the first violation, or `null` if the sequence is coherent.
 */
export function findCoherenceProblem(terms: CoherentSequence, prime: number): CoherenceProblem | null {
  for (let index = 0; index < terms.length; index++) {
    const n = index + 1;
    const term = terms[index];
    if (term < 0n || term >= primePower(prime, n)) {
      return { n, reason: "out-of-range" };
    }
    if (n >= 2 && mod(term, primePower(prime, n - 1)) !== terms[index - 1]) {
      return { n, reason: "incompatible" };
    }
  }
  return null;
}

/**
 * Applies a ring operation term by term: z_n = (x_n ∘ y_n) mod p^n.
 *
 * This is where the ring structure is easiest to see. Each Z/p^nZ is already
 * a ring, and reducing mod p^{n−1} respects + and ×, so the result is
 * automatically coherent.
 */
function combineTermwise(
  x: CoherentSequence,
  y: CoherentSequence,
  prime: number,
  operation: (a: bigint, b: bigint) => bigint,
): CoherentSequence {
  return x.map((xTerm, index) => mod(operation(xTerm, y[index]), primePower(prime, index + 1)));
}

export function addSequences(x: CoherentSequence, y: CoherentSequence, prime: number): CoherentSequence {
  return combineTermwise(x, y, prime, (a, b) => a + b);
}

export function multiplySequences(x: CoherentSequence, y: CoherentSequence, prime: number): CoherentSequence {
  return combineTermwise(x, y, prime, (a, b) => a * b);
}
