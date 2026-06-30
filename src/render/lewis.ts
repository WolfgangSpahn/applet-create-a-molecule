/* 
    Function which takes element number, top|bottom bond position and returns
    lewis structure formula string.
*/


import { elementByNumber } from "../data/elements";
import { BondType } from "../types/chemistry";
import { chemfigLewisToSvg } from "applet-support/chemfig";

const MAX_BONDS: Record<string, number> = {
    H: 1,
    Be: 2,
    B: 3,
    C: 4,
    N: 3,
    O: 2,
    F: 1,
};

const TARGET_ELECTRONS: Record<string, number> = {
    H: 2,
    Be: 4,
    B: 6,
    C: 8,
    N: 8,
    O: 8,
    F: 8,
};

const covalentBondOrder = (leftSymbol: string, rightSymbol: string): 1 | 2 | 3 | null => {
    const left = Object.values(elementByNumber).find((el) => el.symbol === leftSymbol);
    const right = Object.values(elementByNumber).find((el) => el.symbol === rightSymbol);

    if (!left || !right) {
        return null;
    }

    for (const order of [3, 2, 1] as const) {
        if (order > (MAX_BONDS[leftSymbol] ?? 0) || order > (MAX_BONDS[rightSymbol] ?? 0)) {
            continue;
        }

        const leftLonePairs = Math.floor((left.valence - order) / 2);
        const rightLonePairs = Math.floor((right.valence - order) / 2);

        if (leftLonePairs < 0 || rightLonePairs < 0) {
            continue;
        }

        const leftAround = 2 * order + 2 * leftLonePairs;
        const rightAround = 2 * order + 2 * rightLonePairs;

        if (
            leftAround === (TARGET_ELECTRONS[leftSymbol] ?? 0)
            && rightAround === (TARGET_ELECTRONS[rightSymbol] ?? 0)
        ) {
            return order;
        }
    }

    return null;
};

const displayValence = (elementNumber: number): number => {
    const element = elementByNumber[elementNumber];
    if (!element) return 0;

    if (element.valence !== 0) return element.valence;
    if (element.number === 2) return 2;
    return 8;
};

const oppositeAngle = (angle: number): number => (angle + 180) % 360;

const chargeSpecFromOccupancy = (occupancy: Array<{ angle: number; count: number }>): string =>
    occupancy
        .map(({ angle, count }) => {
            if (count >= 2) return `${angle}=\\|`;
            if (count === 1) return `${angle}=\\.`;
            return "";
        })
        .filter(Boolean)
        .join(",");

const targetValence = (elementNumber: number): number => {
    const element = elementByNumber[elementNumber];
    if (!element) return 8;
    return element.number <= 2 ? 2 : 8;
};

const chargeSpecForValence = (
    valence: number,
    facingAngle: number
): string => {
    const angles = [facingAngle, 90, 270, oppositeAngle(facingAngle)];
    const occupancy = angles.map((angle) => ({ angle, count: 0 }));
    let remaining = valence;

    for (const limit of [1, 2]) {
        for (const slot of occupancy) {
            if (remaining <= 0) return chargeSpecFromOccupancy(occupancy);
            if (slot.count < limit) {
                slot.count += 1;
                remaining -= 1;
            }
        }
    }

    return chargeSpecFromOccupancy(occupancy);
};

const fullAtomChargeSpec = (elementNumber: number, facingAngle: number): string =>
    chargeSpecForValence(displayValence(elementNumber), facingAngle);

const bondedAtomChargeSpec = (
    elementNumber: number,
    bondAngle: number,
    order: 1 | 2 | 3
): string => {
    const remainingElectrons = Math.max(0, displayValence(elementNumber) - order);
    const angles = [90, 270, oppositeAngle(bondAngle)].map((angle) => ({ angle, count: 0 }));
    let remaining = remainingElectrons;

    for (const limit of [1, 2]) {
        for (const slot of angles) {
            if (remaining <= 0) return chargeSpecFromOccupancy(angles);
            if (slot.count < limit) {
                slot.count += 1;
                remaining -= 1;
            }
        }
    }

    return chargeSpecFromOccupancy(angles);
};

