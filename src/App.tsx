import React, { useState, useMemo, useRef } from "react";
import {
  CalculationInputs,
  CalculationMode,
  DuctShape,
  FluidType,
  FlowRegime,
  InsulationLayer,
  DuctMaterial,
  InsulationMaterial,
} from "./types";
import {
  DEFAULT_DUCT_MATERIALS,
  DEFAULT_INSULATION_MATERIALS,
  loadDuctMaterials,
  saveCustomDuctMaterial,
  deleteCustomDuctMaterial,
  loadInsulationMaterials,
  saveCustomInsulationMaterial,
  deleteCustomInsulationMaterial,
  FLUID_PROPERTIES,
} from "./data/materials";
import { calculateThermalPerformance } from "./utils/thermalCalculations";
import { exportCalculationToPDF } from "./utils/pdfExport";
import { CanvasCrossSection } from "./components/CanvasCrossSection";
import { LayerManager } from "./components/LayerManager";
import { FinancialCard } from "./components/FinancialCard";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { MaterialModal } from "./components/MaterialModal";
import { HeatLossChart } from "./components/HeatLossChart";
import { WallTemperatureProfileChart } from "./components/WallTemperatureProfileChart";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { PayPerReportModal } from "./components/PayPerReportModal";
import { Language, UnitSystem, translations } from "./utils/translations";
import { unitHelpers } from "./utils/unitConversion";
import {
  Wind,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Compass,
  FileSpreadsheet,
  Globe,
  Ruler,
} from "lucide-react";

