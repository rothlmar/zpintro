/**
 * Demo (the "aha"): dividing in Z_p, one digit at a time.
 *
 * The reader builds q = a / b themselves. At each position k they pick the
 * digit q_k that makes b · q agree with a in one more digit. There is always
 * exactly one such digit when b's last digit is non-zero, and none (for most
 * targets) when it is zero. That is the whole theorem about units.
 */

import {
  countAgreeingLowDigits,
  digitsToInteger,
  divideDigitsWithSteps,
  expandRational,
  formatRational,
  inverseModPrime,
  isUnit,
  makeRational,
  multiplyDigits,
  mod,
  primePower,
  Rational,
  rationalToDigits,
  integerToDigits,
} from "../padic";
import { button, el, htmlEl, textInput } from "../ui/dom";
import { digitTable, DisplayDigit } from "../ui/digitStrip";
import { tex } from "../ui/math";
import { addPrimePicker, Settings } from "../ui/settings";
import { message, messageHtml, parsePAdicIntegerInput, rationalTex } from "./common";

export function mountDivision(container: HTMLElement): void {
  let settings: Settings;
  let numeratorText = "1";
  let denominatorText = "3";

  // Progress of the reader's division.
  let quotientDigits: number[] = []; // q_0 … q_{k−1}, the digits found so far
  let rejectedGuesses = new Set<number>(); // wrong guesses for the current digit q_k
  let lastGuessFeedback: HTMLElement | null = null;
  const explanations = new Map<number, string>(); // position → explanation, for digits filled by "Explain"

  const output = el("div");

  function resetProgress(): void {
    quotientDigits = [];
    rejectedGuesses = new Set();
    lastGuessFeedback = null;
    explanations.clear();
  }

  /** b · q, where the unknown digits of q are treated as 0. */
  function productWithQuotient(quotient: number[], denominator: number[]): number[] {
    const padded = [...quotient, ...Array(settings.precision - quotient.length).fill(0)];
    return multiplyDigits(padded, denominator, settings.prime);
  }

  function guess(digit: number, numerator: number[], denominator: number[]): void {
    const position = quotientDigits.length;
    const candidate = [...quotientDigits, digit];
    const product = productWithQuotient(candidate, denominator);
    const agreeing = countAgreeingLowDigits(product, numerator);
    if (agreeing > position) {
      quotientDigits = candidate;
      rejectedGuesses = new Set();
      lastGuessFeedback = messageHtml(`${tex(`q_{${position}} = ${digit}`)} works ✓`, "success");
    } else {
      rejectedGuesses.add(digit);
      const productEnd = product.slice(0, position + 1).reverse().join(" ");
      const targetEnd = numerator.slice(0, position + 1).reverse().join(" ");
      lastGuessFeedback = messageHtml(
        `With ${tex(`q_{${position}} = ${digit}`)}, ${tex("b\\cdot q")} ends in …${productEnd}, but ${tex("a")} ends in …${targetEnd}. Try another digit.`,
        "error",
      );
    }
    render();
  }

  function explainNextDigit(numerator: number[], denominator: number[]): void {
    const { prime } = settings;
    const position = quotientDigits.length;
    const step = divideDigitsWithSteps(numerator, denominator, prime).steps[position];
    const b0 = denominator[0];
    const b0Inverse = inverseModPrime(BigInt(b0), prime)!;
    explanations.set(
      position,
      `The remainder ${tex("a - b\\cdot q")} so far ends in ${position} zero${position === 1 ? "" : "s"}; its digit at position ${position} is ` +
        `${tex(`r_{${position}} = ${step.remainderDigit}`)}. We need ${tex(`b_0\\, q_{${position}} \\equiv r_{${position}} \\pmod{${prime}}`)}, and since ` +
        `${tex(`b_0^{-1} = ${b0}^{-1} \\equiv ${b0Inverse} \\pmod{${prime}}`)}, ` +
        `${tex(`q_{${position}} \\equiv ${step.remainderDigit}\\cdot ${b0Inverse} \\equiv ${step.quotientDigit} \\pmod{${prime}}`)}.`,
    );
    quotientDigits = [...quotientDigits, step.quotientDigit];
    rejectedGuesses = new Set();
    lastGuessFeedback = null;
    render();
  }

  function fillRemaining(numerator: number[], denominator: number[]): void {
    quotientDigits = divideDigitsWithSteps(numerator, denominator, settings.prime).quotient;
    lastGuessFeedback = null;
    render();
  }

  /** Shown when b is divisible by p: no digit can ever work. */
  function renderNonUnit(b: Rational): void {
    const { prime } = settings;
    output.append(
      message(`b = ${formatRational(b)} is divisible by ${prime}: its last digit is 0.`, "error"),
      htmlEl(
        "p",
        {},
        `Whatever ${tex("q")} is, the last digit of ${tex("b\\cdot q")} is ${tex(`b_0 q_0 \\bmod ${prime} = 0`)}. ` +
          `So ${tex("b \\cdot q")} can never equal anything ending in a non-zero digit, such as ${tex("1")}. ` +
          `In particular ${tex("b")} has no inverse: it is not a unit.`,
      ),
    );
  }

  function renderCompletion(a: Rational, b: Rational): void {
    const { prime } = settings;
    const quotient = makeRational(a.numerator * b.denominator, a.denominator * b.numerator);
    const { preperiod, period } = expandRational(quotient, prime);
    const periodText = [...period].reverse().join(prime > 10 ? " " : "");
    const preperiodText = [...preperiod].reverse().join(prime > 10 ? " " : "");
    output.append(
      message("Done: b · q agrees with a in every displayed digit ✓", "success"),
      htmlEl(
        "p",
        {},
        `So ${tex(`q = ${rationalTex(quotient)}`)} in ${tex(`\\mathbb{Z}_{${prime}}`)}. Its digits are eventually periodic: ` +
          `${tex(`\\ldots\\,\\overline{${periodText}}\\,${preperiodText ? `${preperiodText}` : ""}_{(${prime})}`)}` +
          ` — the block ${tex(periodText)} repeats forever` +
          (preperiod.length ? `, after the initial digit${preperiod.length > 1 ? "s" : ""} ${tex(preperiodText)}.` : "."),
      ),
    );
  }

  function render(): void {
    const { prime, precision } = settings;
    output.replaceChildren();

    const aParsed = parsePAdicIntegerInput(numeratorText, prime);
    const bParsed = parsePAdicIntegerInput(denominatorText, prime);
    if (!aParsed.ok || !bParsed.ok) {
      output.append(message(!aParsed.ok ? aParsed.error : !bParsed.ok ? bParsed.error : "", "error"));
      return;
    }
    const a = aParsed.value;
    const b = bParsed.value;
    const numerator = rationalToDigits(a, prime, precision);
    const denominator = rationalToDigits(b, prime, precision);

    if (!isUnit(denominator)) {
      output.append(digitTable([{ label: htmlEl("span", {}, tex(`b = ${rationalTex(b)}`)), digits: denominator, classFor: (i) => (i === 0 ? "wrong" : undefined) }]));
      renderNonUnit(b);
      return;
    }

    const position = quotientDigits.length;
    const finished = position >= precision;
    const product = productWithQuotient(quotientDigits, denominator);
    const remainder = integerToDigits(
      mod(digitsToInteger(numerator, prime) - digitsToInteger(product, prime), primePower(prime, precision)),
      prime,
      precision,
    );
    const quotientDisplay: DisplayDigit[] = Array.from({ length: precision }, (_, i) => (i < position ? quotientDigits[i] : null));

    output.append(
      digitTable([
        { label: htmlEl("span", {}, tex(`a = ${rationalTex(a)}`)), digits: numerator },
        { label: htmlEl("span", {}, tex(`b = ${rationalTex(b)}`)), digits: denominator, classFor: (i) => (i === 0 ? "highlight" : undefined) },
        {
          label: htmlEl("span", {}, tex("q")),
          digits: quotientDisplay,
          rowClass: "result-row",
          classFor: (i) => (i === position ? "current" : undefined),
        },
        {
          label: htmlEl("span", {}, tex("b \\cdot q")),
          digits: product,
          classFor: (i) => (i < position ? "match" : undefined),
        },
        {
          label: htmlEl("span", {}, tex("a - b\\cdot q")),
          digits: remainder,
          classFor: (i) => (i < position ? "match" : i === position ? "current" : "faint"),
        },
      ]),
    );

    if (finished) {
      renderCompletion(a, b);
      return;
    }

    const choices = Array.from({ length: prime }, (_, digit) => {
      const choice = button(String(digit), () => guess(digit, numerator, denominator), "digit-choice");
      if (rejectedGuesses.has(digit)) {
        choice.disabled = true;
        choice.classList.add("rejected");
      }
      return choice;
    });

    output.append(
      htmlEl(
        "p",
        { class: "prompt" },
        `Choose ${tex(`q_{${position}}`)}: which digit makes ${tex("b\\cdot q")} agree with ${tex("a")} in the last ${position + 1} digit${position === 0 ? "" : "s"}?`,
      ),
      el("div", { class: "digit-choices" }, ...choices),
      lastGuessFeedback ?? "",
      el(
        "div",
        { class: "controls" },
        button("Explain this digit", () => explainNextDigit(numerator, denominator)),
        button("Fill in the rest", () => fillRemaining(numerator, denominator)),
        button("Start over", () => (resetProgress(), render())),
      ),
    );

    if (explanations.size > 0) {
      const latest = Math.max(...explanations.keys());
      output.append(htmlEl("p", { class: "explanation" }, explanations.get(latest)!));
    }
  }

  container.append(
    el(
      "div",
      { class: "controls" },
      el("label", {}, "a = "),
      textInput(numeratorText, (v) => ((numeratorText = v), resetProgress(), render()), "Numerator a"),
      el("label", {}, "b = "),
      textInput(denominatorText, (v) => ((denominatorText = v), resetProgress(), render()), "Denominator b"),
    ),
    output,
  );

  addPrimePicker(container, (next) => {
    settings = next;
    resetProgress();
    render();
  });
}
