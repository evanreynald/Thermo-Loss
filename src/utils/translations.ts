export type Language = 'id' | 'en';
export type UnitSystem = 'metric' | 'imperial';

export interface Translations {
  appName: string;
  appSubtitle: string;
  modeDesign: string;
  modeDiagnose: string;
  designDesc: string;
  diagnoseDesc: string;
  shapeCylinder: string;
  shapeRect: string;
  shapeKiln: string;
  presetsTitle: string;
  inputsTitle: string;
  geometryTitle: string;
  dimensions: string;
  innerDiameter: string;
  width: string;
  height: string;
  length: string;
  ductThickness: string;
  ductMaterial: string;
  corrosionAllowance: string;
  operatingPressure: string;
  operatingConditions: string;
  fluidType: string;
  fluidTemp: string;
  fluidVelocity: string;
  ambientTemp: string;
  windSpeed: string;
  emissivity: string;
  targetSurfaceTemp: string;
  measuredSurfaceTemp: string;
  insulationConfig: string;
  withInsulation: string;
  bareDuct: string;
  addLayer: string;
  financialSettings: string;
  fuelType: string;
  operatingHours: string;
  furnaceEfficiency: string;
  resultsTitle: string;
  heatLossTotal: string;
  heatFlux: string;
  surfaceTemp: string;
  safeToTouch: string;
  burnHazard: string;
  warningTemp: string;
  insulationThickness: string;
  ductShellThickness: string;
  annualEnergyCost: string;
  co2Emissions: string;
  potentialSavings: string;
  exportPdf: string;
  exportPdfDesc: string;
  heatLossChartTitle: string;
  chartDesc: string;
  chartXAxis: string;
  chartYHeatLoss: string;
  chartYTemp: string;
  chartCurrentPoint: string;
  chartRecomPoint: string;
  chartSafeLine: string;
  unitMetric: string;
  unitImperial: string;
  payPerReport: string;
  reportCredits: string;
  buyCredits: string;
  creditRemaining: string;
  officialReport: string;
  draftReport: string;
  unlockOfficialReport: string;
}

