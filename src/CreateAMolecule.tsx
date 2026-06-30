import { For, Show, createEffect, createSignal, onCleanup, untrack } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { chemfigLewisToSvg } from "applet-support/chemfig";

import { PS_Button } from "./PS_Button";
import { width } from "./config/world";
import { elementByNumber, elements } from "./data/elements";
import { buildMoleculeKey, educationalMoleculeByKey } from "./data/molecules";
import { setInfoStore } from "./infoStore";
import type {
  ConnectionEnd,
  ConnectionMark,
  ConnectionTool,
  MoleculeAppletInfoType,
  MoleculeConnectionInfo,
} from "./infoStore";

interface AppProps {
  info?: unknown;
  setInfo?: typeof setInfoStore;
  onStateChange?: (state: MoleculeAppletInfoType) => void;
  onSubmit?: (value: string) => void;
  inputPaused?: boolean;
  submitDelayMs?: number;
  debug?: boolean;
}

interface GridPoint {
  row: number;
  col: number;
}

interface MoleculeGridPoint extends GridPoint {
  atomicNumber: number | null;
}

interface GridAtom extends GridPoint {
  atomicNumber: number;
  symbol: string;
  name: string;
}

interface Connection {
  key: string;
  from: GridPoint;
  to: GridPoint;
}

interface MoleculeConnection extends Connection {
  bondOrder: 0 | 1 | 2 | 3;
  fromMark: ConnectionMark;
  toMark: ConnectionMark;
}

const gridRows = 4;
const gridCols = 5;
const stageWidth = width;
const stageHeight = 330;
const displayHeight = 240;
const gridPaddingX = 82;
const gridPaddingY = 48;
const pointRadius = 10;
const filledPointRadius = 20;
const elementGridGap = 1;
const elementButtonWidth = Math.floor(width / 8);
const elementButtonHeight = Math.floor(width / 10);
const tableWidth = elementButtonWidth * 8 + elementGridGap * 7;
const backgroundPadding = Math.round(tableWidth * 0.05);

const atomKey = (row: number, col: number) => `${row}:${col}`;
const connectionKey = (from: GridPoint, to: GridPoint) => `${atomKey(from.row, from.col)}-${atomKey(to.row, to.col)}`;
const pointX = (col: number) => gridPaddingX + (col / (gridCols - 1)) * (stageWidth - gridPaddingX * 2);
const pointY = (row: number) => gridPaddingY + (row / (gridRows - 1)) * (stageHeight - gridPaddingY * 2);
const samePoint = (a: GridPoint | null, b: GridPoint) => a?.row === b.row && a.col === b.col;

const points: GridPoint[] = Array.from({ length: gridRows * gridCols }, (_, index) => ({
  row: Math.floor(index / gridCols),
  col: index % gridCols,
}));

const createInitialGridPoints = (): MoleculeGridPoint[] =>
  points.map((point) => ({
    ...point,
    atomicNumber: null,
  }));

const connections: Connection[] = points.flatMap(({ row, col }) => {
  const next: Connection[] = [];

  if (col < gridCols - 1) {
    const from = { row, col };
    const to = { row, col: col + 1 };
    next.push({ key: connectionKey(from, to), from, to });
  }

  if (row < gridRows - 1) {
    const from = { row, col };
    const to = { row: row + 1, col };
    next.push({ key: connectionKey(from, to), from, to });
  }

  if (row < gridRows - 1 && col < gridCols - 1) {
    const from = { row, col };
    const to = { row: row + 1, col: col + 1 };
    next.push({ key: connectionKey(from, to), from, to });
  }

  if (row < gridRows - 1 && col > 0) {
    const from = { row, col };
    const to = { row: row + 1, col: col - 1 };
    next.push({ key: connectionKey(from, to), from, to });
  }

  return next;
});

const createInitialConnections = (): MoleculeConnection[] =>
  connections.map((connection) => ({
    ...connection,
    bondOrder: 0,
    fromMark: "none",
    toMark: "none",
  }));

const connectionTools: { value: ConnectionTool; label: string; title: string }[] = [
  { value: "singleBond", label: "-", title: "Single bond" },
  { value: "doubleBond", label: "=", title: "Dual bond" },
  { value: "tripleBond", label: "#", title: "Triple bond" },
  { value: "electronPair", label: ":", title: "Electron pair" },
  { value: "singleElectron", label: ".", title: "Single electron" },
  { value: "plus", label: "q+", title: "Plus sign" },
  { value: "minus", label: "q-", title: "Minus sign" },
  { value: "empty", label: "", title: "Del" },
];

const bondOrderByTool: Partial<Record<ConnectionTool, 1 | 2 | 3>> = {
  singleBond: 1,
  doubleBond: 2,
  tripleBond: 3,
};

const connectionGeometry = ({ from, to }: Connection) => {
  const x1 = pointX(from.col);
  const y1 = pointY(from.row);
  const x2 = pointX(to.col);
  const y2 = pointY(to.row);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;

  return { x1, y1, x2, y2, ux, uy, nx, ny };
};

