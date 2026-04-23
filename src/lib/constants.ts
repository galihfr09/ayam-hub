type DailyFeedNeeds = { week: number | string; gramPerBird: number };

// Mapping data berdasarkan Bab 2.3
export const FEED_CONSUMPTION_STANDARDS: DailyFeedNeeds[] =[
  { week: 1, gramPerBird: 5 }, { week: 2, gramPerBird: 10 }, { week: 3, gramPerBird: 15 },
  { week: 4, gramPerBird: 20 }, { week: 5, gramPerBird: 32 }, { week: 6, gramPerBird: 37 },
  { week: 7, gramPerBird: 42 }, { week: 8, gramPerBird: 55 }, 
  { week: "9-10", gramPerBird: 60 }, { week: "11-12", gramPerBird: 67.5 },
  { week: "13-16", gramPerBird: 72.5 }, { week: "17-20", gramPerBird: 90 },
  { week: "21-24", gramPerBird: 100 }, { week: ">24", gramPerBird: 110 }
];

export type PhaseTarget = {
  id: string; 
  name: string; 
  minPK: number; 
  maxPK: number; 
  minEM: number; 
  maxEM: number;
  targetCa: string;
  targetP: string;
  fixedIngredients: Record<string, number>;
};

// Mapping data berdasarkan Tabel 2.2
export const NUTRITION_TARGETS: PhaseTarget[] =[
  { 
    id: "starter", name: "Starter (0-4 Minggu)", 
    minPK: 20, maxPK: 22, minEM: 2800, maxEM: 2900,
    targetCa: "0.9%", targetP: "0.5%",
    fixedIngredients: { kapur: 1.0, dcp: 0.5 }
  },
  { 
    id: "grower", name: "Grower (4-12 Minggu)", 
    minPK: 17, maxPK: 18, minEM: 2800, maxEM: 2900,
    targetCa: "0.9%", targetP: "0.5%",
    fixedIngredients: { kapur: 0.8, dcp: 0.5 }
  },
  { 
    id: "developer", name: "Developer (12-24 Minggu)", 
    minPK: 14, maxPK: 16, minEM: 2700, maxEM: 2800,
    targetCa: "0.9%", targetP: "0.4%",
    fixedIngredients: { kapur: 0.8, dcp: 0.4 }
  },
  { 
    id: "layer", name: "Layer (>24 Minggu)", 
    minPK: 16, maxPK: 17, minEM: 2700, maxEM: 2800,
    targetCa: "3.25-3.5%", targetP: "0.4%",
    fixedIngredients: { kapur: 5.5, dcp: 1.0 }
  }
];

export type Ingredient = { id: string; name: string; pk: number; em: number };
// Mapping data berdasarkan Tabel 3.2 & Contoh 4.2
export const INGREDIENTS: Ingredient[] =[
  { id: "jagung", name: "Jagung Kuning", pk: 8.9, em: 3340 },
  { id: "dedak", name: "Dedak Padi Halus", pk: 12.5, em: 1630 },
  { id: "bungkil_kedelai", name: "Bungkil Kedelai", pk: 44.5, em: 2240 },
  { id: "tepung_ikan", name: "Tepung Ikan", pk: 62.5, em: 2820 },
  { id: "bungkil_kelapa", name: "Bungkil Kelapa", pk: 22, em: 1540 },
  { id: "daun_lamtoro", name: "Tepung Daun Lamtoro", pk: 23.5, em: 1900 },
  { id: "ampas_tahu", name: "Ampas Tahu", pk: 24, em: 1200 },
  { id: "minyak_sawit", name: "Minyak Kelapa Sawit", pk: 0, em: 8800 },
  { id: "kapur", name: "Kapur/CaCO3", pk: 0, em: 0 },
  { id: "dcp", name: "Dikalsium Fosfat", pk: 0, em: 0 },
  { id: "garam", name: "Garam (NaCl)", pk: 0, em: 0 },
  { id: "topmix", name: "Top Mix / Premix", pk: 0, em: 0 }
];
