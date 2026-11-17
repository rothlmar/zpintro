/**
 * Displays p-adic digits the way base-p numbers are usually written: highest
 * position on the left, a_0 on the right, with "…" marking that the digits
 * continue forever to the left.
 */

import { el } from "./dom";

/** A digit, or `null` for a digit not yet known (shown as "?"). */
export type DisplayDigit = number | null;

export interface DigitRow {
  label: Node | string;
  digits: DisplayDigit[];
  /** Optional CSS class for the cell at a given position. */
  classFor?: (position: number) => string | undefined;
  /** Optional text after the digits, e.g. a subscript or a note. */
  suffix?: Node | string;
  rowClass?: string;
  /** If given, each cell becomes a button that calls this with its position. */
  onDigitClick?: (position: number) => void;
}

function digitCell(
  digit: DisplayDigit,
  position: number,
  extraClass: string | undefined,
  onClick: ((position: number) => void) | undefined,
): HTMLElement {
  const className = ["digit", digit === null ? "unknown" : "", extraClass ?? ""].filter(Boolean).join(" ");
  const text = digit === null ? "?" : String(digit);
  if (!onClick) return el("span", { class: className }, text);
  const cell = el("button", { type: "button", class: `${className} clickable`, "aria-label": `digit a${position} = ${text}` }, text);
  cell.addEventListener("click", () => onClick(position));
  return cell;
}

function rowElement(row: DigitRow): HTMLElement {
  const cells = row.digits
    .map((digit, position) => digitCell(digit, position, row.classFor?.(position), row.onDigitClick))
    .reverse(); // highest position first
  return el(
    "div",
    { class: `digit-row ${row.rowClass ?? ""}` },
    el("span", { class: "row-label" }, row.label),
    el("span", { class: "ellipsis" }, "…"),
    el("span", { class: "digits" }, ...cells),
    row.suffix ? el("span", { class: "row-suffix" }, row.suffix) : null,
  );
}

/** A header row labelling each column with its position i (the power of p). */
function positionHeader(length: number): HTMLElement {
  const cells = Array.from({ length }, (_, position) => el("span", { class: "digit position" }, String(position))).reverse();
  return el(
    "div",
    { class: "digit-row header-row" },
    el("span", { class: "row-label" }, "position i"),
    el("span", { class: "ellipsis" }, ""),
    el("span", { class: "digits" }, ...cells),
  );
}

/** A block of aligned digit rows, optionally with a position header on top. */
export function digitTable(rows: DigitRow[], showPositions = true): HTMLElement {
  const length = rows[0]?.digits.length ?? 0;
  return el(
    "div",
    { class: "digit-table" },
    showPositions ? positionHeader(length) : null,
    ...rows.map(rowElement),
  );
}
