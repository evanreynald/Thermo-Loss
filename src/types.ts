export type DuctShape = 'cylindrical' | 'rectangular' | 'kiln';
export type CalculationMode = 'design' | 'diagnose';
export type InsulationPosition = 'inside' | 'outside';
export type FluidType = 'hot_air' | 'flue_gas' | 'steam' | 'natural_gas' | 'thermal_oil' | 'water';
export type FlowRegime = 'auto' | 'turbulent' | 'laminar';

export interface DuctMaterial {
  id: string;
  name: string;
  category: 'mild_steel' | 'stainless_steel' | 'heat_resistant' | 'alloy' | 'cast_iron' | 'custom';
  thermalConductivity: number; // W/(m·K)
  maxServiceTempC: number; // °C
  allowableStressMpa: number; // MPa
  densityKgM3: number; // kg/m³
  description?: string;
  isCustom?: boolean;
}

export interface InsulationMaterial {
  id: string;
  name: string;
  category: 'blanket' | 'board' | 'brick' | 'castable' | 'calcium_silicate' | 'coating' | 'aerogel' | 'custom';
  thermalConductivity: number; // W/(m·K) at mean temp ~200-400C
  maxServiceTempC: number; // °C
  densityKgM3: number; // kg/m³
  isRefractory: boolean; // true for firebrick & castable (usually internal)
  description?: string;
  isCustom?: boolean;
}

export interface InsulationLayer {
  id: string;
  materialId: string;
  position: InsulationPosition;
  thicknessMm: number;
  name?: string;
  isManualConductivity?: boolean;
  customConductivity?: number; // W/(m·K) manual override
  customMaxTempC?: number; // °C manual override
}

export interface FluidProperty {
  type: FluidType;
  name: string;
  density: number; // kg/m³ at ref temp
  specificHeat: number; // J/(kg·K)
  viscosity: number; // Pa·s
  conductivity: number; // W/(m·K)
}

export interface CalculationInputs {
  mode: CalculationMode;
  shape: DuctShape;
  designGoal?: 'find_thickness' | 'find_surface_temp'; // Mode Desain: cari tebal vs cari suhu luar
  
  // Dimensions
  innerDiameterMm: number; // For cylindrical / kiln
  widthMm: number; // For rectangular
  heightMm: number; // For rectangular
  lengthM: number;
  ductThicknessMm: number;
  ductMaterialId: string;
  internalPressureBar: number;
  corrosionAllowanceMm: number;

  // Fluid conditions
  fluidType: FluidType;
  fluidTempC: number;
  fluidVelocityMs: number;
  flowRegime: FlowRegime;

  // Ambient conditions
  ambientTempC: number;
  windSpeedMs: number;
  externalEmissivity: number; // 0.1 to 0.95 (e.g. 0.85 for painted or rusted steel/jacket)

  // Mode Specific
  targetOuterTempC: number; // Design mode target surface temp (e.g. 60°C)
  measuredOuterTempC: number; // Diagnostic mode measured surface temp

  // Insulation configuration
  hasInsulation?: boolean; // false for bare pipe / bare duct without any insulation
  isMultiLayer: boolean;
  layers: InsulationLayer[];

  // Internal heat transfer model (ASTM C680 / VDI-Wärmeatlas)
  internalHeatTransferModel?: 'auto' | 'vdi_warmeatlas' | 'convection_only' | 'manual';
  customInternalHi?: number; // Manual override for h_in (W/m²·K)

  // Financial settings
  fuelType: 'natural_gas' | 'coal' | 'hsd_diesel' | 'biomass' | 'electricity';
  fuelCostPerUnit: number; // IDR per unit (e.g. IDR per MMBtu, IDR/kg, IDR/kWh)
  operatingHoursPerYear: number;
  boilerFurnaceEfficiencyPercent: number;
}

export interface LayerResult {
  name: string;
  materialName: string;
  position: InsulationPosition | 'duct_wall';
  thicknessMm: number;
  innerRadiusMm?: number;
  outerRadiusMm?: number;
  rValue: number; // Thermal resistance (K/W or m²·K/W)
  tInnerC: number;
  tOuterC: number;
  maxServiceTempC: number;
  isOverheating: boolean;
}

