import React, { useState } from 'react';
import { CalculationInputs, CalculationResults } from '../types';
import { Language } from '../utils/translations';
import { DollarSign, Zap, TrendingDown, Leaf, Clock, Settings2 } from 'lucide-react';

interface Props {
  lang: Language;
  inputs: CalculationInputs;
  results: CalculationResults;
  onUpdateFinancial: (updates: Partial<CalculationInputs>) => void;
}

export const FinancialCard: React.FC<Props> = ({ lang, inputs, results, onUpdateFinancial }) => {
  const tr = (id: string, en: string) => (lang === 'id' ? id : en);

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
            <h3 className="text-base font-semibold text-white">{tr('Analisa Finansial & Pemborosan Energi', 'Financial Analysis & Energy Waste')}</h3>
            <p className="text-xs text-slate-400">
              {tr('Kalkulasi kerugian termal dikonversi ke biaya bahan bakar riil', 'Thermal loss calculated and converted into real fuel cost')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          {showAdvanced ? tr('Tutup Parameter', 'Close Parameters') : tr('Ubah Parameter Energi', 'Edit Energy Parameters')}
        </button>
      </div>

      {/* Advanced energy parameter configuration */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">{tr('Jenis Bahan Bakar', 'Fuel Type')}</label>
            <select
              value={inputs.fuelType}
              onChange={(e) => onUpdateFinancial({ fuelType: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="natural_gas">{tr('Gas Alam (PGN / LNG)', 'Natural Gas (PGN / LNG)')}</option>
              <option value="coal">{tr('Batu Bara (Steam Coal)', 'Coal (Steam Coal)')}</option>
              <option value="hsd_diesel">{tr('Solar Industri (HSD)', 'Industrial Diesel (HSD)')}</option>
              <option value="biomass">{tr('Biomassa (Cangkang Sawit)', 'Biomass (Palm Shell)')}</option>
              <option value="electricity">{tr('Listrik Industri (PLN)', 'Industrial Electricity (PLN)')}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              {tr('Tarif / Harga Satuan (Rp)', 'Unit Rate / Price (Rp)')}
            </label>
            <input
              type="number"
              value={inputs.fuelCostPerUnit}
              onChange={(e) => onUpdateFinancial({ fuelCostPerUnit: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder={tr('Contoh: 120000', 'e.g. 120000')}
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
            <label className="block text-slate-400 font-medium mb-1">{tr('Jam Operasi per Tahun', 'Operating Hours per Year')}</label>
            <input
              type="number"
              value={inputs.operatingHoursPerYear}
              onChange={(e) => onUpdateFinancial({ operatingHoursPerYear: parseInt(e.target.value) || 1000 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="8000"
            />
            <span className="text-[10px] text-slate-500">{tr('Normal 24/7 ~ 8.000 jam/tahun', 'Normal 24/7 ~ 8,000 hours/year')}</span>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">{tr('Efisiensi Boiler/Furnace (%)', 'Boiler/Furnace Efficiency (%)')}</label>
            <input
              type="number"
              value={inputs.boilerFurnaceEfficiencyPercent}
              onChange={(e) =>
                onUpdateFinancial({ boilerFurnaceEfficiencyPercent: Math.min(100, Math.max(30, parseFloat(e.target.value) || 80)) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="85"
            />
            <span className="text-[10px] text-slate-500">{tr('Rata-rata industri 75% - 88%', 'Industry average 75% - 88%')}</span>
          </div>
        </div>
      )}

      {/* Primary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {tr('Biaya Kerugian Panas / Tahun', 'Heat Loss Cost / Year')}
          </span>
          <div className="text-xl font-bold text-white mt-1">
            {formatIDR(results.financial.annualCostIdr)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{tr('Per Jam', 'Per Hour')}: {formatIDR(costPerHour)}</span>
            <span>{tr('Per Bulan', 'Per Month')}: {formatIDR(costPerMonth)}</span>
          </div>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4">
          <span className="text-xs text-emerald-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            {tr('Potensi Penghematan Energi', 'Potential Energy Savings')}
          </span>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {formatIDR(results.financial.potentialSavingsIdr)}
            <span className="text-xs font-normal text-emerald-400/80 ml-1">/ {tr('tahun', 'year')}</span>
          </div>
          <p className="text-[11px] text-emerald-500/80 mt-1">
            {tr('Bila isolasi dioptimasi ke batas aman operasional (< 50°C)', 'If insulation is optimized to the safe operational limit (< 50°C)')}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            {tr('Emisi Karbon Akibat Heat Loss', 'Carbon Emissions from Heat Loss')}
          </span>
          <div className="text-xl font-bold text-slate-100 mt-1">
            {results.financial.co2EmissionsTonsPerYear} <span className="text-xs font-normal text-slate-400">{tr('Ton CO₂e/thn', 'Tons CO₂e/yr')}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {tr('Energi terbuang', 'Energy wasted')}: {(results.financial.annualHeatLossKWh / 1000).toFixed(1)} MWh/{tr('tahun', 'year')} ({results.financial.annualHeatLossGJ} GJ)
          </p>
        </div>
      </div>

      {/* Payback period interactive estimator */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          <span className="text-slate-300">{tr('Estimasi Biaya Pengadaan/Perbaikan Isolasi:', 'Estimated Insulation Procurement/Repair Cost:')}</span>
          <input
            type="number"
            value={estimatedInvestmentCost}
            onChange={(e) => setEstimatedInvestmentCost(parseFloat(e.target.value) || 0)}
            className="w-36 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-brand-950/40 border border-brand-800/50 px-3 py-1.5 rounded-lg text-brand-300">
          <span className="text-slate-400">{tr('Estimasi Periode Balik Modal (Payback):', 'Estimated Payback Period:')}</span>
          <span className="font-bold text-sm">
            {paybackMonths > 0 ? `${paybackMonths} ${tr('Bulan', 'Months')}` : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
