/**
 * Demo: the ordinary integers sit inside Z_p.
 *
 *   - A non-negative integer's p-adic digits are its base-p digits followed
 *     by zeros forever: the series is finite.
 *   - A negative integer's digits end in an infinite run of (p − 1)s.
 *   - The reader finds the digits of −n column by column from −n + n = 0, and
 *     sees the carry of 1 move left forever.
 */

import { addDigitsWithColumns, expandRational, integerAsRational, integerToDigits } from "../padic";
import { button, el, htmlEl, textInput } from "../ui/dom";
import { digitTable, DisplayDigit } from "../ui/digitStrip";
import { tex } from "../ui/math";
import { addPrimePicker, Settings } from "../ui/settings";
import { message, messageHtml, seriesTex } from "./common";

function parseInteger(text: string): bigint | null {
  const cleaned = text.trim().replace(/−/g, "-");
  return /^[+-]?\d+$/.test(cleaned) ? BigInt(cleaned) : null;
}

/** Part A: show the digits of any integer and where its tail starts. */
function mountIntegerExplorer(container: HTMLElement): (settings: Settings) => void {
  let settings: Settings;
  let text = "-38";
  const output = el("div");

  function render(): void {
    const { prime, precision } = settings;
    output.replaceChildren();
    const value = parseInteger(text);
    if (value === null) {
      output.append(message("Enter a whole number, positive or negative.", "error"));
      return;
    }
    const digits = integerToDigits(value, prime, precision);
    // For an integer, the expansion is some digits followed by one repeating digit (0 or p − 1).
    const { preperiod, period } = expandRational(integerAsRational(value), prime);
    const tailStart = preperiod.length;
    const tailDigit = period[0];

    output.append(
      digitTable([
        {
          label: htmlEl("span", {}, tex(`${value}`)),
          digits,
          classFor: (position) => (position >= tailStart ? (tailDigit === 0 ? "faint" : "tail") : undefined),
        },
      ]),
    );

    if (value >= 0n) {
      const basePDigits = preperiod.length ? [...preperiod].reverse().join(prime > 10 ? "\\,|\\," : "") : "0";
      output.append(
        htmlEl(
          "p",
          {},
          `${tex(`${value} = ${basePDigits}_{(${prime})} = ${seriesTex(preperiod.length ? preperiod : [0], prime, true)}`)}. ` +
            `Every digit from position ${tailStart} on is 0, so the series is finite: it is the base-${prime} representation.`,
        ),
      );
    } else {
      output.append(
        htmlEl(
          "p",
          {},
          `Every digit from position ${tailStart} on is ${tex(`${prime - 1} = p - 1`)}. ` +
            `A negative integer never has a finite expansion: the tail of ${tex("(p-1)")}s is how ${tex("\\mathbb{Z}_p")} writes a minus sign.`,
        ),
      );
    }
  }

  container.append(
    el("div", { class: "controls" }, el("label", {}, "Integer: "), textInput(text, (v) => ((text = v), render()), "Integer")),
    output,
  );
  return (next) => {
    settings = next;
    render();
  };
}

/**
 * Part B: the reader finds the digits of −n themselves.
 *
 * The sum −n + n must be 0, so every digit of the sum is 0. At each column
 * the reader chooses the digit d of −n that makes d + (digit of n) + carry a
 * multiple of p. Once n's own digits run out, the answer is p − 1 in every
 * column, and the carry of 1 moves left forever.
 */