export default function App() {
  // Multilingual & Unit System State
  const [lang, setLang] = useState<Language>("id");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const t = translations[lang];
  const tr = (id: string, en: string) => (lang === "id" ? id : en);

  // Master Data state
  const [ductMaterials, setDuctMaterials] = useState<DuctMaterial[]>(() =>
    loadDuctMaterials(),
  );
  const [insulationMaterials, setInsulationMaterials] = useState<
    InsulationMaterial[]
  >(() => loadInsulationMaterials());
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isPayReportModalOpen, setIsPayReportModalOpen] = useState(false);

  // Canvas ref for PDF snapshot export
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  // Main Calculation Inputs
  const [inputs, setInputs] = useState<CalculationInputs>({
    mode: "design",
    shape: "cylindrical",

    // Geometry
    innerDiameterMm: 500,
    widthMm: 600,
    heightMm: 400,
    lengthM: 10,
    ductThicknessMm: 6.0,
    ductMaterialId: DEFAULT_DUCT_MATERIALS[0].id,
    internalPressureBar: 1.5,
    corrosionAllowanceMm: 1.0,

    // Fluid
    fluidType: "hot_air",
    fluidTempC: 350,
    fluidVelocityMs: 12.0,
    flowRegime: "auto",

    // Ambient
    ambientTempC: 32,
    windSpeedMs: 1.5,
    externalEmissivity: 0.85,

    // Mode Specific
    designGoal: "find_surface_temp", // Default to calculating surface temp from configuration
    targetOuterTempC: 55, // Design mode target surface temp (<60°C for safe touch)
    measuredOuterTempC: 92, // Diagnostic mode field reading

    // Insulation Configuration
    hasInsulation: true,
    isMultiLayer: false,
    internalHeatTransferModel: 'auto',
    customInternalHi: 149.6,
    layers: [
      {
        id: "layer-1",
        materialId: DEFAULT_INSULATION_MATERIALS[0].id, // Rockwool
        position: "outside",
        thicknessMm: 80,
        name: DEFAULT_INSULATION_MATERIALS[0].name,
      },
    ],

    // Financial
    fuelType: "natural_gas",
    fuelCostPerUnit: 140000, // Rp 140.000 / MMBtu
    operatingHoursPerYear: 8000,
    boilerFurnaceEfficiencyPercent: 85,
  });

  // Calculate results on the fly
  const results = useMemo(() => {
    return calculateThermalPerformance(
      inputs,
      ductMaterials,
      insulationMaterials,
    );
  }, [inputs, ductMaterials, insulationMaterials]);

  // Selected duct material object
  const currentDuctMaterial = useMemo(() => {
    return (
      ductMaterials.find((m) => m.id === inputs.ductMaterialId) ||
      ductMaterials[0]
    );
  }, [ductMaterials, inputs.ductMaterialId]);

  const [chartViewMode, setChartViewMode] = useState<
    "wall_profile" | "heat_loss_curve" | "both"
  >("wall_profile");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  // Presets for fast testing
  const applyPreset = (presetName: string) => {
    if (presetName === "cooler_cement") {
      const mulSic =
        insulationMaterials.find((m) => m.id === "ins-neocast-mul-sic-15") ||
        insulationMaterials[0];
      const mixGun =
        insulationMaterials.find((m) => m.id === "ins-neocastmixgun-lw-140") ||
        insulationMaterials[1];
      const silca =
        insulationMaterials.find((m) => m.id === "ins-silca-board-1100") ||
        insulationMaterials[2];
      const heatSteel =
        ductMaterials.find((m) => m.category === "heat_resistant") ||
        ductMaterials[0];
      setInputs((prev) => ({
        ...prev,
        shape: "rectangular",
        widthMm: 1600,
        heightMm: 1400,
        ductThicknessMm: 0, // 0 mm so total is 320 mm refractory matching PT Benteng Api Technic / Semen Indonesia report
        ductMaterialId: heatSteel.id,
        fluidType: "flue_gas",
        fluidTempC: 1200,
        fluidVelocityMs: 12.0,
        internalPressureBar: 0.05,
        ambientTempC: 32,
        windSpeedMs: 2.0,
        externalEmissivity: 0.9,
        internalHeatTransferModel: 'vdi_warmeatlas',
        customInternalHi: 149.6,
        hasInsulation: true,
        isMultiLayer: true,
        layers: [
          {
            id: "layer-cooler-1",
            materialId: mulSic.id,
            position: "inside",
            thicknessMm: 220,
            name: "220 mm NEOCASTSUPER MUL-SIC 15",
          },
          {
            id: "layer-cooler-2",
            materialId: mixGun.id,
            position: "inside",
            thicknessMm: 50,
            name: "50 mm NEOCASTMIXGUN LW 140 A",
          },
          {
            id: "layer-cooler-3",
            materialId: silca.id,
            position: "inside", // Inside refractory lining before shell
            thicknessMm: 50,
            name: "50 mm SILCA BOARD 1100",
          },
        ],
      }));
    } else if (presetName === "steam_pipe") {
      const rockwool =
        insulationMaterials.find((m) => m.category === "blanket") ||
        insulationMaterials[0];
      const csMat =
        ductMaterials.find((m) => m.category === "alloy") || ductMaterials[0];
      setInputs((prev) => ({
        ...prev,
        shape: "cylindrical",
        innerDiameterMm: 250,
        ductThicknessMm: 8.0,
        ductMaterialId: csMat.id,
        fluidType: "steam",
        fluidTempC: 280,
        fluidVelocityMs: 25.0,
        internalPressureBar: 16.0,
        hasInsulation: true,
        isMultiLayer: false,
        layers: [
          {
            id: "layer-preset-1",
            materialId: rockwool.id,
            position: "outside",
            thicknessMm: 75,
            name: rockwool.name,
          },
        ],
      }));
    } else if (presetName === "rotary_kiln") {
      const firebrick =
        insulationMaterials.find((m) => m.id === "ins-firebrick-sk34") ||
        insulationMaterials[0];
      const castable =
        insulationMaterials.find((m) => m.id === "ins-lightweight-castable") ||
        insulationMaterials[1];
      const heatSteel =
        ductMaterials.find((m) => m.category === "heat_resistant") ||
        ductMaterials[0];
      setInputs((prev) => ({
        ...prev,
        shape: "kiln",
        innerDiameterMm: 2400,
        ductThicknessMm: 25.0,
        ductMaterialId: heatSteel.id,
        fluidType: "flue_gas",
        fluidTempC: 1150,
        fluidVelocityMs: 8.0,
        internalPressureBar: 0.1,
        hasInsulation: true,
        isMultiLayer: true,
        layers: [
          {
            id: "layer-kiln-1",
            materialId: firebrick.id,
            position: "inside",
            thicknessMm: 180,
            name: "Lapis 1: Bata Tahan Api SK-34 (Hot Face)",
          },
          {
            id: "layer-kiln-2",
            materialId: castable.id,
            position: "inside",
            thicknessMm: 75,
            name: "Lapis 2: Lightweight Castable (Backup)",
          },
        ],
      }));
    } else if (presetName === "flue_gas_duct") {
      const calSil =
        insulationMaterials.find((m) => m.id === "ins-calcium-silicate") ||
        insulationMaterials[0];
      const corten =
        ductMaterials.find((m) => m.id === "duct-corten") || ductMaterials[0];
      setInputs((prev) => ({
        ...prev,
        shape: "rectangular",
        widthMm: 1200,
        heightMm: 900,
        ductThicknessMm: 4.5,
        ductMaterialId: corten.id,
        fluidType: "flue_gas",
        fluidTempC: 340,
        fluidVelocityMs: 14.0,
        internalPressureBar: 0.05,
        hasInsulation: true,
        isMultiLayer: false,
        layers: [
          {
            id: "layer-flue-1",
            materialId: calSil.id,
            position: "outside",
            thicknessMm: 90,
            name: calSil.name,
          },
        ],
      }));
    } else if (presetName === "bare_pipe") {
      const csMat =
        ductMaterials.find((m) => m.category === "alloy") || ductMaterials[0];
      setInputs((prev) => ({
        ...prev,
        shape: "cylindrical",
        innerDiameterMm: 200,
        ductThicknessMm: 6.0,
        ductMaterialId: csMat.id,
        fluidType: "steam",
        fluidTempC: 220,
        fluidVelocityMs: 18.0,
        internalPressureBar: 8.0,
        hasInsulation: false,
        isMultiLayer: false,
        layers: [],
      }));
    }
  };

  // Handlers for adding custom materials
  const handleSaveCustomDuct = (mat: DuctMaterial) => {
    const updated = saveCustomDuctMaterial(mat);
    setDuctMaterials(updated);
  };

  const handleSaveCustomInsulation = (mat: InsulationMaterial) => {
    const updated = saveCustomInsulationMaterial(mat);
    setInsulationMaterials(updated);
  };

  const handleDeleteCustomDuct = (materialId: string) => {
    const updated = deleteCustomDuctMaterial(materialId);
    setDuctMaterials(updated);
    // Fall back to the first default if the deleted material was in use
    if (inputs.ductMaterialId === materialId) {
      setInputs((prev) => ({
        ...prev,
        ductMaterialId: DEFAULT_DUCT_MATERIALS[0].id,
      }));
    }
  };

  const handleDeleteCustomInsulation = (materialId: string) => {
    const updated = deleteCustomInsulationMaterial(materialId);
    setInsulationMaterials(updated);
    // Fall back to the first default for any layer using the deleted material
    setInputs((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.materialId === materialId
          ? { ...l, materialId: DEFAULT_INSULATION_MATERIALS[0].id }
          : l,
      ),
    }));
  };

  // PDF Export - Opens the Pay Per Report & Official Certification Modal
  const handleExportPDF = () => {
    setIsPayReportModalOpen(true);
  };

  // Apply thickness recommendations directly to the targeted layer
  const handleApplyRecommendedInsulation = (thickMm: number, targetLayerId?: string) => {
    setInputs((prev) => {
      const defaultMat = insulationMaterials[0];
      if (!prev.hasInsulation || prev.layers.length === 0) {
        return {
          ...prev,
          hasInsulation: true,
          layers: [
            {
              id: "layer-recom",
              materialId: defaultMat.id,
              position: "outside",
              thicknessMm: thickMm,
              name: defaultMat.name,
            },
          ],
        };
      }
      const targetId = targetLayerId || prev.layers.find((l) => l.position === 'outside')?.id || prev.layers[0]?.id;
      return {
        ...prev,
        hasInsulation: true,
        layers: prev.layers.map((l) => (l.id === targetId ? { ...l, thicknessMm: thickMm } : l)),
      };
    });
  };

  const handleApplyRecommendedDuct = (thickMm: number) => {
    setInputs((prev) => ({ ...prev, ductThicknessMm: thickMm }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/20 shrink-0 p-1.5">
            <img
              src="/sig-logo.png"
              alt="SIG"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              SIG ThermoDuct
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/30">
                Thermal & Mechanical Engineering
              </span>
            </h1>
            <p className="text-xs text-slate-400">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Global Controls: Language, Units, PWA Install, Mode Switch & Master Data */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <div className="px-1.5 text-slate-500">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              id="lang-id-btn"
              onClick={() => setLang("id")}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                lang === "id"
                  ? "bg-slate-800 text-amber-400 shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Bahasa Indonesia"
            >
              ID
            </button>
            <button
              type="button"
              id="lang-en-btn"
              onClick={() => setLang("en")}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                lang === "en"
                  ? "bg-slate-800 text-amber-400 shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Unit System Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              id="unit-metric-btn"
              onClick={() => setUnitSystem("metric")}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-semibold transition-all ${
                unitSystem === "metric"
                  ? "bg-brand-600/30 text-brand-300 border border-brand-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title={t.unitMetric}
            >
              <Ruler className="w-3 h-3 text-brand-400" />
              <span>SI Metric</span>
            </button>
            <button
              type="button"
              id="unit-imperial-btn"
              onClick={() => setUnitSystem("imperial")}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-semibold transition-all ${
                unitSystem === "imperial"
                  ? "bg-brand-600/30 text-brand-300 border border-brand-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title={t.unitImperial}
            >
              <span>US Imperial</span>
            </button>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton lang={lang} />

          {/* Mode Switch (Design vs Diagnostic) */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              id="mode-design-btn"
              onClick={() => setInputs((prev) => ({ ...prev, mode: "design" }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputs.mode === "design"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.modeDesign}
            </button>
            <button
              type="button"
              id="mode-diagnose-btn"
              onClick={() =>
                setInputs((prev) => ({ ...prev, mode: "diagnose" }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputs.mode === "diagnose"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.modeDiagnose}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMaterialModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            {lang === "id" ? "Master Material" : "Custom Materials"}
          </button>
        </div>
      </header>

      {/* Preset bar as dropdown menu (Sesuai Permintaan User a.3) */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 lg:px-8 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <label
            htmlFor="quick-preset-select"
            className="font-semibold text-slate-300 shrink-0"
          >
            {lang === "id"
              ? "Template Rekayasa Cepat:"
              : "Quick Engineering Templates:"}
          </label>
          <select
            id="quick-preset-select"
            value={selectedPreset}
            onChange={(e) => {
              if (e.target.value) {
                applyPreset(e.target.value);
                setSelectedPreset(e.target.value);
              }
            }}
            className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-brand-500 transition-colors cursor-pointer shadow-xs"
          >
            <option value="" disabled>
              {lang === "id"
                ? "-- Pilih Template Kasus Rekayasa --"
                : "-- Choose Engineering Template --"}
            </option>
            <option value="cooler_cement">
              🏭 {tr("Cooler Kiln (Model Vendor 1200°C / 3 Lapis Refraktori)", "Cooler Kiln (Vendor Model 1200°C / 3 Refractory Layers)")}
            </option>
            <option value="steam_pipe">
              ♨️ {tr("Pipa Uap Panas / Steam Pipe (280°C)", "Steam Pipe (280°C)")}
            </option>
            <option value="rotary_kiln">🔥 Rotary Kiln (1150°C)</option>
            <option value="flue_gas_duct">
              💨 {tr("Ducting Flue Gas Persegi (340°C)", "Rectangular Flue Gas Ducting (340°C)")}
            </option>
            <option value="bare_pipe">
              ⚠️ {tr("Pipa Telanjang / Bare Pipe (220°C)", "Bare Pipe (220°C)")}
            </option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500">
          {tr("Standar", "Standards")}: <strong className="text-slate-400">ASTM C1055</strong> (Touch
          Safety), <strong className="text-slate-400">ASME B31.3</strong>,{" "}
          <strong className="text-slate-400">SMACNA</strong>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5">
         {/* Single container grouping all 4 input sections, so it reads as "the form to fill in" */}
         <div className="bg-slate-900/40 border border-brand-500/30 rounded-2xl p-3 sm:p-4 space-y-4">
          <div className="flex items-center gap-3 px-1 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/30 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {tr("Input Data Perhitungan", "Calculation Input Data")}
              </h2>
              <p className="text-[11px] text-slate-400">
                {tr(
                  "Isi keempat bagian di bawah ini, hasil akan dihitung otomatis di sebelah kanan.",
                  "Fill in the four sections below; results update automatically on the right."
                )}
              </p>
            </div>
          </div>

          {/* Geometri & Dimensi Ducting Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-400" />
                1.{" "}
                {tr(
                  "Bentuk & Dimensi Komponen",
                  "Shape & Component Dimensions",
                )}
              </h3>
              <select
                value={inputs.shape}
                onChange={(e) =>
                  setInputs({ ...inputs, shape: e.target.value as DuctShape })
                }
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:border-brand-500"
              >
                <option value="cylindrical">
                  {tr("Silinder / Pipa Bundar", "Cylinder / Round Pipe")}
                </option>
                <option value="rectangular">
                  {tr("Ducting Persegi / Kotak", "Rectangular / Box Duct")}
                </option>
                <option value="kiln">Rotary Kiln / Furnace Shell</option>
              </select>
            </div>

            {/* Dimensional inputs based on shape */}
            {inputs.shape === "rectangular" ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {tr("Lebar Ducting W (mm)", "Duct Width W (mm)")}
                  </label>
                  <input
                    type="number"
                    min="50"
                    value={inputs.widthMm}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        widthMm: parseInt(e.target.value) || 100,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {tr("Tinggi Ducting H (mm)", "Duct Height H (mm)")}
                  </label>
                  <input
                    type="number"
                    min="50"
                    value={inputs.heightMm}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        heightMm: parseInt(e.target.value) || 100,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {tr("Diameter Dalam ID (mm)", "Inner Diameter ID (mm)")}
                  </label>
                  <input
                    type="number"
                    min="20"
                    value={inputs.innerDiameterMm}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        innerDiameterMm: parseInt(e.target.value) || 50,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {tr("Panjang Ducting L (m)", "Duct Length L (m)")}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={inputs.lengthM}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        lengthM: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Material Ducting & Thickness */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {tr("Material Shell Ducting", "Duct Shell Material")}
                </label>
                <select
                  value={inputs.ductMaterialId}
                  onChange={(e) =>
                    setInputs({ ...inputs, ductMaterialId: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                >
                  {ductMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (k={m.thermalConductivity} W/mK)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">
                    {tr("Tebal Plat Shell (mm)", "Shell Plate Thickness (mm)")}
                  </label>
                  <span className="text-[10px] text-brand-400">
                    {tr("Saran", "Suggested")}:{" "}
                    {results.recommendedDuctThicknessMm} mm
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={inputs.ductThicknessMm}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      ductThicknessMm: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            {/* Pressure & Corrosion */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {tr(
                    "Tekanan Internal P (bar Gauge)",
                    "Internal Pressure P (bar Gauge)",
                  )}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={inputs.internalPressureBar}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      internalPressureBar: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Corrosion Allowance (mm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={inputs.corrosionAllowanceMm}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      corrosionAllowanceMm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Fluida & Operasi Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Wind className="w-4 h-4 text-brand-400" />
              2.{" "}
              {tr(
                "Parameter Fluida & Aliran Internal",
                "Fluid & Internal Flow Parameters",
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {tr("Jenis Fluida di Dalam", "Internal Fluid Type")}
                </label>
                <select
                  value={inputs.fluidType}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      fluidType: e.target.value as FluidType,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="hot_air">
                    {tr("Udara Panas (Hot Air)", "Hot Air")}
                  </option>
                  <option value="flue_gas">
                    {tr(
                      "Gas Buang (Flue Gas Kiln/Boiler)",
                      "Flue Gas (Kiln/Boiler)",
                    )}
                  </option>
                  <option value="steam">
                    {tr("Uap Air (Superheated Steam)", "Superheated Steam")}
                  </option>
                  <option value="natural_gas">
                    {tr("Gas Alam (Methane)", "Natural Gas (Methane)")}
                  </option>
                  <option value="thermal_oil">
                    {tr("Minyak Termal (Thermal Oil)", "Thermal Oil")}
                  </option>
                  <option value="water">
                    {tr("Air Panas Bertekanan", "Pressurized Hot Water")}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {tr(
                    "Temperatur Fluida T_f (°C) *",
                    "Fluid Temperature T_f (°C) *",
                  )}
                </label>
                <input
                  type="number"
                  value={inputs.fluidTempC}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      fluidTempC: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {tr("Kecepatan Fluida v (m/s)", "Fluid Velocity v (m/s)")}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={inputs.fluidVelocityMs}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      fluidVelocityMs: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {tr("Rezim Aliran", "Flow Regime")}
                </label>
                <select
                  value={inputs.flowRegime}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      flowRegime: e.target.value as FlowRegime,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="auto">
                    Auto (
                    {tr(
                      results.flowType,
                      { Turbulen: "Turbulent", Laminar: "Laminar", Transisi: "Transitional" }[results.flowType] ??
                        results.flowType,
                    )}
                    )
                  </option>
                  <option value="turbulent">
                    {tr(
                      "Turbulen (Dittus-Boelter)",
                      "Turbulent (Dittus-Boelter)",
                    )}
                  </option>
                  <option value="laminar">Laminar</option>
                </select>
              </div>
            </div>

            {/* Internal Heat Transfer Model (VDI-Wärmeatlas vs Dittus-Boelter Convection) */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>{tr("Model Pindah Panas Gas Dalam (h_in)", "Internal Gas Heat Transfer Model (h_in)")}</span>
                </label>
                <span className="text-[11px] text-brand-400 font-mono font-semibold">
                  h_in: {results.internalConvectionHi} W/m²·K
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={inputs.internalHeatTransferModel || 'auto'}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      internalHeatTransferModel: e.target.value as any,
                      customInternalHi:
                        e.target.value === 'manual'
                          ? inputs.customInternalHi || 149.6
                          : inputs.customInternalHi,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="auto">
                    {tr(
                      "Auto (VDI-Wärmeatlas & Radiasi jika ≥500°C)",
                      "Auto (VDI-Wärmeatlas & Radiation if ≥500°C)",
                    )}
                  </option>
                  <option value="vdi_warmeatlas">
                    VDI-Wärmeatlas (1974) Kc1 (149.6 W/m²·K @ 1200°C)
                  </option>
                  <option value="convection_only">
                    {tr(
                      "Konveksi Pipa Standar (Dittus-Boelter)",
                      "Standard Pipe Convection (Dittus-Boelter)",
                    )}
                  </option>
                  <option value="manual">
                    {tr(
                      "Input Manual Nilai h_in (W/m²·K)",
                      "Manual h_in Value Input (W/m²·K)",
                    )}
                  </option>
                </select>

                {inputs.internalHeatTransferModel === 'manual' ? (
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={inputs.customInternalHi ?? 149.6}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          customInternalHi: parseFloat(e.target.value) || 149.6,
                        })
                      }
                      placeholder="h_in (W/m²·K)"
                      className="w-full bg-slate-950 border border-brand-500/80 rounded-lg px-2.5 py-1.5 text-brand-300 font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 flex items-center bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="truncate">
                      {inputs.internalHeatTransferModel === 'convection_only'
                        ? tr(
                            'Konveksi pipa (fluida suhu rendah/sedang)',
                            'Pipe convection (low/medium temperature fluid)',
                          )
                        : tr(
                            'Standar Tungku/Kiln (Radiasi Gas CO₂/H₂O + Turbulen)',
                            'Furnace/Kiln standard (CO₂/H₂O gas radiation + turbulent)',
                          )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kondisi Lingkungan Luar & Mode Target */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                3.{" "}
                {tr(
                  "Parameter Termal & Kondisi Operasi",
                  "Thermal Parameters & Operating Conditions",
                )}
              </h3>
              <span className="text-[11px] text-slate-400">
                Mode:{" "}
                <strong
                  className={
                    inputs.mode === "design"
                      ? "text-brand-400"
                      : "text-amber-400"
                  }
                >
                  {inputs.mode === "design"
                    ? tr("Mode Desain", "Design Mode")
                    : tr("Mode Diagnosa Lapangan", "Field Diagnostic Mode")}
                </strong>
              </span>
            </div>

            {/* A. MODE DESAIN (Permintaan User a.2: Pilihan Jadikan Suhu Luar Output vs Cari Tebal) */}
            {inputs.mode === "design" ? (
              <div className="space-y-3">
                {/* Selector Tujuan Desain */}
                <div>
                  <label
                    htmlFor="design-goal-select"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    {tr(
                      "Tujuan Perhitungan Desain:",
                      "Design Calculation Goal:",
                    )}
                  </label>
                  <select
                    id="design-goal-select"
                    value={inputs.designGoal || "find_surface_temp"}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        designGoal: e.target.value as
                          | "find_thickness"
                          | "find_surface_temp",
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 hover:border-brand-500 rounded-lg px-2.5 py-1.5 text-xs text-brand-300 font-semibold focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="find_surface_temp">
                      🌡️{" "}
                      {tr(
                        "Hitung Suhu Permukaan Luar dari Konfigurasi Tebal (Suhu Luar sebagai Output)",
                        "Calculate Outer Surface Temperature from Thickness Configuration (Surface Temp as Output)",
                      )}
                    </option>
                    <option value="find_thickness">
                      📏{" "}
                      {tr(
                        "Hitung Tebal Isolasi Optimal dari Target Suhu Luar (Inverse Optimization)",
                        "Calculate Optimal Insulation Thickness from Target Surface Temperature (Inverse Optimization)",
                      )}
                    </option>
                  </select>
                </div>

                {inputs.designGoal === "find_surface_temp" ? (
                  <div className="p-3 bg-brand-950/20 border border-brand-800/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-brand-300 font-semibold">
                        {tr(
                          "Kondisi: Suhu Permukaan Luar Dihitung sebagai Output",
                          "Condition: Outer Surface Temperature Calculated as Output",
                        )}
                      </span>
                      <span className="text-[10px] text-brand-400">
                        Direct Calculation
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tr(
                        "Aplikasi akan menghitung berapa temperatur luar (",
                        "The app will calculate the outer temperature (",
                      )}
                      <em>T_surface</em>
                      {tr(
                        ") yang didapat berdasarkan ketebalan isolasi yang Anda masukkan di bawah, serta memverifikasi kesesuaiannya dengan batas personil aman.",
                        ") obtained based on the insulation thickness you enter below, and verify it against the safe personnel limit.",
                      )}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-xs text-slate-400 shrink-0">
                        {tr(
                          "Batas Acuan Maksimal Aman (°C):",
                          "Max Safe Reference Limit (°C):",
                        )}
                      </label>
                      <input
                        type="number"
                        value={inputs.targetOuterTempC}
                        onChange={(e) =>
                          setInputs({
                            ...inputs,
                            targetOuterTempC: parseFloat(e.target.value) || 60,
                          })
                        }
                        className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono font-bold text-xs"
                      />
                      <span className="text-[11px] text-slate-500">
                        (ASTM C1055: ≤ 60°C)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-brand-950/30 border border-brand-800/40 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-brand-300 font-semibold">
                        {tr(
                          "Target Suhu Luar Maksimal (°C) [Desain Target] *",
                          "Max Target Surface Temperature (°C) [Design Target] *",
                        )}
                      </label>
                      <span className="text-[10px] text-brand-400">
                        {tr(
                          "Standar Personil: ≤ 60°C",
                          "Personnel Standard: ≤ 60°C",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={inputs.targetOuterTempC}
                        onChange={(e) =>
                          setInputs({
                            ...inputs,
                            targetOuterTempC: parseFloat(e.target.value) || 50,
                          })
                        }
                        className="w-24 bg-slate-950 border border-brand-600 rounded-lg px-3 py-1.5 text-white font-bold text-sm"
                      />
                      <span className="text-xs text-slate-300">
                        {tr(
                          "Sistem merekomendasikan tebal isolasi minimum agar suhu luar ≤",
                          "The system recommends the minimum insulation thickness so the surface temperature stays ≤",
                        )}{" "}
                        {inputs.targetOuterTempC}°C.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* B. MODE DIAGNOSA (Permintaan User b: Posisi dibalik antara Suhu Shell Terukur dahulu, lalu Target Suhu) */
              <div className="space-y-3">
                {/* 1. Suhu Shell / Body Terukur Dahulu (Hasil Inspeksi Lapangan) */}
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      1.{" "}
                      {tr(
                        "Temperatur Shell / Body Terukur (°C) [Hasil Inspeksi Lapangan] *",
                        "Measured Shell / Body Temperature (°C) [Field Inspection Result] *",
                      )}
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {tr(
                        "Termografi IR / Pyrometer",
                        "IR Thermography / Pyrometer",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={inputs.measuredOuterTempC}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          measuredOuterTempC: parseFloat(e.target.value) || 80,
                        })
                      }
                      className="w-28 bg-slate-950 border border-amber-500 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold text-base shadow-xs"
                    />
                    <span className="text-xs text-slate-300">
                      {tr(
                        "Temperatur aktual dinding luar shell hasil pengukuran lapangan untuk mendeteksi degradasi isolasi.",
                        "The actual outer shell wall temperature from field measurement, used to detect insulation degradation.",
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. Target Suhu Permukaan Luar Setelahnya */}
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block">
                      2.{" "}
                      {tr(
                        "Target Suhu Permukaan Luar (°C) [Batas Standar / Desain Acuan]",
                        "Target Outer Surface Temperature (°C) [Standard Limit / Design Reference]",
                      )}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {tr(
                        "Batas keselamatan sentuh personil (ASTM C1055: ≤ 60°C)",
                        "Personnel touch-safety limit (ASTM C1055: ≤ 60°C)",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={inputs.targetOuterTempC}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          targetOuterTempC: parseFloat(e.target.value) || 60,
                        })
                      }
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-white font-mono font-semibold text-xs"
                    />
                    <span className="text-slate-400 text-xs">°C</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Parameter Udara Lingkungan Sekitar (Ambient) */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {tr(
                  "Kondisi Udara Lingkungan Sekitar (Ambient):",
                  "Surrounding Ambient Air Conditions:",
                )}
              </span>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {tr(
                      "Suhu Udara Sekitar T_amb (°C)",
                      "Ambient Air Temperature T_amb (°C)",
                    )}
                  </label>
                  <input
                    type="number"
                    value={inputs.ambientTempC}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        ambientTempC: parseFloat(e.target.value) || 25,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                    title={tr(
                      "Temperatur udara bebas sekitar ducting",
                      "Free air temperature surrounding the duct",
                    )}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {tr("Angin v_wind (m/s)", "Wind v_wind (m/s)")}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={inputs.windSpeedMs}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        windSpeedMs: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {tr("Emisivitas Luar ε", "Outer Emissivity ε")}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.99"
                    value={inputs.externalEmissivity}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        externalEmissivity: parseFloat(e.target.value) || 0.85,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Layer Manager Component */}
          <LayerManager
            lang={lang}
            hasInsulation={inputs.hasInsulation ?? true}
            onToggleHasInsulation={(enabled) =>
              setInputs((prev) => ({ ...prev, hasInsulation: enabled }))
            }
            layers={inputs.layers}
            isMultiLayer={inputs.isMultiLayer}
            insulationMaterials={insulationMaterials}
            onToggleMultiLayer={(enabled) =>
              setInputs((prev) => ({ ...prev, isMultiLayer: enabled }))
            }
            onUpdateLayers={(newLayers) =>
              setInputs((prev) => ({ ...prev, layers: newLayers }))
            }
            onOpenAddMaterialModal={() => setIsMaterialModalOpen(true)}
            ductMaterialName={currentDuctMaterial.name}
          />
         </div>
        </div>

        {/* Right Column: Visual Canvas & Calculation Results & Financials (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Visual 2D Canvas */}
          <CanvasCrossSection
            lang={lang}
            inputs={inputs}
            results={results}
            ductMaterials={ductMaterials}
            insulationMaterials={insulationMaterials}
            onCanvasReady={(canvas) => {
              canvasElementRef.current = canvas;
            }}
          />

          {/* Results Summary Dashboard */}
          <ResultsDashboard
            inputs={inputs}
            results={results}
            ductMaterial={currentDuctMaterial}
            lang={lang}
            unitSystem={unitSystem}
            onExportPDF={handleExportPDF}
            onApplyRecommendedThickness={handleApplyRecommendedInsulation}
            onApplyRecommendedDuctThickness={handleApplyRecommendedDuct}
          />

          {/* Chart View Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setChartViewMode("wall_profile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  chartViewMode === "wall_profile"
                    ? "bg-brand-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span>📊</span>
                <span>
                  {lang === "id"
                    ? "Diagram Profil Gradien Suhu (Model Vendor ASTM C680)"
                    : "Wall Temperature Profile (Vendor Standard)"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setChartViewMode("heat_loss_curve")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  chartViewMode === "heat_loss_curve"
                    ? "bg-brand-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span>📉</span>
                <span>
                  {lang === "id"
                    ? "Kurva Penurunan Heat Loss vs Tebal"
                    : "Heat Loss vs Thickness Curve"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setChartViewMode("both")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartViewMode === "both"
                    ? "bg-slate-700 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
                title={tr("Tampilkan Kedua Grafik", "Show Both Charts")}
              >
                {lang === "id" ? "Tampilkan Keduanya" : "Show Both"}
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline px-2">
              ASTM C680 & C1055 Compliant
            </span>
          </div>

          {/* Conditional Rendering of Charts */}
          {(chartViewMode === "wall_profile" || chartViewMode === "both") && (
            <WallTemperatureProfileChart
              inputs={inputs}
              results={results}
              lang={lang}
              unitSystem={unitSystem}
            />
          )}

          {(chartViewMode === "heat_loss_curve" ||
            chartViewMode === "both") && (
            <HeatLossChart
              inputs={inputs}
              results={results}
              lang={lang}
              unitSystem={unitSystem}
            />
          )}

          {/* Financial & Energy Loss Analysis Card */}
          <FinancialCard
            lang={lang}
            inputs={inputs}
            results={results}
            onUpdateFinancial={(updates) =>
              setInputs((prev) => ({ ...prev, ...updates }))
            }
          />
        </div>
      </main>

      {/* Material Modal for adding new custom materials */}
      <MaterialModal
        lang={lang}
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        ductMaterials={ductMaterials}
        insulationMaterials={insulationMaterials}
        onSaveDuctMaterial={handleSaveCustomDuct}
        onSaveInsulationMaterial={handleSaveCustomInsulation}
        onDeleteDuctMaterial={handleDeleteCustomDuct}
        onDeleteInsulationMaterial={handleDeleteCustomInsulation}
      />

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator lang={lang} />

      {/* Pay Per Report & Official Certification Modal */}
      <PayPerReportModal
        isOpen={isPayReportModalOpen}
        onClose={() => setIsPayReportModalOpen(false)}
        inputs={inputs}
        results={results}
        ductMaterial={currentDuctMaterial}
        canvasElement={canvasElementRef.current}
        lang={lang}
        unitSystem={unitSystem}
      />

      {/* Footer note */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500">
        ThermoDuct Engineering Suite •{" "}
        {lang === "id"
          ? "Analisa Perpindahan Panas Konduksi, Konveksi & Radiasi Multilapis • Ekspor PDF & Diagnosa Rekayasa"
          : "Multilayer Conduction, Convection & Radiation Heat Transfer • PDF Engineering Reports & Diagnostics"}
      </footer>
    </div>
  );
}
