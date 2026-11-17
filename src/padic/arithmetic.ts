/**
 * Addition and multiplication in the SERIES representation.
 *
 * These are the grade-school algorithms for base p, with one difference:
 * there is no "leftmost" digit, so a carry can keep moving left forever.
 * Each output digit depends only on the input digits at the same position
 * or lower, so knowing n digits of the inputs is enough to know n digits of
 * the result.
 */

import { Digits } from "./digits";

/** One column of a digit-by-digit addition, for step-by-step display. */
export interface AdditionColumn {
  position: number;
  carryIn: number;
  columnSum: number; // a_i + b_i + carryIn
  digit: number; // columnSum mod p
  carryOut: number; // floor(columnSum / p), always 0 or 1
}

/** Adds two p-adic integers digit by digit, recording every column. */
export function addDigitsWithColumns(
  a: Digits,
  b: Digits,
  prime: number,
): { sum: Digits; columns: AdditionColumn[] } {
  const columns: AdditionColumn[] = [];
  let carry = 0;
  for (let position = 0; position < a.length; position++) {
    const columnSum = a[position] + b[position] + carry;
    const digit = columnSum % prime;
    const carryOut = Math.floor(columnSum / prime);
    columns.push({ position, carryIn: carry, columnSum, digit, carryOut });
    carry = carryOut;
  }
  return { sum: columns.map((column) => column.digit), columns };
}

export function addDigits(a: Digits, b: Digits, prime: number): Digits {
  return addDigitsWithColumns(a, b, prime).sum;
}

/**
 * Multiplies two p-adic integers using long multiplication.
 *
 * Digit k of the product comes from every pair of digits whose positions
 * add up to k, plus whatever was carried from the column to its right:
 *
 *     column_k = (sum over i + j = k of a_i · b_j) + carry
 *     digit_k  = column_k mod p,     carry ← floor(column_k / p)
 */
export function multiplyDigits(a: Digits, b: Digits, prime: number): Digits {
  const product: Digits = [];
  let carry = 0;
  for (let k = 0; k < a.length; k++) {
    let column = carry;
    for (let i = 0; i <= k; i++) {
      column += a[i] * b[k - i];
    }
    product.push(column % prime);
    carry = Math.floor(column / prime);
  }
  return product;
}
