

// ----------------------------------------------------------------------------------------------
// render/Atom.tsx
// ----------------------------------------------------------------------------------------------

import { BondType } from "../types/chemistry";
import { plus, plusMinus } from "./symbols";
import { minus } from "./symbols";

type RenderAtomProps = {
    x: number;
    y: number;
    symbol: string;
    number: number;
    atomRadius: number;
    atomCore:number;
    valence: number;
    ionRadius: number;
    electronegativity: number;
    isClose: boolean;
    onDown?: (e: PointerEvent) => void;
    bondType:  BondType;
    polarity?: "positive" | "negative" | "neutral";
    electronStyle?: "open" | "filled";
    bondElectronOffset?: number;
    ionCharge?: number;
    outerElectronCount?: number;
    transferredElectronCount?: number;
    transferredElectronStyle?: "open" | "filled";
};

// Render function for an atom
export function renderAtomChargeCloud({ 
    x,
    y,
    symbol,
    atomRadius,
    atomCore,
    valence,
    ionRadius,
    electronegativity,
    isClose,
    onDown,
    bondType,
    polarity
    }: RenderAtomProps) {

  const visualGap = 6; // minimum separation (important!)
  const shellRadius = atomCore + visualGap + (atomRadius - atomCore) * 0.8;

  let coreRadius = atomCore;
  let gap = (shellRadius + coreRadius) /2;

  // scale opacity from 0.4 to 0.9 based on valence for 1 to 7
  let opacity = 0.3 + (valence - 1) * ((0.9 - 0.3) / 6);
  return (
      <g transform={`translate(${x}, ${y})`} >
        {(!isClose || bondType === 'none') && (
          <>
            {/* Case 1: valence electrons exists */}
            {valence !== 0 && (
              <>
              <g>
                {/* draw symbol above atom */}
                <text
                  x="0"
                  y={-shellRadius - 12}
                  text-anchor="middle"
                  font-size="16"
                  fill="black"
                  pointer-events="none"
                >
                  {symbol}
                </text>
                {/* electron shell */}
                <circle
                    r={shellRadius}
                    opacity={opacity}
                    fill="url(#shellGradient)"
                    cursor={onDown ? "grab" : "default"}
                    onPointerDown={onDown}
                />
                <circle
                    r={coreRadius}
                    class={"fill-red-500"}
                    pointer-events="none"
                />
                <g pointer-events="none">
                    {plus({size: 12,gap: 0,stroke: 4})}
                    {minus({size: 12,gap: gap,stroke: 4})}

                </g>
              </g>
              </>
            )}
            {/* Case 2: no valence electrons */}
            {valence === 0 && (
              <>
                {/* draw symbol above atom */}
                <text
                  x="0"
                  y={-shellRadius - 12}
                  text-anchor="middle"
                  font-size="16"
                  fill="black"
                  pointer-events="none"
                >
                  {symbol}
                </text>
                <circle
                  r={coreRadius}
                  class="fill-black"
                  cursor={onDown ? "grab" : "default"}
                  onPointerDown={onDown}
                />
                <g pointer-events="none">
                    {plus({size: 8,gap: 0,stroke: 4})}
                    {minus({size: 8,gap: 8,stroke: 4})}

                </g>
              </>
            )}
          </>
        )}
        {isClose && bondType === 'covalent' && (
            <>
            {/* draw symbol above atom */}
            <text
              x="0"
              y={-shellRadius - 12}
              text-anchor="middle"
              font-size="16"
              fill="black"
              pointer-events="none"
            >
              {symbol}
            </text>
            <circle r={coreRadius} class={onDown ? "fill-red-500 cursor-grab active:cursor-grabbing" : "fill-red-500"} 
            onPointerDown={onDown}/>;
            {plus({size: 15,gap: 0,stroke: 4})}
            </>
        )}
        {isClose && bondType === 'metallic' && (
            <>
            {/* draw symbol above atom */}
            <text
              x="0"
              y={-coreRadius - 12}
              text-anchor="middle"
              font-size="16"
              fill="black"
              pointer-events="none"
            >
              {symbol}
            </text>
            <circle
                r={coreRadius}
                class={onDown ? "fill-red-500 cursor-grab active:cursor-grabbing" : "fill-red-500"}
                onPointerDown={onDown}
            />
            {plus({size: 20,gap: 0,stroke: 4})}
            </>
        )}

        {isClose && bondType === 'ionic' && polarity === "negative" && (
            <>
            {/* draw symbol above atom */}
            <text
              x="0"
              y={-ionRadius - 12}
              text-anchor="middle"
              font-size="16"
              fill="black"
              pointer-events="none"
            >
              {symbol}
            </text>
            <circle r={ionRadius} class={onDown ? "fill-blue-500 cursor-grab active:cursor-grabbing" : "fill-blue-500"} 
            onPointerDown={onDown}/>;
            {minus({size: 20,gap: 0,stroke: 4})}
            </>
        )}

        {isClose && bondType === 'ionic' && polarity === "positive" && (
            <>
            {/* draw symbol above atom */}
            <text
              x="0"
              y={-ionRadius - 12}
              text-anchor="middle"
              font-size="16"
              fill="black"
              pointer-events="none"
            >
              {symbol}
            </text>
            <circle r={ionRadius} class={onDown ? "fill-red-500 cursor-grab active:cursor-grabbing" : "fill-red-500"} 
            onPointerDown={onDown}/>;
            {plus({size: 20,gap: 0,stroke: 4})}
            </>
        )}   
      </g>
  );
  }

