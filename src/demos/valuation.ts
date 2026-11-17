/**
 * Demo: the p-adic valuation and the strong triangle inequality
 *
 *     v(x + y) ≥ min(v(x), v(y)),     with equality when v(x) ≠ v(y).
 *
 * For p-adic integers, the valuation is the number of zeros at the right-hand
 * end of the digits, and the digit tables show why the inequality holds: a
 * column of zeros plus a column of zeros is a column of zeros.
 */

import {
  absoluteValue,
  addRationals,
  formatRational,
  isPAdicInteger,
  Rational,
  rationalToDigits,
  rationalValuation,
} from "../padic";
import { button, el, htmlEl, textInput } from "../ui/dom";
import { digitTable } from "../ui/digitStrip";
import { tex } from "../ui/math";
import { addPrimePicker, Settings } from "../ui/settings";
import { message, parseNumberInput, rationalTex } from "./common";

function valuationTex(valuation: number): string {
  return valuation === Infinity ? "\\infty" : String(valuation);
}

/** Example pairs that show the interesting cases for the current prime. */
function examplePairs(prime: number): Array<{ label: string; x: string; y: string }> {
  const pairs = [
    { label: "Different valuations", x: `${prime}`, y: `${prime * prime + 1}` },
    { label: "Equal valuations, no cancellation", x: `${prime}`, y: `${2 * prime}` },
    { label: "Equal valuations, cancellation", x: `${prime}`, y: `${(prime - 1) * prime}` },
    { label: "With fractions", x: `1/${prime}`, y: `${prime - 1}/${prime}` },
  ];
  // For p = 2 the last digits of two numbers with equal valuation are both 1,
  // so they always cancel: the "no cancellation" case cannot happen.
  return prime === 2 ? pairs.filter((pair) => !pair.label.includes("no cancellation")) : pairs;
}

export function mountValuation(container: HTMLElement): void {
  let settings: Settings;
  let xText = "";
  let yText = "";

  const xInput = textInput("", (v) => ((xText = v), render()), "x");
  const yInput = textInput("", (v) => ((yText = v), render()), "y");
  const presets = el("div", { class: "controls presets" });
  const output = el("div");

  function loadExample(x: string, y: string): void {
    xText = xInput.value = x;
    yText = yInput.value = y;
    render();
  }

  function renderPresets(): void {
    presets.replaceChildren(
      el("span", { class: "small" }, "Examples: "),
      ...examplePairs(settings.prime).map((pair) => button(pair.label, () => loadExample(pair.x, pair.y))),
    );
  }

  function render(): void {
    const { prime, precision } = settings;
    output.replaceChildren();
    const xParsed = parseNumberInput(xText);
    const yParsed = parseNumberInput(yText);
    if (!xParsed.ok || !yParsed.ok) {
      output.append(message(!xParsed.ok ? xParsed.error : !yParsed.ok ? yParsed.error : "", "error"));
      return;
    }
    const x = xParsed.value;
    const y = yParsed.value;
    const sum = addRationals(x, y);
    const vx = rationalValuation(x, prime);
    const vy = rationalValuation(y, prime);
    const vSum = rationalValuation(sum, prime);
    const smaller = Math.min(vx, vy);

    const row = (name: string, value: Rational, valuation: number) =>
      el(
        "tr",
        {},
        htmlEl("td", {}, tex(name)),
        htmlEl("td", {}, tex(rationalTex(value))),
        htmlEl("td", {}, tex(valuationTex(valuation))),
        htmlEl("td", {}, tex(rationalTex(absoluteValue(value, prime)))),
      );

    output.append(
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
              el("th", {}, ""),
              el("th", {}, "value"),
              htmlEl("th", {}, tex(`v_{${prime}}`)),
              htmlEl("th", {}, tex(`|\\cdot|_{${prime}} = ${prime}^{-v}`)),
            ),
          ),
          el("tbody", {}, row("x", x, vx), row("y", y, vy), row("x + y", sum, vSum)),
        ),
      ),
    );

    const relation = vSum === smaller ? "=" : "\\geq";
    const verdict =
      vx !== vy
        ? `The valuations differ, so the inequality is an equality: the sum is exactly as divisible by ${prime} as the less divisible term.`
        : vSum > smaller
          ? `The valuations are equal and the lowest non-zero digits cancelled, so the sum is <em>more</em> divisible by ${prime} than either term.`
          : `The valuations are equal and nothing cancelled, so the sum has the same valuation.`;
    output.append(
      htmlEl("p", { class: "formula" }, tex(`v(x+y) = ${valuationTex(vSum)} ${relation} \\min(${valuationTex(vx)}, ${valuationTex(vy)}) = ${valuationTex(smaller)}`, true)),
      htmlEl("p", {}, verdict),
    );

    const allIntegral = [x, y, sum].every((value) => isPAdicInteger(value, prime));
    if (allIntegral) {
      const zerosUpTo = (valuation: number) => (position: number) => (position < valuation ? "match" : undefined);
      output.append(
        htmlEl("p", { class: "small" }, `The valuation counts the zeros at the right-hand end of the digits:`),
        digitTable([
          { label: htmlEl("span", {}, tex("x")), digits: rationalToDigits(x, prime, precision), classFor: zerosUpTo(vx) },
          { label: htmlEl("span", {}, tex("y")), digits: rationalToDigits(y, prime, precision), classFor: zerosUpTo(vy) },
          {
            label: htmlEl("span", {}, tex("x + y")),
            digits: rationalToDigits(sum, prime, precision),
            classFor: zerosUpTo(vSum),
            rowClass: "result-row",
          },
        ]),
      );
    } else {
      const named: Array<[string, Rational]> = [
        ["x", x],
        ["y", y],
        ["x + y", sum],
      ];
      const outside = named
        .filter(([, value]) => !isPAdicInteger(value, prime))
        .map(([name, value]) => `${name} = ${formatRational(value)}`);
      output.append(
        message(
          `${outside.join(", ")} ha${outside.length === 1 ? "s" : "ve"} negative valuation, so ${outside.length === 1 ? "it is" : "they are"} not in ℤ_${prime}, and no digit table is shown.`,
        ),
      );
    }
  }

  container.append(
    presets,
    el("div", { class: "controls" }, el("label", {}, "x = "), xInput, el("label", {}, "y = "), yInput),
    output,
  );

  addPrimePicker(container, (next) => {
    settings = next;
    renderPresets();
    const [first] = examplePairs(settings.prime);
    loadExample(first.x, first.y);
  });
}