const connectionPoint = (connection: Connection, end: ConnectionEnd, distanceFromEnd: number, normalOffset = 0) => {
  const { x1, y1, x2, y2, ux, uy, nx, ny } = connectionGeometry(connection);
  const baseX = end === "from" ? x1 + ux * distanceFromEnd : x2 - ux * distanceFromEnd;
  const baseY = end === "from" ? y1 + uy * distanceFromEnd : y2 - uy * distanceFromEnd;

  return {
    x: baseX + nx * normalOffset,
    y: baseY + ny * normalOffset,
  };
};

const bondOffsets = (bondOrder: 0 | 1 | 2 | 3) => {
  if (bondOrder === 1) return [0];
  if (bondOrder === 2) return [-4, 4];
  if (bondOrder === 3) return [-7, 0, 7];
  return [];
};

const bondSymbol = (bondOrder: 1 | 2 | 3) => {
  if (bondOrder === 2) return "=";
  if (bondOrder === 3) return "~";
  return "-";
};

const connectionAngle = ({ from, to }: Connection, startKey: string) => {
  const fromKey = atomKey(from.row, from.col);
  const start = startKey === fromKey ? from : to;
  const end = startKey === fromKey ? to : from;
  const dx = pointX(end.col) - pointX(start.col);
  const dy = pointY(end.row) - pointY(start.row);
  return Math.round((Math.atan2(-dy, dx) * 180) / Math.PI);
};

const subscriptDigits: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

const superscriptDigits: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

const markElectronCount = (mark: ConnectionMark) => {
  if (mark === "electronPair") return 2;
  if (mark === "singleElectron") return 1;
  return 0;
};

const markChargeOffset = (mark: ConnectionMark) => {
  if (mark === "minus") return 1;
  if (mark === "plus") return -1;
  return 0;
};

const elementFormulaPriority = [
  "Li",
  "Na",
  "Be",
  "Mg",
  "Al",
  "B",
  "Si",
  "N",
  "P",
  "O",
  "S",
  "F",
  "Cl",
  "He",
  "Ne",
  "Ar",
];