function mountNegationChallenge(container: HTMLElement): (settings: Settings) => void {
  let settings: Settings;
  let text = "7";
  let columnsDone = 0; // digits 0 … columnsDone − 1 of −n have been found
  let rejectedGuesses = new Set<number>(); // wrong digits tried in the current column
  let feedback: HTMLElement | null = null;
  const output = el("div");

  function resetProgress(): void {
    columnsDone = 0;
    rejectedGuesses = new Set();
    feedback = null;
  }

  function acceptColumn(note: HTMLElement | null): void {
    columnsDone++;
    rejectedGuesses = new Set();
    feedback = note;
  }

  function render(): void {
    const { prime, precision } = settings;
    output.replaceChildren();
    const n = parseInteger(text);
    if (n === null || n <= 0n) {
      output.append(message("Enter a positive whole number n.", "error"));
      return;
    }
    const negative = integerToDigits(-n, prime, precision); // the answer the reader is looking for
    const positive = integerToDigits(n, prime, precision);
    const { columns } = addDigitsWithColumns(negative, positive, prime);
    const finished = columnsDone >= precision;

    // The carry INTO column i is known once column i − 1 is done; nothing is carried into column 0.
    const carryRow: DisplayDigit[] = columns.map((column, i) => (i === 0 || i <= columnsDone ? column.carryIn : null));
    const found: DisplayDigit[] = negative.map((digit, i) => (i < columnsDone ? digit : null));
    const zeros: DisplayDigit[] = Array(precision).fill(0);
    const current = (i: number) => i === columnsDone;

    output.append(
      digitTable([
        {
          label: "carries",
          digits: carryRow,
          rowClass: "carry-row",
          classFor: (i) => (carryRow[i] ? "carry" : carryRow[i] === null ? undefined : "faint"),
        },
        { label: htmlEl("span", {}, tex(`${n}`)), digits: positive, classFor: (i) => (current(i) ? "highlight" : undefined) },
        {
          label: htmlEl("span", {}, tex(`-${n}`)),
          digits: found,
          rowClass: "result-row",
          classFor: (i) => (current(i) ? "current" : i < columnsDone ? "match" : undefined),
        },
        { label: htmlEl("span", {}, tex(`${n} + (-${n})`)), digits: zeros, classFor: (i) => (current(i) ? "highlight" : "faint") },
      ]),
    );

    if (finished) {
      output.append(
        message(
          `We have run out of displayed digits, but the carry is still 1, and every column further left is ` +
            `0 + ${prime - 1} + 1 = ${prime}. So every remaining digit of −${n} is ${prime - 1}, forever.`,
          "success",
        ),
        el("div", { class: "controls" }, button("Start over", () => (resetProgress(), render()))),
      );
      return;
    }

    const column = columns[columnsDone];
    const nDigit = positive[columnsDone];
    const answer = negative[columnsDone];
    const columnTex = (d: number) => tex(`${nDigit} + ${d} + ${column.carryIn} = ${nDigit + d + column.carryIn}`);

    const choices = Array.from({ length: prime }, (_, digit) => {
      const choice = button(
        String(digit),
        () => {
          if (digit === answer) {
            acceptColumn(
              messageHtml(`${columnTex(digit)}: the sum digit is 0, carry ${tex(`${column.carryOut}`)} ✓`, "success"),
            );
          } else {
            rejectedGuesses.add(digit);
            feedback = messageHtml(
              `With ${tex(`${digit}`)}, the column is ${columnTex(digit)}, whose last base-${prime} digit is ` +
                `${tex(`${(nDigit + digit + column.carryIn) % prime}`)}, not ${tex("0")}.`,
              "error",
            );
          }
          render();
        },
        "digit-choice",
      );
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
        `Which digit of ${tex(`-${n}`)} goes in column ${columnsDone}, so that this column of the sum is ${tex("0")}?`,
      ),
      el("div", { class: "digit-choices" }, ...choices),
      feedback ?? "",
      el(
        "div",
        { class: "controls" },
        button("Explain this column", () => {
          acceptColumn(
            messageHtml(
              `Column ${columnsDone}: we need ${tex(`${nDigit} + d + ${column.carryIn}`)} to be a multiple of ${tex(`${prime}`)}. ` +
                `The only digit that works is ${tex(`d = ${answer}`)}, since ${columnTex(answer)}; carry ${tex(`${column.carryOut}`)}.`,
            ),
          );
          render();
        }),
        button("Fill in the rest", () => {
          columnsDone = precision;
          feedback = null;
          render();
        }),
        button("Start over", () => (resetProgress(), render())),
      ),
    );
  }

  container.append(
    el(
      "div",
      { class: "controls" },
      el("label", {}, "n = "),
      textInput(text, (v) => ((text = v), resetProgress(), render()), "n"),
    ),
    output,
  );
  return (next) => {
    settings = next;
    resetProgress();
    render();
  };
}

export function mountIntegers(explorerContainer: HTMLElement, stepperContainer: HTMLElement): void {
  const updateExplorer = mountIntegerExplorer(explorerContainer);
  const updateStepper = mountNegationChallenge(stepperContainer);
  // Each demo has its own prime picker.
  addPrimePicker(explorerContainer, updateExplorer);
  addPrimePicker(stepperContainer, updateStepper);
}