export interface CalculationResults {
  // Heat Transfer
  heatLossTotalW: number;
  heatLossPerMeterWm: number;
  heatFluxWm2: number;
  surfaceAreaM2: number;

  // Temperatures
  innerWallTempC: number;
  outerSurfaceTempC: number;
  refractoryOuterTempC?: number; // Suhu terluar refraktori (sebelum menyentuh plat shell)
  internalTransferModelUsed?: string;
  layerResults: LayerResult[];

  // Flow & Convection
  reynoldsNumber: number;
  flowType: 'Laminar' | 'Turbulen' | 'Transisi';
  internalConvectionHi: number; // W/(m²·K)
  externalConvectionHo: number; // W/(m²·K)
  radiationHr: number; // W/(m²·K)

  // Recommended thicknesses
  recommendedInsulationThicknessMm: number;
  recommendedInsulationTargetLayerId?: string;
  recommendedInsulationTargetLayerName?: string;
  recommendedInsulationTargetLayerPos?: InsulationPosition;
  recommendedInsulationCurrentThicknessMm?: number;
  recommendedInsulationAdditionalMm?: number;
  recommendedDuctThicknessMm: number; // ASME / SMACNA based
  ductSafetyFactor: number;

  // Safety & Assessment
  personnelProtectionStatus: 'safe' | 'warning' | 'danger'; // ASTM C1055 (<60°C is safe)
  statusMessage: string;

  // Diagnostic Health
  diagnostic?: {
    condition: 'Optimal' | 'Degradasi Ringan' | 'Degradasi Sedang' | 'Kerusakan Kritis / Hotspot';
    effectiveThicknessRatio: number; // ratio of remaining effective insulation (0 to 1.5)
    effectiveThicknessMm: number; // calculated remaining effective thickness
    insulationWearPercent: number; // % keausan atau degradasi isolasi
    heatLossExcessRatio: number; // actual / design heat loss ratio
    riskShellOverheat: boolean;
    recommendations: string[];

    // Keausan Plat Ducting
    ductWearPercent: number; // % keausan plat
    ductWallThinningMm: number; // penipisan plat
    remainingCorrosionAllowanceMm: number;
    ductIntegrityStatus: 'Aman & Optimal' | 'Penipisan Ringan' | 'Waspada Penipisan Kritis' | 'Di Bawah Tebal Minimum ASME/SMACNA';

    // Efektifitas Isolasi Terpasang
    insulationEfficiencyPercent: number; // % heat reduction vs bare duct
    heatLossSavedKW: number; // kW saved by insulation vs bare duct
    bareDuctHeatLossKW: number; // baseline heat loss if bare

    // Diagnosa Kebutuhan Isolasi
    isInsulationNeeded: boolean;
    insulationUrgency: 'WAJIB (Bahaya Personil & Pemborosan Ekstrem)' | 'DIANJURKAN (Konservasi Energi)' | 'SUDAH MEMADAI (Aman)';
    insulationReason: string;
  };

  // Financial Evaluation
  financial: {
    annualHeatLossKWh: number;
    annualHeatLossGJ: number;
    annualCostIdr: number;
    potentialSavingsIdr: number;
    co2EmissionsTonsPerYear: number;
  };
}

export interface ReportMetadata {
  projectName?: string;
  clientName?: string;
  engineerName?: string;
  reportNumber?: string;
  dateStr?: string;
  isCertified?: boolean;
}

export interface ReportPricingPlan {
  id: 'single' | 'pack5' | 'pack20';
  name: string;
  reportsCount: number;
  priceIdr: number;
  priceUsd: number;
  popular?: boolean;
  savingsPercent?: number;
  description: string;
}

export interface PurchaseTransaction {
  id: string;
  date: string;
  planId: string;
  planName: string;
  reportsAdded: number;
  amountIdr: number;
  paymentMethod: 'qris' | 'va' | 'card' | 'voucher';
  status: 'PAID' | 'PENDING';
}
