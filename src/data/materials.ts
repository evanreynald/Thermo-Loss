import { DuctMaterial, InsulationMaterial, FluidProperty, FluidType } from '../types';

export const DEFAULT_DUCT_MATERIALS: DuctMaterial[] = [
  {
    id: 'duct-mild-steel-a36',
    name: 'Mild Steel (ASTM A36 / SS400)',
    category: 'mild_steel',
    thermalConductivity: 51.5,
    maxServiceTempC: 425,
    allowableStressMpa: 115,
    densityKgM3: 7850,
    description: 'Material standar umum untuk ducting udara, gas buang suhu rendah, dan pipa struktur.',
  },
  {
    id: 'duct-carbon-steel-a106',
    name: 'Carbon Steel (ASTM A106 Gr. B)',
    category: 'alloy',
    thermalConductivity: 48.0,
    maxServiceTempC: 450,
    allowableStressMpa: 118,
    densityKgM3: 7850,
    description: 'Pipa seamless standar industri petrokimia dan pembangkit untuk fluida bertekanan.',
  },
  {
    id: 'duct-ss304',
    name: 'Stainless Steel 304 (AISI 304)',
    category: 'stainless_steel',
    thermalConductivity: 16.2,
    maxServiceTempC: 800,
    allowableStressMpa: 138,
    densityKgM3: 7930,
    description: 'Baja austenitik tahan karat, sangat cocok untuk gas korosif dan suhu menengah-tinggi.',
  },
  {
    id: 'duct-ss316l',
    name: 'Stainless Steel 316L (AISI 316L)',
    category: 'stainless_steel',
    thermalConductivity: 15.8,
    maxServiceTempC: 850,
    allowableStressMpa: 115,
    densityKgM3: 8000,
    description: 'Baja tahan karat molibdenum tinggi terhadap asam dan lingkungan gas buang agresif.',
  },
  {
    id: 'duct-ss310s',
    name: 'Heat Resistant Steel (AISI 310S / 25-20)',
    category: 'heat_resistant',
    thermalConductivity: 14.2,
    maxServiceTempC: 1150,
    allowableStressMpa: 140,
    densityKgM3: 7980,
    description: 'Baja tahan panas kromium-nikel tinggi untuk shell kiln, burner duct, dan tungku perlakuan panas.',
  },
  {
    id: 'duct-corten',
    name: 'Corten Steel (Weathering ASTM A588)',
    category: 'mild_steel',
    thermalConductivity: 45.0,
    maxServiceTempC: 550,
    allowableStressMpa: 135,
    densityKgM3: 7850,
    description: 'Baja tahan korosi atmosferik untuk cerobong (chimney) dan ducting flue gas outdoor.',
  },
  {
    id: 'duct-inconel625',
    name: 'Inconel 625 (Superalloy Nickel)',
    category: 'alloy',
    thermalConductivity: 9.8,
    maxServiceTempC: 1000,
    allowableStressMpa: 200,
    densityKgM3: 8440,
    description: 'Superalloy berkekuatan mekanik tinggi pada suhu ekstrim dan ketahanan oksidasi maksimum.',
  },
  {
    id: 'duct-cast-iron',
    name: 'Cast Iron (Besi Cor Kelabu FC200)',
    category: 'cast_iron',
    thermalConductivity: 52.0,
    maxServiceTempC: 350,
    allowableStressMpa: 80,
    densityKgM3: 7200,
    description: 'Bahan cor tebal untuk manifold dan pipa tahan abrasi.',
  },
];

