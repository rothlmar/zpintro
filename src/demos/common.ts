/** Helpers shared by several demos. */

import { formatRational, isPAdicInteger, parseRational, Rational } from "../padic";

export type ParseResult = { ok: true; value: Rational } | { ok: false; error: string };

/** Parses user input as a fraction (or integer), without requiring it to be a p-adic integer. */
export function parseNumberInput(text: string): ParseResult {
  const value = parseRational(text);
  if (!value) return { ok: false, error: "Enter an integer like 7 or −12, or a fraction like 2/3." };
  return { ok: true, value };
}

/** Parses user input and also checks that it is a p-adic integer for the given prime. */
export function parsePAdicIntegerInput(text: string, prime: number): ParseResult {
  const parsed = parseNumberInput(text.replace(/−/g, "-"));
  if (!parsed.ok) return parsed;
  if (!isPAdicInteger(parsed.value, prime)) {
    return {
      ok: false,
      error: `${formatRational(parsed.value)} is not a ${prime}-adic integer: its denominator is divisible by ${prime}.`,
    };
  }
  return parsed;
}

/** LaTeX for a fraction, e.g. \frac{2}{3} or -\frac{1}{7}. */
export function rationalTex(x: Rational): string {
  if (x.denominator === 1n) return `${x.numerator}`;
  const sign = x.numerator < 0n ? "-" : "";
  const magnitude = x.numerator < 0n ? -x.numerator : x.numerator;
  return `${sign}\\frac{${magnitude}}{${x.denominator}}`;
}

/**
 * LaTeX for the first few non-zero terms of a series a_0 + a_1 p + a_2 p^2 + …,
 * e.g. "3 + 2\cdot 5 + 1\cdot 5^{2} + \cdots".
 */
export function seriesTex(digits: number[], prime: number, isFinite: boolean): string {
  const terms = digits
    .map((digit, position) => {
      if (digit === 0) return null;
      if (position === 0) return `${digit}`;
      const power = position === 1 ? `${prime}` : `${prime}^{${position}}`;
      return digit === 1 ? power : `${digit}\\cdot ${power}`;
    })
    .filter((term): term is string => term !== null);
  if (terms.length === 0) return isFinite ? "0" : "0 + 0 + \\cdots";
  return terms.join(" + ") + (isFinite ? "" : " + \\cdots");
}

/** A short status message element, styled by kind. */
export function message(text: string, kind: "error" | "success" | "note" = "note"): HTMLElement {
  const element = document.createElement("p");
  element.className = `message ${kind}`;
  element.textContent = text;
  return element;
}

/** Like `message`, but with trusted HTML content (e.g. KaTeX output). */
export function messageHtml(html: string, kind: "error" | "success" | "note" = "note"): HTMLElement {
  const element = document.createElement("p");
  element.className = `message ${kind}`;
  element.innerHTML = html;
  return element;
}
