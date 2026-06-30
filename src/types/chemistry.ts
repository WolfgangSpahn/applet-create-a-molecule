/* ==============================================================================================
 * types/Chemistry.ts
 * ============================================================================================== */

export type ChemicalElement = {
  row?: number;
  col?: number;
  number: number;
  valence: number;
  symbol: string;
  name: string;
  mass: number;
  electronegativity: number | null;
  atomicRadius: number;
  atomicCore: number;
  ion: string | null;
  ionSize: number | null;
  stateOfMatter: StateOfMatter;
  category: ElementCategory;
};


export type BondType = "none" | "metallic" | "ionic" | "covalent";

export type StateOfMatter = "solid" | "liquid" | "gas";

export type ElementCategory =
  | "alkali metal"
  | "metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble gas";