export const DEFAULT_INSULATION_MATERIALS: InsulationMaterial[] = [
  {
    id: 'ins-rockwool',
    name: 'Rockwool Blanket / Slab (Density 100 kg/m³)',
    category: 'blanket',
    thermalConductivity: 0.040,
    maxServiceTempC: 650,
    densityKgM3: 100,
    isRefractory: false,
    description: 'Isolasi wol mineral serbaguna untuk ducting, pipa uap, dan boiler dinding luar.',
  },
  {
    id: 'ins-ceramic-fiber-blanket',
    name: 'Ceramic Fiber Blanket (1260°C Standard)',
    category: 'blanket',
    thermalConductivity: 0.085,
    maxServiceTempC: 1260,
    densityKgM3: 128,
    isRefractory: true,
    description: 'Serat keramik tahan temperatur tinggi untuk lining internal ducting furnace dan kiln.',
  },
  {
    id: 'ins-ceramic-fiber-board',
    name: 'Ceramic Fiber Board (1400°C High Temp)',
    category: 'board',
    thermalConductivity: 0.115,
    maxServiceTempC: 1400,
    densityKgM3: 300,
    isRefractory: true,
    description: 'Papan keramik kaku tahan api tinggi untuk backing lining kiln dan insulasi burner.',
  },
  {
    id: 'ins-neocast-mul-sic-15',
    name: 'NEOCASTSUPER MUL-SIC 15 (Mullite SiC Castable)',
    category: 'castable',
    thermalConductivity: 2.14,
    maxServiceTempC: 1550,
    densityKgM3: 2440,
    isRefractory: true,
    description: 'Castable refraktori mullite silicon carbide tahan abrasi tinggi untuk cooler semen dan kiln.',
  },
  {
    id: 'ins-neocastmixgun-lw-140',
    name: 'NEOCASTMIXGUN LW 140 A (Gunning Castable)',
    category: 'castable',
    thermalConductivity: 0.337,
    maxServiceTempC: 1400,
    densityKgM3: 1580,
    isRefractory: true,
    description: 'Lightweight insulating gunning castable untuk lapisan transisi dan backup lining tungku semen.',
  },
  {
    id: 'ins-silca-board-1100',
    name: 'SILCA BOARD 1100 (Calcium Silicate Insulation Board)',
    category: 'board',
    thermalConductivity: 0.124,
    maxServiceTempC: 1100,
    densityKgM3: 265,
    isRefractory: true,
    description: 'Papan isolasi silika mikropori temperatur tinggi untuk lapisan terluar refraktori.',
  },
  {
    id: 'ins-calcium-silicate',
    name: 'Calcium Silicate Block / Pipe Cover',
    category: 'calcium_silicate',
    thermalConductivity: 0.058,
    maxServiceTempC: 1000,
    densityKgM3: 240,
    isRefractory: false,
    description: 'Kaku, kuat tekan tinggi, tidak terbakar, sangat ideal untuk pipa uap tekanan tinggi.',
  },
  {
    id: 'ins-firebrick-sk34',
    name: 'Fireclay Brick (Bata Tahan Api SK-34)',
    category: 'brick',
    thermalConductivity: 1.15,
    maxServiceTempC: 1400,
    densityKgM3: 2150,
    isRefractory: true,
    description: 'Bata refraktori padat tahan abrasi fluida gas panas dan terak di dalam kiln/duct.',
  },
  {
    id: 'ins-firebrick-high-alumina',
    name: 'High Alumina Brick (HA-70)',
    category: 'brick',
    thermalConductivity: 1.65,
    maxServiceTempC: 1650,
    densityKgM3: 2600,
    isRefractory: true,
    description: 'Bata refraktori dengan kandungan alumina >70% untuk zona terpanas rotary kiln.',
  },
  {
    id: 'ins-insulating-firebrick-ifb',
    name: 'Insulating Firebrick (IFB Group 26 / B-5)',
    category: 'brick',
    thermalConductivity: 0.28,
    maxServiceTempC: 1430,
    densityKgM3: 800,
    isRefractory: true,
    description: 'Bata tahan panas berpori (ringan) yang berfungsi ganda sebagai isolator panas tinggi.',
  },
  {
    id: 'ins-castable-ca14',
    name: 'Conventional Dense Castable (CA-14)',
    category: 'castable',
    thermalConductivity: 1.30,
    maxServiceTempC: 1450,
    densityKgM3: 2200,
    isRefractory: true,
    description: 'Semen cor tahan api monolitik untuk ducting melengkung, siku, dan lining kiln.',
  },
  {
    id: 'ins-lightweight-castable',
    name: 'Lightweight Insulating Castable (LIC-11)',
    category: 'castable',
    thermalConductivity: 0.24,
    maxServiceTempC: 1100,
    densityKgM3: 900,
    isRefractory: true,
    description: 'Castable insulasi ringan untuk lapisan kedua (backup lining) di balik castable padat.',
  },
  {
    id: 'ins-aerogel',
    name: 'Aerogel Thermal Insulation Blanket',
    category: 'aerogel',
    thermalConductivity: 0.018,
    maxServiceTempC: 650,
    densityKgM3: 160,
    isRefractory: false,
    description: 'Isolasi super tipis nanopori berkinerja tinggi saat ruang ducting sangat terbatas.',
  },
  {
    id: 'ins-glasswool',
    name: 'Glasswool Pipe Section (Density 48 kg/m³)',
    category: 'blanket',
    thermalConductivity: 0.035,
    maxServiceTempC: 350,
    densityKgM3: 48,
    isRefractory: false,
    description: 'Isolasi serat kaca ekonomis untuk ducting HVAC dan pipa air/uap suhu rendah.',
  },
  {
    id: 'ins-thermal-coating',
    name: 'Thermal Ceramic Insulative Coating',
    category: 'coating',
    thermalConductivity: 0.045,
    maxServiceTempC: 260,
    densityKgM3: 650,
    isRefractory: false,
    description: 'Lapisan cat keramik cair reflektif panas untuk permukaan luar yang rumit.',
  },
];

