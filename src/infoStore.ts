import { createStore } from "solid-js/store";

export interface MoleculeAtomInfo {
  row: number;
  col: number;
  atomicNumber: number;
  symbol: string;
  name: string;
}

export type ConnectionEnd = "from" | "to";
export type ConnectionMark = "none" | "electronPair" | "singleElectron" | "plus" | "minus";
export type ConnectionTool = "singleBond" | "doubleBond" | "tripleBond" | "empty" | ConnectionMark;

export interface MoleculeConnectionInfo {
  key: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  bondOrder: 0 | 1 | 2 | 3;
  fromMark: ConnectionMark;
  toMark: ConnectionMark;
}

export interface MoleculeAppletInfoType {
  situation: string;
  selectedElement: {
    atomicNumber: number;
    symbol: string;
    name: string;
  };
  selectedPoint: { row: number; col: number } | null;
  selectedConnection: { key: string; end: ConnectionEnd } | null;
  activeConnectionTool: ConnectionTool;
  sumFormula: string;
  structuralFormula: string | null;
  atoms: MoleculeAtomInfo[];
  connections: MoleculeConnectionInfo[];
}

export const [infoStore, setInfoStore] = createStore<MoleculeAppletInfoType>({
  situation: "No molecule has been built yet; carbon is selected as the next atom.",
  selectedElement: {
    atomicNumber: 6,
    symbol: "C",
    name: "Carbon",
  },
  selectedPoint: null,
  selectedConnection: null,
  activeConnectionTool: "singleBond",
  sumFormula: "",
  structuralFormula: null,
  atoms: [],
  connections: [],
});
