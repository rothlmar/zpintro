/** Tiny DOM-building helpers so the demo code reads as structure, not plumbing. */

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child);
  }
  return element;
}

/** An element whose innerHTML is trusted, locally generated markup (e.g. KaTeX output). */
export function htmlEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
  html: string,
): HTMLElementTagNameMap[K] {
  const element = el(tag, attributes);
  element.innerHTML = html;
  return element;
}

/** Finds the element with the given id, failing loudly if the page markup is missing it. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

export function button(label: string, onClick: () => void, className = ""): HTMLButtonElement {
  const element = el("button", { type: "button", class: className }, label);
  element.addEventListener("click", onClick);
  return element;
}

export function textInput(initialValue: string, onChange: (value: string) => void, ariaLabel: string): HTMLInputElement {
  const input = el("input", { type: "text", value: initialValue, "aria-label": ariaLabel, spellcheck: "false" });
  input.addEventListener("input", () => onChange(input.value));
  return input;
}
