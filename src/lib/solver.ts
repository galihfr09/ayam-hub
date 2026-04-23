import { INGREDIENTS } from './constants';

export function solveFormulation(
  selectedIds: string[],
  minPK: number,
  maxPK: number,
  minEM: number,
  fixedIngredients: Record<string, number>
) {
  // force include garam and topmix as bounded variables
  const mandatoryBounded = {
    garam: { min: 0.3, max: 0.5 },
    topmix: { min: 0.2, max: 0.5 }
  };

  const variableIds = Array.from(new Set([...selectedIds, 'garam', 'topmix'])).filter(id => !(id in fixedIngredients));
  const ingredients = INGREDIENTS.filter(i => variableIds.includes(i.id));

  if (ingredients.length < 2) return { success: false, result: {}, message: 'Pilih minimal 2 bahan pangan tambahan untuk dikalkulasi.' };

  const bounds = ingredients.map(ing => {
    if (ing.id in mandatoryBounded) return mandatoryBounded[ing.id as keyof typeof mandatoryBounded];
    return { min: 0, max: 100 };
  });

  let fixedWeight = 0;
  let fixedPK = 0;
  let fixedEM = 0;

  for (const [id, weight] of Object.entries(fixedIngredients)) {
     fixedWeight += weight;
     const ingDef = INGREDIENTS.find(i => i.id === id);
     if (ingDef) {
        fixedPK += (weight / 100) * ingDef.pk;
        fixedEM += (weight / 100) * ingDef.em;
     }
  }

  const freeWeight = 100 - fixedWeight;
  if (freeWeight <= 0) return { success: false, result: {}, message: 'Komposisi bahan baku tetap terlalu besar (>= 100%).' };

  // Generate initial weights satisfying min bounds
  let bestWeights = ingredients.map((ing, idx) => bounds[idx].min);
  let remain = freeWeight - bestWeights.reduce((a,b)=>a+b, 0);
  if (remain < 0) return { success: false, result: {}, message: 'Komposisi minimum wajib melebihi batas 100%!' };

  for (let i = 0; i < ingredients.length; i++) {
     let add = Math.min(remain, bounds[i].max - bestWeights[i]);
     bestWeights[i] += add;
     remain -= add;
  }

  // Cost function
  const evaluate = (weights: number[]) => {
    let pk = fixedPK;
    let em = fixedEM;
    for (let i = 0; i < ingredients.length; i++) {
       pk += (weights[i] / 100) * ingredients[i].pk;
       em += (weights[i] / 100) * ingredients[i].em;
    }
    let cost = 0;
    if (pk < minPK) cost += (minPK - pk) * 100;
    if (pk > maxPK) cost += (pk - maxPK) * 100;
    if (em < minEM) cost += (minEM - em) / 2;
    return { pk, em, cost };
  };

  let bestEval = evaluate(bestWeights);

  const MAX_ITER = 300000;
  let currentWeights = [...bestWeights];
  let currentEval = bestEval;
  let temp = 100; // Simulated annealing temperature
  const alpha = 0.99995;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    if (bestEval.cost === 0) break;

    let i = Math.floor(Math.random() * ingredients.length);
    let j = Math.floor(Math.random() * ingredients.length);
    while (i === j) j = Math.floor(Math.random() * ingredients.length);

    let maxStep = Math.min(
      currentWeights[i] - bounds[i].min,
      bounds[j].max - currentWeights[j]
    );

    if (maxStep <= 0) continue;

    let step = Math.random() * 5 * Math.max(0.1, (temp / 100)); 
    if (step > maxStep) step = maxStep;

    let nextWeights = [...currentWeights];
    nextWeights[i] -= step;
    nextWeights[j] += step;

    let nextEval = evaluate(nextWeights);

    if (nextEval.cost === 0) {
      bestWeights = nextWeights;
      bestEval = nextEval;
      break;
    }

    if (nextEval.cost < currentEval.cost || Math.random() < Math.exp((currentEval.cost - nextEval.cost) / temp)) {
      currentWeights = nextWeights;
      currentEval = nextEval;
      if (nextEval.cost < bestEval.cost) {
        bestWeights = [...nextWeights];
        bestEval = nextEval;
      }
    }
    temp *= alpha;
  }

  // Final rounding to 1 decimal place
  let rounded = bestWeights.map(w => Number(w.toFixed(1)));
  // Fix sum to exactly freeWeight due to rounding, respect bounds
  let diff = freeWeight - rounded.reduce((a, b) => a + b, 0);
  if (Math.abs(diff) > 0.01) {
      // Find someone who can absorb the diff without breaking bounds
      for (let k=0; k<rounded.length; k++) {
         if (diff > 0 && rounded[k] + diff <= bounds[k].max) {
             rounded[k] = Number((rounded[k] + diff).toFixed(1));
             break;
         } else if (diff < 0 && rounded[k] + diff >= bounds[k].min) {
             rounded[k] = Number((rounded[k] + diff).toFixed(1));
             break;
         }
      }
  }
  
  const finalEval = evaluate(rounded);

  const resultObj: Record<string, number> = { ...fixedIngredients };
  ingredients.forEach((ing, idx) => {
      resultObj[ing.id] = rounded[idx];
  });

  if (finalEval.cost > 0.1) {
     return { 
         success: false, 
         result: resultObj, 
         message: 'Tidak dapat menemukan kombinasi yang pas 100% dengan bahan terpilih. Ini adalah hasil pendekatan terbaik.' 
     };
  }

  return { 
      success: true, 
      result: resultObj, 
      message: 'Berhasil menemukan formula yang sesuai!' 
  };
}
