/* ==============================================================================================
  * data/elements.ts
  * ============================================================================================== */

import type { ChemicalElement } from "../types/chemistry";

export const elements: ChemicalElement[] = [
  { row: 1, col: 1, number:  1, valence: 1, symbol: "H",  name: "Hydrogen",   mass: 1.01,  electronegativity: 2.20, atomicCore: 10, atomicRadius: 31,  ion: "H+",   ionSize: 10,   stateOfMatter: "gas",   category: "nonmetal" },
  { row: 1, col: 8, number:  2, valence: 0, symbol: "He", name: "Helium",     mass: 4.00,  electronegativity: null, atomicCore: 31, atomicRadius: 31,  ion: null,   ionSize: null, stateOfMatter: "gas",   category: "noble gas" },
  { row: 2, col: 1, number:  3, valence: 1, symbol: "Li", name: "Lithium",    mass: 6.94,  electronegativity: 0.98, atomicCore: 40, atomicRadius: 167, ion: "Li+",  ionSize: 76,   stateOfMatter: "solid", category: "alkali metal" },
  { row: 2, col: 2, number:  4, valence: 2, symbol: "Be", name: "Beryllium",  mass: 9.01,  electronegativity: 1.57, atomicCore: 30, atomicRadius: 112, ion: "Be2+", ionSize: 45,   stateOfMatter: "solid", category: "metal" },
  { row: 2, col: 3, number:  5, valence: 3, symbol: "B",  name: "Boron",      mass: 10.81, electronegativity: 2.04, atomicCore: 25, atomicRadius: 87,  ion: "B3+",  ionSize: 50,   stateOfMatter: "solid", category: "metalloid" },
  { row: 2, col: 4, number:  6, valence: 4, symbol: "C",  name: "Carbon",     mass: 12.01, electronegativity: 2.55, atomicCore: 20, atomicRadius: 67,  ion: "C4+",  ionSize: 40,   stateOfMatter: "solid", category: "nonmetal" },
  { row: 2, col: 5, number:  7, valence: 5, symbol: "N",  name: "Nitrogen",   mass: 14.01, electronegativity: 3.04, atomicCore: 20, atomicRadius: 56,  ion: "N3-",  ionSize: 170,  stateOfMatter: "gas",   category: "nonmetal" },
  { row: 2, col: 6, number:  8, valence: 6, symbol: "O",  name: "Oxygen",     mass: 16.00, electronegativity: 3.44, atomicCore: 18, atomicRadius: 48,  ion: "O2-",  ionSize: 140,  stateOfMatter: "gas",   category: "nonmetal" },
  { row: 2, col: 7, number:  9, valence: 7, symbol: "F",  name: "Fluorine",   mass: 19.00, electronegativity: 3.98, atomicCore: 15, atomicRadius: 43,  ion: "F-",   ionSize: 133,  stateOfMatter: "gas",   category: "halogen" },
  { row: 2, col: 8, number: 10, valence: 0, symbol: "Ne", name: "Neon",       mass: 20.18, electronegativity: null, atomicCore: 38, atomicRadius: 38,  ion: null,   ionSize: null, stateOfMatter: "gas",   category: "noble gas" },
  { row: 3, col: 1, number: 11, valence: 1, symbol: "Na", name: "Sodium",     mass: 22.99, electronegativity: 0.93, atomicCore: 50, atomicRadius: 190, ion: "Na+",  ionSize: 102,  stateOfMatter: "solid", category: "alkali metal" },
  { row: 3, col: 2, number: 12, valence: 2, symbol: "Mg", name: "Magnesium",  mass: 24.31, electronegativity: 1.31, atomicCore: 37, atomicRadius: 145, ion: "Mg2+", ionSize: 72,   stateOfMatter: "solid", category: "metal" },
  { row: 3, col: 3, number: 13, valence: 3, symbol: "Al", name: "Aluminum",   mass: 26.98, electronegativity: 1.61, atomicCore: 31, atomicRadius: 118, ion: "Al3+", ionSize: 53,   stateOfMatter: "solid", category: "metal" },
  { row: 3, col: 4, number: 14, valence: 4, symbol: "Si", name: "Silicon",    mass: 28.09, electronegativity: 1.90, atomicCore: 25, atomicRadius: 111, ion: "Si4+", ionSize: 40,   stateOfMatter: "solid", category: "metalloid" },
  { row: 3, col: 5, number: 15, valence: 5, symbol: "P",  name: "Phosphorus", mass: 30.97, electronegativity: 2.19, atomicCore: 25, atomicRadius: 98,  ion: "P3-",  ionSize: 212,  stateOfMatter: "solid", category: "nonmetal" },
  { row: 3, col: 6, number: 16, valence: 6, symbol: "S",  name: "Sulfur",     mass: 32.07, electronegativity: 2.58, atomicCore: 22, atomicRadius: 88,  ion: "S2-",  ionSize: 184,  stateOfMatter: "solid", category: "nonmetal" },
  { row: 3, col: 7, number: 17, valence: 7, symbol: "Cl", name: "Chlorine",   mass: 35.45, electronegativity: 3.16, atomicCore: 18, atomicRadius: 79,  ion: "Cl-",  ionSize: 181,  stateOfMatter: "gas",   category: "halogen" },
  { row: 3, col: 8, number: 18, valence: 0, symbol: "Ar", name: "Argon",      mass: 39.95, electronegativity: null, atomicCore: 71, atomicRadius: 71,  ion: null,   ionSize: null, stateOfMatter: "gas",   category: "noble gas" },
];

export const elementByNumber = elements.reduce<Record<number, ChemicalElement>>((acc, element) => {
  acc[element.number] = element;
  return acc;
}, {});

// give element number, return radius
export const radiusLookup = (number: number): number => {
  const element = elements.find(e => e.number === number);
  return element ? element.atomicRadius/2. : 30; // default radius if not found
};
