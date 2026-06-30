export interface EducationalMolecule {
  key: string;
  formula: string;
  name: string;
}

const moleculeKey = (parts: Record<string, number>, charge = 0) => {
  const formula = Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, count]) => `${symbol}${count}`)
    .join("");

  return `${formula}|${charge}`;
};

export const educationalMolecules: EducationalMolecule[] = [
  { key: moleculeKey({ H: 2 }), formula: "H₂", name: "hydrogen" },
  { key: moleculeKey({ N: 2 }), formula: "N₂", name: "nitrogen" },
  { key: moleculeKey({ O: 2 }), formula: "O₂", name: "oxygen" },
  { key: moleculeKey({ F: 2 }), formula: "F₂", name: "fluorine" },
  { key: moleculeKey({ Cl: 2 }), formula: "Cl₂", name: "chlorine" },
  { key: moleculeKey({ H: 1, F: 1 }), formula: "HF", name: "hydrogen fluoride" },
  { key: moleculeKey({ H: 1, Cl: 1 }), formula: "HCl", name: "hydrogen chloride" },
  { key: moleculeKey({ H: 2, O: 1 }), formula: "H₂O", name: "water" },
  { key: moleculeKey({ H: 2, S: 1 }), formula: "H₂S", name: "hydrogen sulfide" },
  { key: moleculeKey({ Li: 2, O: 1 }), formula: "Li₂O", name: "lithium oxide" },
  { key: moleculeKey({ Be: 1, O: 1 }), formula: "BeO", name: "beryllium oxide" },
  { key: moleculeKey({ N: 1, H: 3 }), formula: "NH₃", name: "ammonia" },
  { key: moleculeKey({ C: 1, H: 4 }), formula: "CH₄", name: "methane" },
  { key: moleculeKey({ C: 1, O: 2 }), formula: "CO₂", name: "carbon dioxide" },
  { key: moleculeKey({ C: 1, O: 1 }), formula: "CO", name: "carbon monoxide" },
  { key: moleculeKey({ C: 1, S: 2 }), formula: "CS₂", name: "carbon disulfide" },
  { key: moleculeKey({ N: 1, O: 1 }), formula: "NO", name: "nitric oxide" },
  { key: moleculeKey({ N: 1, O: 2 }), formula: "NO₂", name: "nitrogen dioxide" },
  { key: moleculeKey({ S: 1, O: 2 }), formula: "SO₂", name: "sulfur dioxide" },
  { key: moleculeKey({ S: 1, O: 3 }), formula: "SO₃", name: "sulfur trioxide" },
  { key: moleculeKey({ C: 2, H: 6 }), formula: "C₂H₆", name: "ethane" },
  { key: moleculeKey({ C: 2, H: 4 }), formula: "C₂H₄", name: "ethene" },
  { key: moleculeKey({ C: 2, H: 2 }), formula: "C₂H₂", name: "ethyne" },
  { key: moleculeKey({ C: 1, H: 4, O: 1 }), formula: "CH₃OH", name: "methanol" },
  { key: moleculeKey({ C: 1, H: 2, O: 1 }), formula: "CH₂O", name: "formaldehyde" },
  { key: moleculeKey({ C: 2, H: 4, O: 1 }), formula: "CH₃CHO", name: "ethanal" },
  { key: moleculeKey({ C: 1, H: 2, O: 2 }), formula: "HCOOH", name: "formic acid" },
  { key: moleculeKey({ H: 1, C: 1, N: 1 }), formula: "HCN", name: "hydrogen cyanide" },
  { key: moleculeKey({ N: 2, H: 4 }), formula: "N₂H₄", name: "hydrazine" },
  { key: moleculeKey({ N: 1, H: 3 }, 1), formula: "NH₄⁺", name: "ammonium" },
  { key: moleculeKey({ O: 1, H: 1 }, -1), formula: "OH⁻", name: "hydroxide" },
  { key: moleculeKey({ N: 1, O: 3 }, -1), formula: "NO₃⁻", name: "nitrate" },
  { key: moleculeKey({ N: 1, O: 2 }, -1), formula: "NO₂⁻", name: "nitrite" },
  { key: moleculeKey({ S: 1, O: 4 }, -2), formula: "SO₄²⁻", name: "sulfate" },
  { key: moleculeKey({ S: 1, O: 3 }, -2), formula: "SO₃²⁻", name: "sulfite" },
  { key: moleculeKey({ C: 1, O: 3 }, -2), formula: "CO₃²⁻", name: "carbonate" },
];

export const educationalMoleculeByKey = educationalMolecules.reduce<Record<string, EducationalMolecule>>((acc, molecule) => {
  acc[molecule.key] = molecule;
  return acc;
}, {});

export const buildMoleculeKey = moleculeKey;
