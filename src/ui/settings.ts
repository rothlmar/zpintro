/**
 * Each demo carries its own prime picker, shown next to the demo's title, so
 * the reader changes p exactly where they are looking. The number of digits
 * shown is fixed.
 */

import { el } from "./dom";

export interface Settings {
  prime: number;
  precision: number;
}

export const AVAILABLE_PRIMES = [2, 3, 5, 7, 11, 13];
export const DEFAULT_PRIME = 5;
export const DIGITS_SHOWN = 12;

/**
 * Adds a row of prime buttons to the top of `demo` (after its title) and
 * calls `onChange` now and whenever the reader picks a different prime.
 */
export function addPrimePicker(
  demo: HTMLElement,
  onChange: (settings: Settings) => void,
  initialPrime = DEFAULT_PRIME,
): void {
  let selectedPrime = initialPrime;

  const buttons = AVAILABLE_PRIMES.map((prime) => {
    const choice = el("button", { type: "button", class: "prime-choice", "aria-pressed": String(prime === selectedPrime) }, String(prime));
    choice.addEventListener("click", () => {
      if (prime === selectedPrime) return;
      selectedPrime = prime;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === String(prime))));
      onChange({ prime, precision: DIGITS_SHOWN });
    });
    return choice;
  });

  const picker = el(
    "div",
    { class: "prime-picker", role: "group", "aria-label": "Choose the prime p" },
    el("span", { class: "prime-picker-label" }, "p ="),
    ...buttons,
  );

  const title = demo.querySelector(".demo-title");
  if (title) {
    // Put the title and picker on one line.
    const header = el("div", { class: "demo-header" });
    title.replaceWith(header);
    header.append(title, picker);
  } else {
    demo.prepend(picker);
  }

  onChange({ prime: selectedPrime, precision: DIGITS_SHOWN });
}
