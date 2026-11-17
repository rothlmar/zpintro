/** KaTeX helpers: render LaTeX written in the page and in demo output. */

import katex from "katex";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";

/** Renders a LaTeX string to an HTML string. */
export function tex(latex: string, displayMode = false): string {
  return katex.renderToString(latex, { displayMode, throwOnError: false });
}

/** Renders every $...$ and $$...$$ span inside `root`. */
export function renderMathIn(root: HTMLElement): void {
  renderMathInElement(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });
}
