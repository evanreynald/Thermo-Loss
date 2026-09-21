import jsPDF from 'jspdf';
import { CalculationInputs, CalculationResults, DuctMaterial, ReportMetadata } from '../types';
import { Language, getSafetyStatusMessage } from './translations';

// ---- Palette (matches the app's black/white/red brand) ----
const INK = [15, 23, 42] as const; // near-black text
const SUBTLE = [100, 116, 139] as const; // gray secondary text
const FAINT = [148, 163, 184] as const; // lighter gray / footer text
const LINE = [226, 232, 240] as const; // hairline borders
const PANEL = [248, 250, 252] as const; // very light gray panel fill
const DARK_BG = [15, 23, 42] as const; // header banner background
const BRAND = [239, 68, 68] as const; // brand red accent
const SAFE = [22, 163, 74] as const; // green
const WARN = [217, 119, 6] as const; // amber

// Finite-value labels coming out of the calculation engine (always Indonesian at the
// source) get a small lookup table for English display (statusMessage is rebuilt entirely
// via getSafetyStatusMessage instead, since it's just 3 fixed templates). True free-text
// diagnostic narrative (insulationReason, recommendations[]) is generated with embedded
// numbers by thermalCalculations.ts and stays Indonesian — localizing that means the
// calculation engine itself needs to produce bilingual text, which is out of scope here.
const FLOW_TYPE_EN: Record<string, string> = {
  Turbulen: 'Turbulent',
  Laminar: 'Laminar',
  Transisi: 'Transitional',
};

const DUCT_INTEGRITY_EN: Record<string, string> = {
  'Aman & Optimal': 'Safe & Optimal',
  'Penipisan Ringan': 'Minor Thinning',
  'Waspada Penipisan Kritis': 'Critical Thinning Warning',
  'Di Bawah Tebal Minimum ASME/SMACNA': 'Below ASME/SMACNA Minimum Thickness',
};

const INSULATION_URGENCY_EN: Record<string, string> = {
  'SUDAH MEMADAI (Aman)': 'ADEQUATE (Safe)',
  'WAJIB (Bahaya Personil & Pemborosan Ekstrem)': 'MANDATORY (Personnel Hazard & Severe Energy Waste)',
  'DIANJURKAN (Konservasi Energi)': 'RECOMMENDED (Energy Conservation)',
};