const chemfigAtom = (elementNumber: number, facingAngle: number): string => {
    const element = elementByNumber[elementNumber];
    if (!element) return "";

    const chargeSpec = fullAtomChargeSpec(elementNumber, facingAngle);
    return String.raw`\chemfig{\charge{${chargeSpec}}{${element.symbol}}}`;
};

const ionChargeText = (charge: number): string => {
    if (charge === 0) return "";

    const sign = charge > 0 ? "+" : "-";
    const magnitude = Math.abs(charge);
    return magnitude === 1 ? sign : `${magnitude}${sign}`;
};

const chemfigIon = (
    elementNumber: number,
    charge: number,
    facingAngle: number
): string => {
    const element = elementByNumber[elementNumber];
    if (!element) return "";

    const visibleValence = charge > 0
        ? 0
        : Math.min(targetValence(elementNumber), displayValence(elementNumber) + Math.abs(charge));
    const chargeSpec = chargeSpecForValence(visibleValence, facingAngle);
    const atom = chargeSpec
        ? String.raw`\charge{${chargeSpec}}{${element.symbol}}`
        : element.symbol;
    const ionCharge = ionChargeText(charge);

    return ionCharge
        ? String.raw`\chemfig{${atom}}^{${ionCharge}}`
        : String.raw`\chemfig{${atom}}`;
};

const chemfigBondedCovalent = (
    topElementNumber: number,
    bottomElementNumber: number
): string | null => {
    const top = elementByNumber[topElementNumber];
    const bottom = elementByNumber[bottomElementNumber];
    if (!top || !bottom) return null;

    const order = covalentBondOrder(top.symbol, bottom.symbol) ?? 1;
    const bondSymbol = order === 1 ? "-" : order === 2 ? "=" : "~";
    const leftChargeSpec = bondedAtomChargeSpec(top.number, 0, order);
    const rightChargeSpec = bondedAtomChargeSpec(bottom.number, 180, order);

    return String.raw`\chemfig{\charge{${leftChargeSpec}}{${top.symbol}}${bondSymbol}\charge{${rightChargeSpec}}{${bottom.symbol}}}`;
};

const extractSvgMetrics = (svg: string): { width: number; height: number; inner: string } => {
    const openTagMatch = svg.match(/<svg\b[^>]*>/i);
    const widthMatch = svg.match(/\bwidth="([^"]+)"/i);
    const heightMatch = svg.match(/\bheight="([^"]+)"/i);
    const viewBoxMatch = svg.match(/\bviewBox="([^"]+)"/i);
    const viewBoxParts = viewBoxMatch?.[1].split(/\s+/).map(Number);

    const widthValue = widthMatch ? Number(widthMatch[1]) : viewBoxParts?.[2] ?? 120;
    const heightValue = heightMatch ? Number(heightMatch[1]) : viewBoxParts?.[3] ?? 120;
    const inner = openTagMatch
        ? svg
            .slice(openTagMatch.index! + openTagMatch[0].length)
            .replace(/<\/svg>\s*$/i, "")
        : svg;

    return {
        width: Number.isFinite(widthValue) ? widthValue : 120,
        height: Number.isFinite(heightValue) ? heightValue : 120,
        inner,
    };
};

const addDescription = (svg: string, description: string): string =>
    svg.replace(/<svg\b([^>]*)>/i, `<svg$1><desc>${description}</desc>`);

