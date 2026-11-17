/**
 * The p-adic "mathematical engine". Each module covers one idea:
 *
 *   modular.ts     BigInt helpers: mod, powers of p, inverses mod p
 *   digits.ts      the series representation: integers → digits a_0, a_1, a_2, ...
 *   sequences.ts   the sequence representation: (x_1, x_2, ...) and conversions
 *   arithmetic.ts  addition (with carries) and multiplication of digits
 *   inverse.ts     right-to-left long division; units
 *   rational.ts    fractions → eventually periodic expansions
 *   valuation.ts   v_p, the strong triangle inequality, |x|_p
 */
export * from "./modular";
export * from "./digits";
export * from "./sequences";
export * from "./arithmetic";
export * from "./inverse";
export * from "./rational";
export * from "./valuation";
