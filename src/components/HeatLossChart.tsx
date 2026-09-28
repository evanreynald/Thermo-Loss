import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingDown, Info } from 'lucide-react';
import { CalculationInputs, CalculationResults, DuctMaterial, InsulationLayer, InsulationMaterial } from '../types';
import { calculateThermalPerformance } from '../utils/thermalCalculations';
import { Language, UnitSystem, translations } from '../utils/translations';
import { unitHelpers } from '../utils/unitConversion';

interface Props {
  inputs: CalculationInputs;
  results: CalculationResults;
  lang: Language;
  unitSystem: UnitSystem;
  ductMaterials: DuctMaterial[];
  insulationMaterials: InsulationMaterial[];
}

export const HeatLossChart: React.FC<Props> = ({
  inputs,
  results,
  lang,
  unitSystem,
  ductMaterials,
  insulationMaterials,
}) => {
  const t = translations[lang];
  const units = unitHelpers.getUnits(unitSystem);

  // Generate curve data points (0 mm to 200 mm in steps of 10 mm) by re-running the
  // real calculation engine at each thickness, instead of a simplified duplicate model,
  // so the curve always reconciles with the KPI cards shown alongside it.
  const chartData = useMemo(() => {
    const points: Array<{
      thicknessMm: number;
      thicknessLabel: string;
      heatLossDisplay: number;
      tempDisplay: number;
      rawHeatLossKW: number;
      rawTempC: number;
    }> = [];

    // Same "primary layer" selection rule used by the recommended-thickness solver:
    // prefer the outside insulation layer, else the first configured layer.
    const primaryLayer = inputs.layers.find((l) => l.position === 'outside') || inputs.layers[0];
    const primaryMat = primaryLayer
      ? insulationMaterials.find((m) => m.id === primaryLayer.materialId) || insulationMaterials[0]
      : insulationMaterials[0];

    // In diagnostic mode, derate every insulation layer's conductivity by the same
    // insulationRetainedFraction the engine already computed, so the "what-if thickness"
    // curve reflects the diagnosed degraded state rather than a hypothetical clean system.
    const retainedFraction =
      inputs.mode === 'diagnose' && results.diagnostic
        ? Math.max(0.02, results.diagnostic.effectiveThicknessRatio)
        : 1;

    const getNominalK = (layer: InsulationLayer): number => {
      if (layer.customConductivity !== undefined && layer.customConductivity > 0) {
        return layer.customConductivity;
      }
      const mat = insulationMaterials.find((m) => m.id === layer.materialId) || insulationMaterials[0];
      return mat.thermalConductivity;
    };

    // Thickness values to simulate (0 to 200mm)
    const thicknesses = [0, 10, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200];

    thicknesses.forEach((thickMm) => {
      const workingLayers: InsulationLayer[] =
        inputs.layers.length > 0
          ? inputs.layers.map((l) => {
              const nominalK = getNominalK(l);
              const effectiveK = retainedFraction < 1 ? nominalK / retainedFraction : nominalK;
              return {
                ...l,
                thicknessMm: l.id === primaryLayer?.id ? thickMm : l.thicknessMm,
                customConductivity: effectiveK,
              };
            })
          : thickMm > 0
          ? [
              {
                id: 'chart-sim-layer',
                materialId: primaryMat.id,
                position: 'outside',
                thicknessMm: thickMm,
                customConductivity: retainedFraction < 1 ? primaryMat.thermalConductivity / retainedFraction : undefined,
              },
            ]
          : [];

      const workingInputs: CalculationInputs = {
        ...inputs,
        mode: 'design',
        hasInsulation: workingLayers.length > 0,
        layers: workingLayers,
      };

      const simResult = calculateThermalPerformance(workingInputs, ductMaterials, insulationMaterials);
      const Q_W = simResult.heatLossTotalW;
      const T_surface_C = simResult.outerSurfaceTempC;

      const qKW = Q_W / 1000;

      // Unit conversions
      const displayThick =
        unitSystem === 'imperial'
          ? Number((thickMm / 25.4).toFixed(1))
          : thickMm;

      const displayHeatLoss =
        unitSystem === 'imperial'
          ? Number(((qKW * 3412.142) / 1000).toFixed(1))
          : Number(qKW.toFixed(2));

      const displayTemp =
        unitSystem === 'imperial'
          ? Number((T_surface_C * 1.8 + 32).toFixed(1))
          : Number(T_surface_C.toFixed(1));

      points.push({
        thicknessMm: displayThick,
        thicknessLabel: `${displayThick} ${units.dim}`,
        heatLossDisplay: displayHeatLoss,
        tempDisplay: displayTemp,
        rawHeatLossKW: qKW,
        rawTempC: T_surface_C,
      });
    });

    return points;
  }, [inputs, results, unitSystem, units.dim, ductMaterials, insulationMaterials]);

  const safeLimitDisplay = unitSystem === 'imperial' ? 140 : 60; // 60°C = 140°F

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            {t.heatLossChartTitle}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">{t.chartDesc}</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span>
              {t.chartYHeatLoss} ({units.power})
            </span>
          </div>
          <div className="flex items-center gap-1 text-sky-400 font-semibold ml-2">
            <span className="w-3 h-0.5 bg-sky-400 inline-block" />
            <span>
              {t.chartYTemp} ({units.temp})
            </span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="thicknessLabel"
              stroke="#94a3b8"
              fontSize={11}
              label={{
                value: `${t.chartXAxis} (${units.dim})`,
                position: 'insideBottom',
                offset: -12,
                fill: '#94a3b8',
                fontSize: 11,
              }}
            />
            {/* Left Y Axis: Heat Loss */}
            <YAxis
              yAxisId="left"
              stroke="#fbbf24"
              fontSize={11}
              label={{
                value: `${t.chartYHeatLoss} (${units.power})`,
                angle: -90,
                position: 'insideLeft',
                fill: '#fbbf24',
                fontSize: 11,
              }}
            />
            {/* Right Y Axis: Surface Temp */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#38bdf8"
              fontSize={11}
              label={{
                value: `${t.chartYTemp} (${units.temp})`,
                angle: 90,
                position: 'insideRight',
                fill: '#38bdf8',
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Legend verticalAlign="top" height={24} />

            {/* ASTM C1055 Safe Limit Reference Line */}
            <ReferenceLine
              yAxisId="right"
              y={safeLimitDisplay}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: t.chartSafeLine,
                fill: '#ef4444',
                fontSize: 10,
                position: 'top',
              }}
            />

            {/* Lines */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="heatLossDisplay"
              name={`${t.chartYHeatLoss} (${units.power})`}
              stroke="#fbbf24"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#fbbf24' }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tempDisplay"
              name={`${t.chartYTemp} (${units.temp})`}
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#38bdf8' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Engineering Insight Footer */}
      <div className="flex items-start gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span>
            {lang === 'id' ? (
              <>
                <strong>Prinsip Hukum Termodinamika:</strong> Penambahan ketebalan awal memberikan penurunan panas paling drastis. Setelah melewati tebal rekomendasi (~<strong>{results.recommendedInsulationThicknessMm} mm</strong>), kurva mulai mendatar (*diminishing returns*), di mana penambahan tebal lebih lanjut hanya memberikan penghematan marjinal dengan biaya isolasi yang melonjak.
              </>
            ) : (
              <>
                <strong>Thermodynamic Principle:</strong> The initial insulation thickness yields the steepest heat loss reduction. Beyond the recommended thickness (~<strong>{results.recommendedInsulationThicknessMm} mm</strong>), the curve levels off (*law of diminishing returns*), where further thickness only adds marginal savings against escalating material costs.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