export function exportCalculationToPDF(
  inputs: CalculationInputs,
  results: CalculationResults,
  ductMaterial: DuctMaterial,
  canvasElement?: HTMLCanvasElement | null,
  metadata?: ReportMetadata,
  lang: Language = 'id'
) {
  const tr = (id: string, en: string) => (lang === 'id' ? id : en);
  const trVal = (map: Record<string, string>, value: string) => (lang === 'id' ? value : map[value] || value);

  const isCertified = metadata?.isCertified ?? true;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageWidth - 2 * margin;

  // ---- small drawing helpers, kept consistent across the whole document ----
  const setColor = (target: 'fill' | 'draw' | 'text', rgb: readonly [number, number, number]) => {
    if (target === 'fill') doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    else if (target === 'draw') doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    else doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  const sectionTitle = (title: string, y: number) => {
    setColor('fill', BRAND);
    doc.rect(margin, y - 3.2, 2, 4.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    setColor('text', INK);
    doc.text(title, margin + 4, y);
    return y + 6;
  };

  const bodyLine = (text: string, x: number, y: number, opts?: { bold?: boolean; color?: readonly [number, number, number]; size?: number }) => {
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(opts?.size ?? 8.2);
    setColor('text', opts?.color ?? SUBTLE);
    doc.text(text, x, y);
  };

  const footer = (pageLabel: string) => {
    setColor('draw', LINE);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setColor('text', FAINT);
    doc.text('ThermoDuct Engineering Suite  ·  ASTM C1055, ASME B31.3, SMACNA', margin, pageHeight - 7);
    doc.text(pageLabel, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // ==========================================================
  // PAGE 1 — SUMMARY, VISUAL, PARAMETERS, WALL LAYERS, NOTES
  // ==========================================================
  let y = margin;

  // --- Header banner ---
  const headerH = 24;
  setColor('fill', DARK_BG);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  setColor('text', [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(tr('Laporan Analisa & Desain Isolasi Termal', 'Thermal Insulation Analysis & Design Report'), margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor('text', FAINT);
  const modeStr =
    inputs.mode === 'design'
      ? tr('Mode Desain — Optimisasi Tebal', 'Design Mode — Thickness Optimization')
      : tr('Mode Diagnosa — Audit Kinerja Eksisting', 'Diagnostic Mode — Existing Performance Audit');
  const dateStr = metadata?.dateStr || new Date().toLocaleString(lang === 'id' ? 'id-ID' : 'en-US');
  doc.text(`${modeStr}  ·  ${tr('Diterbitkan', 'Published')} ${dateStr}`, margin, 17);

  const projLine = `${metadata?.projectName || 'Industrial Ducting Project'}  ·  ${tr('Klien', 'Client')}: ${metadata?.clientName || 'General Industrial Plant'}`;
  doc.text(projLine.length > 90 ? projLine.slice(0, 88) + '…' : projLine, margin, 21.5);

  // Simple status chip, top-right — no gimmicks, just a clean label
  const chipLabel = isCertified ? tr('LAPORAN RESMI', 'OFFICIAL REPORT') : 'DRAFT SAMPLE';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const chipW = doc.getTextWidth(chipLabel) + 8;
  const chipX = pageWidth - margin - chipW;
  const chipY = 8;
  setColor('fill', isCertified ? BRAND : [71, 85, 105]);
  doc.roundedRect(chipX, chipY, chipW, 7, 1.5, 1.5, 'F');
  setColor('text', [255, 255, 255]);
  doc.text(chipLabel, chipX + chipW / 2, chipY + 4.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setColor('text', FAINT);
  doc.text(metadata?.reportNumber || `TD-${Date.now().toString().slice(-6)}`, chipX + chipW, chipY + 12, { align: 'right' });

  y = headerH + 9;

  // --- KPI summary cards (4 across, generous padding) ---
  const cardGap = 5;
  const cardW = (contentW - 3 * cardGap) / 4;
  const cardH = 22;

  const drawCard = (x: number, label: string, value: string, sub: string, valueColor: readonly [number, number, number] = INK) => {
    setColor('fill', PANEL);
    setColor('draw', LINE);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    setColor('text', SUBTLE);
    doc.text(label.toUpperCase(), x + 4, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    setColor('text', valueColor);
    doc.text(value, x + 4, y + 14.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    setColor('text', SUBTLE);
    doc.text(sub, x + 4, y + 19);
  };

  const c1X = margin;
  const c2X = c1X + cardW + cardGap;
  const c3X = c2X + cardW + cardGap;
  const c4X = c3X + cardW + cardGap;

  drawCard(c1X, 'Total Heat Loss', `${(results.heatLossTotalW / 1000).toFixed(2)} kW`, `Flux: ${results.heatFluxWm2} W/m²`);

  const surfaceColor = results.personnelProtectionStatus === 'safe' ? SAFE : results.personnelProtectionStatus === 'warning' ? WARN : BRAND;
  drawCard(
    c2X,
    tr('Suhu Permukaan', 'Surface Temperature'),
    `${results.outerSurfaceTempC}°C`,
    results.personnelProtectionStatus === 'safe' ? tr('Aman disentuh (ASTM)', 'Safe to touch (ASTM)') : tr('Peringatan suhu tinggi', 'High temperature warning'),
    surfaceColor
  );

  const card3Label = inputs.hasInsulation === false
    ? tr('Status Isolasi', 'Insulation Status')
    : inputs.mode === 'design'
    ? tr('Rekomendasi Isolasi', 'Recommended Insulation')
    : tr('Efektif Isolasi', 'Effective Insulation');
  const card3Value = inputs.hasInsulation === false ? 'Bare Duct' : `${results.recommendedInsulationThicknessMm} mm`;
  const card3Sub =
    inputs.hasInsulation === false
      ? `${tr('Rek. pasang', 'Recommended')}: ${results.recommendedInsulationThicknessMm} mm`
      : results.recommendedInsulationAdditionalMm && results.recommendedInsulationAdditionalMm > 0
      ? `${tr('Perlu', 'Needs')} +${results.recommendedInsulationAdditionalMm} mm ${tr('pd', 'on')} ${results.recommendedInsulationTargetLayerName?.slice(0, 15) ?? ''}`
      : tr('Tebal Sesuai Target Safe Touch', 'Thickness Meets Safe-Touch Target');
  drawCard(c3X, card3Label, card3Value, card3Sub, inputs.hasInsulation === false ? WARN : INK);

  drawCard(
    c4X,
    tr('Biaya Energi / Tahun', 'Energy Cost / Year'),
    `Rp ${(results.financial.annualCostIdr / 1000000).toFixed(1)} ${tr('Jt', 'M')}`,
    `${tr('Emisi', 'Emissions')}: ${results.financial.co2EmissionsTonsPerYear} Ton CO2/${tr('thn', 'yr')}`
  );

  y += cardH + 8;

  // --- Cross-section snapshot ---
  if (canvasElement) {
    try {
      const imgData = canvasElement.toDataURL('image/png');
      const imgH = 62;
      setColor('draw', LINE);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, y, contentW, imgH, 2, 2, 'S');
      doc.addImage(imgData, 'PNG', margin + 1, y + 1, contentW - 2, imgH - 2);
      y += imgH + 8;
    } catch (e) {
      console.warn('Could not embed canvas to PDF', e);
    }
  }

  // --- Section 1: Parameters ---
  y = sectionTitle(tr('1. Parameter Operasi, Geometri & Lingkungan', '1. Operating Parameters, Geometry & Environment'), y);

  const paramRows = 5;
  const paramBoxH = paramRows * 5.2 + 6;
  setColor('fill', PANEL);
  setColor('draw', LINE);
  doc.roundedRect(margin, y, contentW, paramBoxH, 2, 2, 'FD');

  const pCol1 = margin + 5;
  const pCol2 = margin + contentW * 0.37;
  const pCol3 = margin + contentW * 0.7;
  const pStartY = y + 6.5;
  const lineH = 5.2;

  const shapeStr =
    inputs.shape === 'cylindrical'
      ? `${tr('Silinder / Pipa', 'Cylinder / Pipe')} (ID: ${inputs.innerDiameterMm} mm)`
      : inputs.shape === 'kiln'
      ? `Rotary Kiln (ID: ${inputs.innerDiameterMm} mm)`
      : `${tr('Ducting Persegi', 'Rectangular Ducting')} (${inputs.widthMm} × ${inputs.heightMm} mm)`;

  const col1Lines = [
    `${tr('Bentuk', 'Shape')}: ${shapeStr}`,
    `${tr('Panjang ducting', 'Duct length')}: ${inputs.lengthM} m`,
    `${tr('Plat shell', 'Shell plate')}: ${ductMaterial.name.split('(')[0].trim()} (${inputs.ductThicknessMm} mm)`,
    `${tr('Sistem isolasi', 'Insulation system')}: ${
      inputs.hasInsulation === false ? tr('Bare Duct (tanpa isolasi)', 'Bare Duct (uninsulated)') : `${inputs.layers.length} ${tr('lapisan', 'layer(s)')}`
    }`,
    `${tr('Tekanan operasi', 'Operating pressure')}: ${inputs.internalPressureBar} bar (gauge)`,
  ];
  const col2Lines = [
    `${tr('Jenis fluida', 'Fluid type')}: ${inputs.fluidType.replace(/_/g, ' ')}`,
    `${tr('Suhu fluida (T_f)', 'Fluid temperature (T_f)')}: ${inputs.fluidTempC} °C`,
    `${tr('Kecepatan fluida', 'Fluid velocity')}: ${inputs.fluidVelocityMs} m/s`,
    `${tr('Rezim aliran', 'Flow regime')}: ${trVal(FLOW_TYPE_EN, results.flowType)}`,
    `Reynolds (Re): ${results.reynoldsNumber.toLocaleString()}`,
  ];
  const col3Lines = [
    `${tr('Suhu lingkungan', 'Ambient temperature')}: ${inputs.ambientTempC} °C`,
    `${tr('Kecepatan angin', 'Wind speed')}: ${inputs.windSpeedMs} m/s`,
    `${tr('Emisivitas permukaan', 'Surface emissivity')}: ${inputs.externalEmissivity}`,
    inputs.mode === 'design'
      ? `${tr('Target suhu luar', 'Target surface temp')}: ${inputs.targetOuterTempC} °C`
      : `${tr('Suhu luar terukur', 'Measured surface temp')}: ${inputs.measuredOuterTempC} °C`,
  ];

  [col1Lines, col2Lines, col3Lines].forEach((lines, i) => {
    const cx = [pCol1, pCol2, pCol3][i];
    lines.forEach((line, idx) => bodyLine(`•  ${line}`, cx, pStartY + idx * lineH));
  });

  y += paramBoxH + 8;

  // --- Section 2: Wall layer table ---
  y = sectionTitle(tr('2. Spesifikasi Lapisan Dinding & Distribusi Temperatur', '2. Wall Layer Specification & Temperature Distribution'), y);

  const tableColX = {
    pos: margin + 4,
    name: margin + 32,
    thick: margin + 98,
    tIn: margin + 122,
    tOut: margin + 146,
    status: margin + 168,
  };

  const drawTableHeader = (yy: number, headers: [string, string, string, string, string, string]) => {
    setColor('fill', DARK_BG);
    doc.rect(margin, yy, contentW, 7, 'F');
    setColor('text', [255, 255, 255]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(headers[0], tableColX.pos, yy + 4.7);
    doc.text(headers[1], tableColX.name, yy + 4.7);
    doc.text(headers[2], tableColX.thick, yy + 4.7);
    doc.text(headers[3], tableColX.tIn, yy + 4.7);
    doc.text(headers[4], tableColX.tOut, yy + 4.7);
    doc.text(headers[5], tableColX.status, yy + 4.7);
    return yy + 7;
  };

  y = drawTableHeader(y, [
    tr('Posisi', 'Position'),
    tr('Nama Lapisan / Material', 'Layer Name / Material'),
    tr('Tebal (mm)', 'Thickness (mm)'),
    tr('T. Dalam (°C)', 'T. Inner (°C)'),
    tr('T. Luar (°C)', 'T. Outer (°C)'),
    'Status',
  ]);

  const rowH = 6.5;
  doc.setFontSize(7.3);
  results.layerResults.forEach((lyr, index) => {
    if (index % 2 === 0) {
      setColor('fill', PANEL);
      doc.rect(margin, y, contentW, rowH, 'F');
    }
    const posLabel =
      lyr.position === 'inside'
        ? tr('Refraktori Dalam', 'Inner Refractory')
        : lyr.position === 'duct_wall'
        ? 'Ducting Shell'
        : tr('Isolasi Luar', 'Outer Insulation');

    doc.setFont('helvetica', 'normal');
    setColor('text', SUBTLE);
    doc.text(posLabel, tableColX.pos, y + 4.4);
    setColor('text', INK);
    doc.text(lyr.name.length > 36 ? lyr.name.slice(0, 34) + '…' : lyr.name, tableColX.name, y + 4.4);
    doc.text(lyr.thicknessMm.toFixed(1), tableColX.thick, y + 4.4);
    doc.text(lyr.tInnerC.toFixed(1), tableColX.tIn, y + 4.4);
    doc.text(lyr.tOuterC.toFixed(1), tableColX.tOut, y + 4.4);

    doc.setFont('helvetica', 'bold');
    if (lyr.isOverheating) {
      setColor('text', BRAND);
      doc.text(`Overheat >${lyr.maxServiceTempC}°C`, tableColX.status, y + 4.4);
    } else {
      setColor('text', SAFE);
      doc.text(tr('Aman', 'Safe'), tableColX.status, y + 4.4);
    }
    y += rowH;
  });

  setColor('draw', LINE);
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Section 3: Engineering summary ---
  y = sectionTitle(tr('3. Kesimpulan Rekayasa & Rekomendasi', '3. Engineering Summary & Recommendations'), y);

  const notesLines: Array<{ text: string; bold?: boolean }> = [
    { text: `${tr('Status keselamatan', 'Safety status')}: ${getSafetyStatusMessage(results.personnelProtectionStatus, results.outerSurfaceTempC, lang)}` },
    {
      text: `${tr('Koefisien pindah panas', 'Heat transfer coefficients')}: h_${tr('dalam', 'inside')} = ${results.internalConvectionHi} W/m²·K, h_${tr('luar', 'outside')} = ${results.externalConvectionHo} W/m²·K, h_${tr('radiasi', 'radiation')} = ${results.radiationHr} W/m²·K.`,
    },
    {
      text: `${tr('Tebal shell', 'Shell thickness')}: ${tr('terpasang', 'installed')} ${inputs.ductThicknessMm} mm vs. ${tr('minimum kode', 'code minimum')} ${results.recommendedDuctThicknessMm} mm (safety factor ${results.ductSafetyFactor}×).`,
    },
  ];

  if (results.diagnostic) {
    notesLines.push({
      text: `${tr('Diagnosa keausan', 'Wear diagnosis')}: ${tr('isolasi terdegradasi', 'insulation degraded')} ${results.diagnostic.insulationWearPercent}% (${tr('tebal efektif', 'effective thickness')} ${results.diagnostic.effectiveThicknessMm} mm, ${tr('efisiensi', 'efficiency')} ${results.diagnostic.insulationEfficiencyPercent}%). ${tr('Plat', 'Plate')}: ${trVal(DUCT_INTEGRITY_EN, results.diagnostic.ductIntegrityStatus)}.`,
    });
    notesLines.push({
      text: `${tr('Kebutuhan isolasi', 'Insulation need')}: ${trVal(INSULATION_URGENCY_EN, results.diagnostic.insulationUrgency)}. ${results.diagnostic.recommendations[0] || tr('Lakukan audit berkala.', 'Perform periodic audits.')}`,
    });
  } else {
    notesLines.push({
      text: `${tr('Potensi efisiensi biaya', 'Cost efficiency potential')}: ${tr('penghematan hingga', 'savings of up to')} Rp ${(results.financial.potentialSavingsIdr / 1000000).toFixed(1)} ${tr('juta/tahun dapat dicapai dengan ketebalan isolasi optimal.', 'million/year achievable with optimal insulation thickness.')}`,
    });
  }

  const noteLineH = 6;
  const wrappedNotes = notesLines.flatMap((n) => doc.splitTextToSize(`•  ${n.text}`, contentW - 10));
  const notesBoxH = wrappedNotes.length * noteLineH + 6;

  setColor('fill', PANEL);
  setColor('draw', LINE);
  doc.roundedRect(margin, y, contentW, notesBoxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor('text', INK);
  wrappedNotes.forEach((line: string, idx: number) => {
    doc.text(line, margin + 5, y + 6 + idx * noteLineH);
  });

  y += notesBoxH + 8;

  // Faint watermark for the free draft sample, not for certified/paid reports
  if (!isCertified) {
    try {
      doc.saveGraphicsState();
      setColor('text', [222, 222, 226]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('DRAFT SAMPLE', pageWidth / 2, pageHeight / 2, { angle: 32, align: 'center' });
      doc.restoreGraphicsState();
    } catch {
      // ignore
    }
  }

  footer(tr('Halaman 1 / 2', 'Page 1 / 2'));

  // ==========================================================
  // PAGE 2 — WALL TEMPERATURE PROFILE (ASTM C680 / VDI-Wärmeatlas)
  // ==========================================================
  doc.addPage('a4', 'portrait');
  let y2 = margin;

  const header2H = 20;
  setColor('fill', DARK_BG);
  doc.rect(0, 0, pageWidth, header2H, 'F');
  setColor('text', [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Stationary Heat Transition Calculation', margin, 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor('text', FAINT);
  doc.text(
    `Standard: ASTM C680-89 & VDI-Wärmeatlas  ·  ${metadata?.projectName || 'Industrial Ducting & Refractory System'}`,
    margin,
    15.5
  );

  y2 = header2H + 9;

  // --- Boundary conditions ---
  const boundBoxH = 24;
  setColor('fill', PANEL);
  setColor('draw', LINE);
  doc.roundedRect(margin, y2, contentW, boundBoxH, 2, 2, 'FD');

  const bCol1 = margin + 5;
  const bCol2 = margin + contentW * 0.52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  setColor('text', INK);
  doc.text(tr('Kondisi Eksternal', 'External Conditions'), bCol1, y2 + 6);
  doc.text(tr('Kondisi Internal & Fluida', 'Internal & Fluid Conditions'), bCol2, y2 + 6);

  bodyLine(`•  ${tr('Kecepatan angin', 'Wind speed')}: ${inputs.windSpeedMs} m/s`, bCol1, y2 + 11.5);
  bodyLine(`•  ${tr('Derajat emisi permukaan', 'Surface emissivity')}: ${inputs.externalEmissivity}`, bCol1, y2 + 16.5);
  bodyLine(`•  ${tr('h_luar total', 'Total h_outside')}: ${(results.externalConvectionHo + results.radiationHr).toFixed(2)} W/m²·K`, bCol1, y2 + 21.5);

  bodyLine(`•  ${tr('Suhu fluida internal', 'Internal fluid temperature')}: ${inputs.fluidTempC} °C`, bCol2, y2 + 11.5);
  bodyLine(`•  ${tr('h_dalam (konveksi)', 'h_inside (convection)')}: ${results.internalConvectionHi.toFixed(1)} W/m²·K`, bCol2, y2 + 16.5);
  bodyLine(`•  ${tr('Fluks kehilangan panas', 'Heat loss flux')}: ${Math.round(results.heatFluxWm2)} W/m²`, bCol2, y2 + 21.5);

  y2 += boundBoxH + 8;

  // --- Wall temperature profile diagram ---
  y2 = sectionTitle(tr('Diagram Gradien Suhu Penampang Dinding', 'Wall Cross-Section Temperature Gradient Diagram'), y2);

  const gWidth = contentW;
  const gHeight = 76;
  const gX = margin;
  const gY = y2;

  setColor('fill', [10, 15, 26]);
  doc.roundedRect(gX, gY, gWidth, gHeight, 2, 2, 'F');
  setColor('draw', [51, 65, 85]);
  doc.setLineWidth(0.3);
  doc.roundedRect(gX, gY, gWidth, gHeight, 2, 2, 'S');

  const gPadLeft = 16;
  const gPadRight = 12;
  const gPadTop = 12;
  const gPadBottom = 16;
  const plotW = gWidth - gPadLeft - gPadRight;
  const plotH = gHeight - gPadTop - gPadBottom;

  const maxTVal = Math.max(inputs.fluidTempC, 100);
  const yMaxVal = Math.ceil(maxTVal / 200) * 200;
  const totalThick = results.layerResults.reduce((s, l) => s + l.thicknessMm, 0);

  const yTickVals = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600].filter((v) => v <= yMaxVal);
  setColor('draw', [30, 41, 59]);
  doc.setLineWidth(0.2);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  setColor('text', FAINT);

  yTickVals.forEach((tickVal) => {
    const yNorm = (tickVal / yMaxVal) * plotH;
    const lineY = gY + gPadTop + plotH - yNorm;
    doc.line(gX + gPadLeft, lineY, gX + gPadLeft + plotW, lineY);
    doc.text(`${tickVal}`, gX + gPadLeft - 2, lineY + 1.2, { align: 'right' });
  });

  let cumMm = 0;
  const layerColors: Array<[number, number, number]> = [
    [239, 68, 68],
    [234, 88, 12],
    [16, 185, 129],
    [56, 189, 248],
    [100, 116, 139],
  ];

  results.layerResults.forEach((lyr, idx) => {
    const startMm = cumMm;
    const endMm = cumMm + lyr.thicknessMm;
    cumMm = endMm;

    const blockX1 = gX + gPadLeft + (totalThick > 0 ? (startMm / totalThick) * plotW : 0);
    const blockX2 = gX + gPadLeft + (totalThick > 0 ? (endMm / totalThick) * plotW : plotW);
    const blockW = Math.max(0.5, blockX2 - blockX1);

    const c = layerColors[idx % layerColors.length];
    setColor('fill', c);
    doc.rect(blockX1, gY + gPadTop, blockW, plotH, 'F');
    setColor('draw', [10, 15, 26]);
    doc.setLineWidth(0.3);
    doc.rect(blockX1, gY + gPadTop, blockW, plotH, 'S');

    if (blockW > 8) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.2);
      setColor('text', [255, 255, 255]);
      const labelText = `${Math.round(lyr.thicknessMm)} mm ${lyr.name.slice(0, 20)}`;
      try {
        doc.text(labelText, blockX1 + blockW / 2, gY + gPadTop + plotH / 2, { align: 'center', angle: 90 });
      } catch {
        doc.text(`${Math.round(lyr.thicknessMm)}mm`, blockX1 + 1, gY + gPadTop + plotH / 2);
      }
    }
  });

  const curvePoints: Array<{ x: number; y: number; temp: number }> = [];
  const x0 = gX + gPadLeft;
  const y0 = gY + gPadTop + plotH - (results.innerWallTempC / yMaxVal) * plotH;
  curvePoints.push({ x: x0, y: y0, temp: results.innerWallTempC });

  let cumCurveMm = 0;
  results.layerResults.forEach((lyr) => {
    cumCurveMm += lyr.thicknessMm;
    const ptX = gX + gPadLeft + (totalThick > 0 ? (cumCurveMm / totalThick) * plotW : plotW);
    const ptY = gY + gPadTop + plotH - (lyr.tOuterC / yMaxVal) * plotH;
    curvePoints.push({ x: ptX, y: ptY, temp: lyr.tOuterC });
  });

  setColor('draw', [255, 255, 255]);
  doc.setLineWidth(0.8);
  for (let i = 0; i < curvePoints.length - 1; i++) {
    doc.line(curvePoints[i].x, curvePoints[i].y, curvePoints[i + 1].x, curvePoints[i + 1].y);
  }

  curvePoints.forEach((pt) => {
    setColor('fill', [255, 255, 255]);
    doc.circle(pt.x, pt.y, 1.1, 'F');

    const boxW = 14;
    const boxH = 5;
    const boxX = Math.max(gX + gPadLeft, Math.min(gX + gPadLeft + plotW - boxW, pt.x - boxW / 2));
    const boxY = Math.max(gY + gPadTop + 1, pt.y - 6.5);

    setColor('fill', DARK_BG);
    setColor('draw', [255, 255, 255]);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxW, boxH, 0.8, 0.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    setColor('text', [255, 255, 255]);
    doc.text(`${Math.round(pt.temp)} °C`, boxX + boxW / 2, boxY + 3.4, { align: 'center' });
  });

  setColor('draw', FAINT);
  doc.setLineWidth(0.4);
  doc.line(gX + gPadLeft, gY + gPadTop + plotH, gX + gPadLeft + plotW, gY + gPadTop + plotH);

  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  setColor('text', [203, 213, 225]);
  doc.text('0', gX + gPadLeft, gY + gPadTop + plotH + 3.5, { align: 'center' });

  let cumTickMm = 0;
  results.layerResults.forEach((lyr) => {
    cumTickMm += lyr.thicknessMm;
    const tX = gX + gPadLeft + (totalThick > 0 ? (cumTickMm / totalThick) * plotW : plotW);
    doc.line(tX, gY + gPadTop + plotH, tX, gY + gPadTop + plotH + 1.5);
    doc.text(`${Math.round(cumTickMm)}`, tX, gY + gPadTop + plotH + 3.5, { align: 'center' });
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  setColor('text', FAINT);
  doc.text('Wall thickness [mm]', gX + gPadLeft + plotW / 2, gY + gPadTop + plotH + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  setColor('text', [248, 113, 113]);
  doc.text(`${inputs.fluidTempC} °C internal temperature`, gX + gPadLeft, gY + 7);

  setColor('text', [251, 191, 36]);
  doc.text(`Heat loss external: ${Math.round(results.heatFluxWm2)} W/m²`, gX + gPadLeft, gY + gHeight - 2);

  setColor('text', [56, 189, 248]);
  doc.text(`${inputs.ambientTempC} °C ambient temperature`, gX + gPadLeft + plotW, gY + gHeight - 2, { align: 'right' });

  y2 += gHeight + 9;

  // --- Material / heat transition table ---
  y2 = sectionTitle(tr('Tabel Transisi Panas Multilapis (ASTM C680)', 'Multilayer Heat Transition Table (ASTM C680)'), y2);

  const tCol = {
    row: margin + 4,
    mat: margin + 26,
    thick: margin + 92,
    temp: margin + 116,
    k: margin + 144,
    r: margin + 165,
  };

  setColor('fill', DARK_BG);
  doc.rect(margin, y2, contentW, 6.5, 'F');
  setColor('text', [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text(tr('Row / Posisi', 'Row / Position'), tCol.row, y2 + 4.4);
  doc.text(tr('Material / Lapisan', 'Material / Layer'), tCol.mat, y2 + 4.4);
  doc.text(tr('Tebal [mm]', 'Thickness [mm]'), tCol.thick, y2 + 4.4);
  doc.text(tr('Suhu [°C]', 'Temp [°C]'), tCol.temp, y2 + 4.4);
  doc.text('k [W/m·K]', tCol.k, y2 + 4.4);
  doc.text('R [m²·K/W]', tCol.r, y2 + 4.4);
  y2 += 6.5;

  const t2RowH = 5.8;

  setColor('fill', PANEL);
  doc.rect(margin, y2, contentW, t2RowH, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setColor('text', SUBTLE);
  doc.text('Internal Wall', tCol.row, y2 + 4);
  doc.text(`Gas film boundary (h_in: ${results.internalConvectionHi} W/m²·K)`, tCol.mat, y2 + 4);
  doc.text('—', tCol.thick, y2 + 4);
  doc.setFont('helvetica', 'bold');
  setColor('text', BRAND);
  doc.text(`${Math.round(results.innerWallTempC)}`, tCol.temp, y2 + 4);
  doc.setFont('helvetica', 'normal');
  setColor('text', SUBTLE);
  doc.text('—', tCol.k, y2 + 4);
  doc.text(`${(1 / Math.max(1, results.internalConvectionHi)).toFixed(4)}`, tCol.r, y2 + 4);
  y2 += t2RowH;

  results.layerResults.forEach((lyr, idx) => {
    if (idx % 2 === 0) {
      setColor('fill', PANEL);
      doc.rect(margin, y2, contentW, t2RowH, 'F');
    }
    const posStr =
      lyr.position === 'inside' ? tr('Refraktori', 'Refractory') : lyr.position === 'duct_wall' ? tr('Shell Plat', 'Shell Plate') : tr('Isolasi Luar', 'Outer Insulation');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setColor('text', SUBTLE);
    doc.text(posStr, tCol.row, y2 + 4);
    doc.setFont('helvetica', 'bold');
    setColor('text', INK);
    doc.text(lyr.name.length > 34 ? lyr.name.slice(0, 32) + '…' : lyr.name, tCol.mat, y2 + 4);
    doc.setFont('helvetica', 'normal');
    setColor('text', SUBTLE);
    doc.text(lyr.thicknessMm.toFixed(0), tCol.thick, y2 + 4);
    doc.text(`${Math.round(lyr.tOuterC)}`, tCol.temp, y2 + 4);

    const kVal =
      lyr.thicknessMm > 0 && lyr.rValue > 0
        ? (lyr.thicknessMm / 1000 / (lyr.rValue * Math.max(0.1, results.surfaceAreaM2))).toFixed(3)
        : '—';
    doc.text(kVal, tCol.k, y2 + 4);
    doc.text(lyr.rValue.toFixed(4), tCol.r, y2 + 4);

    y2 += t2RowH;
  });

  setColor('fill', PANEL);
  doc.rect(margin, y2, contentW, t2RowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor('text', INK);
  doc.text('External Wall', tCol.row, y2 + 4);
  doc.setFont('helvetica', 'normal');
  setColor('text', SUBTLE);
  doc.text(tr('Suhu permukaan luar shell / jacket', 'Outer shell / jacket surface temperature'), tCol.mat, y2 + 4);
  doc.text(`${totalThick.toFixed(0)} total`, tCol.thick, y2 + 4);
  doc.setFont('helvetica', 'bold');
  setColor('text', [234, 88, 12]);
  doc.text(`${Math.round(results.outerSurfaceTempC)}`, tCol.temp, y2 + 4);
  doc.setFont('helvetica', 'normal');
  setColor('text', SUBTLE);
  doc.text(`${Math.round(results.heatFluxWm2)} W/m²`, tCol.k, y2 + 4);
  y2 += t2RowH + 8;

  // --- Disclaimer ---
  const discLines = doc.splitTextToSize(
    tr(
      'Perhitungan transisi panas bersifat teoritis berdasarkan parameter yang diketahui (konduktivitas termal, koefisien pindah panas, ketebalan dinding, dll). Jembatan panas seperti anchor, bukaan, dan sambungan mortar tidak diperhitungkan. Seluruh data dihitung sesuai ASTM C680-89.',
      'Heat transition calculations are theoretical, based on known parameters (thermal conductivity, heat transfer coefficients, wall thickness, etc). Heat bridges such as anchors, openings, and mortar joints are not accounted for. All data is calculated per ASTM C680-89.'
    ),
    contentW - 10
  );
  const discBoxH = discLines.length * 4.6 + 6;
  setColor('fill', PANEL);
  setColor('draw', LINE);
  doc.roundedRect(margin, y2, contentW, discBoxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  setColor('text', SUBTLE);
  discLines.forEach((line: string, idx: number) => doc.text(line, margin + 5, y2 + 5 + idx * 4.6));

  y2 += discBoxH + 10;

  // --- Sign-off: prepared-by + a real signature line, plus a certification stamp for
  // official/paid reports. Lives at the end of the document (page 2 has the room; page 1 is full).
  const signH = 32;
  const signColW = contentW * (isCertified ? 0.66 : 1);
  const reportNo = metadata?.reportNumber || `TD-${Date.now().toString().slice(-6)}`;

  setColor('fill', PANEL);
  setColor('draw', LINE);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y2, contentW, signH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColor('text', INK);
  doc.text(tr('Disusun oleh', 'Prepared by'), margin + 5, y2 + 6);
  doc.setFont('helvetica', 'normal');
  setColor('text', SUBTLE);
  doc.text(metadata?.engineerName || 'Certified Thermal Engineer', margin + 5, y2 + 11.5);
  doc.setFontSize(7);
  doc.text(`${tr('Nomor Laporan', 'Report Number')}: ${reportNo}`, margin + 5, y2 + 16.5);

  // Physical signature line for the auditor to sign after printing
  setColor('draw', SUBTLE);
  doc.setLineWidth(0.25);
  doc.line(margin + 5, y2 + signH - 7, margin + signColW - 8, y2 + signH - 7);
  doc.setFontSize(6.5);
  setColor('text', FAINT);
  doc.text(tr('Tanda Tangan & Tanggal Pengesahan Auditor', "Auditor's Signature & Sign-off Date"), margin + 5, y2 + signH - 3);

  if (isCertified) {
    const stampCX = margin + contentW - 22;
    const stampCY = y2 + signH / 2;
    const stampR = 13;

    setColor('draw', BRAND);
    doc.setLineWidth(0.9);
    doc.circle(stampCX, stampCY, stampR, 'S');
    doc.setLineWidth(0.4);
    doc.circle(stampCX, stampCY, stampR - 1.8, 'S');

    setColor('text', BRAND);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.text('THERMODUCT', stampCX, stampCY - 2, { align: 'center', angle: -8 });
    doc.setFontSize(5.4);
    doc.text('CERTIFIED', stampCX, stampCY + 2.6, { align: 'center', angle: -8 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.2);
    setColor('text', SUBTLE);
    doc.text(reportNo, stampCX, stampCY + 6.5, { align: 'center', angle: -8 });
  }

  footer(tr('Halaman 2 / 2', 'Page 2 / 2'));

  // Save PDF
  const filename = isCertified
    ? `ThermoDuct_Official_Report_${inputs.shape}_${Date.now()}.pdf`
    : `ThermoDuct_Draft_Sample_${inputs.shape}_${Date.now()}.pdf`;
  doc.save(filename);
}