// ---- helpers for renderAtomWithElectronOrbits --------------------------------------------------

/** Electron counts per shell [s1, s2?, s3?] for Z ≤ 18 */
function shellElectrons(atomicNumber: number): number[] {
  const shells: number[] = [Math.min(atomicNumber, 2)];
  if (atomicNumber > 2)  shells.push(Math.min(atomicNumber - 2,  8));
  if (atomicNumber > 10) shells.push(Math.min(atomicNumber - 10, 8));
  return shells;
}

/**
 * Distribute `count` electrons across 4 positions [N, E, S, W].
 * Single electrons first (Hund's rule), then pair up.
 */
function distributeOctet(count: number): [number, number, number, number] {
  const p: [number, number, number, number] = [0, 0, 0, 0];
  for (let i = 0; i < Math.min(count, 4); i++) p[i]++;   // one each
  for (let i = 0; i < count - 4 && i < 4;  i++) p[i]++;  // pair up
  return p;
}

/**
 * Render 1 or 2 electron dots centred at (cx, cy).
 * pdx/pdy is the unit perpendicular direction used for pair separation.
 */
function electronDots(
  cx: number,
  cy: number,
  n: number,
  pdx: number,
  pdy: number,
  style: "open" | "filled"
) {
  const gap = 4;
  if (n === 1) return electronMark(cx, cy, style);
  if (n > 2) {
    const start = -((n - 1) * gap) / 2;
    return (
      <>
        {Array.from({ length: n }, (_, index) =>
          electronMark(cx + pdx * (start + index * gap), cy + pdy * (start + index * gap), style)
        )}
      </>
    );
  }

  return (
    <>
      {electronMark(cx - pdx * gap, cy - pdy * gap, style)}
      {electronMark(cx + pdx * gap, cy + pdy * gap, style)}
    </>
  );
}

type ElectronSide = "N" | "E" | "S" | "W";
type ElectronStyle = "open" | "filled";

function electronMark(cx: number, cy: number, style: ElectronStyle) {
  const r = 3.8;

  if (style === "open") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="white"
        stroke="#111"
        stroke-width="1.5"
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="#111"
      stroke="#111"
      stroke-width="1.5"
    />
  );
}

function nonBondingCounts(valence: number, bondSide: ElectronSide): Record<ElectronSide, number> {
  const counts: Record<ElectronSide, number> = { N: 0, E: 0, S: 0, W: 0 };
  if (valence <= 0) return counts;

  let remaining = valence - 1;
  const order: ElectronSide[] = bondSide === "E"
    ? ["N", "S", "W"]
    : ["N", "S", "E"];

  for (const limit of [1, 2]) {
    for (const side of order) {
      if (remaining <= 0) return counts;
      if (counts[side] < limit) {
        counts[side] += 1;
        remaining -= 1;
      }
    }
  }

  return counts;
}

function facingValenceCounts(valence: number, facingSide: ElectronSide): Record<ElectronSide, number> {
  const counts: Record<ElectronSide, number> = { N: 0, E: 0, S: 0, W: 0 };
  if (valence <= 0) return counts;

  const order: ElectronSide[] = facingSide === "E"
    ? ["E", "N", "S", "W"]
    : ["W", "N", "S", "E"];
  let remaining = valence;

  for (const limit of [1, 2]) {
    for (const side of order) {
      if (remaining <= 0) return counts;
      if (counts[side] < limit) {
        counts[side] += 1;
        remaining -= 1;
      }
    }
  }

  return counts;
}

function orderedSidesFromFacing(facingSide: ElectronSide): ElectronSide[] {
  return facingSide === "E" ? ["E", "N", "S", "W"] : ["W", "N", "S", "E"];
}

