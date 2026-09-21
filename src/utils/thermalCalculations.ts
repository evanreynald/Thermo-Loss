import {
  CalculationInputs,
  CalculationResults,
  DuctMaterial,
  InsulationMaterial,
  LayerResult,
} from '../types';
import { FLUID_PROPERTIES } from '../data/materials';

const STEFAN_BOLTZMANN = 5.670374419e-8; // W/(m²·K⁴)

type DiagnosticResult = NonNullable<CalculationResults['diagnostic']>;

export function calculateThermalPerformance(
  inputs: CalculationInputs,
  ductMaterials: DuctMaterial[],
  insulationMaterials: InsulationMaterial[]
): CalculationResults {
  const ductMat =
    ductMaterials.find((m) => m.id === inputs.ductMaterialId) || ductMaterials[0];
  const fluidProp = FLUID_PROPERTIES[inputs.fluidType] || FLUID_PROPERTIES.hot_air;

  // 1. Dimensions and Geometry
  const isCylinder = inputs.shape === 'cylindrical' || inputs.shape === 'kiln';
  const lengthM = Math.max(0.1, inputs.lengthM);
  const ductThickM = Math.max(0.0005, inputs.ductThicknessMm / 1000);

  let innerPerimeterM = 0;
  let innerAreaM2 = 0;
  let hydraulicDiameterM = 0;

  let r0_m = 0; // Inner radius of core (m)
  let w0_m = 0; // Inner width (m)
  let h0_m = 0; // Inner height (m)

  if (isCylinder) {
    const dInM = Math.max(0.01, inputs.innerDiameterMm / 1000);
    r0_m = dInM / 2;
    hydraulicDiameterM = dInM;
    innerPerimeterM = Math.PI * dInM;
    innerAreaM2 = innerPerimeterM * lengthM;
  } else {
    w0_m = Math.max(0.02, inputs.widthMm / 1000);
    h0_m = Math.max(0.02, inputs.heightMm / 1000);
    hydraulicDiameterM = (2 * w0_m * h0_m) / (w0_m + h0_m);
    innerPerimeterM = 2 * (w0_m + h0_m);
    innerAreaM2 = innerPerimeterM * lengthM;
  }

  // 2. Fluid Dynamics & Inside Convection (h_i)
  const T_f_K = inputs.fluidTempC + 273.15;
  const T_amb_K = inputs.ambientTempC + 273.15;

  // Temperature-adjusted fluid density (ideal gas behavior for gases)
  let fluidDensity = fluidProp.density;
  if (inputs.fluidType !== 'water' && inputs.fluidType !== 'thermal_oil') {
    fluidDensity = fluidProp.density * (293.15 / T_f_K);
  }

  const velocity = Math.max(0.1, inputs.fluidVelocityMs);
  const Re = (fluidDensity * velocity * hydraulicDiameterM) / Math.max(1e-7, fluidProp.viscosity);
  const Pr = (fluidProp.specificHeat * fluidProp.viscosity) / Math.max(1e-5, fluidProp.conductivity);

  let flowTypeStr: 'Laminar' | 'Turbulen' | 'Transisi' = 'Turbulen';
  let Nu_i = 4.36; // Default laminar uniform heat flux

  if (inputs.flowRegime === 'turbulent' || (inputs.flowRegime === 'auto' && Re >= 4000)) {
    flowTypeStr = 'Turbulen';
    // Dittus-Boelter correlation for cooling/heating
    Nu_i = 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.35);
  } else if (inputs.flowRegime === 'laminar' || (inputs.flowRegime === 'auto' && Re < 2300)) {
    flowTypeStr = 'Laminar';
    Nu_i = 3.66;
  } else {
    flowTypeStr = 'Transisi';
    // Linear interpolation between laminar and turbulent
    const Nu_lam = 3.66;
    const Nu_turb = 0.023 * Math.pow(4000, 0.8) * Math.pow(Pr, 0.35);
    const frac = (Re - 2300) / (4000 - 2300);
    Nu_i = Nu_lam + frac * (Nu_turb - Nu_lam);
  }

  Nu_i = Math.max(2.0, Math.min(Nu_i, 5000));
  const h_conv_pure = Math.max(2.0, (Nu_i * fluidProp.conductivity) / hydraulicDiameterM);

  // Check if inside layers include refractory or if temperature is high
  const hasInsideRefractory = inputs.layers.some(
    (l) => l.position === 'inside' && l.thicknessMm > 0
  );

  let h_i = h_conv_pure;
  let internalTransferModelUsed = 'Dittus-Boelter Convection';

  if (inputs.internalHeatTransferModel === 'manual' && inputs.customInternalHi && inputs.customInternalHi > 0) {
    h_i = inputs.customInternalHi;
    internalTransferModelUsed = `Manual Override (${h_i.toFixed(1)} W/m²·K)`;
  } else if (
    inputs.internalHeatTransferModel === 'vdi_warmeatlas' ||
    (inputs.internalHeatTransferModel !== 'convection_only' &&
      (inputs.fluidTempC >= 500 || hasInsideRefractory || inputs.shape === 'kiln' || inputs.fluidType === 'flue_gas'))
  ) {
    // VDI-Wärmeatlas (1974) Kc1 & Industrial Furnace/Kiln Hot Gas Standard:
    // In kilns, coolers, and high-temperature flue gas ducts containing CO2, H2O, and particulate dust:
    // At 1200 °C, combined convection + gas radiation yields h_in = 149.6 W/(m²·K).
    // Radiative heat transfer coefficient scales with (T_fluid)^3:
    const baseVdiHiAt1200C = 149.6; // exact value from VDI-Wärmeatlas (1974) Kc1
    const T_scale = Math.pow(T_f_K / (1200 + 273.15), 3);
    const h_vdi = Math.max(h_conv_pure, baseVdiHiAt1200C * T_scale);
    h_i = Math.max(20.0, Number(h_vdi.toFixed(1)));
    internalTransferModelUsed = 'VDI-Wärmeatlas (1974) Kc1 / Gas Radiation';
  }

  // 3. Build Wall Layer Structure
  // Layers order from inside fluid to outside air:
  // Inside insulation layers (if any) -> Duct metal shell -> Outside insulation layers (if any)
  interface RawLayer {
    id: string;
    name: string;
    materialName: string;
    position: 'inside' | 'outside' | 'duct_wall';
    thicknessM: number;
    conductivity: number;
    maxServiceTempC: number;
  }

  const hasInsulation = inputs.hasInsulation !== false && inputs.layers.length > 0;
  const rawLayers: RawLayer[] = [];

  // Inside insulation layers (only if insulated)
  if (hasInsulation) {
    inputs.layers
      .filter((l) => l.position === 'inside' && l.thicknessMm > 0)
      .forEach((l) => {
        const mat = insulationMaterials.find((m) => m.id === l.materialId) || insulationMaterials[0];
        const conductivity =
          l.customConductivity !== undefined && l.customConductivity > 0
            ? l.customConductivity
            : mat.thermalConductivity;
        const maxServiceTempC =
          l.customMaxTempC !== undefined && l.customMaxTempC > 0
            ? l.customMaxTempC
            : mat.maxServiceTempC;

        rawLayers.push({
          id: l.id,
          name: l.name || (l.customConductivity ? `Custom (k=${conductivity})` : mat.name),
          materialName: l.customConductivity ? `Custom (k=${conductivity} W/m·K)` : mat.name,
          position: 'inside',
          thicknessM: l.thicknessMm / 1000,
          conductivity,
          maxServiceTempC,
        });
      });
  }

  // Duct wall (only if thickness > 0)
  if (ductThickM > 0.0001) {
    rawLayers.push({
      id: 'duct-wall',
      name: `Duct Shell (${ductMat.name})`,
      materialName: ductMat.name,
      position: 'duct_wall',
      thicknessM: ductThickM,
      conductivity: ductMat.thermalConductivity,
      maxServiceTempC: ductMat.maxServiceTempC,
    });
  }

  // Outside insulation layers (only if insulated)
  if (hasInsulation) {
    inputs.layers
      .filter((l) => l.position === 'outside' && l.thicknessMm > 0)
      .forEach((l) => {
        const mat = insulationMaterials.find((m) => m.id === l.materialId) || insulationMaterials[0];
        const conductivity =
          l.customConductivity !== undefined && l.customConductivity > 0
            ? l.customConductivity
            : mat.thermalConductivity;
        const maxServiceTempC =
          l.customMaxTempC !== undefined && l.customMaxTempC > 0
            ? l.customMaxTempC
            : mat.maxServiceTempC;

        rawLayers.push({
          id: l.id,
          name: l.name || (l.customConductivity ? `Custom (k=${conductivity})` : mat.name),
          materialName: l.customConductivity ? `Custom (k=${conductivity} W/m·K)` : mat.name,
          position: 'outside',
          thicknessM: l.thicknessMm / 1000,
          conductivity,
          maxServiceTempC,
        });
      });
  }

  // 4. Conduction Resistances Solver Helper
  function evaluateNetwork(
    layersToEval: RawLayer[],
    forcedOuterTempC?: number
  ) {
    let currR = r0_m;
    let currW = w0_m;
    let currH = h0_m;

    interface EvalLayer {
      raw: RawLayer;
      r_in_m: number;
      r_out_m: number;
      w_in_m: number;
      w_out_m: number;
      h_in_m: number;
      h_out_m: number;
      areaAvgM2: number;
      R_cond_K_W: number;
    }

    const evalLayers: EvalLayer[] = [];
    let totalCondR_K_W = 0;

    for (const lyr of layersToEval) {
      if (isCylinder) {
        const r_in = currR;
        const r_out = currR + lyr.thicknessM;
        const R_cond = Math.log(r_out / r_in) / (2 * Math.PI * lyr.conductivity * lengthM);
        const areaAvg = Math.PI * (r_in + r_out) * lengthM;
        evalLayers.push({
          raw: lyr,
          r_in_m: r_in,
          r_out_m: r_out,
          w_in_m: 0,
          w_out_m: 0,
          h_in_m: 0,
          h_out_m: 0,
          areaAvgM2: areaAvg,
          R_cond_K_W: R_cond,
        });
        totalCondR_K_W += R_cond;
        currR = r_out;
      } else {
        const w_in = currW;
        const h_in = currH;
        const w_out = currW + 2 * lyr.thicknessM;
        const h_out = currH + 2 * lyr.thicknessM;
        const perimeterAvg = 2 * ((w_in + w_out) / 2 + (h_in + h_out) / 2);
        const areaAvg = perimeterAvg * lengthM;
        const R_cond = lyr.thicknessM / (lyr.conductivity * areaAvg);
        evalLayers.push({
          raw: lyr,
          r_in_m: 0,
          r_out_m: 0,
          w_in_m: w_in,
          w_out_m: w_out,
          h_in_m: h_in,
          h_out_m: h_out,
          areaAvgM2: areaAvg,
          R_cond_K_W: R_cond,
        });
        totalCondR_K_W += R_cond;
        currW = w_out;
        currH = h_out;
      }
    }

    // Outer geometry
    let outerPerimeterM = 0;
    let outerAreaM2 = 0;
    let outerCharacteristicLengthM = 0;

    if (isCylinder) {
      outerPerimeterM = 2 * Math.PI * currR;
      outerAreaM2 = outerPerimeterM * lengthM;
      outerCharacteristicLengthM = 2 * currR;
    } else {
      outerPerimeterM = 2 * (currW + currH);
      outerAreaM2 = outerPerimeterM * lengthM;
      outerCharacteristicLengthM = (currW + currH) / 2;
    }

    const R_inside_conv_K_W = 1 / (h_i * innerAreaM2);

    // Outside convection & radiation calculator as function of surface temp T_s_C
    function calcOutsideCoefficients(T_s_C: number) {
      const deltaT = Math.max(0.1, Math.abs(T_s_C - inputs.ambientTempC));
      const T_s_K = T_s_C + 273.15;

      // Natural convection component
      const h_nat = 1.32 * Math.pow(deltaT / Math.max(0.05, outerCharacteristicLengthM), 0.25);

      // Forced convection component (wind)
      let h_forced = 0;
      if (inputs.windSpeedMs > 0.1) {
        h_forced = 5.7 + 3.8 * inputs.windSpeedMs; // Practical industrial wind correlation (W/m²K)
      }

      const h_conv_o = Math.max(h_nat, h_forced);

      // Radiation coefficient
      const eps = Math.min(0.99, Math.max(0.05, inputs.externalEmissivity));
      const h_rad = eps * STEFAN_BOLTZMANN * (T_s_K + T_amb_K) * (T_s_K * T_s_K + T_amb_K * T_amb_K);

      const h_o = h_conv_o + h_rad;
      return { h_conv_o, h_rad, h_o };
    }

    // Solving Outer Temperature T_s_out
    let T_s_out_C = forcedOuterTempC !== undefined ? forcedOuterTempC : inputs.ambientTempC + 20;

    if (forcedOuterTempC === undefined) {
      // Iterative relaxation to find self-consistent T_s_out
      for (let iter = 0; iter < 40; iter++) {
        const { h_o } = calcOutsideCoefficients(T_s_out_C);
        const R_outside_K_W = 1 / (h_o * outerAreaM2);
        const R_total_K_W = R_inside_conv_K_W + totalCondR_K_W + R_outside_K_W;

        const Q = (inputs.fluidTempC - inputs.ambientTempC) / R_total_K_W;
        const T_new = inputs.ambientTempC + Q * R_outside_K_W;

        if (Math.abs(T_new - T_s_out_C) < 0.02) {
          T_s_out_C = T_new;
          break;
        }
        T_s_out_C = 0.5 * T_s_out_C + 0.5 * T_new; // damped convergence
      }
    }

    const { h_conv_o, h_rad, h_o } = calcOutsideCoefficients(T_s_out_C);
    const R_outside_K_W = 1 / (h_o * outerAreaM2);
    const R_total_K_W = R_inside_conv_K_W + totalCondR_K_W + R_outside_K_W;

    let Q_W = 0;
    if (forcedOuterTempC !== undefined) {
      // In diagnostic mode with measured surface temp:
      // Heat loss directly from surface to ambient
      Q_W = h_o * outerAreaM2 * (T_s_out_C - inputs.ambientTempC);
    } else {
      Q_W = (inputs.fluidTempC - inputs.ambientTempC) / R_total_K_W;
    }

    // Calculate intermediate temperatures
    const layerResults: LayerResult[] = [];
    let innerWallTC: number;

    if (forcedOuterTempC !== undefined) {
      // Diagnostic mode: Q_W was anchored to the measured outer surface temperature.
      // The nominal (catalog) insulation resistance almost never matches reality exactly —
      // that mismatch is the whole point of a field diagnosis. Applying the field-implied
      // Q_W across the *nominal* resistance network (fluid side or surface side, either
      // direction) forces the fluid-to-surface budget to close over the wrong total
      // resistance, producing physically impossible temperatures at whichever end isn't
      // anchored (e.g. an inner wall far hotter than the fluid itself).
      //
      // Instead, solve for how much of the *insulation's* resistance is actually still
      // present: hold the inside film and duct wall (both based on real, current geometry)
      // fixed, and back out the insulation resistance that makes the fluid → measured-surface
      // budget close exactly. That degradation factor is then applied uniformly across the
      // insulation layers so the walked profile stays physically consistent end to end.
      const nonInsulationR_K_W = evalLayers
        .filter((el) => el.raw.position === 'duct_wall')
        .reduce((sum, el) => sum + el.R_cond_K_W, 0);
      const insulationR_nominal_K_W = evalLayers
        .filter((el) => el.raw.position !== 'duct_wall')
        .reduce((sum, el) => sum + el.R_cond_K_W, 0);

      const totalRequiredDropC = inputs.fluidTempC - T_s_out_C;
      const fixedDropC = Q_W * (R_inside_conv_K_W + nonInsulationR_K_W);
      const requiredInsulationDropC = totalRequiredDropC - fixedDropC;
      const requiredInsulationR_K_W = Q_W !== 0 ? requiredInsulationDropC / Q_W : insulationR_nominal_K_W;

      // How much of the nominal insulation resistance the field reading implies is left
      // (clamped so a wildly inconsistent reading degrades gracefully instead of flipping sign)
      const insulationRetainedFraction =
        insulationR_nominal_K_W > 1e-9
          ? Math.max(0.02, Math.min(1.5, requiredInsulationR_K_W / insulationR_nominal_K_W))
          : 1;

      let currentTC = T_s_out_C;
      for (let i = evalLayers.length - 1; i >= 0; i--) {
        const el = evalLayers[i];
        const effectiveR_K_W =
          el.raw.position === 'duct_wall' ? el.R_cond_K_W : el.R_cond_K_W * insulationRetainedFraction;
        const drop = Q_W * effectiveR_K_W;
        const tOut = currentTC;
        const tIn = currentTC + drop;
        currentTC = tIn;

        const maxT = Math.max(tIn, tOut);
        const isOverheat = maxT > el.raw.maxServiceTempC;

        layerResults.unshift({
          name: el.raw.name,
          materialName: el.raw.materialName,
          position: el.raw.position,
          thicknessMm: el.raw.thicknessM * 1000,
          innerRadiusMm: isCylinder ? el.r_in_m * 1000 : undefined,
          outerRadiusMm: isCylinder ? el.r_out_m * 1000 : undefined,
          rValue: effectiveR_K_W,
          tInnerC: tIn,
          tOuterC: tOut,
          maxServiceTempC: el.raw.maxServiceTempC,
          isOverheating: isOverheat,
        });
      }
      innerWallTC = currentTC;
    } else {
      // Design mode: walk from the fluid side outward, since Q_W was solved
      // self-consistently across the whole network (inside film + conduction + outside film).
      let currentTC = inputs.fluidTempC - Q_W * R_inside_conv_K_W;
      innerWallTC = currentTC;

      for (const el of evalLayers) {
        const drop = Q_W * el.R_cond_K_W;
        const tIn = currentTC;
        const tOut = currentTC - drop;
        currentTC = tOut;

        const maxT = Math.max(tIn, tOut);
        const isOverheat = maxT > el.raw.maxServiceTempC;

        layerResults.push({
          name: el.raw.name,
          materialName: el.raw.materialName,
          position: el.raw.position,
          thicknessMm: el.raw.thicknessM * 1000,
          innerRadiusMm: isCylinder ? el.r_in_m * 1000 : undefined,
          outerRadiusMm: isCylinder ? el.r_out_m * 1000 : undefined,
          rValue: el.R_cond_K_W,
          tInnerC: tIn,
          tOuterC: tOut,
          maxServiceTempC: el.raw.maxServiceTempC,
          isOverheating: isOverheat,
        });
      }
    }

    return {
      Q_W,
      T_s_out_C,
      innerWallTC,
      outerAreaM2,
      h_conv_o,
      h_rad,
      h_o,
      layerResults,
      R_total_K_W,
      totalCondR_K_W,
    };
  }

  // Evaluate baseline model
  const isDiagnostic = inputs.mode === 'diagnose';
  const baselineEval = evaluateNetwork(
    rawLayers,
    isDiagnostic ? inputs.measuredOuterTempC : undefined
  );

  // 5. Recommended Insulation Thickness Calculation (Target to meet Safe Touch / OSHA / ASTM C1055)
  let recommendedInsulationThicknessMm = 50;
  const targetOuterTemp = inputs.targetOuterTempC || 60; // Standard OSHA/ASTM touch limit

  // Primary insulation layer to optimize (prefer outside insulation or first layer)
  const primaryInsLayer = inputs.layers.find((l) => l.position === 'outside') || inputs.layers[0];
  const primaryMat = primaryInsLayer
    ? insulationMaterials.find((m) => m.id === primaryInsLayer.materialId) || insulationMaterials[0]
    : insulationMaterials[0];

  // Binary search for insulation thickness between 5mm and 400mm to achieve T_s_out <= targetOuterTemp
  let low = 5;
  let high = 400;
  let bestThickness = 50;

  for (let step = 0; step < 20; step++) {
    const mid = (low + high) / 2;
    let testLayers: RawLayer[];

    if (hasInsulation && primaryInsLayer) {
      testLayers = rawLayers.map((l) => {
        if (l.id === primaryInsLayer.id) {
          return { ...l, thicknessM: mid / 1000 };
        }
        return l;
      });
    } else {
      // Bare duct: simulate adding outside insulation on top of the bare duct shell
      testLayers = [
        ...rawLayers,
        {
          id: 'recom-layer',
          name: primaryMat.name,
          materialName: primaryMat.name,
          position: 'outside',
          thicknessM: mid / 1000,
          conductivity: primaryMat.thermalConductivity,
          maxServiceTempC: primaryMat.maxServiceTempC,
        },
      ];
    }

    const res = evaluateNetwork(testLayers);
    if (res.T_s_out_C <= targetOuterTemp) {
      bestThickness = mid;
      high = mid; // Try smaller thickness
    } else {
      low = mid;
    }
  }
  recommendedInsulationThicknessMm = Math.round(bestThickness);

  const recommendedInsulationTargetLayerId = hasInsulation && primaryInsLayer ? primaryInsLayer.id : undefined;
  const recommendedInsulationTargetLayerName = hasInsulation && primaryInsLayer
    ? `${primaryInsLayer.name} (${primaryInsLayer.position === 'inside' ? 'Sisi Dalam' : 'Sisi Luar'})`
    : `${primaryMat.name} (Sisi Luar)`;
  const recommendedInsulationTargetLayerPos = hasInsulation && primaryInsLayer ? primaryInsLayer.position : 'outside';
  const recommendedInsulationCurrentThicknessMm = hasInsulation && primaryInsLayer ? primaryInsLayer.thicknessMm : 0;
  const recommendedInsulationAdditionalMm = Math.max(0, recommendedInsulationThicknessMm - recommendedInsulationCurrentThicknessMm);

  // 6. Duct Structural / Pressure Thickness Calculation (ASME B31.3 & SMACNA)
  const designPressureBar = Math.max(0, inputs.internalPressureBar);
  const designPressureMpa = designPressureBar * 0.1; // 1 bar = 0.1 MPa
  const corrosionM = (inputs.corrosionAllowanceMm || 0) / 1000;

  // Temperature derating on allowable stress
  let S_allow = ductMat.allowableStressMpa;
  if (inputs.fluidTempC > 150) {
    const derateFactor = Math.max(0.35, 1 - (inputs.fluidTempC - 150) * 0.001);
    S_allow = S_allow * derateFactor;
  }

  let recommendedDuctThicknessMm = 2.0;

  if (isCylinder) {
    const D_o_mm = inputs.innerDiameterMm + 2 * inputs.ductThicknessMm;
    if (designPressureMpa > 0.02) {
      // ASME B31.3 Hoop Stress: t = (P * D) / (2 * (S * E + P * Y)) + corrosion
      const E = 0.85; // Weld efficiency
      const Y = 0.4;
      const t_pressure_mm =
        (designPressureMpa * D_o_mm) / (2 * (S_allow * E + designPressureMpa * Y)) +
        (inputs.corrosionAllowanceMm || 0);
      recommendedDuctThicknessMm = Math.max(2.5, t_pressure_mm);
    } else {
      // Low pressure ducting (SMACNA standard empirical for self-weight & handling)
      // D/400 + corrosion allowance, minimum 2.0 mm
      const t_min_mm = Math.max(2.0, D_o_mm / 400 + (inputs.corrosionAllowanceMm || 0));
      recommendedDuctThicknessMm = t_min_mm;
    }
  } else {
    // Rectangular duct (SMACNA HVAC / Industrial Duct Construction Standards)
    const maxDimMm = Math.max(inputs.widthMm, inputs.heightMm);
    let t_smacna_mm = 1.6;
    if (maxDimMm > 1500) t_smacna_mm = 4.0;
    else if (maxDimMm > 1000) t_smacna_mm = 3.0;
    else if (maxDimMm > 600) t_smacna_mm = 2.5;
    else if (maxDimMm > 300) t_smacna_mm = 2.0;
    recommendedDuctThicknessMm = t_smacna_mm + (inputs.corrosionAllowanceMm || 0);
  }

  recommendedDuctThicknessMm = Number(recommendedDuctThicknessMm.toFixed(1));

  const ductSafetyFactor = Number(
    (inputs.ductThicknessMm / Math.max(0.5, recommendedDuctThicknessMm)).toFixed(2)
  );

  // 7. Safety Status & Warnings (ASTM C1055 & C1057)
  const surfaceTemp = baselineEval.T_s_out_C;
  let personnelProtectionStatus: 'safe' | 'warning' | 'danger' = 'safe';
  let statusMessage = 'Temperatur permukaan luar aman disentuh (< 60°C).';

  if (surfaceTemp > 75) {
    personnelProtectionStatus = 'danger';
    statusMessage = `BAHAYA LUKA BAKAR: Suhu permukaan ${surfaceTemp.toFixed(1)}°C melebihi batas aman ASTM C1055 (>60°C). Risiko cedera personil!`;
  } else if (surfaceTemp > 60) {
    personnelProtectionStatus = 'warning';
    statusMessage = `PERINGATAN: Suhu permukaan ${surfaceTemp.toFixed(1)}°C mendekati batas kritis personil (60°C). Dianjurkan penambahan tebal isolasi.`;
  }

  // 8. Diagnostic Health Assessment
  let diagnosticData: CalculationResults['diagnostic'] | undefined = undefined;

  // Calculate baseline bare duct heat loss for efficiency benchmark
  const bareLayers: RawLayer[] = [
    {
      id: 'duct-shell-bare',
      name: ductMat.name,
      materialName: ductMat.name,
      position: 'duct_wall',
      thicknessM: inputs.ductThicknessMm / 1000,
      conductivity: ductMat.thermalConductivity,
      maxServiceTempC: ductMat.maxServiceTempC,
    },
  ];
  const bareEval = evaluateNetwork(bareLayers);
  const bareDuctHeatLossKW = bareEval.Q_W / 1000;
  const currentHeatLossKW = baselineEval.Q_W / 1000;

  // Insulation efficiency vs bare duct
  let insulationEfficiencyPercent = 0;
  let heatLossSavedKW = 0;
  if (hasInsulation && bareEval.Q_W > 0) {
    heatLossSavedKW = Math.max(0, bareDuctHeatLossKW - currentHeatLossKW);
    insulationEfficiencyPercent = Number(
      Math.max(0, Math.min(99.9, (heatLossSavedKW / bareDuctHeatLossKW) * 100)).toFixed(1)
    );
  }

  if (isDiagnostic) {
    const theoretical = evaluateNetwork(rawLayers);
    const heatExcessRatio = theoretical.Q_W > 0 ? baselineEval.Q_W / theoretical.Q_W : 1.0;
    const effectiveThickRatio = Number((1 / Math.max(0.5, heatExcessRatio)).toFixed(2));

    const ductWallLayer = baselineEval.layerResults.find((l) => l.position === 'duct_wall');
    const shellTemp = ductWallLayer ? ductWallLayer.tInnerC : surfaceTemp;
    const isShellOverheating = shellTemp > ductMat.maxServiceTempC * 0.85;

    // Insulation wear / degradation
    const currentTotalInsThickMm = hasInsulation
      ? inputs.layers.reduce((sum, l) => sum + l.thicknessMm, 0)
      : 0;
    const effectiveThicknessMm = Math.round(currentTotalInsThickMm * effectiveThickRatio);
    const insulationWearPercent = hasInsulation
      ? Number(Math.max(0, Math.min(100, (1 - effectiveThickRatio) * 100)).toFixed(1))
      : 100;

    // Duct Shell Wear & Thinning Analysis
    const initialCorrosionMm = inputs.corrosionAllowanceMm || 2.0;
    const thinningMm = Number(Math.max(0, recommendedDuctThicknessMm - inputs.ductThicknessMm).toFixed(2));
    const remainingCorrosionAllowanceMm = Number(
      Math.max(0, initialCorrosionMm - thinningMm).toFixed(2)
    );
    const ductWearPercent = Number(
      Math.min(100, Math.max(0, (thinningMm / Math.max(0.5, initialCorrosionMm)) * 100)).toFixed(1)
    );

    let ductIntegrityStatus: DiagnosticResult['ductIntegrityStatus'] = 'Aman & Optimal';
    if (inputs.ductThicknessMm < recommendedDuctThicknessMm * 0.85) {
      ductIntegrityStatus = 'Di Bawah Tebal Minimum ASME/SMACNA';
    } else if (inputs.ductThicknessMm < recommendedDuctThicknessMm) {
      ductIntegrityStatus = 'Waspada Penipisan Kritis';
    } else if (thinningMm > 0) {
      ductIntegrityStatus = 'Penipisan Ringan';
    } else {
      ductIntegrityStatus = 'Aman & Optimal';
    }

    // Need for Insulation Assessment (Apakah Ducting Membutuhkan Isolasi?)
    let isInsulationNeeded = false;
    let insulationUrgency: DiagnosticResult['insulationUrgency'] = 'SUDAH MEMADAI (Aman)';
    let insulationReason = '';

    if (!hasInsulation || inputs.layers.length === 0) {
      isInsulationNeeded = true;
      if (surfaceTemp > 60) {
        insulationUrgency = 'WAJIB (Bahaya Personil & Pemborosan Ekstrem)';
        insulationReason = `Pipa/ducting telanjang dengan temperatur permukaan ${surfaceTemp.toFixed(0)}°C melebihi batas aman ASTM C1055 (60°C). Menyebabkan risiko luka bakar personil dan pemborosan panas ${bareDuctHeatLossKW.toFixed(1)} kW.`;
      } else {
        insulationUrgency = 'DIANJURKAN (Konservasi Energi)';
        insulationReason = `Suhu permukaan ${surfaceTemp.toFixed(0)}°C masih dalam batas aman, namun terjadi rugi energi termal ${bareDuctHeatLossKW.toFixed(1)} kW yang dapat dihemat jika dipasang isolasi.`;
      }
    } else {
      // Insulated duct
      if (surfaceTemp > 75 || effectiveThickRatio < 0.5) {
        isInsulationNeeded = true;
        insulationUrgency = 'WAJIB (Bahaya Personil & Pemborosan Ekstrem)';
        insulationReason = `Isolasi terpasang mengalami keausan parah (${insulationWearPercent}% degradasi efektif). Suhu luar mencapai ${surfaceTemp.toFixed(0)}°C. Diperlukan perbaikan lining refraktori atau re-insulasi segera.`;
      } else if (surfaceTemp > 60 || effectiveThickRatio < 0.8) {
        isInsulationNeeded = true;
        insulationUrgency = 'DIANJURKAN (Konservasi Energi)';
        insulationReason = `Efektivitas isolasi terpasang menurun menjadi ${(effectiveThickRatio * 100).toFixed(0)}% (keausan termal ~${insulationWearPercent}%). Suhu luar ${surfaceTemp.toFixed(0)}°C mendekati/melampaui batas aman 60°C.`;
      } else {
        isInsulationNeeded = false;
        insulationUrgency = 'SUDAH MEMADAI (Aman)';
        insulationReason = `Isolasi terpasang bekerja sangat efektif (${insulationEfficiencyPercent}% efisiensi penahanan panas), berhasil menahan ${heatLossSavedKW.toFixed(1)} kW energi panas. Belum memerlukan isolasi tambahan.`;
      }
    }

    let condition: DiagnosticResult['condition'] = 'Optimal';
    const recommendations: string[] = [];

    if (heatExcessRatio > 1.6 || isShellOverheating) {
      condition = 'Kerusakan Kritis / Hotspot';
      recommendations.push(
        `Terdeteksi lonjakan rugi panas tinggi (${((heatExcessRatio - 1) * 100).toFixed(0)}% di atas desain). Potensi refraktori rontok (spalling), retak tembus, atau isolasi basah kuyup.`
      );
      if (isShellOverheating) {
        recommendations.push(
          `Shell baja mengalami overheating (~${shellTemp.toFixed(0)}°C), mendekati batas maksimal material ${ductMat.maxServiceTempC}°C. Risiko deformasi plastis / buckling!`
        );
      }
      recommendations.push('Segera jadwalkan shutdown inspection, pengukuran ketebalan ultrasonik (UTG), dan penggantian material isolasi.');
    } else if (heatExcessRatio > 1.25) {
      condition = 'Degradasi Sedang';
      recommendations.push(
        `Efektivitas isolasi tersisa ${(effectiveThickRatio * 100).toFixed(0)}% (keausan isolasi ~${insulationWearPercent}%).`
      );
      recommendations.push(
        'Periksa infiltrasi kelembaban/air hujan pada isolasi luar atau erosi gas berkecepatan tinggi pada refractory dalam.'
      );
    } else if (heatExcessRatio > 1.08) {
      condition = 'Degradasi Ringan';
      recommendations.push(
        'Kinerja isolasi masih dalam batas toleransi wajar (+8-25% heat loss). Lakukan pemantauan thermography berkala.'
      );
    } else {
      condition = 'Optimal';
      recommendations.push('Sistem isolasi dan dinding ducting dalam kondisi prima sesuai desain termal.');
    }

    // Add duct shell structural recommendation if thinning detected
    if (ductIntegrityStatus === 'Di Bawah Tebal Minimum ASME/SMACNA') {
      recommendations.push(
        `PERINGATAN STRUKTUR: Ketebalan shell plat saat ini (${inputs.ductThicknessMm} mm) berada di bawah tebal minimum rekomendasi standar kode mekanikal (${recommendedDuctThicknessMm} mm). Segera evaluasi integritas plat!`
      );
    } else if (ductIntegrityStatus === 'Waspada Penipisan Kritis') {
      recommendations.push(
        `Toleransi korosi plat ducting tersisa kritis (${remainingCorrosionAllowanceMm} mm). Jadwalkan uji ketebalan NDT berkala.`
      );
    }

    diagnosticData = {
      condition,
      effectiveThicknessRatio: effectiveThickRatio,
      effectiveThicknessMm,
      insulationWearPercent,
      heatLossExcessRatio: Number(heatExcessRatio.toFixed(2)),
      riskShellOverheat: isShellOverheating,
      recommendations,

      ductWearPercent,
      ductWallThinningMm: thinningMm,
      remainingCorrosionAllowanceMm,
      ductIntegrityStatus,

      insulationEfficiencyPercent,
      heatLossSavedKW: Number(heatLossSavedKW.toFixed(2)),
      bareDuctHeatLossKW: Number(bareDuctHeatLossKW.toFixed(2)),

      isInsulationNeeded,
      insulationUrgency,
      insulationReason,
    };
  }

  // 9. Financial Evaluation
  // Heat loss total (W) -> kW * operatingHours -> kWh
  const heatLossKW = baselineEval.Q_W / 1000;
  const annualHours = Math.max(100, inputs.operatingHoursPerYear || 8000);
  const efficiency = Math.max(30, Math.min(100, inputs.boilerFurnaceEfficiencyPercent || 85)) / 100;

  const annualHeatLossKWh = (heatLossKW * annualHours) / efficiency;
  const annualHeatLossGJ = annualHeatLossKWh * 0.0036;

  // Fuel equivalent unit cost reference:
  // Default values scaled if fuelCostPerUnit is provided
  // 1 kWh = 3.6 MJ = 0.003412 MMBtu
  let costPerKWhIdr = 1500; // Electricity benchmark ~1500 IDR/kWh
  let co2PerKWhKg = 0.75; // kg CO2 per kWh thermal

  switch (inputs.fuelType) {
    case 'natural_gas':
      // 1 MMBtu ~ 293 kWh. If user input e.g. IDR 120,000 / MMBtu -> ~410 IDR/kWh
      costPerKWhIdr = inputs.fuelCostPerUnit > 0 ? inputs.fuelCostPerUnit / 293 : 450;
      co2PerKWhKg = 0.20;
      break;
    case 'coal':
      // 1 kg coal ~ 5.5 kWh (20 MJ/kg). If user input IDR 1,200/kg -> ~220 IDR/kWh
      costPerKWhIdr = inputs.fuelCostPerUnit > 0 ? inputs.fuelCostPerUnit / 5.5 : 280;
      co2PerKWhKg = 0.35;
      break;
    case 'hsd_diesel':
      // 1 L solar ~ 10 kWh. If user input IDR 14,000/L -> ~1400 IDR/kWh
      costPerKWhIdr = inputs.fuelCostPerUnit > 0 ? inputs.fuelCostPerUnit / 10 : 1400;
      co2PerKWhKg = 0.27;
      break;
    case 'biomass':
      // 1 kg cangkang sawit ~ 4 kWh. If IDR 800/kg -> ~200 IDR/kWh
      costPerKWhIdr = inputs.fuelCostPerUnit > 0 ? inputs.fuelCostPerUnit / 4 : 220;
      co2PerKWhKg = 0.05;
      break;
    case 'electricity':
      costPerKWhIdr = inputs.fuelCostPerUnit > 0 ? inputs.fuelCostPerUnit : 1500;
      co2PerKWhKg = 0.85;
      break;
  }

  const annualCostIdr = Math.round(annualHeatLossKWh * costPerKWhIdr);
  // Potential savings if brought to safe 50°C surface target
  const potentialSavingsRatio = Math.max(0.15, Math.min(0.85, (surfaceTemp - 50) / Math.max(10, surfaceTemp)));
  const potentialSavingsIdr = Math.round(annualCostIdr * potentialSavingsRatio);
  const co2EmissionsTonsPerYear = Number(((annualHeatLossKWh * co2PerKWhKg) / 1000).toFixed(1));

  // Calculate outermost temperature of refractory (before kiln/duct shell)
  const insideRefractoryLayers = baselineEval.layerResults.filter((l) => l.position === 'inside');
  const refractoryOuterTempC =
    insideRefractoryLayers.length > 0
      ? Number(insideRefractoryLayers[insideRefractoryLayers.length - 1].tOuterC.toFixed(1))
      : undefined;

  return {
    heatLossTotalW: Math.round(baselineEval.Q_W),
    heatLossPerMeterWm: Math.round(baselineEval.Q_W / lengthM),
    heatFluxWm2: Math.round(baselineEval.Q_W / Math.max(0.01, baselineEval.outerAreaM2)),
    surfaceAreaM2: Number(baselineEval.outerAreaM2.toFixed(2)),

    innerWallTempC: Number(baselineEval.innerWallTC.toFixed(1)),
    outerSurfaceTempC: Number(baselineEval.T_s_out_C.toFixed(1)),
    refractoryOuterTempC,
    internalTransferModelUsed,
    layerResults: baselineEval.layerResults,

    reynoldsNumber: Math.round(Re),
    flowType: flowTypeStr,
    internalConvectionHi: Number(h_i.toFixed(1)),
    externalConvectionHo: Number(baselineEval.h_conv_o.toFixed(1)),
    radiationHr: Number(baselineEval.h_rad.toFixed(1)),

    recommendedInsulationThicknessMm,
    recommendedInsulationTargetLayerId,
    recommendedInsulationTargetLayerName,
    recommendedInsulationTargetLayerPos,
    recommendedInsulationCurrentThicknessMm,
    recommendedInsulationAdditionalMm,
    recommendedDuctThicknessMm,
    ductSafetyFactor,

    personnelProtectionStatus,
    statusMessage,
    diagnostic: diagnosticData,

    financial: {
      annualHeatLossKWh: Math.round(annualHeatLossKWh),
      annualHeatLossGJ: Number(annualHeatLossGJ.toFixed(1)),
      annualCostIdr,
      potentialSavingsIdr,
      co2EmissionsTonsPerYear,
    },
  };
}