export const translations: Record<Language, Translations> = {
  id: {
    appName: 'ThermoDuct',
    appSubtitle: 'Analisa Isolasi Termal & Ketebalan Ducting/Kiln/Pipa',
    modeDesign: 'Mode Desain',
    modeDiagnose: 'Mode Diagnosa',
    designDesc: 'Merancang ketebalan isolasi dan plat untuk memenuhi target temperatur permukaan (ASTM C1055).',
    diagnoseDesc: 'Mendiagnosa keausan material, degradasi isolasi, dan efektivitas berdasarkan data temperatur terukur di lapangan.',
    shapeCylinder: 'Silinder / Pipa',
    shapeRect: 'Ducting Persegi',
    shapeKiln: 'Rotary Kiln',
    presetsTitle: 'Preset Cepat Industri',
    inputsTitle: 'Parameter Desain & Operasi',
    geometryTitle: 'Geometri & Spesifikasi Saluran',
    dimensions: 'Dimensi Saluran',
    innerDiameter: 'Diameter Dalam (ID)',
    width: 'Lebar Ducting (W)',
    height: 'Tinggi Ducting (H)',
    length: 'Panjang Saluran',
    ductThickness: 'Tebal Plat Dinding Ducting',
    ductMaterial: 'Material Plat Dinding (Shell)',
    corrosionAllowance: 'Toleransi Korosi (Corrosion Allowance)',
    operatingPressure: 'Tekanan Internal (Gauge)',
    operatingConditions: 'Kondisi Operasi & Lingkungan',
    fluidType: 'Jenis Fluida Gas / Panas',
    fluidTemp: 'Temperatur Fluida Operasi (T_fluida)',
    fluidVelocity: 'Kecepatan Aliran Fluida',
    ambientTemp: 'Suhu Lingkungan Luar (T_ambient)',
    windSpeed: 'Kecepatan Angin Luar',
    emissivity: 'Emisivitas Permukaan Luar',
    targetSurfaceTemp: 'Target Suhu Permukaan Luar',
    measuredSurfaceTemp: 'Suhu Permukaan Luar Terukur',
    insulationConfig: 'Konfigurasi Lapisan Isolasi',
    withInsulation: 'Dengan Isolasi Termal',
    bareDuct: 'Tanpa Isolasi (Bare Duct)',
    addLayer: 'Tambah Lapisan',
    financialSettings: 'Parameter Biaya Energi & Finansial',
    fuelType: 'Jenis Sumber Bahan Bakar / Energi',
    operatingHours: 'Jam Operasi per Tahun',
    furnaceEfficiency: 'Efisiensi Boiler / Furnace',
    resultsTitle: 'Hasil Analisa & Dasbor Rekayasa',
    heatLossTotal: 'Total Kehilangan Panas',
    heatFlux: 'Fluks Panas',
    surfaceTemp: 'Temperatur Permukaan Luar',
    safeToTouch: 'Aman Sentuh (ASTM C1055)',
    burnHazard: 'Bahaya Luka Bakar!',
    warningTemp: 'Peringatan Suhu Tinggi',
    insulationThickness: 'Rekomendasi Tebal Isolator',
    ductShellThickness: 'Rekomendasi Tebal Plat Shell',
    annualEnergyCost: 'Estimasi Biaya Energi Terbuang',
    co2Emissions: 'Emisi Karbon Tahunan',
    potentialSavings: 'Potensi Penghematan Biaya',
    exportPdf: 'Unduh Laporan Resmi (PDF)',
    exportPdfDesc: 'Laporan teknis lengkap berstandar ASTM C1055, ASME B31.3 & SMACNA.',
    heatLossChartTitle: 'Grafik Kurva Karakteristik Heat Loss vs Tebal Isolasi',
    chartDesc: 'Simulasi kurva penurunan rugi kalor dan suhu permukaan terhadap variasi ketebalan insulasi.',
    chartXAxis: 'Ketebalan Isolasi',
    chartYHeatLoss: 'Rugi Kalor',
    chartYTemp: 'Suhu Permukaan',
    chartCurrentPoint: 'Titik Terpasang Saat Ini',
    chartRecomPoint: 'Titik Rekomendasi Optimal',
    chartSafeLine: 'Batas Maksimum Aman Personil (60°C / ASTM C1055)',
    unitMetric: 'Metrik (SI: mm, °C, kW, bar)',
    unitImperial: 'Imperial (US: in, °F, BTU/h, psi)',
    payPerReport: 'Pay Per Report',
    reportCredits: 'Kuota Laporan',
    buyCredits: 'Beli Kuota Laporan',
    creditRemaining: 'Kuota Tersisa',
    officialReport: 'Laporan Resmi Berlisensi',
    draftReport: 'Draft Sampel (Gratis)',
    unlockOfficialReport: 'Terbitkan Laporan Resmi (Certified PDF)',
  },
  en: {
    appName: 'ThermoDuct',
    appSubtitle: 'Thermal Insulation & Duct/Pipe/Kiln Wall Analyzer',
    modeDesign: 'Design Mode',
    modeDiagnose: 'Diagnostic Mode',
    designDesc: 'Design optimal insulation and shell wall thickness to meet target surface temperatures (ASTM C1055).',
    diagnoseDesc: 'Diagnose shell thinning, insulation degradation, and thermal efficiency based on measured field temperatures.',
    shapeCylinder: 'Cylinder / Pipe',
    shapeRect: 'Rectangular Duct',
    shapeKiln: 'Rotary Kiln',
    presetsTitle: 'Industrial Quick Presets',
    inputsTitle: 'Design & Operating Parameters',
    geometryTitle: 'Geometry & Shell Specifications',
    dimensions: 'Duct Dimensions',
    innerDiameter: 'Inner Diameter (ID)',
    width: 'Duct Width (W)',
    height: 'Duct Height (H)',
    length: 'Duct Length',
    ductThickness: 'Duct Wall Thickness',
    ductMaterial: 'Shell Wall Material',
    corrosionAllowance: 'Corrosion Allowance',
    operatingPressure: 'Internal Gauge Pressure',
    operatingConditions: 'Operating & Ambient Conditions',
    fluidType: 'Internal Fluid Type',
    fluidTemp: 'Operating Fluid Temperature (T_fluid)',
    fluidVelocity: 'Fluid Flow Velocity',
    ambientTemp: 'Ambient Air Temperature (T_ambient)',
    windSpeed: 'Ambient Wind Speed',
    emissivity: 'Outer Surface Emissivity',
    targetSurfaceTemp: 'Target Outer Surface Temp',
    measuredSurfaceTemp: 'Measured Outer Surface Temp',
    insulationConfig: 'Insulation Layer Configuration',
    withInsulation: 'With Thermal Insulation',
    bareDuct: 'Bare Duct (Uninsulated)',
    addLayer: 'Add Layer',
    financialSettings: 'Energy Financial & Cost Settings',
    fuelType: 'Primary Fuel / Energy Source',
    operatingHours: 'Operating Hours / Year',
    furnaceEfficiency: 'Boiler / Furnace Efficiency',
    resultsTitle: 'Engineering Results & Dashboard',
    heatLossTotal: 'Total Heat Loss',
    heatFlux: 'Heat Flux',
    surfaceTemp: 'Outer Surface Temperature',
    safeToTouch: 'Safe to Touch (ASTM C1055)',
    burnHazard: 'Burn Hazard Alert!',
    warningTemp: 'High Temperature Warning',
    insulationThickness: 'Recommended Insulation Thickness',
    ductShellThickness: 'Recommended Shell Wall Thickness',
    annualEnergyCost: 'Estimated Annual Heat Loss Cost',
    co2Emissions: 'Annual CO2 Emissions',
    potentialSavings: 'Potential Annual Savings',
    exportPdf: 'Download Engineering Report (PDF)',
    exportPdfDesc: 'Comprehensive engineering report referencing ASTM C1055, ASME B31.3 & SMACNA.',
    heatLossChartTitle: 'Heat Loss vs Insulation Thickness Curve',
    chartDesc: 'Simulation curve illustrating heat loss reduction and surface temperature behavior vs insulation thickness.',
    chartXAxis: 'Insulation Thickness',
    chartYHeatLoss: 'Heat Loss',
    chartYTemp: 'Surface Temp',
    chartCurrentPoint: 'Current Installed Point',
    chartRecomPoint: 'Optimal Recommended Point',
    chartSafeLine: 'Personnel Safety Limit (60°C / 140°F ASTM C1055)',
    unitMetric: 'Metric (SI: mm, °C, kW, bar)',
    unitImperial: 'Imperial (US: in, °F, BTU/h, psi)',
    payPerReport: 'Pay Per Report',
    reportCredits: 'Report Credits',
    buyCredits: 'Buy Report Credits',
    creditRemaining: 'Credits Remaining',
    officialReport: 'Official Certified Report',
    draftReport: 'Draft Preview (Free)',
    unlockOfficialReport: 'Issue Official Report (Certified PDF)',
  },
};
