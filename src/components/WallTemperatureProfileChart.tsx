import React, { useRef, useState } from 'react';
import { CalculationInputs, CalculationResults } from '../types';
import { Language, UnitSystem } from '../utils/translations';
import { unitHelpers } from '../utils/unitConversion';
import { Thermometer, Download, Info, CheckCircle2, Layers } from 'lucide-react';

interface Props {
  inputs: CalculationInputs;
  results: CalculationResults;
  lang: Language;
  unitSystem: UnitSystem;
}

// Color palettes for industrial refractory & insulation layers (matches ASTM & vendor reports)
const LAYER_PALETTES = [
  { bg: 'rgba(220, 38, 38, 0.85)', border: '#ef4444', text: '#ffffff', tagBg: '#991b1b' }, // Hot face refractory
  { bg: 'rgba(234, 88, 12, 0.85)', border: '#f97316', text: '#ffffff', tagBg: '#c2410c' }, // Mid castable / gunning
  { bg: 'rgba(16, 185, 129, 0.85)', border: '#10b981', text: '#ffffff', tagBg: '#047857' }, // Silicate board / backup
  { bg: 'rgba(14, 165, 233, 0.85)', border: '#38bdf8', text: '#ffffff', tagBg: '#0369a1' }, // Cold insulation / blanket
  { bg: 'rgba(100, 116, 139, 0.85)', border: '#94a3b8', text: '#ffffff', tagBg: '#334155' }, // Steel shell
  { bg: 'rgba(168, 85, 247, 0.85)', border: '#c084fc', text: '#ffffff', tagBg: '#7e22ce' }, // High alumina
];