export const FLUID_PROPERTIES: Record<FluidType, FluidProperty> = {
  hot_air: {
    type: 'hot_air',
    name: 'Udara Panas (Hot Air)',
    density: 1.204, // at 20°C, scale with T
    specificHeat: 1007,
    viscosity: 1.81e-5,
    conductivity: 0.026,
  },
  flue_gas: {
    type: 'flue_gas',
    name: 'Gas Buang / Flue Gas (Boiler/Kiln)',
    density: 1.28,
    specificHeat: 1080,
    viscosity: 1.95e-5,
    conductivity: 0.029,
  },
  steam: {
    type: 'steam',
    name: 'Uap Air (Superheated Steam)',
    density: 0.60,
    specificHeat: 2010,
    viscosity: 1.25e-5,
    conductivity: 0.031,
  },
  natural_gas: {
    type: 'natural_gas',
    name: 'Gas Alam (Methane Rich)',
    density: 0.72,
    specificHeat: 2200,
    viscosity: 1.10e-5,
    conductivity: 0.034,
  },
  thermal_oil: {
    type: 'thermal_oil',
    name: 'Minyak Termal (Thermal Oil)',
    density: 850,
    specificHeat: 2100,
    viscosity: 0.003,
    conductivity: 0.12,
  },
  water: {
    type: 'water',
    name: 'Air Panas Bertekanan (Hot Water)',
    density: 980,
    specificHeat: 4184,
    viscosity: 0.0004,
    conductivity: 0.63,
  },
};

const STORAGE_KEY_DUCT_MATERIALS = 'thermoduct_custom_duct_materials';
const STORAGE_KEY_INS_MATERIALS = 'thermoduct_custom_ins_materials';

export function loadDuctMaterials(): DuctMaterial[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DUCT_MATERIALS);
    if (saved) {
      const parsed: DuctMaterial[] = JSON.parse(saved);
      return [...DEFAULT_DUCT_MATERIALS, ...parsed];
    }
  } catch (e) {
    console.error('Error loading custom duct materials', e);
  }
  return DEFAULT_DUCT_MATERIALS;
}

export function saveCustomDuctMaterial(material: DuctMaterial): DuctMaterial[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DUCT_MATERIALS);
    const existing: DuctMaterial[] = saved ? JSON.parse(saved) : [];
    const updated = [...existing.filter(m => m.id !== material.id), { ...material, isCustom: true }];
    localStorage.setItem(STORAGE_KEY_DUCT_MATERIALS, JSON.stringify(updated));
    return [...DEFAULT_DUCT_MATERIALS, ...updated];
  } catch (e) {
    console.error('Error saving custom duct material', e);
    return DEFAULT_DUCT_MATERIALS;
  }
}

export function loadInsulationMaterials(): InsulationMaterial[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_INS_MATERIALS);
    if (saved) {
      const parsed: InsulationMaterial[] = JSON.parse(saved);
      return [...DEFAULT_INSULATION_MATERIALS, ...parsed];
    }
  } catch (e) {
    console.error('Error loading custom insulation materials', e);
  }
  return DEFAULT_INSULATION_MATERIALS;
}

export function saveCustomInsulationMaterial(material: InsulationMaterial): InsulationMaterial[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_INS_MATERIALS);
    const existing: InsulationMaterial[] = saved ? JSON.parse(saved) : [];
    const updated = [...existing.filter(m => m.id !== material.id), { ...material, isCustom: true }];
    localStorage.setItem(STORAGE_KEY_INS_MATERIALS, JSON.stringify(updated));
    return [...DEFAULT_INSULATION_MATERIALS, ...updated];
  } catch (e) {
    console.error('Error saving custom insulation material', e);
    return DEFAULT_INSULATION_MATERIALS;
  }
}
