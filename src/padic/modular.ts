/**
 * Small helpers for modular arithmetic with BigInt.
 *
 * Powers of p grow quickly (5^30 already exceeds 2^53), so every quantity
 * that can be as large as p^n is a `bigint`. Individual digits, which are
 * always smaller than p, stay as ordinary `number`s.
 */

/**
 * The remainder of `value` modulo `modulus`, always in the range [0, modulus).
 *
 * JavaScript's `%` operator keeps the sign of the dividend (-1n % 5n === -1n),
 * but in modular arithmetic we always want the representative in [0, m).
 */
export function mod(value: bigint, modulus: bigint): bigint {
  const remainder = value % modulus;
  return remainder < 0n ? remainder + modulus : remainder;
}

/** p^exponent as a BigInt. */
export function primePower(prime: number, exponent: number): bigint {
  return BigInt(prime) ** BigInt(exponent);
}

/** Greatest common divisor of two integers (always non-negative). */
export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x;
}

/**
 * The inverse of `residue` modulo a prime: the number b in [1, p) with
 * residue * b ≡ 1 (mod p), or `null` if residue ≡ 0 (mod p).
 *
 * Because our primes are small, we simply try every candidate. This is the
 * whole reason a prime modulus matters: modulo a prime, every non-zero
 * residue has exactly one inverse.
 */
export function inverseModPrime(residue: bigint, prime: number): number | null {
  const p = BigInt(prime);
  const reduced = mod(residue, p);
  for (let candidate = 1n; candidate < p; candidate++) {
    if (mod(reduced * candidate, p) === 1n) {
      return Number(candidate);
    }
  }
  return null;
}

/** True when `value` is one of the primes this site supports. */
export function isPrime(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor++) {
    if (value % divisor === 0) return false;
  }
  return true;
}
