import React from 'react';
import { CalculationInputs, CalculationResults, DuctMaterial } from '../types';
import { Language, UnitSystem, translations, getSafetyStatusMessage } from '../utils/translations';
import { unitHelpers } from '../utils/unitConversion';
import {
  Flame,
  ShieldCheck,
  AlertTriangle,
  FileDown,
  Gauge,
  Thermometer,
  Layers,
  CheckCircle2,
  AlertCircle,
  Activity,
  Wrench,
} from 'lucide-react';

type DiagnosticResult = NonNullable<CalculationResults['diagnostic']>;

const CONDITION_LABELS_EN: Record<DiagnosticResult['condition'], string> = {
  'Optimal': 'Optimal',
  'Degradasi Ringan': 'Minor Degradation',
  'Degradasi Sedang': 'Moderate Degradation',
  'Kerusakan Kritis / Hotspot': 'Critical Damage / Hotspot',
};

const DUCT_INTEGRITY_LABELS_EN: Record<DiagnosticResult['ductIntegrityStatus'], string> = {
  'Aman & Optimal': 'Safe & Optimal',
  'Penipisan Ringan': 'Minor Thinning',
  'Waspada Penipisan Kritis': 'Critical Thinning Warning',
  'Di Bawah Tebal Minimum ASME/SMACNA': 'Below ASME/SMACNA Minimum Thickness',
};

const tr_condition = (value: DiagnosticResult['condition'], lang: Language) =>
  lang === 'id' ? value : CONDITION_LABELS_EN[value];

const tr_ductIntegrity = (value: DiagnosticResult['ductIntegrityStatus'], lang: Language) =>
  lang === 'id' ? value : DUCT_INTEGRITY_LABELS_EN[value];

interface Props {
  inputs: CalculationInputs;
  results: CalculationResults;
  ductMaterial: DuctMaterial;
  lang?: Language;
  unitSystem?: UnitSystem;
  onExportPDF: () => void;
  onApplyRecommendedThickness: (thickMm: number) => void;
  onApplyRecommendedDuctThickness: (thickMm: number) => void;
}

