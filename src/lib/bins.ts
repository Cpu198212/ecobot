export const BINS = [
  {
    id: "plastic",
    label: "Plastic",
    bin: "Plastics recycling",
    tip: "Empty it and give it a quick rinse. Leave the cap on if your city takes it.",
  },
  {
    id: "paper",
    label: "Paper & cardboard",
    bin: "Paper recycling",
    tip: "Keep it dry and flatten boxes. Greasy food cardboard goes in general waste.",
  },
  {
    id: "glass",
    label: "Glass",
    bin: "Glass recycling",
    tip: "Empty and rinse. Take the cap or cork off. No ceramics, mirrors, or light bulbs.",
  },
  {
    id: "metal",
    label: "Metal",
    bin: "Metal recycling",
    tip: "Rinse cans. Clean foil can go in if you ball it up.",
  },
  {
    id: "organic",
    label: "Organic",
    bin: "Compost",
    tip: "Food scraps and yard waste. Skip ordinary plastic bags.",
  },
  {
    id: "textile",
    label: "Textile",
    bin: "Donation or textile recycling",
    tip: "Clean clothes and shoes can be donated. Worn-out fabric goes to a textile point.",
  },
  {
    id: "hazardous",
    label: "Hazardous",
    bin: "Special collection",
    tip: "Batteries, paint, and chemicals need a drop-off. Never the trash or the recycling.",
  },
  {
    id: "ewaste",
    label: "E-waste",
    bin: "Electronics drop-off",
    tip: "Phones, cables, and devices. Do not put them in a household bin.",
  },
  {
    id: "landfill",
    label: "General waste",
    bin: "Residual bin",
    tip: "Mixed or contaminated items that cannot be recycled cleanly.",
  },
] as const;

export type BinId = (typeof BINS)[number]["id"];

export const FINES = [
  "battery",
  "biological",
  "brown-glass",
  "cardboard",
  "clothes",
  "green-glass",
  "metal",
  "paper",
  "plastic",
  "shoes",
  "trash",
  "white-glass",
] as const;

export type FineId = (typeof FINES)[number];

export const FINE_LABEL: Record<FineId, string> = {
  battery: "Battery",
  biological: "Food waste",
  "brown-glass": "Brown glass",
  cardboard: "Cardboard",
  clothes: "Clothes",
  "green-glass": "Green glass",
  metal: "Metal",
  paper: "Paper",
  plastic: "Plastic",
  shoes: "Shoes",
  trash: "Residual trash",
  "white-glass": "Clear glass",
};

export const FINE_BIN: Record<FineId, BinId> = {
  battery: "hazardous",
  biological: "organic",
  "brown-glass": "glass",
  cardboard: "paper",
  clothes: "textile",
  "green-glass": "glass",
  metal: "metal",
  paper: "paper",
  plastic: "plastic",
  shoes: "textile",
  trash: "landfill",
  "white-glass": "glass",
};

export function binById(id: BinId) {
  const found = BINS.find((bin) => bin.id === id);
  if (!found) throw new Error(`Unknown bin ${id}`);
  return found;
}

export function isBinId(value: unknown): value is BinId {
  return typeof value === "string" && BINS.some((bin) => bin.id === value);
}

export function isFineId(value: unknown): value is FineId {
  return typeof value === "string" && (FINES as readonly string[]).includes(value);
}
