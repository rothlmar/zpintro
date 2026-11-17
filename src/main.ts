/**
 * Entry point: typeset the page's LaTeX and mount each demo into its
 * placeholder in index.html. Each demo has its own prime picker.
 *
 * The mathematics itself lives in src/padic/. The files in src/demos/ only
 * build the interactive displays around it.
 */

import "./style.css";
import { mountConverter } from "./demos/converter";
import { mountDivision } from "./demos/division";
import { mountIntegers } from "./demos/integers";
import { mountRing } from "./demos/ring";
import { mountValuation } from "./demos/valuation";
import { byId } from "./ui/dom";
import { renderMathIn } from "./ui/math";

renderMathIn(document.body);

mountConverter(byId("demo-converter"));
mountRing(byId("demo-ring"));
mountIntegers(byId("demo-integers"), byId("demo-carry"));
mountDivision(byId("demo-division"));
mountValuation(byId("demo-valuation"));
