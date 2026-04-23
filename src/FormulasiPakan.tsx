import React, { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Calculator, Info, Lock, Unlock, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { INGREDIENTS, NUTRITION_TARGETS, PhaseTarget, FEED_CONSUMPTION_STANDARDS } from './lib/constants';
import { solveFormulation } from './lib/solver';

type FormValues = {
  weekId: string;
  ingredients: Record<string, number>;
  population: number;
};

const getPhaseFromWeek = (weekId: string): string => {
  if (["1", "2", "3", "4"].includes(weekId)) return "starter";
  if (["5", "6", "7", "8", "9-10", "11-12"].includes(weekId)) return "grower";
  if (["13-16", "17-20", "21-24"].includes(weekId)) return "developer";
  if (weekId === ">24") return "layer";
  return "";
};

export default function FormulasiPakan() {
  const [selectedAutoIngredients, setSelectedAutoIngredients] = useState<string[]>([]);
  const [lockedIngredients, setLockedIngredients] = useState<string[]>([]);
  const [solverMessage, setSolverMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const { register, control, watch, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      weekId: '',
      population: 100,
      ingredients: INGREDIENTS.reduce((acc, curr) => {
        if (curr.id === 'garam') acc[curr.id] = 0.3;
        else if (curr.id === 'topmix') acc[curr.id] = 0.2;
        else acc[curr.id] = 0;
        return acc;
      }, {} as Record<string, number>)
    }
  });

  const weekId = watch('weekId');
  const phaseId = getPhaseFromWeek(weekId);
  const population = watch('population') || 0;
  const ingredientsForm = useWatch({ control, name: 'ingredients' });

  const selectedConsumption = useMemo(() => {
    return FEED_CONSUMPTION_STANDARDS.find(s => String(s.week) === weekId);
  }, [weekId]);

  React.useEffect(() => {
    setLockedIngredients([]);
    if (phaseId) {
      const target = NUTRITION_TARGETS.find(t => t.id === phaseId);
      if (target) {
        // Automatically set the inputs for the fixed ingredients when phase changes
        Object.keys(target.fixedIngredients).forEach(ingId => {
          setValue(`ingredients.${ingId}`, target.fixedIngredients[ingId]);
        });
      }
    }
  }, [phaseId, setValue]);

  const selectedTarget = useMemo(() => {
    return NUTRITION_TARGETS.find(t => t.id === phaseId);
  }, [phaseId]);

  const { totalPercentage, totalPK, totalEM } = useMemo(() => {
    let perc = 0;
    let pk = 0;
    let em = 0;

    for (const ingredient of INGREDIENTS) {
      const val = ingredientsForm?.[ingredient.id] || 0;
      perc += val;
      pk += (val / 100) * ingredient.pk;
      em += (val / 100) * ingredient.em;
    }

    return {
      totalPercentage: Number(perc.toFixed(2)),
      totalPK: Number(pk.toFixed(2)),
      totalEM: Number(em.toFixed(2))
    };
  }, [ingredientsForm]);

  const targetStatus = useMemo(() => {
    if (!selectedTarget || totalPercentage !== 100) return null;

    const isPKOk = totalPK >= selectedTarget.minPK && totalPK <= selectedTarget.maxPK;
    const isEMOk = totalEM >= selectedTarget.minEM; // As per PRD "minimal mencapai batas bawah minEM"

    if (isPKOk && isEMOk) {
      return { status: 'success', message: 'Selamat! Formulasi Pakan Sudah Sesuai Standar KUB' };
    }

    const errors = [];
    if (!isPKOk) {
      if (totalPK < selectedTarget.minPK) errors.push(`Protein Kasar kurang dari target ${selectedTarget.minPK}%`);
      if (totalPK > selectedTarget.maxPK) errors.push(`Protein Kasar melebihi target ${selectedTarget.maxPK}%`);
    }
    if (!isEMOk) {
      errors.push(`Energi Metabolis kurang dari target ${selectedTarget.minEM} kkal/kg`);
    }

    return { status: 'warning', message: errors.join(', ') };
  }, [selectedTarget, totalPercentage, totalPK, totalEM]);

  const handleAutoCalculate = () => {
    if (!selectedTarget) return;
    setSolverMessage(null);
    
    // reset all to 0 first (not including locked/fixed)
    INGREDIENTS.forEach(ing => {
       if (!selectedTarget.fixedIngredients[ing.id] && !lockedIngredients.includes(ing.id)) {
           setValue(`ingredients.${ing.id}`, 0);
       }
    });

    if (selectedAutoIngredients.length < 2) {
      setSolverMessage({ type: 'error', text: 'Pilih minimal 2 bahan untuk hitung otomatis.' });
      return;
    }

    const currentVals = getValues('ingredients');
    const combinedFixed = { ...selectedTarget.fixedIngredients };
    lockedIngredients.forEach(id => {
       combinedFixed[id] = currentVals[id] || 0;
    });

    const res = solveFormulation(
      selectedAutoIngredients,
      selectedTarget.minPK,
      selectedTarget.maxPK,
      selectedTarget.minEM,
      combinedFixed
    );

    if (res.result) {
      // First clean ALL non-fixed/non-bounded to 0
      INGREDIENTS.forEach(ing => {
         if (!combinedFixed[ing.id] && ing.id !== 'garam' && ing.id !== 'topmix') {
           setValue(`ingredients.${ing.id}`, 0);
         }
      });
      // Then set the computed results
      Object.entries(res.result).forEach(([id, val]) => {
         setValue(`ingredients.${id}`, val as number);
      });
    }

    setSolverMessage({ 
      type: res.success ? 'success' : 'error', 
      text: res.message 
    });
  };

  const toggleAutoIngredient = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAutoIngredients(prev => [...prev, id]);
    } else {
      setSelectedAutoIngredients(prev => prev.filter(i => i !== id));
      // Auto-unlock if it was locked when deselecting
      setLockedIngredients(prev => prev.filter(i => i !== id));
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-6">
      <div className="mb-2">
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h2 className="font-bold text-xl text-slate-800">Formulasi Pakan Sendiri</h2>
          </div>
          {selectedTarget && (
            <div className="flex flex-wrap gap-4 md:gap-6 mt-4 md:mt-0">
              <div className="text-left md:text-right text-xs">
                <p className="text-slate-400 uppercase font-bold tracking-tighter">Fase Pemeliharaan</p>
                <p className="font-bold text-slate-700 text-sm">{selectedTarget.name}</p>
              </div>
              <div className="text-left md:text-right text-xs">
                <p className="text-slate-400 uppercase font-bold tracking-tighter">Target PK</p>
                <p className="font-bold text-slate-700 text-sm">{selectedTarget.minPK} - {selectedTarget.maxPK}%</p>
              </div>
              <div className="text-left md:text-right text-xs">
                <p className="text-slate-400 uppercase font-bold tracking-tighter">Target EM</p>
                <p className="font-bold text-slate-700 text-sm">Min. {selectedTarget.minEM}</p>
              </div>
              <div className="text-left md:text-right text-xs">
                <p className="text-slate-400 uppercase font-bold tracking-tighter">Target Ca/P</p>
                <p className="font-bold text-slate-700 text-sm">{selectedTarget.targetCa} / {selectedTarget.targetP}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Umur Ayam (Minggu)</Label>
            <Select onValueChange={(val) => setValue('weekId', val)} value={weekId}>
              <SelectTrigger className="w-full !h-12 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                <SelectValue placeholder="Pilih Umur Ayam..." />
              </SelectTrigger>
              <SelectContent>
                {FEED_CONSUMPTION_STANDARDS.map((s) => (
                  <SelectItem key={String(s.week)} value={String(s.week)} className="text-base py-2">
                    Minggu ke-{s.week} ({getPhaseFromWeek(String(s.week)).toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Ayam (Ekor)</Label>
            <Input 
              type="number"
              min="1"
              className="w-full !h-12 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              {...register('population', { valueAsNumber: true })}
            />
          </div>
        </div>

        {selectedTarget && (
          <>
            <div className="mb-6 pb-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-500" />
                  Hitung Proporsi Otomatis
                </h3>
                <p className="text-sm text-slate-500 font-medium">Bahan terpilih: {selectedAutoIngredients.length} (Centang 4-6 bahan di bawah)</p>
              </div>
              <Button 
                onClick={handleAutoCalculate}
                disabled={selectedAutoIngredients.filter(id => !(selectedTarget.fixedIngredients.hasOwnProperty(id))).length < 2}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
              >
                Hitung Sekarang
              </Button>
            </div>
            
            {solverMessage && (
               <div className={`mb-6 p-4 border rounded-xl flex items-center gap-3 ${solverMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                 <Info className={`h-5 w-5 ${solverMessage.type === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
                 <p className="text-sm font-medium">{solverMessage.text}</p>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-8">
              {INGREDIENTS.map((ingredient) => {
                const isFixed = selectedTarget.fixedIngredients.hasOwnProperty(ingredient.id);
                const isUserLocked = lockedIngredients.includes(ingredient.id);
                const isEffectivelyFixed = isFixed || isUserLocked;
                const isBounded = ingredient.id === 'garam' || ingredient.id === 'topmix';
                const boundMin = isBounded ? (ingredient.id === 'garam' ? 0.3 : 0.2) : 0;
                const boundMax = isBounded ? 0.5 : 100;
                
                return (
                  <div key={ingredient.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center transition-colors hover:border-indigo-300 gap-3">
                    <div className="flex items-center gap-3">
                      {!(isFixed || isBounded) ? (
                        <Checkbox 
                          id={`chk-${ingredient.id}`} 
                          checked={selectedAutoIngredients.includes(ingredient.id)}
                          onCheckedChange={(checked) => toggleAutoIngredient(ingredient.id, checked as boolean)}
                          disabled={isUserLocked}
                        />
                      ) : (
                        <div className="w-4 h-4 flex shrink-0 rounded-sm border border-slate-300 bg-slate-200" title="Fixed/Bounded for this phase" />
                      )}
                      
                      <div className="text-sm">
                        <Label htmlFor={`chk-${ingredient.id}`} className={`font-bold text-slate-700 ${!(isFixed || isBounded) && !isUserLocked && 'cursor-pointer'}`}>
                          {ingredient.name}
                        </Label>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                           PK: {ingredient.pk}% | EM: {ingredient.em} kcal
                           {isFixed && ' (Tetap)'}
                           {isBounded && ` (${boundMin}-${boundMax}%)`}
                           {isUserLocked && ' (Terkunci)'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 relative">
                        <Input
                          id={`ing-${ingredient.id}`}
                          type="number"
                          min={boundMin}
                          max={boundMax}
                          step="0.1"
                          disabled={isEffectivelyFixed}
                          className="w-full p-2 h-auto bg-white border border-slate-300 rounded-lg text-right font-mono focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          {...register(`ingredients.${ingredient.id}`, { 
                            valueAsNumber: true,
                            onBlur: (e) => {
                              let val = parseFloat(e.target.value);
                              if (isNaN(val)) val = boundMin;
                              if (val < boundMin) val = boundMin;
                              if (val > boundMax) val = boundMax;
                              setValue(`ingredients.${ingredient.id}` as any, val);
                            }
                          })}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                      {!isFixed ? (
                        <button
                          type="button"
                          onClick={() => {
                             if (isUserLocked) {
                                setLockedIngredients(prev => prev.filter(i => i !== ingredient.id));
                             } else {
                                setLockedIngredients(prev => [...prev, ingredient.id]);
                             }
                          }}
                          disabled={!selectedAutoIngredients.includes(ingredient.id) && !isBounded}
                          className={`p-2 flex shrink-0 items-center justify-center rounded-lg border transition-colors ${
                              isUserLocked ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 
                              (!selectedAutoIngredients.includes(ingredient.id) && !isBounded) ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-50' :
                              'bg-white border-slate-200 text-slate-400 hover:text-indigo-500 hover:bg-slate-50'
                          }`}
                          title={!selectedAutoIngredients.includes(ingredient.id) && !isBounded ? "Centang otomatis terlebih dahulu" : (isUserLocked ? "Buka kuncian" : "Kunci nilai ini")}
                        >
                          {isUserLocked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      ) : (
                        <div className="p-2 flex shrink-0 items-center justify-center rounded-lg bg-slate-200 border border-slate-300 text-slate-400" title="Terikat formula fase">
                          <Lock size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto border-t border-slate-100 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Bahan</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-slate-800">{totalPercentage}%</span>
                    <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded ${totalPercentage === 100 ? "bg-emerald-500" : "bg-amber-500"}`}>
                      {totalPercentage === 100 ? "PAS" : (totalPercentage > 100 ? "LEBIH" : "KURANG")}
                    </span>
                  </div>
                  <Progress 
                    value={totalPercentage > 100 ? 100 : totalPercentage} 
                    className={`h-1.5 mt-2 bg-slate-200 [&>div]:rounded-full ${totalPercentage > 100 ? "[&>div]:bg-red-500" : totalPercentage === 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"}`} 
                  />
                </div>
                
                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Protein Kasar (PK)</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-slate-800">{totalPK}%</span>
                    <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded ${(totalPK >= selectedTarget.minPK && totalPK <= selectedTarget.maxPK) ? "bg-emerald-500" : "bg-amber-500"}`}>
                      {totalPK >= selectedTarget.minPK && totalPK <= selectedTarget.maxPK ? "OK" : "CEK"}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold">
                    <span>MIN {selectedTarget.minPK}</span>
                    <span>MAX {selectedTarget.maxPK}</span>
                  </div>
                </div>

                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Energi (EM)</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-slate-800">{totalEM}</span>
                    <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded ${totalEM >= selectedTarget.minEM ? "bg-emerald-500" : "bg-amber-500"}`}>
                      {totalEM >= selectedTarget.minEM ? "OK" : "CEK"}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold">
                    <span>MIN {selectedTarget.minEM}</span>
                    <span>MAX {selectedTarget.maxEM}</span>
                  </div>
                </div>
              </div>

              {targetStatus && totalPercentage === 100 && (
                targetStatus.status === 'success' ? (
                  <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="text-white h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-bold text-md text-emerald-800">Selamat! Formulasi Sudah Sesuai Standar KUB.</p>
                      <p className="text-emerald-600 text-sm">Nutrisi optimal untuk fase <span className="font-bold underline">{selectedTarget.name}</span>.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      <XCircle className="text-white h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-bold text-md text-red-800">Kurang Tepat</p>
                      <p className="text-red-600 text-sm">{targetStatus.message}</p>
                    </div>
                  </div>
                )
              )}

              {targetStatus && targetStatus.status === 'success' && totalPercentage === 100 && population > 0 && selectedConsumption && (
                <div className="mt-8 border-t border-slate-200 pt-8 mt-auto">
                  <div className="flex items-center gap-2 mb-6">
                     <Scale className="h-6 w-6 text-indigo-500" />
                     <h2 className="text-xl font-bold text-slate-800">Kebutuhan Bahan Pakan</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                        <p className="text-indigo-600 font-bold mb-1">Total Pakan Harian</p>
                        <p className="text-3xl font-black text-indigo-900 border-b border-indigo-200 pb-2 mb-2">
                           {((population * selectedConsumption.gramPerBird) / 1000).toLocaleString('id-ID', {maximumFractionDigits:2})} <span className="text-lg font-bold text-indigo-600">kg/hari</span>
                        </p>
                        <p className="text-indigo-600 text-sm">
                           Berdasarkan {selectedConsumption.gramPerBird} gr/ekor/hari
                        </p>
                     </div>
                     <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col justify-center">
                        <p className="text-amber-600 font-bold mb-1">Total Pakan Bulanan (30 Hari)</p>
                        <p className="text-3xl font-black text-amber-900 border-b border-amber-200 pb-2 mb-2">
                           {((population * selectedConsumption.gramPerBird * 30) / 1000).toLocaleString('id-ID', {maximumFractionDigits:2})} <span className="text-lg font-bold text-amber-600">kg/bulan</span>
                        </p>
                        <p className="text-amber-600 text-sm">
                           Untuk populasi {population} ekor ayam
                        </p>
                     </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                          <tr>
                            <th className="px-6 py-4">Bahan Pakan</th>
                            <th className="px-6 py-4 text-right">Persentase</th>
                            <th className="px-6 py-4 text-right">Harian (kg)</th>
                            <th className="px-6 py-4 text-right">Bulanan (kg)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {INGREDIENTS.filter(ing => (ingredientsForm[ing.id] || 0) > 0).map(ing => {
                            const percentage = ingredientsForm[ing.id] || 0;
                            const dailyKg = (population * selectedConsumption.gramPerBird * (percentage / 100)) / 1000;
                            const monthlyKg = dailyKg * 30;
                            return (
                              <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 font-semibold text-slate-800">{ing.name}</td>
                                <td className="px-6 py-3 text-right font-mono text-slate-600">{percentage.toFixed(2)}%</td>
                                <td className="px-6 py-3 text-right font-mono text-indigo-600 font-bold">{dailyKg.toLocaleString('id-ID', {maximumFractionDigits:3})}</td>
                                <td className="px-6 py-3 text-right font-mono text-amber-600 font-bold">{monthlyKg.toLocaleString('id-ID', {maximumFractionDigits:3})}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
