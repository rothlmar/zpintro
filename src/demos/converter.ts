/**
 * Demo: converting between the series representation (digits) and the
 * sequence representation (x_1, x_2, x_3, …).
 *
 * Left to right: type a number (integer or fraction) and see its digits and
 * its sequence. Clicking a digit raises it by one, and the number field
 * updates to show exactly which number the new digits represent.
 * Right to left: type a sequence and see whether it is coherent, and if so,
 * which digits it describes.
 */

import {
  digitsToInteger,
  digitsToSequence,
  findCoherenceProblem,
  formatRational,
  incrementDigitOfRational,
  integerToDigits,
  mod,
  primePower,
  Rational,
  rationalToDigits,
  sequenceToDigits,
} from "../padic";
import { el, htmlEl, textInput } from "../ui/dom";
import { digitTable } from "../ui/digitStrip";
import { tex } from "../ui/math";
import { addPrimePicker, Settings } from "../ui/settings";
import { message, parsePAdicIntegerInput, seriesTex } from "./common";

const SEQUENCE_PREFILL_LENGTH = 5;

/** Writes x in base p as a digit string, e.g. 38 → "123". */
function baseP(value: bigint, prime: number, length: number): string {
  return integerToDigits(value, prime, length).reverse().join(prime > 10 ? " " : "");
}

export function mountConverter(container: HTMLElement): void {
  let settings: Settings;
  let value: Rational | null = null; // the number whose digits are shown
  let digits: number[] = [];

  const numberInput = textInput("38", readNumberInput, "Number");
  const numberError = el("div");
  const digitsView = el("div");
  const seriesView = el("div", { class: "formula" });
  const sequenceView = el("div", { class: "table-scroll" });

  const sequenceInput = el("textarea", { rows: "2", "aria-label": "Sequence terms", spellcheck: "false" });
  const reverseView = el("div");

  /** Shows the digits and sequence of `newValue` (or zeros if there is none). */
  function showValue(newValue: Rational | null): void {
    value = newValue;
    digits = value
      ? rationalToDigits(value, settings.prime, settings.precision)
      : integerToDigits(0n, settings.prime, settings.precision);
    prefillSequenceInput();
    renderForward();
  }

  /** Called on every keystroke in the number field. */
  function readNumberInput(text: string): void {
    const parsed = parsePAdicIntegerInput(text, settings.prime);
    numberError.replaceChildren();
    if (!parsed.ok) {
      // Keep showing the last valid number while the reader is typing.
      if (text.trim() !== "" && text.trim() !== "-") numberError.append(message(parsed.error, "error"));
      return;
    }
    showValue(parsed.value);
  }

  /** Raises one digit, and writes the number the new digits represent into the field. */
  function incrementDigit(position: number): void {
    if (!value) return;
    const newValue = incrementDigitOfRational(value, position, settings.prime);
    numberInput.value = formatRational(newValue);
    numberError.replaceChildren();
    showValue(newValue);
  }

  function prefillSequenceInput(): void {
    const terms = digitsToSequence(digits, settings.prime).slice(0, SEQUENCE_PREFILL_LENGTH);
    sequenceInput.value = terms.join(", ");
    renderReverse();
  }

  function renderForward(): void {
    const { prime } = settings;
    digitsView.replaceChildren(
      digitTable([{ label: htmlEl("span", {}, tex("a_i")), digits, onDigitClick: incrementDigit }]),
    );
    seriesView.innerHTML = tex(`x = ${seriesTex(digits, prime, false)}`, true);

    const terms = digitsToSequence(digits, prime);
    const rows = terms.map((term, index) => {
      const n = index + 1;
      const previous = index === 0 ? 0n : terms[index - 1];
      const step = term - previous;
      return el(
        "tr",
        {},
        el("td", {}, String(n)),
        el("td", { class: "mono" }, term.toString()),
        el("td", { class: "mono" }, baseP(term, prime, n)),
        htmlEl("td", {}, tex(`${digits[index]}\\cdot ${prime}^{${index}} = ${step}`)),
      );
    });
    sequenceView.replaceChildren(
      el(
        "table",
        { class: "data-table" },
        el(
          "thead",
          {},
          el(
            "tr",
            {},
            htmlEl("th", {}, tex("n")),
            htmlEl("th", {}, `${tex("x_n")} (in ${tex(`[0, ${prime}^n)`)})`),
            htmlEl("th", {}, `${tex("x_n")} in base ${prime}`),
            htmlEl("th", {}, tex("x_n - x_{n-1} = a_{n-1}p^{n-1}")),
          ),
        ),
        el("tbody", {}, ...rows),
      ),
    );
  }

  function renderReverse(): void {
    const { prime } = settings;
    reverseView.replaceChildren();
    const pieces = sequenceInput.value.split(/[\s,]+/).filter(Boolean);
    if (pieces.length === 0) return;
    if (!pieces.every((piece) => /^-?\d+$/.test(piece))) {
      reverseView.append(message("Enter whole numbers separated by commas.", "error"));
      return;
    }
    const terms = pieces.map((piece) => BigInt(piece));
    const problem = findCoherenceProblem(terms, prime);
    if (problem) {
      const n = problem.n;
      const term = terms[n - 1];
      const previousModulus = primePower(prime, n - 1);
      const text =
        problem.reason === "out-of-range"
          ? `x_${n} = ${term} is not in the range 0 ≤ x_${n} < ${prime}^${n} = ${primePower(prime, n)}.`
          : `x_${n} = ${term} reduces to ${mod(term, previousModulus)} modulo ${prime}^${n - 1} = ${previousModulus}, ` +
            `not to x_${n - 1} = ${terms[n - 2]}, so it does not extend the previous term.`;
      reverseView.append(message(text, "error"));
      return;
    }
    const recovered = sequenceToDigits(terms, prime);
    reverseView.append(
      message(`Coherent ✓  These ${terms.length} terms determine the first ${terms.length} digits:`, "success"),
      digitTable([{ label: htmlEl("span", {}, tex("a_i")), digits: recovered }]),
      htmlEl(
        "p",
        { class: "small" },
        `Each digit is ${tex("a_{n-1} = (x_n - x_{n-1}) / p^{n-1}")}. ` +
          `Check: ${tex(`x_${terms.length} = ${digitsToInteger(recovered, prime)}`)}.`,
      ),
    );
  }

  sequenceInput.addEventListener("input", renderReverse);

  container.append(
    el("div", { class: "controls" }, el("label", {}, "Number: "), numberInput),
    htmlEl(
      "p",
      { class: "hint" },
      `Try negative numbers such as ${tex("-1")} or ${tex("-38")}, and fractions such as ${tex("-1/4")} or ${tex("2/7")} ` +
        `(the denominator must not be divisible by ${tex("p")}).`,
    ),
    numberError,
    htmlEl(
      "p",
      { class: "hint" },
      "Click a digit to increase it by one (p − 1 wraps around to 0). The number above changes to match.",
    ),
    digitsView,
    seriesView,
    el("h4", {}, "The same number as a sequence"),
    sequenceView,
    el("h4", {}, "Now go the other way"),
    htmlEl(
      "p",
      { class: "hint" },
      `Type the first few terms ${tex("x_1, x_2, x_3, \\ldots")} of a sequence. Try changing one of them to break coherence.`,
    ),
    sequenceInput,
    reverseView,
  );

  addPrimePicker(container, (next) => {
    settings = next;
    // Re-read the field: the same number has different digits for a new
    // prime, and may not be a p-adic integer at all for this one.
    showValue(null);
    readNumberInput(numberInput.value);
  });
}