export const ResultsDashboard: React.FC<Props> = ({
  inputs,
  results,
  ductMaterial,
  lang = 'id' as Language,
  unitSystem = 'metric' as UnitSystem,
  onExportPDF,
  onApplyRecommendedThickness,
  onApplyRecommendedDuctThickness,
}: Props) => {
  const isDesign = inputs.mode === 'design';
  const t = translations[lang];
  const units = unitHelpers.getUnits(unitSystem);

  return (
    <div className="space-y-4">
      {/* Action Banner with PDF Export Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
       <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
         <FileDown className="w-4 h-4 text-brand-400" />
         <h3 className="text-sm font-semibold text-white">
           {lang === 'id' ? 'Laporan Teknis (PDF)' : 'Technical Report (PDF)'}
         </h3>
       </div>
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isDesign
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isDesign ? t.modeDesign.toUpperCase() : (lang === 'id' ? 'MODE DIAGNOSA LAPANGAN' : 'FIELD DIAGNOSTIC MODE')}
            </span>

            {inputs.hasInsulation === false ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {t.bareDuct.toUpperCase()}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {lang === 'id' ? `TERISOLASI (${inputs.layers.length} LAPIS)` : `INSULATED (${inputs.layers.length} LAYERS)`}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {inputs.hasInsulation === false
              ? (lang === 'id' ? 'Analisa termal dan rugi energi pada pipa telanjang tanpa isolasi' : 'Thermal analysis & energy loss on uninsulated bare duct')
              : isDesign
              ? t.designDesc
              : t.diagnoseDesc}
          </p>
        </div>

        <button
          type="button"
          id="btn-export-pdf"
          onClick={onExportPDF}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-colors active:scale-95"
          title={lang === 'id' ? 'Ekspor Laporan PDF Lengkap (100% Gratis)' : 'Export Full PDF Report (100% Free)'}
        >
          <FileDown className="w-4 h-4" />
          <span>{t.exportPdf}</span>
        </button>
       </div>
      </div>

      {/* Primary KPI Metric Cards (3 Main Outputs Requested by User) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Thermal Loss Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              {t.heatLossTotal}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              {lang === 'id' ? 'Output Utama' : 'Key Metric'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {unitSystem === 'imperial'
                ? (((results.heatLossTotalW / 1000) * 3412.142) / 1000).toFixed(1)
                : (results.heatLossTotalW / 1000).toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-400">{units.power} Total</span>
            {unitSystem === 'imperial' && (
              <span className="text-xs text-slate-500 ml-auto">
                ({(results.heatLossTotalW / 1000).toFixed(2)} kW)
              </span>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              {lang === 'id' ? 'Per Meter' : 'Per Length'}:{' '}
              <strong className="text-slate-200">
                {unitSystem === 'imperial'
                  ? `${((results.heatLossPerMeterWm * 3.412142) / 3.28084).toFixed(1)} BTU/(h·ft)`
                  : `${results.heatLossPerMeterWm} W/m`}
              </strong>
            </span>
            <span>
              {t.heatFlux}:{' '}
              <strong className="text-slate-200">
                {unitSystem === 'imperial'
                  ? `${(results.heatFluxWm2 * 0.316998).toFixed(1)} BTU/(h·ft²)`
                  : `${results.heatFluxWm2} W/m²`}
              </strong>
            </span>
          </div>
        </div>

        {/* 2. Ketebalan Isolator ATAU Suhu Luar yang Didapat Metric (Permintaan User a.2) */}
        {isDesign && inputs.designGoal === 'find_surface_temp' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-emerald-400" />
                {lang === 'id' ? 'Suhu Luar yang Didapat' : 'Obtained Surface Temp'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                  results.personnelProtectionStatus === 'safe'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : results.personnelProtectionStatus === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {results.personnelProtectionStatus === 'safe'
                  ? (lang === 'id' ? 'Aman Sentuh' : 'Safe')
                  : (lang === 'id' ? 'Bahaya Panas' : 'Hazard')}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  results.personnelProtectionStatus === 'safe' ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {unitHelpers.formatTemp(results.outerSurfaceTempC, unitSystem)}
              </span>
              {unitSystem === 'imperial' && (
                <span className="text-xs text-slate-500 ml-1">({results.outerSurfaceTempC}°C)</span>
              )}
              <span className="text-xs text-slate-400 ml-auto">
                {results.outerSurfaceTempC <= (inputs.targetOuterTempC || 60) ? (
                  <span className="text-emerald-400 font-semibold">
                    ✓ {lang === 'id' ? 'Aman' : 'Safe'} (≤ {inputs.targetOuterTempC || 60}°C)
                  </span>
                ) : (
                  <span className="text-red-400 font-semibold">
                    ▲ +{(results.outerSurfaceTempC - (inputs.targetOuterTempC || 60)).toFixed(1)}°C
                  </span>
                )}
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                {lang === 'id' ? 'Tebal terpasang' : 'Installed thickness'}:{' '}
                <strong className="text-slate-200">
                  {inputs.hasInsulation === false
                    ? '0 mm (Bare)'
                    : `${inputs.layers.reduce((s, l) => s + l.thicknessMm, 0)} mm`}
                </strong>
              </span>
              {results.outerSurfaceTempC > (inputs.targetOuterTempC || 60) && (
                <button
                  type="button"
                  onClick={() => onApplyRecommendedThickness(results.recommendedInsulationThicknessMm)}
                  className="text-amber-400 hover:text-amber-300 underline font-semibold text-[11px]"
                >
                  {lang === 'id' ? `Solusi: ${results.recommendedInsulationThicknessMm} mm` : `Need ${results.recommendedInsulationThicknessMm}mm`}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                {inputs.hasInsulation === false
                  ? (lang === 'id' ? 'Rekomendasi Isolasi Baru' : 'New Insulation Recom.')
                  : isDesign
                  ? t.insulationThickness
                  : (lang === 'id' ? 'Ketebalan Efektif Lapangan' : 'Field Effective Thickness')}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  inputs.hasInsulation === false
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {inputs.hasInsulation === false ? 'Bare Duct' : isDesign ? (lang === 'id' ? 'Desain' : 'Design') : (lang === 'id' ? 'Diagnosa' : 'Audit')}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-300 tracking-tight">
                {unitSystem === 'imperial'
                  ? (results.recommendedInsulationThicknessMm / 25.4).toFixed(2)
                  : results.recommendedInsulationThicknessMm}
              </span>
              <span className="text-sm font-semibold text-slate-400">{units.dim}</span>
              {unitSystem === 'imperial' && (
                <span className="text-xs text-slate-500 ml-1">
                  ({results.recommendedInsulationThicknessMm} mm)
                </span>
              )}
              {isDesign && (
                <button
                  type="button"
                  onClick={() => onApplyRecommendedThickness(results.recommendedInsulationThicknessMm)}
                  className="ml-auto text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  {inputs.hasInsulation === false
                    ? (lang === 'id' ? '+ Pasang Isolasi' : '+ Install Insulation')
                    : (lang === 'id' ? 'Terapkan Nilai' : 'Apply')}
                </button>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              {inputs.hasInsulation === false ? (
                <span className="text-amber-300/90 font-medium">
                  {lang === 'id'
                    ? `Kondisi telanjang (0 mm). Dihitung agar suhu turun ke ≤ ${unitHelpers.formatTemp(inputs.targetOuterTempC, unitSystem)}`
                    : `Bare condition (0 mm). Sized so surface temp drops to ≤ ${unitHelpers.formatTemp(inputs.targetOuterTempC, unitSystem)}`}
                </span>
              ) : isDesign ? (
                <span>
                  {lang === 'id'
                    ? `Dibutuhkan agar suhu luar ≤ ${unitHelpers.formatTemp(inputs.targetOuterTempC, unitSystem)} (ASTM C1055)`
                    : `Required for outer temp ≤ ${unitHelpers.formatTemp(inputs.targetOuterTempC, unitSystem)} (ASTM C1055)`}
                </span>
              ) : (
                <span>
                  {lang === 'id'
                    ? `Kondisi lining saat ini setara ${(results.diagnostic ? (results.diagnostic.effectiveThicknessRatio * 100).toFixed(0) : '100')}% dari desain awal`
                    : `Current lining condition equivalent to ${(results.diagnostic ? (results.diagnostic.effectiveThicknessRatio * 100).toFixed(0) : '100')}% of original design`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 3. Ketebalan Material Ducting Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              {t.ductShellThickness}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20">
              ASME / SMACNA
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-300 tracking-tight">
              {unitSystem === 'imperial'
                ? (results.recommendedDuctThicknessMm / 25.4).toFixed(2)
                : results.recommendedDuctThicknessMm}
            </span>
            <span className="text-sm font-semibold text-slate-400">{units.dim} (Min)</span>
            {unitSystem === 'imperial' && (
              <span className="text-xs text-slate-500 ml-1">
                ({results.recommendedDuctThicknessMm} mm)
              </span>
            )}
            {inputs.ductThicknessMm < results.recommendedDuctThicknessMm && (
              <button
                type="button"
                onClick={() => onApplyRecommendedDuctThickness(results.recommendedDuctThicknessMm)}
                className="ml-auto text-[11px] text-brand-400 hover:text-brand-300 underline font-medium"
              >
                {lang === 'id' ? 'Sesuaikan' : 'Adjust'}
              </button>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              {lang === 'id' ? 'Terpasang' : 'Installed'}:{' '}
              <strong className="text-slate-200">
                {unitHelpers.formatDim(inputs.ductThicknessMm, unitSystem)}
              </strong>
            </span>
            <span>
              Safety Factor:{' '}
              <strong
                className={
                  results.ductSafetyFactor >= 1.0 ? 'text-emerald-400' : 'text-red-400 font-bold'
                }
              >
                {results.ductSafetyFactor}x
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Surface Temperature & Safety Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          results.personnelProtectionStatus === 'safe'
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            : results.personnelProtectionStatus === 'warning'
            ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
            : 'bg-red-950/40 border-red-800/50 text-red-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-950/50">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold">
                {t.surfaceTemp}: {unitHelpers.formatTemp(results.outerSurfaceTempC, unitSystem)}
                {unitSystem === 'imperial' && ` (${results.outerSurfaceTempC}°C)`}
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-black/40">
                {results.personnelProtectionStatus === 'safe'
                  ? t.safeToTouch
                  : results.personnelProtectionStatus === 'warning'
                  ? t.warningTemp
                  : t.burnHazard}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {getSafetyStatusMessage(results.personnelProtectionStatus, results.outerSurfaceTempC, lang)}
            </p>
          </div>
        </div>

        <div className="text-right text-xs opacity-80 shrink-0">
          <div>{lang === 'id' ? 'Standar Perlindungan Personil: ASTM C1055' : 'Personnel Protection Standard: ASTM C1055'}</div>
          <div>{lang === 'id' ? 'Batas Maksimum Aman Kerja: ≤ 60°C' : 'Max Safe Working Limit: ≤ 60°C'}</div>
        </div>
      </div>

      {/* Diagnostic Health Box (Shown in Diagnose Mode) */}
      {!isDesign && results.diagnostic && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  {lang === 'id'
                    ? 'Laporan Diagnosa Lapangan: Keausan, Efektivitas & Kebutuhan Isolasi'
                    : 'Field Diagnostic Report: Wear, Effectiveness & Insulation Needs'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {lang === 'id'
                    ? `Berdasarkan perbandingan temperatur permukaan terukur (${inputs.measuredOuterTempC}°C) terhadap model termodinamika teoritis`
                    : `Based on comparing the measured surface temperature (${inputs.measuredOuterTempC}°C) against the theoretical thermodynamic model`}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                results.diagnostic.condition === 'Optimal'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : results.diagnostic.condition === 'Degradasi Ringan'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
              }`}
            >
              Status: {tr_condition(results.diagnostic.condition, lang)}
            </span>
          </div>

          {/* 3 Dedicated Diagnostic Answer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card A: Keausan & Efektivitas Isolasi */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  1. {lang === 'id' ? 'Keausan & Efektivitas Isolasi' : 'Insulation Wear & Effectiveness'}
                </span>
                <span className="text-[10px] text-slate-400">Lining / Blanket</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{lang === 'id' ? 'Tingkat Keausan / Degradasi:' : 'Wear / Degradation Level:'}</span>
                  <strong className={`font-mono ${results.diagnostic.insulationWearPercent > 30 ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                    {results.diagnostic.insulationWearPercent}%
                  </strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{lang === 'id' ? 'Tebal Efektif Lapangan:' : 'Field Effective Thickness:'}</span>
                  <strong className="text-slate-200 font-mono">
                    {results.diagnostic.effectiveThicknessMm} mm{' '}
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({lang === 'id' ? 'dari' : 'of'} {inputs.layers.reduce((s, l) => s + l.thicknessMm, 0)} mm)
                    </span>
                  </strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{lang === 'id' ? 'Efisiensi Tahan Panas vs Bare:' : 'Heat Retention Efficiency vs Bare:'}</span>
                  <strong className="text-emerald-400 font-mono">
                    {results.diagnostic.insulationEfficiencyPercent}%
                  </strong>
                </div>

                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-400">{lang === 'id' ? 'Daya Panas Ditahan:' : 'Heat Power Retained:'}</span>
                  <span className="text-slate-300 font-mono">
                    {results.diagnostic.heatLossSavedKW} kW
                  </span>
                </div>
              </div>
            </div>

            {/* Card B: Keausan Material Ducting Shell */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  2. {lang === 'id' ? 'Keausan Material Plat Ducting' : 'Ducting Plate Material Wear'}
                </span>
                <span className="text-[10px] text-slate-400">ASME / SMACNA</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{lang === 'id' ? 'Status Integritas Plat:' : 'Plate Integrity Status:'}</span>
                  <strong
                    className={`font-mono text-[11px] ${
                      results.diagnostic.ductIntegrityStatus === 'Aman & Optimal'
                        ? 'text-emerald-400'
                        : results.diagnostic.ductIntegrityStatus === 'Penipisan Ringan'
                        ? 'text-amber-400'
                        : 'text-red-400 font-bold'
                    }`}
                  >
                    {tr_ductIntegrity(results.diagnostic.ductIntegrityStatus, lang)}
                  </strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{lang === 'id' ? 'Tebal Aktual vs Rekomendasi:' : 'Actual vs Recommended Thickness:'}</span>
                  <strong className="text-slate-200 font-mono">
                    {inputs.ductThicknessMm} mm vs {results.recommendedDuctThicknessMm} mm
                  </strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{lang === 'id' ? 'Sisa Toleransi Korosi:' : 'Remaining Corrosion Allowance:'}</span>
                  <strong className="text-slate-200 font-mono">
                    {results.diagnostic.remainingCorrosionAllowanceMm} mm
                  </strong>
                </div>

                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-400">{lang === 'id' ? 'Safety Factor Struktural:' : 'Structural Safety Factor:'}</span>
                  <span
                    className={`font-mono font-bold ${
                      results.ductSafetyFactor >= 1.0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {results.ductSafetyFactor}x
                  </span>
                </div>
              </div>
            </div>

            {/* Card C: Keputusan Kebutuhan Isolasi */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  3. {lang === 'id' ? 'Kebutuhan Isolasi Termal' : 'Thermal Insulation Need'}
                </span>
                <span className="text-[10px] text-slate-400">{lang === 'id' ? 'Audit Keputusan' : 'Decision Audit'}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">{lang === 'id' ? 'STATUS URGENSI:' : 'URGENCY STATUS:'}</span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                      results.diagnostic.insulationUrgency.includes('WAJIB')
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : results.diagnostic.insulationUrgency.includes('DIANJURKAN')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {results.diagnostic.insulationUrgency}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800">
                  {results.diagnostic.insulationReason}
                </p>

                {results.diagnostic.isInsulationNeeded && (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">{lang === 'id' ? 'Rekomendasi Tebal Baru:' : 'New Thickness Recommendation:'}</span>
                    <button
                      type="button"
                      onClick={() => onApplyRecommendedThickness(results.recommendedInsulationThicknessMm)}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-semibold transition-all active:scale-95"
                    >
                      {lang === 'id' ? 'Terapkan' : 'Apply'} {results.recommendedInsulationThicknessMm} mm
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Engineering Action Items */}
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              {lang === 'id' ? 'Rekomendasi Tindakan Lapangan & Rencana Perbaikan:' : 'Recommended Field Actions & Repair Plan:'}
            </span>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 pt-1">
              {results.diagnostic.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Layer-by-Layer Temperature Distribution Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-400" />
            {lang === 'id' ? 'Distribusi Temperatur Antar-Lapisan (Gradient Profile)' : 'Inter-Layer Temperature Distribution (Gradient Profile)'}
          </h4>
          <span className="text-xs text-slate-400">
            T_Fluida = {inputs.fluidTempC}°C | T_Ambient = {inputs.ambientTempC}°C
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3">{lang === 'id' ? 'Lapisan' : 'Layer'}</th>
                <th className="py-2.5 px-3">{lang === 'id' ? 'Posisi' : 'Position'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'id' ? 'Tebal (mm)' : 'Thickness (mm)'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'id' ? 'T. Dalam (°C)' : 'T. Inner (°C)'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'id' ? 'T. Luar (°C)' : 'T. Outer (°C)'}</th>
                <th className="py-2.5 px-3 text-right">Drop ΔT (°C)</th>
                <th className="py-2.5 px-3 text-center">{lang === 'id' ? 'Status Batas Suhu' : 'Temp Limit Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {results.layerResults.map((lyr, index) => {
                const drop = Math.abs(lyr.tInnerC - lyr.tOuterC);
                return (
                  <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-200">
                      {lyr.name}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {lyr.materialName}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {lyr.position === 'inside' ? (
                        <span className="text-amber-400">{lang === 'id' ? 'Refraktori Dalam' : 'Inner Refractory'}</span>
                      ) : lyr.position === 'duct_wall' ? (
                        <span className="text-slate-300">{lang === 'id' ? 'Shell Plat Baja' : 'Steel Shell Plate'}</span>
                      ) : (
                        <span className="text-brand-400">{lang === 'id' ? 'Isolasi Luar' : 'Outer Insulation'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">
                      {lyr.thicknessMm}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      {lyr.tInnerC.toFixed(1)}°
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      {lyr.tOuterC.toFixed(1)}°
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-300">
                      -{drop.toFixed(1)}°
                    </td>
                    <td className="py-2 px-3 text-center">
                      {lyr.isOverheating ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3" /> Overheat (&gt;{lyr.maxServiceTempC}°C)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> {lang === 'id' ? 'Aman' : 'Safe'} ({lang === 'id' ? 'Maks' : 'Max'} {lyr.maxServiceTempC}°C)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
