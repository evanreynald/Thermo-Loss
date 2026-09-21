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
import { CalculationInputs, CalculationResults } from '../types';
import { DEFAULT_INSULATION_MATERIALS } from '../data/materials';
import { Language, UnitSystem, translations } from '../utils/translations';
import { unitHelpers } from '../utils/unitConversion';

interface Props {
  inputs: CalculationInputs;
  results: CalculationResults;
  lang: Language;
  unitSystem: UnitSystem;
}

export const HeatLossChart: React.FC<Props> = ({ inputs, results, lang, unitSystem }) => {
  const t = translations[lang];
  const units = unitHelpers.getUnits(unitSystem);

  // Generate curve data points (0 mm to 200 mm in steps of 10 mm)
  const chartData = useMemo(() => {
    const points: Array<{
      thicknessMm: number;
      thicknessLabel: string;
      heatLossDisplay: number;
      tempDisplay: number;
      rawHeatLossKW: number;
      rawTempC: number;
    }> = [];

    // Find primary insulation material
    const primaryMatId =
      inputs.layers.length > 0
        ? inputs.layers[0].materialId
        : 'calcium_silicate_block';
    const primaryMat =
      DEFAULT_INSULATION_MATERIALS.find((m) => m.id === primaryMatId) || DEFAULT_INSULATION_MATERIALS[0];
    const k_insul = primaryMat.thermalConductivity;

    // Dimensions
    const isCyl = inputs.shape === 'cylindrical' || inputs.shape === 'kiln';
    const r_in_m = (inputs.innerDiameterMm || 600) / 2000;
    const ductThickM = inputs.ductThicknessMm / 1000;
    const r_duct_m = r_in_m + ductThickM;
    const lengthM = inputs.lengthM || 10;
    const T_fluid = inputs.fluidTempC;
    const T_amb = inputs.ambientTempC;
    const deltaT_total = Math.max(1, T_fluid - T_amb);

    const h_i = results.internalConvectionHi || 50;
    const h_o = (results.externalConvectionHo || 15) + (results.radiationHr || 7);

    // Thickness values to simulate (0 to 200mm)
    const thicknesses = [0, 10, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200];

    thicknesses.forEach((thickMm) => {
      const thickM = thickMm / 1000;
      let Q_W = 0;
      let T_surface_C = T_amb;

      if (isCyl) {
        const A_in = 2 * Math.PI * r_in_m * lengthM;
        const R_conv_in = 1 / (h_i * A_in);

        // Duct shell resistance
        const k_steel = 45;
        const R_steel = Math.log(r_duct_m / r_in_m) / (2 * Math.PI * k_steel * lengthM);

        // Insulation resistance
        let R_insul = 0;
        const r_out_m = r_duct_m + thickM;
        if (thickM > 0) {
          R_insul = Math.log(r_out_m / r_duct_m) / (2 * Math.PI * k_insul * lengthM);
        }

        const A_out = 2 * Math.PI * r_out_m * lengthM;
        const R_conv_out = 1 / (h_o * A_out);

        const R_total = R_conv_in + R_steel + R_insul + R_conv_out;
        Q_W = deltaT_total / Math.max(0.0001, R_total);
        T_surface_C = T_amb + Q_W * R_conv_out;
      } else {
        // Rectangular
        const w_m = (inputs.widthMm || 800) / 1000;
        const h_m = (inputs.heightMm || 600) / 1000;
        const perimeter_in = 2 * (w_m + h_m);
        const A_in = perimeter_in * lengthM;
        const R_conv_in = 1 / (h_i * A_in);

        const k_steel = 45;
        const R_steel = ductThickM / (k_steel * A_in);

        const w_out = w_m + 2 * (ductThickM + thickM);
        const h_out = h_m + 2 * (ductThickM + thickM);
        const A_out = 2 * (w_out + h_out) * lengthM;

        let R_insul = 0;
        if (thickM > 0) {
          const A_mid = (A_in + A_out) / 2;
          R_insul = thickM / (k_insul * A_mid);
        }

        const R_conv_out = 1 / (h_o * A_out);
        const R_total = R_conv_in + R_steel + R_insul + R_conv_out;
        Q_W = deltaT_total / Math.max(0.0001, R_total);
        T_surface_C = T_amb + Q_W * R_conv_out;
      }

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
  }, [inputs, results, unitSystem, units.dim]);

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
