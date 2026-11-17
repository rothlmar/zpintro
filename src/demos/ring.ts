/**
 * Demo: Z_p is closed under addition and multiplication.
 *
 * The same sum and product are computed two ways:
 *   - with digits, using carries (the series representation), and
 *   - term by term modulo p^n (the sequence representation),
 * and both are compared with the expansion of the exact fraction.
 */

import {
  addDigitsWithColumns,
  addRationals,
  addSequences,
  digitsToSequence,
  multiplyDigits,
  multiplyRationals,
  multiplySequences,
  rationalToDigits,
  sequenceToDigits,
} from "../padic";
import { el, htmlEl, textInput } from "../ui/dom";
import { digitTable } from "../ui/digitStrip";
import { tex } from "../ui/math";
import { addPrimePicker, Settings } from "../ui/settings";
import { message, parsePAdicIntegerInput, rationalTex } from "./common";

const SEQUENCE_ROWS_SHOWN = 6;

function sameDigits(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((digit, index) => digit === b[index]);
}

export function mountRing(container: HTMLElement): void {
  let settings: Settings;
  let xText = "2/3";
  let yText = "-7";

  const output = el("div");

  function render(): void {
    const { prime, precision } = settings;
    output.replaceChildren();

    const xParsed = parsePAdicIntegerInput(xText, prime);
    const yParsed = parsePAdicIntegerInput(yText, prime);
    if (!xParsed.ok || !yParsed.ok) {
      const error = !xParsed.ok ? xParsed.error : !yParsed.ok ? yParsed.error : "";
      output.append(message(error, "error"));
      return;
    }
    const x = xParsed.value;
    const y = yParsed.value;

    const xDigits = rationalToDigits(x, prime, precision);
    const yDigits = rationalToDigits(y, prime, precision);
    const { sum, columns } = addDigitsWithColumns(xDigits, yDigits, prime);
    const product = multiplyDigits(xDigits, yDigits, prime);
    // The carry into column i is the carry out of column i − 1.
    const carries = columns.map((column) => column.carryIn);

    const exactSum = addRationals(x, y);
    const exactProduct = multiplyRationals(x, y);

    output.append(
      el("h4", {}, "With digits"),
      digitTable([
        { label: "carries", digits: carries, rowClass: "carry-row", classFor: (i) => (carries[i] ? "carry" : "faint") },
        { label: htmlEl("span", {}, tex(`x = ${rationalTex(x)}`)), digits: xDigits },
        { label: htmlEl("span", {}, tex(`y = ${rationalTex(y)}`)), digits: yDigits },
        { label: htmlEl("span", {}, tex("x + y")), digits: sum, rowClass: "result-row" },
        { label: htmlEl("span", {}, tex("x \\cdot y")), digits: product, rowClass: "result-row" },
      ]),
    );

    // Check against the exact fraction's own expansion.
    const sumMatches = sameDigits(sum, rationalToDigits(exactSum, prime, precision));
    const productMatches = sameDigits(product, rationalToDigits(exactProduct, prime, precision));
    output.append(
      htmlEl(
        "p",
        { class: "small" },
        `As fractions, ${tex(`x + y = ${rationalTex(exactSum)}`)} and ${tex(`x\\cdot y = ${rationalTex(exactProduct)}`)}. ` +
          `Expanding those directly gives ${sumMatches && productMatches ? "<strong>the same digits</strong> ✓" : "different digits ✗"}.`,
      ),
    );

    // The sequence representation: every operation is just arithmetic in Z/p^nZ.
    const xs = digitsToSequence(xDigits, prime);
    const ys = digitsToSequence(yDigits, prime);
    const sumTerms = addSequences(xs, ys, prime);
    const productTerms = multiplySequences(xs, ys, prime);
    const rows = xs.slice(0, SEQUENCE_ROWS_SHOWN).map((_, index) =>
      el(
        "tr",
        {},
        el("td", {}, String(index + 1)),
        el("td", { class: "mono" }, xs[index].toString()),
        el("td", { class: "mono" }, ys[index].toString()),
        el("td", { class: "mono" }, sumTerms[index].toString()),
        el("td", { class: "mono" }, productTerms[index].toString()),
      ),
    );
    const termwiseAgrees =
      sameDigits(sequenceToDigits(sumTerms, prime), sum) && sameDigits(sequenceToDigits(productTerms, prime), product);

    output.append(
      el("h4", {}, "With sequences"),
      el(
        "div",
        { class: "table-scroll" },
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
              htmlEl("th", {}, tex("x_n")),
              htmlEl("th", {}, tex("y_n")),
              htmlEl("th", {}, tex("(x_n + y_n) \\bmod p^n")),
              htmlEl("th", {}, tex("(x_n y_n) \\bmod p^n")),
            ),
          ),
          el("tbody", {}, ...rows),
        ),
      ),
      message(
        termwiseAgrees
          ? "Converting the last two columns back to digits gives exactly the rows x + y and x·y above ✓"
          : "The termwise results disagree with the digit computation ✗",
        termwiseAgrees ? "success" : "error",
      ),
    );
  }

  container.append(
    el(
      "div",
      { class: "controls" },
      el("label", {}, "x = "),
      textInput(xText, (value) => ((xText = value), render()), "x"),
      el("label", {}, "y = "),
      textInput(yText, (value) => ((yText = value), render()), "y"),
    ),
    output,
  );

  addPrimePicker(container, (next) => {
    settings = next;
    render();
  });
}