export const WallTemperatureProfileChart: React.FC<Props> = ({
  inputs,
  results,
  lang,
  unitSystem,
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredLayerIndex, setHoveredLayerIndex] = useState<number | null>(null);

  const units = unitHelpers.getUnits(unitSystem);

  // Extract layers and coordinate system
  const layers = results.layerResults || [];
  const totalThicknessMm = layers.reduce((sum, lyr) => sum + lyr.thicknessMm, 0);

  // Boundary temperatures
  const tFluid = inputs.fluidTempC;
  const tAmb = inputs.ambientTempC;
  const tInnerWall = results.innerWallTempC;
  const tOuterWall = results.outerSurfaceTempC;

  // Max temp for Y scale
  const maxTemp = Math.max(tFluid, 100);
  const minTemp = Math.max(0, Math.min(tAmb, 0));
  // Round max scale to nice number (e.g. 1200, 1400, etc.)
  const yAxisMax = Math.ceil(maxTemp / 200) * 200;
  const yTicks = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600].filter((val) => val <= yAxisMax);

  // Calculate cumulative X offsets for each layer
  let cumulativeMm = 0;
  const layerCoordinates = layers.map((lyr, idx) => {
    const startMm = cumulativeMm;
    const endMm = cumulativeMm + lyr.thicknessMm;
    cumulativeMm = endMm;
    const palette = LAYER_PALETTES[idx % LAYER_PALETTES.length];
    return {
      ...lyr,
      index: idx,
      startMm,
      endMm,
      palette,
    };
  });

  // SVG Dimension ViewBox
  const svgWidth = 840;
  const svgHeight = 440;
  const padLeft = 70;
  const padRight = 50;
  const padTop = 40;
  const padBottom = 75;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Scale functions
  const scaleX = (xMm: number) => {
    if (totalThicknessMm <= 0) return padLeft + plotWidth / 2;
    return padLeft + (xMm / totalThicknessMm) * plotWidth;
  };

  const scaleY = (tempC: number) => {
    const clamped = Math.max(minTemp, Math.min(yAxisMax, tempC));
    return padTop + plotHeight - ((clamped - minTemp) / (yAxisMax - minTemp)) * plotHeight;
  };

  // Build temperature line points
  // Points: [ (0, tInnerWall), (x1, tOut1), (x2, tOut2), ... ]
  const points: Array<{ x: number; y: number; tempC: number; label: string; xMm: number }> = [];

  // Internal wall point (x=0)
  points.push({
    x: scaleX(0),
    y: scaleY(tInnerWall),
    tempC: tInnerWall,
    label: `${Math.round(tInnerWall)} °C`,
    xMm: 0,
  });

  // Interface points
  layerCoordinates.forEach((lyr) => {
    points.push({
      x: scaleX(lyr.endMm),
      y: scaleY(lyr.tOuterC),
      tempC: lyr.tOuterC,
      label: `${Math.round(lyr.tOuterC)} °C`,
      xMm: lyr.endMm,
    });
  });

  // Polyline points string
  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Export diagram to PNG
  const handleDownloadPNG = () => {
    const svgEl = chartContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = svgWidth * 2;
    canvas.height = svgHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Draw background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `Stationary_Heat_Transition_Profile_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  return (
    <div
      ref={chartContainerRef}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                {lang === 'id'
                  ? 'Diagram Gradien Suhu Dinding Multilapis'
                  : 'Wall Temperature Profile Diagram'}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  ASTM C680 / VDI-Wärmeatlas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'id'
                  ? 'Format Standar Laporan Vendor Refraktori & Isolasi Termal (Stationary Heat Transition)'
                  : 'Refractory & Industrial Insulation Standard Vendor Format (Stationary Heat Transition)'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shadow-xs"
            title="Download PNG Image of Graph"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'id' ? 'Unduh Grafik (PNG)' : 'Save Chart'}</span>
          </button>
        </div>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="relative w-full bg-slate-950/80 rounded-xl border border-slate-800 p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[460px] min-w-[620px] select-none font-sans"
        >
          {/* Background Grid */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotWidth}
            height={plotHeight}
            fill="#06090e"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Horizontal Temperature Gridlines */}
          {yTicks.map((temp) => {
            const y = scaleY(temp);
            return (
              <g key={temp}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {temp.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Y-Axis Label */}
          <text
            x={18}
            y={padTop - 12}
            fill="#94a3b8"
            fontSize="11"
            fontWeight="bold"
            textAnchor="start"
          >
            °C
          </text>

          {/* 1. LAYER BLOCKS (Colored vertical bands) */}
          {layerCoordinates.map((lyr) => {
            const x1 = scaleX(lyr.startMm);
            const x2 = scaleX(lyr.endMm);
            const blockWidth = Math.max(1, x2 - x1);
            const isHovered = hoveredLayerIndex === lyr.index;

            return (
              <g
                key={lyr.index}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredLayerIndex(lyr.index)}
                onMouseLeave={() => setHoveredLayerIndex(null)}
              >
                {/* Colored Column */}
                <rect
                  x={x1}
                  y={padTop}
                  width={blockWidth}
                  height={plotHeight}
                  fill={lyr.palette.bg}
                  stroke={lyr.palette.border}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={isHovered ? 1 : 0.88}
                />

                {/* Vertical Text Label for Layer Name and Thickness */}
                {blockWidth > 24 ? (
                  <g
                    transform={`translate(${x1 + blockWidth / 2}, ${
                      padTop + plotHeight / 2
                    }) rotate(-90)`}
                  >
                    <text
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={blockWidth < 45 ? 9 : 11}
                      fontWeight="bold"
                      style={{
                        letterSpacing: '0.5px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      }}
                    >
                      {lyr.thicknessMm} mm {lyr.name}
                    </text>
                  </g>
                ) : (
                  /* If layer is too thin, show vertical tiny label */
                  <g
                    transform={`translate(${x1 + blockWidth / 2}, ${
                      padTop + plotHeight / 2
                    }) rotate(-90)`}
                  >
                    <text
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={8}
                      fontWeight="bold"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                    >
                      {lyr.thicknessMm}mm
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. TEMPERATURE PROFILE LINE */}
          {/* Fluid to Internal Wall Drop line (Film Resistance) */}
          <line
            x1={padLeft - 20}
            y1={scaleY(tFluid)}
            x2={scaleX(0)}
            y2={scaleY(tInnerWall)}
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />

          {/* Main Conduction Profile Polyline */}
          <polyline
            points={polylineStr}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.8))' }}
          />

          {/* External Wall to Ambient drop line */}
          <line
            x1={scaleX(totalThicknessMm)}
            y1={scaleY(tOuterWall)}
            x2={scaleX(totalThicknessMm) + 25}
            y2={scaleY(tAmb)}
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />

          {/* 3. INTERFACE CALLOUT BOXES & MARKERS */}
          {points.map((p, idx) => {
            // Alternating vertical offset to avoid overlap if points are close
            const isFirst = idx === 0;
            const isLast = idx === points.length - 1;
            const boxW = 58;
            const boxH = 22;

            // Positioning of callout box
            let boxX = p.x - boxW / 2;
            if (isFirst) boxX = Math.max(padLeft + 4, p.x + 8);
            if (isLast) boxX = Math.min(padLeft + plotWidth - boxW - 4, p.x + 8);

            const boxY = Math.max(padTop + 4, p.y - 12);

            return (
              <g key={idx}>
                {/* Pointer line */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={boxX + (isFirst || isLast ? 0 : boxW / 2)}
                  y2={boxY + boxH / 2}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  opacity="0.8"
                />

                {/* Circle Marker on the line */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Tag Box (Matches vendor style: 1020 °C, 775 °C, etc.) */}
                <rect
                  x={boxX}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx="3"
                  ry="3"
                  fill="#090d16"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  opacity="0.95"
                />
                <text
                  x={boxX + boxW / 2}
                  y={boxY + 14.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {p.label}
                </text>
              </g>
            );
          })}

          {/* 4. X-AXIS TICKS & LABELS (Wall thickness [mm]) */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={padLeft + plotWidth}
            y2={padTop + plotHeight}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Thickness Ticks at Each Boundary */}
          <g>
            {/* 0 mm tick */}
            <line
              x1={scaleX(0)}
              y1={padTop + plotHeight}
              x2={scaleX(0)}
              y2={padTop + plotHeight + 6}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <text
              x={scaleX(0)}
              y={padTop + plotHeight + 18}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="10"
              fontFamily="monospace"
            >
              0
            </text>

            {layerCoordinates.map((lyr) => {
              const x = scaleX(lyr.endMm);
              return (
                <g key={lyr.index}>
                  <line
                    x1={x}
                    y1={padTop + plotHeight}
                    x2={x}
                    y2={padTop + plotHeight + 6}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={padTop + plotHeight + 18}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {Math.round(lyr.endMm)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* X-Axis Title */}
          <text
            x={padLeft + plotWidth / 2}
            y={padTop + plotHeight + 35}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="bold"
          >
            Wall thickness [mm]
          </text>

          {/* 5. TOP & BOTTOM VENDOR LABELS */}
          {/* Top Left: Internal Temperature */}
          <text
            x={padLeft + 10}
            y={padTop - 12}
            fill="#ef4444"
            fontSize="11"
            fontWeight="bold"
          >
            {tFluid} °C internal temperature
          </text>

          {/* Bottom Left: External Heat Loss */}
          <text
            x={padLeft}
            y={padTop + plotHeight + 60}
            fill="#f59e0b"
            fontSize="11"
            fontWeight="bold"
          >
            Heat loss external: {Math.round(results.heatFluxWm2)} Watt/m²
          </text>

          {/* Bottom Right: Ambient Temperature */}
          <text
            x={padLeft + plotWidth}
            y={padTop + plotHeight + 60}
            textAnchor="end"
            fill="#38bdf8"
            fontSize="11"
            fontWeight="bold"
          >
            {tAmb} °C ambient temperature
          </text>
        </svg>
      </div>

      {/* 6. DETAILED MATERIAL & HEAT TRANSITION TABLE (Identical to Vendor Report) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            {lang === 'id'
              ? 'Tabel Transisi Termal Stasioner Lapisan Dinding'
              : 'Stationary Heat Transition Layer Table'}
          </span>
          <span className="text-[11px] text-slate-500">
            Total Thickness = <strong>{totalThicknessMm} mm</strong> | Heat Loss ={' '}
            <strong className="text-amber-400">{Math.round(results.heatFluxWm2)} W/m²</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-3 py-2">Row / Posisi</th>
                <th className="px-3 py-2">Material</th>
                <th className="px-3 py-2 text-right">Tebal [mm]</th>
                <th className="px-3 py-2 text-center">Suhu Antarmuka [°C]</th>
                <th className="px-3 py-2 text-right">k [W/m·K]</th>
                <th className="px-3 py-2 text-right">R [m²·K/W]</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {/* Internal Fluid to Inner Wall */}
              <tr className="bg-slate-950/40 text-slate-400 text-[11px]">
                <td className="px-3 py-1.5 italic">Internal Gas Film</td>
                <td className="px-3 py-1.5">Konveksi Internal Fluida (h_in: {results.internalConvectionHi} W/m²·K)</td>
                <td className="px-3 py-1.5 text-right">-</td>
                <td className="px-3 py-1.5 text-center font-mono">
                  {tFluid}°C → <strong className="text-red-400">{Math.round(tInnerWall)}°C</strong>
                </td>
                <td className="px-3 py-1.5 text-right">-</td>
                <td className="px-3 py-1.5 text-right font-mono">
                  {(1 / Math.max(1, results.internalConvectionHi)).toFixed(4)}
                </td>
                <td className="px-3 py-1.5 text-center text-emerald-400 font-semibold">OK</td>
              </tr>

              {/* Each Solid Wall Layer */}
              {layerCoordinates.map((lyr, idx) => {
                const isHovered = hoveredLayerIndex === lyr.index;
                return (
                  <tr
                    key={idx}
                    onMouseEnter={() => setHoveredLayerIndex(lyr.index)}
                    onMouseLeave={() => setHoveredLayerIndex(null)}
                    className={`transition-colors ${
                      isHovered ? 'bg-slate-800/80' : idx % 2 === 0 ? 'bg-slate-900/30' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-medium flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: lyr.palette.border }}
                      ></span>
                      <span className="text-slate-300">
                        {lyr.position === 'inside'
                          ? 'Refractory'
                          : lyr.position === 'duct_wall'
                          ? 'Shell Plat'
                          : 'Insulasi Luar'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-white">
                      {lyr.name}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-amber-300">
                      {lyr.thicknessMm}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-slate-200">
                      {Math.round(lyr.tInnerC)}°C →{' '}
                      <strong className="text-amber-300">{Math.round(lyr.tOuterC)}°C</strong>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">
                      {/* Thermal conductivity derived from layer resistance and thickness */}
                      {lyr.thicknessMm > 0 && lyr.rValue > 0
                        ? (lyr.thicknessMm / 1000 / (lyr.rValue * Math.max(0.1, results.surfaceAreaM2))).toFixed(3)
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">
                      {lyr.rValue.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {lyr.isOverheating ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                          Overheat
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Outer Surface to Ambient Film */}
              <tr className="bg-slate-950/40 text-slate-400 text-[11px]">
                <td className="px-3 py-1.5 italic">External Film</td>
                <td className="px-3 py-1.5">
                  Konveksi Luar + Radiasi (h_o: {results.externalConvectionHo} W/m²·K)
                </td>
                <td className="px-3 py-1.5 text-right">-</td>
                <td className="px-3 py-1.5 text-center font-mono">
                  <strong className="text-amber-400">{Math.round(tOuterWall)}°C</strong> →{' '}
                  <span className="text-sky-400">{tAmb}°C</span>
                </td>
                <td className="px-3 py-1.5 text-right">-</td>
                <td className="px-3 py-1.5 text-right font-mono">
                  {(1 / Math.max(1, results.externalConvectionHo + results.radiationHr)).toFixed(4)}
                </td>
                <td className="px-3 py-1.5 text-center text-emerald-400 font-semibold">OK</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineering notes from standard */}
      <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl flex items-start gap-2 text-xs text-blue-300/90">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'id'
            ? 'Perhitungan transisi panas stasioner mengacu pada ASTM C680 formula perpindahan panas stasioner satu dimensi. Suhu antarmuka (interface temperatures) dan fluks panas dihitung secara simultan mempertimbangkan konduksi dinding multilapis, tahanan film fluida dalam (VDI-Wärmeatlas), serta konveksi alami/paksa dan radiasi permukaan luar.'
            : 'Stationary heat transition calculation complies with ASTM C680 one-dimensional steady-state heat transfer. Interface temperatures and external heat loss flux are solved simultaneously across multilayer wall conduction, inner fluid boundary layer (VDI-Wärmeatlas), and external natural/forced convection and radiation.'}
        </p>
      </div>
    </div>
  );
};
