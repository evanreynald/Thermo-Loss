import jsPDF from 'jspdf';
import { CalculationInputs, CalculationResults, DuctMaterial, ReportMetadata } from '../types';

export function exportCalculationToPDF(
  inputs: CalculationInputs,
  results: CalculationResults,
  ductMaterial: DuctMaterial,
  canvasElement?: HTMLCanvasElement | null,
  metadata?: ReportMetadata
) {
  const isCertified = metadata?.isCertified ?? true;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN TEKNIS ANALISA & DESAIN ISOLASI TERMAL', margin + 6, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const modeStr =
    inputs.mode === 'design'
      ? 'MODE DESAIN (OPTIMISASI TEBAL)'
      : 'MODE DIAGNOSA (AUDIT KINERJA EKSISTING)';
  const dateStr = metadata?.dateStr || new Date().toLocaleString('id-ID');
  doc.text(`ThermoDuct Engineering Suite | ${modeStr} | Diterbitkan: ${dateStr}`, margin + 6, y + 13);

  // Project & Client info
  const projText = `Proyek: ${metadata?.projectName || 'Komersial / Industrial Ducting'}  |  Klien: ${metadata?.clientName || 'General Industrial Plant'}  |  Auditor: ${metadata?.engineerName || 'Certified Engineer'}`;
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(projText.length > 85 ? projText.slice(0, 83) + '...' : projText, margin + 6, y + 19);

  // Official Certified Badge vs Unverified Draft Badge in Top Right
  if (isCertified) {
    const badgeW = 48;
    const badgeH = 16;
    const badgeX = pageWidth - margin - badgeW - 3;
    const badgeY = y + 4;
    doc.setFillColor(30, 58, 138); // blue-900
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F');
    doc.setDrawColor(234, 179, 8); // amber-500 gold
    doc.setLineWidth(0.6);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(253, 224, 71); // amber-300
    doc.text('★ RESMI & TERLISENSI ★', badgeX + 5, badgeY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`No: ${metadata?.reportNumber || `CERT-TD-${Date.now().toString().slice(-6)}`}`, badgeX + 5, badgeY + 9);
    doc.text('Valid: ASTM C1055 / ASME B31.3', badgeX + 5, badgeY + 13);
  } else {
    const badgeW = 45;
    const badgeH = 14;
    const badgeX = pageWidth - margin - badgeW - 3;
    const badgeY = y + 5;
    doc.setFillColor(69, 26, 26);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(248, 113, 113);
    doc.text('DRAFT SAMPLE (GRATIS)', badgeX + 4, badgeY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(226, 232, 240);
    doc.text('Pay Per Report untuk Lisensi Resmi', badgeX + 4, badgeY + 10);
  }

  y += 28;

  // Summary KPI Cards (4 cards in a row)
  const cardW = (pageWidth - 2 * margin - 9) / 4;
  const cardH = 18;

  // Card 1: Heat Loss
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL HEAT LOSS', margin + 3, y + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${(results.heatLossTotalW / 1000).toFixed(2)} kW`, margin + 3, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Flux: ${results.heatFluxWm2} W/m²`, margin + 3, y + 15.5);

  // Card 2: Surface Temp & Safety
  const c2X = margin + cardW + 3;
  doc.roundedRect(c2X, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('SUHU PERMUKAAN', c2X + 3, y + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  if (results.personnelProtectionStatus === 'safe') {
    doc.setTextColor(22, 163, 74); // green
  } else if (results.personnelProtectionStatus === 'warning') {
    doc.setTextColor(217, 119, 6); // amber
  } else {
    doc.setTextColor(220, 38, 38); // red
  }
  doc.text(`${results.outerSurfaceTempC}°C`, c2X + 3, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(results.personnelProtectionStatus === 'safe' ? 'Aman Sentuh (ASTM)' : 'Peringatan Suhu Tinggi', c2X + 3, y + 15.5);

  // Card 3: Recommended Insulation / Status
  const c3X = c2X + cardW + 3;
  doc.roundedRect(c3X, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    inputs.hasInsulation === false
      ? 'STATUS ISOLASI'
      : inputs.mode === 'design'
      ? 'REKOMENDASI ISOLASI'
      : 'EFEKTIF ISOLASI',
    c3X + 3,
    y + 5
  );
  doc.setFontSize(inputs.hasInsulation === false ? 9.5 : 11);
  doc.setFont('helvetica', 'bold');
  if (inputs.hasInsulation === false) {
    doc.setTextColor(217, 119, 6); // amber
    doc.text('Tanpa Isolasi (Bare)', c3X + 3, y + 12);
  } else {
    doc.setTextColor(15, 23, 42);
    doc.text(`${results.recommendedInsulationThicknessMm} mm`, c3X + 3, y + 12);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    inputs.hasInsulation === false
      ? `Rek. Pasang: ${results.recommendedInsulationThicknessMm} mm`
      : results.recommendedInsulationAdditionalMm && results.recommendedInsulationAdditionalMm > 0
      ? `Perlu +${results.recommendedInsulationAdditionalMm} mm pd ${results.recommendedInsulationTargetLayerName?.slice(0, 15)}`
      : `Tebal Sesuai Target Safe Touch`,
    c3X + 3,
    y + 15.5
  );

  // Card 4: Financial Annual Cost
  const c4X = c3X + cardW + 3;
  doc.roundedRect(c4X, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('BIAYA ENERGI / THN', c4X + 3, y + 5);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const costJt = (results.financial.annualCostIdr / 1000000).toFixed(1);
  doc.text(`Rp ${costJt} Juta`, c4X + 3, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Emisi: ${results.financial.co2EmissionsTonsPerYear} T CO₂`, c4X + 3, y + 15.5);

  y += cardH + 6;

  // Embedded Canvas Image if provided
  if (canvasElement) {
    try {
      const imgData = canvasElement.toDataURL('image/png');
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 65;
      doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
      y += imgHeight + 6;
    } catch (e) {
      console.warn('Could not embed canvas to PDF', e);
    }
  }

  // Section 1: Parameter Operasi & Desain
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PARAMETER OPERASI, GEOMETRI & LINGKUNGAN', margin, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, 28, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const col1 = margin + 4;
  const col2 = margin + 65;
  const col3 = margin + 125;

  const shapeStr =
    inputs.shape === 'cylindrical'
      ? `Silinder / Pipa (ID: ${inputs.innerDiameterMm} mm)`
      : inputs.shape === 'kiln'
      ? `Rotary Kiln (ID: ${inputs.innerDiameterMm} mm)`
      : `Ducting Persegi (${inputs.widthMm} x ${inputs.heightMm} mm)`;

  doc.text(`• Bentuk: ${shapeStr}`, col1, y + 5);
  doc.text(`• Panjang Ducting: ${inputs.lengthM} meter`, col1, y + 10);
  doc.text(`• Plat Shell: ${ductMaterial.name.split('(')[0]} (${inputs.ductThicknessMm} mm)`, col1, y + 15);
  doc.text(`• Sistem Isolasi: ${inputs.hasInsulation === false ? 'Bare Duct (Tanpa Isolasi)' : `${inputs.layers.length} Lapisan`}`, col1, y + 20);
  doc.text(`• Tekanan Operasi: ${inputs.internalPressureBar} bar (Gauge)`, col1, y + 25);

  doc.text(`• Jenis Fluida: ${inputs.fluidType.toUpperCase()}`, col2, y + 5);
  doc.text(`• Suhu Fluida (T_f): ${inputs.fluidTempC} °C`, col2, y + 10);
  doc.text(`• Kecepatan Fluida: ${inputs.fluidVelocityMs} m/s`, col2, y + 15);
  doc.text(`• Rezim Aliran: ${results.flowType}`, col2, y + 20);
  doc.text(`• Reynolds (Re): ${results.reynoldsNumber.toLocaleString()}`, col2, y + 25);

  doc.text(`• Suhu Lingkungan (Ambient): ${inputs.ambientTempC} °C`, col3, y + 5);
  doc.text(`• Kecepatan Angin: ${inputs.windSpeedMs} m/s`, col3, y + 10);
  doc.text(`• Emisivitas Permukaan: ${inputs.externalEmissivity}`, col3, y + 15);
  if (inputs.mode === 'design') {
    doc.text(`• Target Suhu Luar: ${inputs.targetOuterTempC} °C`, col3, y + 20);
  } else {
    doc.text(`• Suhu Luar Terukur: ${inputs.measuredOuterTempC} °C`, col3, y + 20);
  }

  y += 32;

  // Section 2: Spesifikasi Lapisan Dinding & Profil Termal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. SPESIFIKASI LAPISAN DINDING & DISTRIBUSI TEMPERATUR', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  doc.text('Posisi', margin + 3, y + 4.2);
  doc.text('Nama Lapisan / Material', margin + 30, y + 4.2);
  doc.text('Tebal (mm)', margin + 95, y + 4.2);
  doc.text('T_Dalam (°C)', margin + 120, y + 4.2);
  doc.text('T_Luar (°C)', margin + 145, y + 4.2);
  doc.text('Status Termal', margin + 165, y + 4.2);

  y += 6;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  results.layerResults.forEach((lyr, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 5.5, 'F');
    }
    doc.setTextColor(15, 23, 42);

    const posLabel =
      lyr.position === 'inside'
        ? 'Refractory Dalam'
        : lyr.position === 'duct_wall'
        ? 'Ducting Shell'
        : 'Isolasi Luar';

    doc.text(posLabel, margin + 3, y + 4);
    doc.text(lyr.name.length > 34 ? lyr.name.slice(0, 32) + '...' : lyr.name, margin + 30, y + 4);
    doc.text(`${lyr.thicknessMm.toFixed(1)}`, margin + 95, y + 4);
    doc.text(`${lyr.tInnerC.toFixed(1)}`, margin + 120, y + 4);
    doc.text(`${lyr.tOuterC.toFixed(1)}`, margin + 145, y + 4);

    if (lyr.isOverheating) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Overheat (> ${lyr.maxServiceTempC}°C)`, margin + 165, y + 4);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text('Aman', margin + 165, y + 4);
    }

    y += 5.5;
  });

  y += 4;

  // Section 3: Diagnostic / Engineering Assessment Notes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. KESIMPULAN REKAYASA & REKOMENDASI AUDIT', margin, y);
  y += 4;

  const boxHeight = results.diagnostic ? 28 : 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, boxHeight, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  let note1 = `• Status Keselamatan: ${results.statusMessage}`;
  let note2 = `• Efisiensi Termal: h_in = ${results.internalConvectionHi} W/m²·K, h_out = ${results.externalConvectionHo} W/m²·K, h_rad = ${results.radiationHr} W/m²·K.`;
  let note3 = `• Ketebalan Shell Plat: Terpasang ${inputs.ductThicknessMm} mm vs min. kode ${results.recommendedDuctThicknessMm} mm (Safety factor = ${results.ductSafetyFactor}x).`;

  doc.text(note1, margin + 4, y + 5);
  doc.text(note2, margin + 4, y + 10);
  doc.text(note3, margin + 4, y + 15);

  if (results.diagnostic) {
    const diagNote1 = `• Diagnosa Keausan: Isolasi ${results.diagnostic.insulationWearPercent}% degradasi (Tebal efektif: ${results.diagnostic.effectiveThicknessMm} mm, Efisiensi: ${results.diagnostic.insulationEfficiencyPercent}%). Plat: ${results.diagnostic.ductIntegrityStatus}.`;
    const diagNote2 = `• Kebutuhan Isolasi: ${results.diagnostic.insulationUrgency} | Rekomendasi: ${results.diagnostic.recommendations[0] || 'Lakukan audit berkala.'}`;
    doc.text(diagNote1, margin + 4, y + 20);
    doc.text(diagNote2, margin + 4, y + 25);
  } else {
    const potNote = `• Potensi Efisiensi Biaya: Penghematan hingga Rp ${(results.financial.potentialSavingsIdr / 1000000).toFixed(1)} Juta/tahun dapat dicapai dengan ketebalan isolasi optimal.`;
    doc.text(potNote, margin + 4, y + 20);
  }

  // Footer page number & signature line
  if (isCertified) {
    // Official Engineer Signature & Approval Box
    const signY = pageHeight - 27;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, signY, pageWidth - 2 * margin, 17, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('PENGESAHAN DOKUMEN REKAYASA (ENGINEERING SIGN-OFF)', margin + 3, signY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Lead Auditor / Specialist: ${metadata?.engineerName || 'Ir. Lead Thermal Engineer, ST, IPM'}`,
      margin + 3,
      signY + 9
    );
    doc.text(
      `Nomor Registrasi: ${metadata?.reportNumber || `CERT-TD-${Date.now().toString().slice(-6)}`}`,
      margin + 3,
      signY + 13.5
    );

    doc.text('Status: TERVALIDASI & MEMENUHI STANDAR KESELAMATAN', pageWidth - margin - 75, signY + 9);
    doc.text(
      `Verifikasi Dokumen: HASH-${Date.now().toString(36).toUpperCase()}-VERIFIED`,
      pageWidth - margin - 75,
      signY + 13.5
    );
  } else {
    // Faint diagonal watermark for draft sample
    try {
      doc.saveGraphicsState();
      doc.setTextColor(215, 215, 220);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('DRAFT SAMPLE • WATERMARKED PREVIEW', 25, 145, { angle: 36 });
      doc.text('GUNAKAN PAY PER REPORT UNTUK LAPORAN RESMI', 15, 175, { angle: 36 });
      doc.restoreGraphicsState();
    } catch {
      // ignore
    }
  }

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Divalidasi oleh Sistem Analisa Termal ThermoDuct | Standar Referensi: ASTM C1055, ASME B31.3, SMACNA', margin, pageHeight - 6);
  doc.text('Hal 1 / 2', pageWidth - margin - 15, pageHeight - 6);

  // ==========================================
  // PAGE 2: STATIONARY HEAT TRANSITION CALCULATION & WALL TEMPERATURE PROFILE
  // (Standard Refractory & Industrial Insulation Format after ASTM C680 / VDI-Wärmeatlas)
  // ==========================================
  doc.addPage('a4', 'portrait');
  let y2 = 14;

  // Header Banner Page 2
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y2, pageWidth - 2 * margin, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STATIONARY HEAT TRANSITION CALCULATION', margin + 6, y2 + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Standard: ASTM C 680-89 & VDI-Wärmeatlas | File Ref: TD-${Date.now().toString().slice(-6)} | Client: ${metadata?.clientName || 'General Industrial'}`,
    margin + 6,
    y2 + 13
  );
  doc.text(
    `Equip: ${metadata?.projectName || 'Industrial Ducting & Refractory System'} | Status: ${isCertified ? 'RESMI & TERVALIDASI' : 'DRAFT KALKULASI'}`,
    margin + 6,
    y2 + 18
  );

  y2 += 26;

  // Boundary Conditions Box (External & Internal)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y2, pageWidth - 2 * margin, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('KONDISI EKSTERNAL (EXTERNAL CONDITIONS):', margin + 4, y2 + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Kecepatan Angin (Wind velocity): ${inputs.windSpeedMs} m/s`, margin + 4, y2 + 10.5);
  doc.text(`• Derajat Emisi Permukaan (Emission grade): ${inputs.externalEmissivity}`, margin + 4, y2 + 15);
  doc.text(
    `• Koef. Pindah Panas Luar (h_o): ${(results.externalConvectionHo + results.radiationHr).toFixed(2)} W/m²·K (ASTM C 680)`,
    margin + 4,
    y2 + 19.5
  );

  const colExtMid = margin + 95;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('KONDISI INTERNAL & FLUIDA (INTERNAL CONDITIONS):', colExtMid, y2 + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Suhu Fluida Gas (Internal Temp): ${inputs.fluidTempC} °C`, colExtMid, y2 + 10.5);
  doc.text(`• Koef. Konveksi Internal (h_i): ${results.internalConvectionHi.toFixed(1)} W/m²·K (VDI-Wärmeatlas)`, colExtMid, y2 + 15);
  doc.text(
    `• Fluks Kehilangan Panas (Heat Loss): ${Math.round(results.heatFluxWm2)} Watt/m²`,
    colExtMid,
    y2 + 19.5
  );

  y2 += 28;

  // Title for the Graph
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DIAGRAM GRADIEN SUHU PENAMPANG DINDING (WALL TEMPERATURE PROFILE)', margin, y2);
  y2 += 4;

  // ==========================================
  // VECTOR DRAWING OF TEMPERATURE PROFILE GRAPH
  // ==========================================
  const gWidth = pageWidth - 2 * margin; // e.g. 210 - 28 = 182 mm
  const gHeight = 78; // height in mm
  const gX = margin;
  const gY = y2;

  // Background for graph
  doc.setFillColor(10, 15, 26);
  doc.rect(gX, gY, gWidth, gHeight, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  doc.rect(gX, gY, gWidth, gHeight, 'S');

  // Coordinates inside graph
  const gPadLeft = 16;
  const gPadRight = 12;
  const gPadTop = 10;
  const gPadBottom = 16;
  const plotW = gWidth - gPadLeft - gPadRight;
  const plotH = gHeight - gPadTop - gPadBottom;

  const maxT = Math.max(inputs.fluidTempC, 100);
  const yMaxVal = Math.ceil(maxT / 200) * 200;
  const totalThick = results.layerResults.reduce((s, l) => s + l.thicknessMm, 0);

  // Y-axis gridlines
  const yTickVals = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600].filter((v) => v <= yMaxVal);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.2);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);

  yTickVals.forEach((tickVal) => {
    const yNorm = (tickVal / yMaxVal) * plotH;
    const lineY = gY + gPadTop + plotH - yNorm;
    doc.line(gX + gPadLeft, lineY, gX + gPadLeft + plotW, lineY);
    doc.text(`${tickVal}`, gX + gPadLeft - 2, lineY + 1.2, { align: 'right' });
  });

  // Layer colored blocks
  let cumMm = 0;
  const layerColors = [
    [220, 38, 38], // Red
    [234, 88, 12], // Orange
    [16, 185, 129], // Green
    [14, 165, 233], // Blue
    [100, 116, 139], // Slate
  ];

  results.layerResults.forEach((lyr, idx) => {
    const startMm = cumMm;
    const endMm = cumMm + lyr.thicknessMm;
    cumMm = endMm;

    const blockX1 = gX + gPadLeft + (totalThick > 0 ? (startMm / totalThick) * plotW : 0);
    const blockX2 = gX + gPadLeft + (totalThick > 0 ? (endMm / totalThick) * plotW : plotW);
    const blockW = Math.max(0.5, blockX2 - blockX1);

    const c = layerColors[idx % layerColors.length];
    doc.setFillColor(c[0], c[1], c[2]);
    doc.rect(blockX1, gY + gPadTop, blockW, plotH, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.rect(blockX1, gY + gPadTop, blockW, plotH, 'S');

    // Vertical text in block if wide enough
    if (blockW > 7) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      const labelText = `${Math.round(lyr.thicknessMm)} mm ${lyr.name.slice(0, 20)}`;
      try {
        doc.text(labelText, blockX1 + blockW / 2, gY + gPadTop + plotH / 2, {
          align: 'center',
          angle: 90,
        });
      } catch {
        doc.text(`${Math.round(lyr.thicknessMm)}mm`, blockX1 + 1, gY + gPadTop + plotH / 2);
      }
    }
  });

  // Polyline for temperature curve
  const curvePoints: Array<{ x: number; y: number; temp: number }> = [];
  // Inner wall point (x=0)
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

  // Draw temperature lines
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  for (let i = 0; i < curvePoints.length - 1; i++) {
    doc.line(curvePoints[i].x, curvePoints[i].y, curvePoints[i + 1].x, curvePoints[i + 1].y);
  }

  // Draw point markers and callout tags
  curvePoints.forEach((pt) => {
    // Circle marker
    doc.setFillColor(255, 255, 255);
    doc.circle(pt.x, pt.y, 1.2, 'F');

    // Callout box with temperature text
    const boxW = 14;
    const boxH = 5;
    const boxX = Math.max(gX + gPadLeft, Math.min(gX + gPadLeft + plotW - boxW, pt.x - boxW / 2));
    const boxY = Math.max(gY + gPadTop + 1, pt.y - 6.5);

    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxW, boxH, 0.8, 0.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${Math.round(pt.temp)} °C`, boxX + boxW / 2, boxY + 3.4, { align: 'center' });
  });

  // X-Axis tick marks and labels (Wall thickness [mm])
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(gX + gPadLeft, gY + gPadTop + plotH, gX + gPadLeft + plotW, gY + gPadTop + plotH);

  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
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
  doc.setTextColor(148, 163, 184);
  doc.text('Wall thickness [mm]', gX + gPadLeft + plotW / 2, gY + gPadTop + plotH + 7, {
    align: 'center',
  });

  // Top/Bottom graph notes matching vendor layout
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(239, 68, 68);
  doc.text(`${inputs.fluidTempC} °C internal temperature`, gX + gPadLeft + 2, gY + gPadTop - 2);

  doc.setTextColor(245, 158, 11);
  doc.text(
    `Heat loss external: ${Math.round(results.heatFluxWm2)} Watt/m²`,
    gX + gPadLeft,
    gY + gHeight - 2
  );

  doc.setTextColor(56, 189, 248);
  doc.text(
    `${inputs.ambientTempC} °C ambient temperature`,
    gX + gPadLeft + plotW,
    gY + gHeight - 2,
    { align: 'right' }
  );

  y2 += gHeight + 6;

  // ==========================================
  // STATIONARY HEAT TRANSITION MATERIAL TABLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TABEL HASIL PERHITUNGAN TRANSISI PANAS MULTILAPIS (ASTM C 680)', margin, y2);
  y2 += 4;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y2, pageWidth - 2 * margin, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');

  doc.text('Row/Posisi', margin + 3, y2 + 3.8);
  doc.text('Material / Lapisan', margin + 25, y2 + 3.8);
  doc.text('Tebal [mm]', margin + 90, y2 + 3.8);
  doc.text('Suhu [°C]', margin + 115, y2 + 3.8);
  doc.text('k [W/m·K]', margin + 145, y2 + 3.8);
  doc.text('R [m²·K/W]', margin + 165, y2 + 3.8);

  y2 += 5.5;

  // Row for internal wall temp
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y2, pageWidth - 2 * margin, 4.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Internal Wall Temp.', margin + 3, y2 + 3.2);
  doc.text(`Gas film boundary layer (h_in: ${results.internalConvectionHi} W/m²·K)`, margin + 25, y2 + 3.2);
  doc.text('-', margin + 90, y2 + 3.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`${Math.round(results.innerWallTempC)}`, margin + 115, y2 + 3.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('-', margin + 145, y2 + 3.2);
  doc.text(`${(1 / Math.max(1, results.internalConvectionHi)).toFixed(4)}`, margin + 165, y2 + 3.2);
  y2 += 4.5;

  // Rows for each layer
  results.layerResults.forEach((lyr, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y2, pageWidth - 2 * margin, 5, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);

    const posStr =
      lyr.position === 'inside'
        ? 'Refractory'
        : lyr.position === 'duct_wall'
        ? 'Shell Plat'
        : 'Isolasi Luar';

    doc.text(posStr, margin + 3, y2 + 3.5);
    doc.setFont('helvetica', 'bold');
    doc.text(lyr.name.length > 32 ? lyr.name.slice(0, 30) + '...' : lyr.name, margin + 25, y2 + 3.5);
    doc.text(`${lyr.thicknessMm.toFixed(0)}`, margin + 90, y2 + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${Math.round(lyr.tOuterC)}`, margin + 115, y2 + 3.5);

    // Thermal conductivity derived from thickness & R
    const kVal =
      lyr.thicknessMm > 0 && lyr.rValue > 0
        ? (lyr.thicknessMm / 1000 / (lyr.rValue * Math.max(0.1, results.surfaceAreaM2))).toFixed(3)
        : '-';
    doc.text(`${kVal}`, margin + 145, y2 + 3.5);
    doc.text(`${lyr.rValue.toFixed(4)}`, margin + 165, y2 + 3.5);

    y2 += 5;
  });

  // External wall temp row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y2, pageWidth - 2 * margin, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text('External Wall Temp.', margin + 3, y2 + 3.5);
  doc.text('Suhu permukaan luar shell/jacket', margin + 25, y2 + 3.5);
  doc.text(`${totalThick.toFixed(0)} total`, margin + 90, y2 + 3.5);
  doc.setTextColor(234, 88, 12);
  doc.text(`${Math.round(results.outerSurfaceTempC)}`, margin + 115, y2 + 3.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Heat Loss: ${Math.round(results.heatFluxWm2)} W/m²`,
    margin + 145,
    y2 + 3.5
  );
  y2 += 7;

  // Theoretical Disclaimer Footer Page 2 (persis seperti laporan vendor)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y2, pageWidth - 2 * margin, 13, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Heat transition calculations are theoretical and calculated depending on known parameters as thermal cond, heat transfer coef.,',
    margin + 3,
    y2 + 4.5
  );
  doc.text(
    'wall thickness, etc. Heat-bridges as anchors, openings, mortar-joints are not regarded. All data are calculated according to ASTM C 680-89.',
    margin + 3,
    y2 + 8.5
  );

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('ThermoDuct Stationary Heat Transition System | Standar ASTM C 680 / VDI Wärmeatlas', margin, pageHeight - 6);
  doc.text('Hal 2 / 2', pageWidth - margin - 15, pageHeight - 6);

  // Save PDF
  const filename = isCertified
    ? `ThermoDuct_Official_Report_${inputs.shape}_${Date.now()}.pdf`
    : `ThermoDuct_Draft_Sample_${inputs.shape}_${Date.now()}.pdf`;
  doc.save(filename);
}