function ionicAcceptorOwnCounts(
  ownElectrons: number,
  atomicNumber: number,
  facingSide: ElectronSide
): Record<ElectronSide, number> {
  const counts: Record<ElectronSide, number> = { N: 0, E: 0, S: 0, W: 0 };
  const target = atomicNumber <= 2 ? 2 : 8;

  if (target === 2) {
    counts[facingSide] = Math.min(1, ownElectrons);
    return counts;
  }

  const unpairedCount = target - ownElectrons;
  if (unpairedCount < 1 || unpairedCount > 4) {
    return facingValenceCounts(ownElectrons, facingSide);
  }

  const unpairedSides = orderedSidesFromFacing(facingSide).slice(0, unpairedCount);
  for (const side of unpairedSides) counts[side] = 1;
  for (const side of orderedSidesFromFacing(facingSide)) {
    if (!unpairedSides.includes(side)) counts[side] = 2;
  }

  return counts;
}

function transferredElectronCounts(
  ownCounts: Record<ElectronSide, number>,
  transferCount: number,
  facingSide: ElectronSide
): Record<ElectronSide, number> {
  const counts: Record<ElectronSide, number> = { N: 0, E: 0, S: 0, W: 0 };
  let remaining = transferCount;

  for (const side of orderedSidesFromFacing(facingSide)) {
    if (remaining <= 0) return counts;
    if (ownCounts[side] === 1) {
      counts[side] = 1;
      remaining -= 1;
    }
  }

  return counts;
}

function dotCrossElectrons(
  counts: Record<ElectronSide, number>,
  radius: number,
  style: ElectronStyle
) {
  const sides: Array<{ side: ElectronSide; x: number; y: number; pdx: number; pdy: number }> = [
    { side: "N", x: 0, y: -radius, pdx: 1, pdy: 0 },
    { side: "E", x: radius, y: 0, pdx: 0, pdy: 1 },
    { side: "S", x: 0, y: radius, pdx: 1, pdy: 0 },
    { side: "W", x: -radius, y: 0, pdx: 0, pdy: 1 },
  ];
  const gap = 5;

  return sides.map(({ side, x, y, pdx, pdy }) => {
    const count = counts[side];
    if (count <= 0) return null;
    if (count === 1) return electronMark(x, y, style);

    return (
      <>
        {electronMark(x - pdx * gap, y - pdy * gap, style)}
        {electronMark(x + pdx * gap, y + pdy * gap, style)}
      </>
    );
  });
}

function mixedDotCrossElectrons(
  ownCounts: Record<ElectronSide, number>,
  transferredCounts: Record<ElectronSide, number>,
  radius: number,
  ownStyle: ElectronStyle,
  transferredStyle: ElectronStyle
) {
  const sides: Array<{ side: ElectronSide; x: number; y: number; pdx: number; pdy: number }> = [
    { side: "N", x: 0, y: -radius, pdx: 1, pdy: 0 },
    { side: "E", x: radius, y: 0, pdx: 0, pdy: 1 },
    { side: "S", x: 0, y: radius, pdx: 1, pdy: 0 },
    { side: "W", x: -radius, y: 0, pdx: 0, pdy: 1 },
  ];
  const gap = 5;

  return sides.map(({ side, x, y, pdx, pdy }) => {
    const electrons: ElectronStyle[] = [
      ...Array.from({ length: ownCounts[side] }, () => ownStyle),
      ...Array.from({ length: transferredCounts[side] }, () => transferredStyle),
    ];

    if (electrons.length <= 0) return null;
    if (electrons.length === 1) return electronMark(x, y, electrons[0]);

    const start = -((electrons.length - 1) * gap) / 2;
    return (
      <>
        {electrons.map((style, index) =>
          electronMark(x + pdx * (start + index * gap), y + pdy * (start + index * gap), style)
        )}
      </>
    );
  });
}

function chargeLabel(charge?: number) {
  if (!charge) return "";
  const sign = charge > 0 ? "+" : "-";
  const magnitude = Math.abs(charge);
  return magnitude === 1 ? sign : `${magnitude}${sign}`;
}

// ---- new render function -----------------------------------------------------------------------

/**
 * Render an atom with concentric orbit circles.
 *  - One circle per electron shell.
 *  - Shell 1: single position at the top of the orbit (holds 1 or 2 electrons side-by-side).
 *  - Shells 2+: four positions N / E / S / W, each holding 1 or 2 electrons.
 *    Filling follows Hund's rule: one electron per position first, then pair up.
 */
