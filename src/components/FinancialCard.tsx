import React, { useState } from 'react';
import { CalculationInputs, CalculationResults } from '../types';
import { DollarSign, Zap, TrendingDown, Leaf, Clock, Settings2 } from 'lucide-react';

interface Props {
  inputs: CalculationInputs;
  results: CalculationResults;
  onUpdateFinancial: (updates: Partial<CalculationInputs>) => void;
}

export const FinancialCard: React.FC<Props> = ({ inputs, results, onUpdateFinancial }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedInvestmentCost, setEstimatedInvestmentCost] = useState<number>(15000000); // 15 jt default

  // Format Currency IDR
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const costPerHour = Math.round(results.financial.annualCostIdr / Math.max(1, inputs.operatingHoursPerYear));
  const costPerMonth = Math.round(results.financial.annualCostIdr / 12);
  const paybackMonths =
    results.financial.potentialSavingsIdr > 0
      ? Number(((estimatedInvestmentCost / results.financial.potentialSavingsIdr) * 12).toFixed(1))
      : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Analisa Finansial & Pemborosan Energi</h3>
            <p className="text-xs text-slate-400">
              Kalkulasi kerugian termal dikonversi ke biaya bahan bakar riil
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          {showAdvanced ? 'Tutup Parameter' : 'Ubah Parameter Energi'}
        </button>
      </div>

      {/* Advanced energy parameter configuration */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Jenis Bahan Bakar</label>
            <select
              value={inputs.fuelType}
              onChange={(e) => onUpdateFinancial({ fuelType: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="natural_gas">Gas Alam (PGN / LNG)</option>
              <option value="coal">Batu Bara (Steam Coal)</option>
              <option value="hsd_diesel">Solar Industri (HSD)</option>
              <option value="biomass">Biomassa (Cangkang Sawit)</option>
              <option value="electricity">Listrik Industri (PLN)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Tarif / Harga Satuan (Rp)
            </label>
            <input
              type="number"
              value={inputs.fuelCostPerUnit}
              onChange={(e) => onUpdateFinancial({ fuelCostPerUnit: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="Contoh: 120000"
            />
            <span className="text-[10px] text-slate-500">
              {inputs.fuelType === 'natural_gas'
                ? 'Rp/MMBtu'
                : inputs.fuelType === 'coal' || inputs.fuelType === 'biomass'
                ? 'Rp/kg'
                : inputs.fuelType === 'hsd_diesel'
                ? 'Rp/Liter'
                : 'Rp/kWh'}
            </span>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Jam Operasi per Tahun</label>
            <input
              type="number"
              value={inputs.operatingHoursPerYear}
              onChange={(e) => onUpdateFinancial({ operatingHoursPerYear: parseInt(e.target.value) || 1000 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="8000"
            />
            <span className="text-[10px] text-slate-500">Normal 24/7 ~ 8.000 jam/tahun</span>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Efisiensi Boiler/Furnace (%)</label>
            <input
              type="number"
              value={inputs.boilerFurnaceEfficiencyPercent}
              onChange={(e) =>
                onUpdateFinancial({ boilerFurnaceEfficiencyPercent: Math.min(100, Math.max(30, parseFloat(e.target.value) || 80)) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="85"
            />
            <span className="text-[10px] text-slate-500">Rata-rata industri 75% - 88%</span>
          </div>
        </div>
      )}

      {/* Primary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Biaya Kerugian Panas / Tahun
          </span>
          <div className="text-xl font-bold text-white mt-1">
            {formatIDR(results.financial.annualCostIdr)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Per Jam: {formatIDR(costPerHour)}</span>
            <span>Per Bulan: {formatIDR(costPerMonth)}</span>
          </div>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4">
          <span className="text-xs text-emerald-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            Potensi Penghematan Energi
          </span>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {formatIDR(results.financial.potentialSavingsIdr)}
            <span className="text-xs font-normal text-emerald-400/80 ml-1">/ tahun</span>
          </div>
          <p className="text-[11px] text-emerald-500/80 mt-1">
            Bila isolasi dioptimasi ke batas aman operasional (&lt; 50°C)
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            Emisi Karbon Akibat Heat Loss
          </span>
          <div className="text-xl font-bold text-slate-100 mt-1">
            {results.financial.co2EmissionsTonsPerYear} <span className="text-xs font-normal text-slate-400">Ton CO₂e/thn</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Energi terbuang: {(results.financial.annualHeatLossKWh / 1000).toFixed(1)} MWh/tahun ({results.financial.annualHeatLossGJ} GJ)
          </p>
        </div>
      </div>

      {/* Payback period interactive estimator */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300">Estimasi Biaya Pengadaan/Perbaikan Isolasi:</span>
          <input
            type="number"
            value={estimatedInvestmentCost}
            onChange={(e) => setEstimatedInvestmentCost(parseFloat(e.target.value) || 0)}
            className="w-36 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/50 px-3 py-1.5 rounded-lg text-cyan-300">
          <span className="text-slate-400">Estimasi Periode Balik Modal (Payback):</span>
          <span className="font-bold text-sm">
            {paybackMonths > 0 ? `${paybackMonths} Bulan` : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
