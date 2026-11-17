# Vision

The goal of this project is to produce an interactive introduction to a fascinating class of mathematical structures, $p$-adic numbers.  It should introduce the most interesting and accessible properties, and have a way for users of the site to experiment.

The content should be accessible to users who have some familiarity with abstract algebra, specifically with the abstract concepts of a ring, using the integers and rational numbers as the prototype against which p-adic numbers are compared.

The site should introduce p-adic integers from two perspectives:
- as formal series of the shape $sum_{i=0}^{\infty} a_ip^i
- as equivalence classes of sequences $<x_n>$ that have the property that $x_{n+1} \equiv x_n mod p^n$

There should be interactive demonstrations for the following:
- conversion between the two representations
- the p-adic integers are a ring because they are closed under addition and multiplication
- the rational integers are a subring of the p-adic integers, and in particular that the base-p representation of an integer is equivalent to the formal series (which means that for any rational integer, there is an $n$ such that $a_m = 0$ whenever $m > n$ in the formal series representation).
- the big "Aha moment" should be an interaction that illustrates multiplicative inverses (aka division), leading to the conclusion that every element of the ring that is not divisible by $p$ is a unit.

The concept of the $p$-adic valuation should be introduced, along with the strong triangle inequality, showing how it is related to the concept that the ring of $p$-adic integers is closed under addition.

# Output

There are two primary artifacts: the hosted version on the web, and the code that drives it.

## The website

The website will be a static site hosted on github pages, in the natural location associated with this repository.  Getting the page configured is part of the agent's task.  The mathematics content should be written in LaTeX notation and converted for display on the website using [KaTeX](https://katex.org).

## The code
The typescript functions that implement the core algorithms will be studied, and may be of equal pedagogical value because they help interested parties to walk through the algorithms step by step.  The code should focus on readability and understandability, which includes consise, well-modularized functions with descriptive function and variable names.  It should be easy to find this code within the repository.  The "mathematical engine" code includes things like the conversion between an ordinary fraction and its $p$-adic representation, or the conversion between the direct product representation and the series representation of a p-adic number, or the calculation of the inverse of an integer.