function CreateAMolecule(props: AppProps) {
  const submitDelayMs = props.submitDelayMs ?? 5000;
  const [$activeAtom, setActiveAtom] = createSignal<number>(6);
  const [$selectedPoint, setSelectedPoint] = createSignal<GridPoint | null>(null);
  const [$selectedConnection, setSelectedConnection] = createSignal<{ key: string; end: ConnectionEnd } | null>(null);
  const [$activeConnectionTool, setActiveConnectionTool] = createSignal<ConnectionTool>("singleBond");
  const [$connectionMenu, setConnectionMenu] = createSignal<{ key: string; end: ConnectionEnd; x: number; y: number } | null>(
    null,
  );
  const [gridPoints, setGridPoints] = createStore<MoleculeGridPoint[]>(createInitialGridPoints());
  const [connectionStore, setConnectionStore] = createStore<MoleculeConnection[]>(createInitialConnections());
  const [progress, setProgress] = createSignal(0);
  const [submitMessage, setSubmitMessage] = createSignal("");
  let progressTimer: ReturnType<typeof setInterval> | undefined;
  let hasInitializedProgressWatch = false;

  const $activeElement = () => elementByNumber[$activeAtom()];
  const debugJson = () => JSON.stringify({ gridPoints, connections: annotatedConnections() }, null, 2);

  const placedAtoms = (): GridAtom[] =>
    gridPoints
      .filter((point): point is MoleculeGridPoint & { atomicNumber: number } => point.atomicNumber != null)
      .map((point) => {
        const { row, col, atomicNumber } = point;
        const element = elementByNumber[atomicNumber];
        return { row, col, atomicNumber, symbol: element.symbol, name: element.name };
      })
      .sort((a, b) => a.row - b.row || a.col - b.col);

  const sumFormulaParts = () => {
    const counts = new Map<string, number>();

    for (const atom of placedAtoms()) {
      counts.set(atom.symbol, (counts.get(atom.symbol) ?? 0) + 1);
    }

    const priority = (symbol: string) => {
      if (counts.has("C")) {
        if (symbol === "C") return 0;
        if (symbol === "H") return 1;
        return 2 + elementFormulaPriority.indexOf(symbol);
      }

      if (symbol === "H") {
        return elementFormulaPriority.length + 1;
      }

      const priorityIndex = elementFormulaPriority.indexOf(symbol);
      return priorityIndex >= 0 ? priorityIndex : elementFormulaPriority.length;
    };

    const symbols = [...counts.keys()].sort((a, b) => {
      if (a === "C") return -1;
      if (b === "C") return 1;
      const priorityDelta = priority(a) - priority(b);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return a.localeCompare(b);
    });

    return symbols.map((symbol) => ({ symbol, count: counts.get(symbol) ?? 0 }));
  };

  const moleculeKey = () => {
    const counts = placedAtoms().reduce<Record<string, number>>((acc, atom) => {
      acc[atom.symbol] = (acc[atom.symbol] ?? 0) + 1;
      return acc;
    }, {});

    return buildMoleculeKey(counts, netCharge());
  };

  const matchedEducationalMolecule = () => educationalMoleculeByKey[moleculeKey()] ?? null;

  const moleculeName = () => (isRealisticMolecule() ? matchedEducationalMolecule()?.name : null);

  const sumFormula = () => {
    const formatCount = (count: number) =>
      String(count)
        .split("")
        .map((digit) => subscriptDigits[digit] ?? digit)
        .join("");

    const knownMolecule = matchedEducationalMolecule();
    if (knownMolecule) {
      return knownMolecule.formula;
    }

    const formula = sumFormulaParts()
      .map(({ symbol, count }) => `${symbol}${count === 1 ? "" : formatCount(count)}`)
      .join("");

    return `${formula}${formattedPlainCharge()}`;
  };

  const sumFormulaFontSize = () => {
    const length = sumFormula().length;
    if (length <= 3) return "7.5rem";
    if (length <= 4) return "6.5rem";
    if (length <= 5) return "5.6rem";
    return "4.8rem";
  };

  const annotatedConnections = (): MoleculeConnectionInfo[] =>
    connectionStore
      .filter((connection) => connection.bondOrder > 0 || connection.fromMark !== "none" || connection.toMark !== "none")
      .map(({ key, from, to, bondOrder, fromMark, toMark }) => ({
        key,
        from,
        to,
        bondOrder,
        fromMark,
        toMark,
      }));

  const netCharge = () => {
    const atomKeys = new Set(placedAtoms().map((atom) => atomKey(atom.row, atom.col)));

    return connectionStore.reduce((charge, connection) => {
      const endpoints: { point: GridPoint; mark: ConnectionMark }[] = [
        { point: connection.from, mark: connection.fromMark },
        { point: connection.to, mark: connection.toMark },
      ];

      return (
        charge +
        endpoints.reduce((endpointCharge, { point, mark }) => {
          if (!atomKeys.has(atomKey(point.row, point.col))) {
            return endpointCharge;
          }

          if (mark === "plus") return endpointCharge + 1;
          if (mark === "minus") return endpointCharge - 1;
          return endpointCharge;
        }, 0)
      );
    }, 0);
  };

  const formattedPlainCharge = () => {
    const charge = netCharge();
    if (charge === 0) {
      return "";
    }

    const magnitude = Math.abs(charge);
    const digits = magnitude === 1 ? "" : String(magnitude).replace(/\d/g, (digit) => superscriptDigits[digit] ?? digit);
    return `${digits}${charge > 0 ? "⁺" : "⁻"}`;
  };

  const formattedDisplayCharge = () => {
    const charge = netCharge();
    if (charge === 0) {
      return "";
    }

    const magnitude = Math.abs(charge);
    return `${magnitude === 1 ? "" : magnitude}${charge > 0 ? "+" : "-"}`;
  };

  const formattedChemfigCharge = () => {
    const charge = netCharge();
    if (charge === 0) {
      return "";
    }

    const magnitude = Math.abs(charge);
    return `^{${magnitude === 1 ? "" : magnitude}${charge > 0 ? "+" : "-"}}`;
  };

  const bondedConnections = () => {
    const atomKeys = new Set(placedAtoms().map((atom) => atomKey(atom.row, atom.col)));
    return connectionStore.filter(
      ({ from, to, bondOrder }) =>
        bondOrder > 0 && atomKeys.has(atomKey(from.row, from.col)) && atomKeys.has(atomKey(to.row, to.col)),
    );
  };

  const isRealisticMolecule = () => {
    const atoms = placedAtoms();
    if (atoms.length < 2) {
      return false;
    }

    const atomByKey = new Map(atoms.map((atom) => [atomKey(atom.row, atom.col), atom]));
    const bonded = bondedConnections();
    if (bonded.length === 0) {
      return false;
    }

    const graph = new Map<string, Set<string>>();
    const bondOrderByAtom = new Map<string, number>();
    const markedElectronCountByAtom = new Map<string, number>();
    const chargeOffsetByAtom = new Map<string, number>();

    for (const atom of atoms) {
      const key = atomKey(atom.row, atom.col);
      graph.set(key, new Set());
      bondOrderByAtom.set(key, 0);
      markedElectronCountByAtom.set(key, 0);
      chargeOffsetByAtom.set(key, 0);
    }

    for (const connection of bonded) {
      const fromKey = atomKey(connection.from.row, connection.from.col);
      const toKey = atomKey(connection.to.row, connection.to.col);
      graph.get(fromKey)?.add(toKey);
      graph.get(toKey)?.add(fromKey);
      bondOrderByAtom.set(fromKey, (bondOrderByAtom.get(fromKey) ?? 0) + connection.bondOrder);
      bondOrderByAtom.set(toKey, (bondOrderByAtom.get(toKey) ?? 0) + connection.bondOrder);
    }

    for (const connection of connectionStore) {
      const endpoints: { point: GridPoint; mark: ConnectionMark }[] = [
        { point: connection.from, mark: connection.fromMark },
        { point: connection.to, mark: connection.toMark },
      ];

      for (const { point, mark } of endpoints) {
        const key = atomKey(point.row, point.col);
        if (!atomByKey.has(key)) {
          continue;
        }

        markedElectronCountByAtom.set(key, (markedElectronCountByAtom.get(key) ?? 0) + markElectronCount(mark));
        chargeOffsetByAtom.set(key, (chargeOffsetByAtom.get(key) ?? 0) + markChargeOffset(mark));
      }
    }

    const [startKey] = atomByKey.keys();
    const seen = new Set<string>();
    const stack = [startKey];

    while (stack.length > 0) {
      const key = stack.pop();
      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      for (const nextKey of graph.get(key) ?? []) {
        stack.push(nextKey);
      }
    }

    if (seen.size !== atoms.length) {
      return false;
    }

    return atoms.every((atom) => {
      const element = elementByNumber[atom.atomicNumber];
      const key = atomKey(atom.row, atom.col);
      const bondOrder = bondOrderByAtom.get(atomKey(atom.row, atom.col)) ?? 0;
      const markedElectrons = markedElectronCountByAtom.get(key) ?? 0;
      const chargeOffset = chargeOffsetByAtom.get(key) ?? 0;
      const expectedValenceElectrons = element.valence + chargeOffset;
      const remainingElectrons = expectedValenceElectrons - bondOrder - markedElectrons;

      return expectedValenceElectrons >= 0 && remainingElectrons >= 0 && remainingElectrons % 2 === 0;
    });
  };

  const structuralFormulaFragments = () => {
    if (!isRealisticMolecule()) {
      return [];
    }

    const atoms = placedAtoms();
    if (atoms.length === 0) {
      return [];
    }

    const atomByKey = new Map(atoms.map((atom) => [atomKey(atom.row, atom.col), atom]));
    const connectedBonds = bondedConnections();
    const graph = new Map<string, MoleculeConnection[]>();

    for (const connection of connectedBonds) {
      const fromKey = atomKey(connection.from.row, connection.from.col);
      const toKey = atomKey(connection.to.row, connection.to.col);
      graph.set(fromKey, [...(graph.get(fromKey) ?? []), connection]);
      graph.set(toKey, [...(graph.get(toKey) ?? []), connection]);
    }

    const atomChemfig = (atom: GridAtom) => {
      const key = atomKey(atom.row, atom.col);
      const explicitCharges = connectionStore
        .flatMap((connection) => {
          const marks: { end: ConnectionEnd; mark: ConnectionMark }[] = [
            { end: "from", mark: connection.fromMark },
            { end: "to", mark: connection.toMark },
          ];

          return marks
            .filter(({ end, mark }) => {
              const point = end === "from" ? connection.from : connection.to;
              return atomKey(point.row, point.col) === key && (mark === "electronPair" || mark === "singleElectron");
            })
            .map(({ mark }) => {
              const symbol = mark === "electronPair" ? "\\|" : "\\.";
              return `${connectionAngle(connection, key)}=${symbol}`;
            });
        })
        .filter(Boolean);
      const bondOrder = connectedBonds.reduce((total, connection) => {
        const fromKey = atomKey(connection.from.row, connection.from.col);
        const toKey = atomKey(connection.to.row, connection.to.col);
        return fromKey === key || toKey === key ? total + connection.bondOrder : total;
      }, 0);
      const markedElectrons = connectionStore.reduce((total, connection) => {
        const endpointMarks: { point: GridPoint; mark: ConnectionMark }[] = [
          { point: connection.from, mark: connection.fromMark },
          { point: connection.to, mark: connection.toMark },
        ];

        return (
          total +
          endpointMarks.reduce(
            (endpointTotal, { point, mark }) =>
              atomKey(point.row, point.col) === key ? endpointTotal + markElectronCount(mark) : endpointTotal,
            0,
          )
        );
      }, 0);
      const chargeOffset = connectionStore.reduce((total, connection) => {
        const endpointMarks: { point: GridPoint; mark: ConnectionMark }[] = [
          { point: connection.from, mark: connection.fromMark },
          { point: connection.to, mark: connection.toMark },
        ];

        return (
          total +
          endpointMarks.reduce(
            (endpointTotal, { point, mark }) =>
              atomKey(point.row, point.col) === key ? endpointTotal + markChargeOffset(mark) : endpointTotal,
            0,
          )
        );
      }, 0);
      const inferredPairCount = Math.max(0, (elementByNumber[atom.atomicNumber].valence + chargeOffset - bondOrder - markedElectrons) / 2);
      const usedAngles = new Set(
        connectedBonds
          .filter((connection) => {
            const fromKey = atomKey(connection.from.row, connection.from.col);
            const toKey = atomKey(connection.to.row, connection.to.col);
            return fromKey === key || toKey === key;
          })
          .map((connection) => Math.round(connectionAngle(connection, key))),
      );
      const inferredCharges = [90, 0, 270, 180, 45, 315, 135, 225]
        .filter((angle) => !usedAngles.has(angle))
        .slice(0, inferredPairCount)
        .map((angle) => `${angle}=\\|`);
      const charges = [...explicitCharges, ...inferredCharges];

      return charges.length > 0 ? `\\charge{${charges.join(",")}}{${atom.symbol}}` : atom.symbol;
    };

    const visited = new Set<string>();
    const renderFrom = (key: string, parentKey: string | null): string => {
      const atom = atomByKey.get(key);
      if (!atom) {
        return "";
      }

      visited.add(key);

      const branches = (graph.get(key) ?? [])
        .map((connection) => {
          const fromKey = atomKey(connection.from.row, connection.from.col);
          const toKey = atomKey(connection.to.row, connection.to.col);
          const nextKey = fromKey === key ? toKey : fromKey;
          return { connection, nextKey };
        })
        .filter(({ nextKey }) => nextKey !== parentKey && atomByKey.has(nextKey) && !visited.has(nextKey))
        .sort((a, b) => a.nextKey.localeCompare(b.nextKey));

      const renderedBranches = branches.map(({ connection, nextKey }) => {
        const order = connection.bondOrder || 1;
        const bond = `${bondSymbol(order as 1 | 2 | 3)}[:${connectionAngle(connection, key)}]`;
        return `${bond}${renderFrom(nextKey, key)}`;
      });

      if (renderedBranches.length === 0) {
        return atomChemfig(atom);
      }

      const [mainBranch, ...sideBranches] = renderedBranches;
      return `${atomChemfig(atom)}${sideBranches.map((branch) => `(${branch})`).join("")}${mainBranch}`;
    };

    const components: string[] = [];

    for (const atom of atoms) {
      const key = atomKey(atom.row, atom.col);
      if (!visited.has(key)) {
        const component = renderFrom(key, null);
        if (component) {
          components.push(component);
        }
      }
    }

    return components;
  };

  const structuralFormula = () => {
    const fragments = structuralFormulaFragments();
    return fragments.length > 0 ? fragments.map((fragment) => `\\chemfig{${fragment}}${formattedChemfigCharge()}`).join(" + ") : null;
  };

  const renderedStructuralFormula = () =>
    structuralFormulaFragments()
      .map((fragment) => {
        const formula = `\\chemfig{${fragment}}${formattedChemfigCharge()}`;

        try {
          return chemfigLewisToSvg(formula);
        } catch (error) {
          console.error("Failed to render chemfig formula", formula, error);
          return null;
        }
      })
      .filter((svg): svg is string => svg !== null);

  const currentInfo = (): MoleculeAppletInfoType => ({
    selectedElement: {
      atomicNumber: $activeElement().number,
      symbol: $activeElement().symbol,
      name: $activeElement().name,
    },
    selectedPoint: $selectedPoint(),
    selectedConnection: $selectedConnection(),
    activeConnectionTool: $activeConnectionTool(),
    sumFormula: isRealisticMolecule() ? sumFormula() : "",
    structuralFormula: isRealisticMolecule() ? structuralFormula() : null,
    atoms: placedAtoms(),
    connections: annotatedConnections(),
  });

  const publishInfo = () => {
    const nextInfo = currentInfo();
    setInfoStore(nextInfo);
    props.setInfo?.(nextInfo);
    props.onStateChange?.(nextInfo);
  };

  const buildSubmitMessage = () =>
    JSON.stringify(
      {
        applet: "applet-create-a-molecule",
        infoStore: currentInfo(),
      },
      null,
      2,
    );

  const clearProgressBar = () => {
    setProgress(0);
    setSubmitMessage("");

    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = undefined;
    }
  };

  const startProgressBar = () => {
    if (untrack(() => props.inputPaused)) {
      clearProgressBar();
      return;
    }

    if (progressTimer) {
      clearInterval(progressTimer);
    }

    const start = Date.now();
    progressTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.min(100, (elapsed / submitDelayMs) * 100);
      setProgress(percent);

      if (percent >= 100) {
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = undefined;
        }

        const message = buildSubmitMessage();
        setSubmitMessage(message);
        props.onSubmit?.(message);
        setProgress(0);
      }
    }, 100);
  };

  onCleanup(() => {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = undefined;
    }
  });

  createEffect(() => {
    $activeAtom();
    $selectedPoint();
    $selectedConnection();
    $activeConnectionTool();
    JSON.stringify(gridPoints);
    JSON.stringify(connectionStore);
    publishInfo();
  });

  createEffect(() => {
    $activeAtom();
    $selectedPoint();
    $selectedConnection();
    $activeConnectionTool();
    JSON.stringify(gridPoints);
    JSON.stringify(connectionStore);

    if (!hasInitializedProgressWatch) {
      hasInitializedProgressWatch = true;
      return;
    }

    startProgressBar();
  });

  createEffect(() => {
    if (props.inputPaused) {
      clearProgressBar();
    }
  });

  const fillSelectedPoint = (atomicNumber: number) => {
    setActiveAtom(atomicNumber);
    setConnectionMenu(null);

    const selected = $selectedPoint();
    if (selected) {
      const selectedIndex = gridPoints.findIndex((point) => samePoint(point, selected));

      if (selectedIndex >= 0) {
        setGridPoints(selectedIndex, "atomicNumber", atomicNumber);
      }
    }
  };

  const clearSelectedPoint = () => {
    setConnectionMenu(null);

    const selected = $selectedPoint();
    if (!selected) {
      return;
    }

    const selectedIndex = gridPoints.findIndex((point) => samePoint(point, selected));

    if (selectedIndex >= 0) {
      setGridPoints(selectedIndex, "atomicNumber", null);
    }
  };

  const clearCanvasSelection = () => {
    setSelectedPoint(null);
    setSelectedConnection(null);
    setConnectionMenu(null);
  };

  const openConnectionMenu = (connection: MoleculeConnection, end: ConnectionEnd) => {
    const { x, y } = connectionPoint(connection, end, 30);
    setSelectedConnection({ key: connection.key, end });
    setConnectionMenu({ key: connection.key, end, x, y });
  };

  const applyConnectionTool = (key: string, end: ConnectionEnd, tool: ConnectionTool) => {
    setSelectedConnection({ key, end });
    setActiveConnectionTool(tool);
    setConnectionMenu(null);

    const selectedIndex = connectionStore.findIndex((connection) => connection.key === key);
    if (selectedIndex < 0) {
      return;
    }

    if (tool === "empty") {
      setConnectionStore(selectedIndex, "bondOrder", 0);
      setConnectionStore(selectedIndex, end === "from" ? "fromMark" : "toMark", "none");
      return;
    }

    const bondOrder = bondOrderByTool[tool];
    if (bondOrder) {
      setConnectionStore(selectedIndex, "bondOrder", bondOrder);
      return;
    }

    setConnectionStore(selectedIndex, end === "from" ? "fromMark" : "toMark", tool as ConnectionMark);
  };

  const renderConnectionMark = (connection: MoleculeConnection, end: ConnectionEnd) => {
    const mark = end === "from" ? connection.fromMark : connection.toMark;
    if (mark === "none") {
      return null;
    }

    const { ux, uy, nx, ny } = connectionGeometry(connection);
    const { x, y } = connectionPoint(connection, end, 24, 22);

    if (mark === "electronPair") {
      const center = connectionPoint(connection, end, 24);
      const halfLength = 7;

      return (
        <line
          x1={center.x - nx * halfLength}
          y1={center.y - ny * halfLength}
          x2={center.x + nx * halfLength}
          y2={center.y + ny * halfLength}
          stroke="#17201e"
          stroke-width="3"
          stroke-linecap="round"
          pointer-events="none"
        />
      );
    }

    if (mark === "singleElectron") {
      return <circle cx={x} cy={y} r="3" fill="#17201e" pointer-events="none" />;
    }

    const center = connectionPoint(connection, end, 40);

    return (
      <text
        x={center.x + ux * 1}
        y={center.y + uy * 1 + 8}
        text-anchor="middle"
        font-family="monospace"
        font-size="28"
        font-weight="700"
        fill="#17201e"
        pointer-events="none"
      >
        {mark === "plus" ? "+" : "-"}
      </text>
    );
  };

  const resetGrid = () => {
    setGridPoints(reconcile(createInitialGridPoints()));
    setConnectionStore(reconcile(createInitialConnections()));
    setSelectedPoint(null);
    setSelectedConnection(null);
    setConnectionMenu(null);
    setActiveAtom(6);
    setActiveConnectionTool("singleBond");
    clearProgressBar();
  };

  return (
    <div
      class="relative mx-auto bg-aidu-page font-mono text-aidu-text"
      style={{
        width: `${tableWidth + backgroundPadding * 2}px`,
        "max-width": "100%",
        padding: `${backgroundPadding}px ${backgroundPadding}px ${backgroundPadding + 64}px`,
      }}
    >
      <div class="flex flex-col items-center gap-2" style={{ width: `${tableWidth}px`, "max-width": "100%" }}>
      <Show when={progress() > 0}>
        <div class="absolute inset-x-0 bottom-6 z-20 px-3">
          <div class="mb-1 text-[11px] uppercase tracking-normal text-aidu-muted">
            Applet state sends when the bar completes
          </div>
          <div class="h-1 overflow-hidden rounded-full bg-aidu-line-soft" aria-hidden="true">
            <div class="h-full rounded-full bg-aidu-primary" style={{ width: `${Math.round(progress())}%` }} />
          </div>
        </div>
      </Show>

      <div
        class="mt-2 grid w-full grid-cols-[minmax(300px,1.4fr)_minmax(0,1fr)] items-center gap-3 border border-aidu-line-soft bg-aidu-surface px-3"
        style={{ height: `${displayHeight}px` }}
        aria-label="Display"
      >
        <span class="sr-only">{submitMessage()}</span>
        <Show
          when={isRealisticMolecule()}
          fallback={<div class="text-left text-5xl font-normal leading-none text-aidu-error">no molecule</div>}
        >
          <div class="flex min-w-0 flex-col items-start justify-center">
            <Show when={moleculeName()}>
              {(name) => <div class="min-w-0 truncate text-sm font-bold uppercase tracking-normal text-aidu-muted">{name()}</div>}
            </Show>
            <div class="whitespace-nowrap text-left font-bold leading-none text-aidu-text" style={{ "font-size": sumFormulaFontSize() }}>
              <Show
                when={matchedEducationalMolecule()}
                fallback={
                  <>
                    <For each={sumFormulaParts()}>
                      {({ symbol, count }) => (
                        <>
                          {symbol}
                          <Show when={count > 1}>
                            <sub class="text-[0.5em] leading-none">{count}</sub>
                          </Show>
                        </>
                      )}
                    </For>
                    <Show when={formattedDisplayCharge()}>
                      {(charge) => <sup class="align-super text-[0.35em] leading-none">{charge()}</sup>}
                    </Show>
                  </>
                }
              >
                {(molecule) => molecule().formula}
              </Show>
            </div>
          </div>
        </Show>
        <div class="flex min-w-0 justify-end gap-2 overflow-hidden text-aidu-text">
          <For each={renderedStructuralFormula()}>
            {(svg) => <div class="chemfig-rendered max-w-full shrink" innerHTML={svg} />}
          </For>
        </div>
      </div>

      <div
        class="relative w-full border border-aidu-line bg-aidu-surface"
        style={{ height: `${stageHeight}px` }}
        onClick={clearCanvasSelection}
      >
        <svg width={stageWidth} height={stageHeight} viewBox={`0 0 ${stageWidth} ${stageHeight}`} class="block max-w-full">
          <rect width={stageWidth} height={stageHeight} fill="#ffffff" />

          <For each={connectionStore}>
            {(connection) => {
              const isActive = () => $selectedConnection()?.key === connection.key;
              const geometry = () => connectionGeometry(connection);

              return (
                <g>
                  <line
                    x1={geometry().x1}
                    y1={geometry().y1}
                    x2={geometry().x2}
                    y2={geometry().y2}
                    stroke={isActive() ? "#99f6e4" : "#d1d5db"}
                    stroke-width={isActive() ? 4 : 1.5}
                  />
                  <For each={bondOffsets(connection.bondOrder)}>
                    {(offset) => (
                      <line
                        x1={geometry().x1 + geometry().ux * filledPointRadius + geometry().nx * offset}
                        y1={geometry().y1 + geometry().uy * filledPointRadius + geometry().ny * offset}
                        x2={geometry().x2 - geometry().ux * filledPointRadius + geometry().nx * offset}
                        y2={geometry().y2 - geometry().uy * filledPointRadius + geometry().ny * offset}
                        stroke="#17201e"
                        stroke-width="2.5"
                        stroke-linecap="round"
                      />
                    )}
                  </For>
                  {renderConnectionMark(connection, "from")}
                  {renderConnectionMark(connection, "to")}
                </g>
              );
            }}
          </For>

          <For each={gridPoints}>
            {(point) => {
              const element = () => (point.atomicNumber ? elementByNumber[point.atomicNumber] : null);
              const isSelected = () => samePoint($selectedPoint(), point);

              return (
                <g>
                  <circle
                    cx={pointX(point.col)}
                    cy={pointY(point.row)}
                    r={element() ? filledPointRadius : pointRadius}
                    fill={element() ? "#ffffff" : "#9ca3af"}
                    stroke={isSelected() ? "#0f766e" : "transparent"}
                    stroke-width={isSelected() ? 4 : 0}
                  />
                  <Show when={element()}>
                    {(placedElement) => (
                      <text
                        x={pointX(point.col)}
                        y={pointY(point.row) + 6}
                        text-anchor="middle"
                        font-family="monospace"
                        font-size="18"
                        font-weight="700"
                        fill="#17201e"
                      >
                        {placedElement().symbol}
                      </text>
                    )}
                  </Show>
                </g>
              );
            }}
          </For>
        </svg>

        <For each={connectionStore}>
          {(connection) => (
            <For each={["from", "to"] as ConnectionEnd[]}>
              {(end) => {
                const zone = () => connectionPoint(connection, end, 30);
                const isActive = () =>
                  $selectedConnection()?.key === connection.key && $selectedConnection()?.end === end;

                return (
                  <button
                    type="button"
                    class="absolute z-10 cursor-pointer rounded-full border border-transparent bg-transparent p-0 outline-none transition-colors hover:border-aidu-primary hover:bg-aidu-primary/10 focus:ring-2 focus:ring-aidu-primary"
                    style={{
                      left: `${zone().x}px`,
                      top: `${zone().y}px`,
                      width: "28px",
                      height: "28px",
                      transform: "translate(-50%, -50%)",
                      appearance: "none",
                      background: isActive() ? "rgba(15, 118, 110, 0.12)" : "transparent",
                      border: isActive() ? "1px solid #0f766e" : "1px solid transparent",
                    }}
                    aria-label={`${end === "from" ? "Beginning" : "End"} of connection ${connection.key}`}
                    aria-haspopup="menu"
                    aria-expanded={
                      $connectionMenu()?.key === connection.key && $connectionMenu()?.end === end ? "true" : "false"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      openConnectionMenu(connection, end);
                    }}
                  />
                );
              }}
            </For>
          )}
        </For>

        <Show when={$connectionMenu()}>
          {(menu) => (
            <div
              class="absolute z-30 min-w-28 rounded-md border border-aidu-line bg-aidu-surface p-1 shadow-lg"
              role="menu"
              onClick={(event) => event.stopPropagation()}
              style={{
                left: `${menu().x}px`,
                top: `${menu().y}px`,
                transform: menu().x > stageWidth - 150 ? "translate(-100%, -50%)" : "translate(10px, -50%)",
              }}
            >
              <For each={connectionTools}>
                {(tool) => (
                  <button
                    type="button"
                    class="flex h-7 w-full items-center gap-2 rounded px-2 text-left text-xs font-mono text-aidu-text transition-colors hover:bg-aidu-line-soft focus:outline-none focus:ring-2 focus:ring-aidu-primary"
                    role="menuitem"
                    onClick={(event) => {
                      event.stopPropagation();
                      applyConnectionTool(menu().key, menu().end, tool.value);
                    }}
                  >
                    <span class="w-6 text-center font-bold">{tool.label}</span>
                    <span class="whitespace-nowrap">{tool.title}</span>
                  </button>
                )}
              </For>
            </div>
          )}
        </Show>

        <For each={gridPoints}>
          {(point) => (
            <button
              type="button"
              class="absolute z-20 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus:ring-2 focus:ring-aidu-primary"
              style={{
                left: `${pointX(point.col)}px`,
                top: `${pointY(point.row)}px`,
                width: `${filledPointRadius * 2 + 6}px`,
                height: `${filledPointRadius * 2 + 6}px`,
                transform: "translate(-50%, -50%)",
                appearance: "none",
                background: "transparent",
              }}
              aria-label={`Select grid point row ${point.row + 1}, column ${point.col + 1}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedPoint(point);
                setConnectionMenu(null);
              }}
            />
          )}
        </For>
      </div>

      <div class="flex w-full">
        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(8, 1fr)",
            "grid-template-rows": "repeat(3, auto)",
            width: `${tableWidth}px`,
            "max-width": "100%",
            gap: `${elementGridGap}px`,
          }}
        >
          {elements.map((el, idx) => (
            <div style={{ "grid-column": String(el.col), "grid-row": String(el.row) }}>
              <PS_Button
                {...el}
                width={elementButtonWidth}
                height={elementButtonHeight}
                index={idx + 1}
                activeAtom={$activeAtom}
                setActiveAtom={setActiveAtom}
                electronegativity={el.electronegativity}
                onClick={() => fillSelectedPoint(el.number)}
              />
            </div>
          ))}
          <div class="row-start-1 col-start-4 col-end-6 flex items-center justify-center">
            <button
              type="button"
              class="rounded border border-blue-500 bg-blue-500 px-4 py-1.5 text-sm font-mono font-bold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={resetGrid}
            >
              Reset
            </button>
          </div>
          <div class="row-start-1 col-start-7 flex items-center justify-center">
            <button
              type="button"
              class="h-full w-full rounded-lg border border-gray-300 bg-gray-50 px-1 text-[8pt] font-mono font-bold text-gray-700 shadow transition-colors hover:border-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
              aria-label="Delete selected grid point"
              onClick={clearSelectedPoint}
            >
              Del
            </button>
          </div>
        </div>
      </div>

      <Show when={props.debug}>
        <pre class="max-h-56 w-full overflow-auto border border-aidu-line-soft bg-white p-2 text-[10px] leading-snug text-aidu-muted">
          {debugJson()}
        </pre>
      </Show>
      </div>
    </div>
  );
}

export default CreateAMolecule;