export function renderAtomWithElectronOrbits({
    x,
    y,
    symbol,
    number,
    atomRadius,
    atomCore,
    valence,
    ionRadius,
    electronegativity,
    isClose,
    onDown,
    bondType,
    polarity,
    electronStyle = "filled",
    bondElectronOffset,
    ionCharge,
    outerElectronCount,
    transferredElectronCount = 0,
    transferredElectronStyle = electronStyle,
}: RenderAtomProps) {

  const shells   = shellElectrons(number);
  const n        = shells.length;
  const nucleusR = Math.max(atomCore * 0.35, 5);
  const bondedOrbitPadding = isClose && bondType === "covalent"
    ? (bondElectronOffset ?? 0) + 12
    : 0;
  const baseOuterR = Math.max(atomRadius * 0.95, 42);
  const outerR = Math.max(baseOuterR, bondedOrbitPadding);
  const orbitR = shells.map((_, i) => {
    const isOuterShell = i === n - 1;
    if (isOuterShell) return outerR;
    return nucleusR + (baseOuterR - nucleusR) * (i + 1) / n;
  });
  const symbolY  = -(orbitR[n - 1] + 14);

  const orbitShells = (showElectrons: boolean) => (
    <>
      {shells.map((eCount, si) => {
        const R = orbitR[si];
        const isOuterShell = si === shells.length - 1;
        const facingSide: ElectronSide = electronStyle === "open" ? "E" : "W";

        if (isClose && bondType === "covalent" && isOuterShell) {
          return (
            <g pointer-events="none">
              <circle r={R} fill="none" stroke="#bbb" stroke-width="0.8" stroke-dasharray="3 2" />
              {showElectrons && dotCrossElectrons(
                nonBondingCounts(valence, facingSide),
                R,
                electronStyle
              )}
            </g>
          );
        }

        if (isOuterShell) {
          const visibleElectrons = outerElectronCount ?? (valence > 0 ? valence : eCount);
          const ownElectrons = Math.max(0, visibleElectrons - transferredElectronCount);
          const ownCounts = ionicAcceptorOwnCounts(ownElectrons, number, facingSide);
          const transferCounts = transferredElectronCounts(ownCounts, transferredElectronCount, facingSide);
          return (
            <g pointer-events="none">
              <circle r={R} fill="none" stroke="#bbb" stroke-width="0.8" stroke-dasharray="3 2" />
              {showElectrons && (
                transferredElectronCount > 0
                  ? mixedDotCrossElectrons(ownCounts, transferCounts, R, electronStyle, transferredElectronStyle)
                  : dotCrossElectrons(facingValenceCounts(ownElectrons, facingSide), R, electronStyle)
              )}
            </g>
          );
        }

        if (si === 0) {
          return (
            <g pointer-events="none">
              <circle r={R} fill="none" stroke="#bbb" stroke-width="0.8" stroke-dasharray="3 2" />
              {showElectrons && electronDots(0, -R, eCount, 1, 0, electronStyle)}
            </g>
          );
        }

        const [nN, nE, nS, nW] = distributeOctet(eCount);
        return (
          <g pointer-events="none">
            <circle r={R} fill="none" stroke="#bbb" stroke-width="0.8" stroke-dasharray="3 2" />
            {showElectrons && nN > 0 && electronDots(  0, -R, nN, 1, 0, electronStyle)}
            {showElectrons && nE > 0 && electronDots(  R,  0, nE, 0, 1, electronStyle)}
            {showElectrons && nS > 0 && electronDots(  0,  R, nS, 1, 0, electronStyle)}
            {showElectrons && nW > 0 && electronDots( -R,  0, nW, 0, 1, electronStyle)}
          </g>
        );
      })}
    </>
  );

  const atomCoreView = () => (
    <g>
      <circle r={nucleusR} fill="#c0392b" cursor={onDown ? "grab" : "default"} onPointerDown={onDown} />
      {orbitShells(true)}

      <text x="0" y={symbolY} text-anchor="middle" font-size="16"
            fill="black" pointer-events="none">
        {symbol}
      </text>
      {chargeLabel(ionCharge) && (
        <text
          x="18"
          y={symbolY - 12}
          text-anchor="middle"
          font-size="13"
          font-weight="700"
          fill="black"
          pointer-events="none"
        >
          {chargeLabel(ionCharge)}
        </text>
      )}
    </g>
  );

  const bondedOrbitAtom = () => {
    const direction = electronStyle === "open" ? 1 : -1;
    const pairOffset = bondElectronOffset ?? outerR;

    return (
      <>
        {atomCoreView()}
        <g pointer-events="none">
          {electronMark(direction * pairOffset, electronStyle === "open" ? -5 : 5, electronStyle)}
        </g>
      </>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>

      {(!isClose || bondType === 'none') && atomCoreView()}

      {isClose && bondType === 'covalent' && (
        bondedOrbitAtom()
      )}

      {isClose && bondType === 'metallic' && (
        atomCoreView()
      )}

      {isClose && bondType === 'ionic' && polarity === 'negative' && (
        atomCoreView()
      )}

      {isClose && bondType === 'ionic' && polarity === 'positive' && (
        atomCoreView()
      )}

    </g>
  );
}