const svgToDataUrl = (svg: string): string =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const composedFormulaSvg = (
    leftFormula: string,
    rightFormula: string,
    description: string
): string => {
    const leftSvg = extractSvgMetrics(chemfigLewisToSvg(leftFormula));
    const rightSvg = extractSvgMetrics(chemfigLewisToSvg(rightFormula));
    const cropX = 18;
    const croppedLeftWidth = Math.max(1, leftSvg.width - cropX * 2);
    const croppedRightWidth = Math.max(1, rightSvg.width - cropX * 2);
    const gap = 24;
    const padding = 8;
    const width = croppedLeftWidth + croppedRightWidth + gap + padding * 2;
    const height = Math.max(leftSvg.height, rightSvg.height) + padding * 2;
    const leftY = padding + (height - padding * 2 - leftSvg.height) / 2;
    const rightY = padding + (height - padding * 2 - rightSvg.height) / 2;

    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <desc>${description}</desc>
            <g transform="translate(${padding - cropX} ${leftY})">${leftSvg.inner}</g>
            <g transform="translate(${padding + croppedLeftWidth + gap - cropX} ${rightY})">${rightSvg.inner}</g>
        </svg>
    `;
};

const composedSeparatedSvg = (
    topElementNumber: number,
    bottomElementNumber: number
): string => {
    const top = elementByNumber[topElementNumber];
    const bottom = elementByNumber[bottomElementNumber];
    return composedFormulaSvg(
        chemfigAtom(topElementNumber, 0),
        chemfigAtom(bottomElementNumber, 180),
        `${top?.symbol ?? ""} and ${bottom?.symbol ?? ""} separated Lewis structures`
    );
};

const ionicTransfer = (
    topElementNumber: number,
    bottomElementNumber: number
): { topCharge: number; bottomCharge: number; transfer: number } => {
    const top = elementByNumber[topElementNumber];
    const bottom = elementByNumber[bottomElementNumber];
    if (!top || !bottom || top.electronegativity == null || bottom.electronegativity == null) {
        return { topCharge: 0, bottomCharge: 0, transfer: 0 };
    }

    const topIsDonor = top.electronegativity < bottom.electronegativity;
    const donor = topIsDonor ? top : bottom;
    const acceptor = topIsDonor ? bottom : top;
    const donorCanLose = Math.max(0, displayValence(donor.number));
    const acceptorCanGain = Math.max(0, targetValence(acceptor.number) - displayValence(acceptor.number));
    const transfer = Math.min(donorCanLose, acceptorCanGain);

    if (transfer <= 0) {
        return { topCharge: 0, bottomCharge: 0, transfer: 0 };
    }

    return {
        topCharge: topIsDonor ? transfer : -transfer,
        bottomCharge: topIsDonor ? -transfer : transfer,
        transfer,
    };
};

const composedIonicSvg = (
    topElementNumber: number,
    bottomElementNumber: number
): string => {
    const top = elementByNumber[topElementNumber];
    const bottom = elementByNumber[bottomElementNumber];
    const transfer = ionicTransfer(topElementNumber, bottomElementNumber);

    return composedFormulaSvg(
        chemfigIon(topElementNumber, transfer.topCharge, 0),
        chemfigIon(bottomElementNumber, transfer.bottomCharge, 180),
        `${top?.symbol ?? ""}${ionChargeText(transfer.topCharge)} and ${bottom?.symbol ?? ""}${ionChargeText(transfer.bottomCharge)} ionic Lewis structures, ${transfer.transfer} electron${transfer.transfer === 1 ? "" : "s"} transferred`
    );
};

export function lewisSvgStructure(
    topElementNumber: number,
    bottomElementNumber: number,
    bondType: BondType,
    isClose: boolean
): string | null {
    const top = elementByNumber[topElementNumber];
    const bottom = elementByNumber[bottomElementNumber];

    if (!top || !bottom) {
        return null;
    }

    if (!isClose) {
        return svgToDataUrl(composedSeparatedSvg(topElementNumber, bottomElementNumber));
    }

    if (bondType === "ionic") {
        return svgToDataUrl(composedIonicSvg(topElementNumber, bottomElementNumber));
    }

    if (bondType !== "covalent") {
        return svgToDataUrl(composedSeparatedSvg(topElementNumber, bottomElementNumber));
    }

    const formula = chemfigBondedCovalent(topElementNumber, bottomElementNumber);
    if (!formula) return null;

    return svgToDataUrl(addDescription(
        chemfigLewisToSvg(formula),
        `${top.symbol}-${bottom.symbol} bonded Lewis structure`
    ));
}

export function lewisAtomSvgStructure(elementNumber: number): string | null {
    const element = elementByNumber[elementNumber];
    if (!element) {
        return null;
    }

    return svgToDataUrl(addDescription(
        chemfigLewisToSvg(chemfigAtom(elementNumber, 0)),
        `${element.symbol} atom Lewis structure`
    ));
}

export async function lewisSvgDescription(svgAssetPath: string): Promise<string> {
    try {
        const response = await fetch(svgAssetPath);
        if (!response.ok) {
            console.error(`Failed to fetch SVG at ${svgAssetPath}: ${response.statusText}`);
            return `could not load ${svgAssetPath}`;
        }

        const svgText = await response.text();
        const descMatch = svgText.match(/<(?:[A-Za-z0-9_]+:)?desc>(.*?)<\/(?:[A-Za-z0-9_]+:)?desc>/s);
        if (descMatch && descMatch[1]) {
            return descMatch[1].trim();
        }

        return "Unknown structure";
    } catch (error) {
        console.error(`Error loading SVG description from ${svgAssetPath}:`, error);
        return `could not load ${svgAssetPath}`;
    }
}

export function lewisStructure(
    elementNumber: number,
    bondPosition: "top" | "bottom",
    bondType: BondType = "covalent"
): string {
    const element = elementByNumber[elementNumber];

    if (!element) return "";

    if (bondType === "ionic" && element.ion) {
        return element.ion;
    }

    const symbol = element.symbol; 
    const valenceElectrons = element.valence;
    console.log(`Generating Lewis structure for ${symbol} with ${valenceElectrons} valence electrons.`);
    if (valenceElectrons === 1) return symbol;
    // one valence electron, one for bond
    if (valenceElectrons === 2) return bondPosition === "bottom" ? `·${symbol}` : `${symbol}·`;
    // two valence electrons, one for bond, one lone pair
    if (valenceElectrons === 3) return bondPosition === "bottom" ? `:${symbol}` : `${symbol}:`;
    // three valence electrons, one for bond, one lone pair, one single electron
    if (valenceElectrons === 4) return bondPosition === "bottom" ? `·:${symbol}` : `${symbol}:·`;
    // four valence electrons, one for bond, one lone pair, two single electrons
    if (valenceElectrons === 5) return bondPosition === "bottom" ? `::${symbol}` : `${symbol}::`;
    // five valence electrons, one for bond, two lone pairs, one single electron
    if (valenceElectrons === 6) return bondPosition === "bottom" ? `·::${symbol}` : `${symbol}::·`;
    // six valence electrons, one for bond, three lone pairs
    if (valenceElectrons === 7) return bondPosition === "bottom" ? `:::${symbol}` : `${symbol}:::`;
    // seven valence electrons, one for bond, three lone pairs, one single electron
    if (valenceElectrons === 8) return bondPosition === "bottom" ? `·:::${symbol}` : `${symbol}:::·`;
    // eight valence electrons, one for bond, four lone pairs

    return symbol;
}

export function lewisStructureWithBond(
    topElementNumber: number,
    bottomElementNumber: number,
    bondType: BondType
): string {
    const top = elementByNumber[topElementNumber];
    const bottom = elementByNumber[bottomElementNumber];

    if (!top || !bottom) {
        return "";
    }

    const topStructure = lewisStructure(topElementNumber, "top", bondType);
    const bottomStructure = lewisStructure(bottomElementNumber, "bottom", bondType);
    const bondSymbol = bondType === "ionic" ? " " : bondType === "metallic" ? " " : bondType === "none" ? " " : "-";

    return `${topStructure}${bondSymbol}${bottomStructure}`;
}
