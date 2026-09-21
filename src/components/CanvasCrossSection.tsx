import React, { useEffect, useRef, useState } from 'react';
import { CalculationInputs, CalculationResults, DuctMaterial, InsulationMaterial } from '../types';
import { Layers, Eye, Camera, Flame } from 'lucide-react';

interface Props {
  inputs: CalculationInputs;
  results: CalculationResults;
  ductMaterials: DuctMaterial[];
  insulationMaterials: InsulationMaterial[];
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const CanvasCrossSection: React.FC<Props> = ({
  inputs,
  results,
  ductMaterials,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'cross' | 'side'>('cross');
  const [showThermalGradient, setShowThermalGradient] = useState<boolean>(true);

  const ductMat = ductMaterials.find((m) => m.id === inputs.ductMaterialId) || ductMaterials[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // Set high DPI resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 600;
    const height = rect.height || 420;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (activeTab === 'cross') {
      drawCrossSection(ctx, width, height);
    } else {
      drawSideView(ctx, width, height);
    }
  }, [inputs, results, activeTab, showThermalGradient]);

  // Download snapshot
  const downloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `thermoduct-${activeTab}-view-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const drawCrossSection = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const isCylinder = inputs.shape === 'cylindrical' || inputs.shape === 'kiln';

    // Calculate maximum dimension for autoscaling
    let totalMaxDimensionMm = 0;
    const hasInsulation = inputs.hasInsulation !== false;
    const innerDim = isCylinder ? inputs.innerDiameterMm : Math.max(inputs.widthMm, inputs.heightMm);
    const totalInsideIns = hasInsulation
      ? inputs.layers
          .filter((l) => l.position === 'inside')
          .reduce((sum, l) => sum + l.thicknessMm, 0)
      : 0;
    const totalOutsideIns = hasInsulation
      ? inputs.layers
          .filter((l) => l.position === 'outside')
          .reduce((sum, l) => sum + l.thicknessMm, 0)
      : 0;

    totalMaxDimensionMm = innerDim + 2 * (totalInsideIns + inputs.ductThicknessMm + totalOutsideIns);
    const maxRadiusMm = totalMaxDimensionMm / 2;

    const maxCanvasRadius = Math.min(width, height) * 0.38;
    const scale = maxCanvasRadius / Math.max(50, maxRadiusMm);

    // Background technical grid
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 20; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 20; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Centerlines
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, height - 20);
    ctx.moveTo(20, centerY);
    ctx.lineTo(width - 20, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isCylinder) {
      // 1. Draw outer insulation layers (from outside inward)
      let currentR_px = maxRadiusMm * scale;

      // Draw Outside Insulation (if insulated)
      const outsideLayers = hasInsulation
        ? inputs.layers.filter((l) => l.position === 'outside' && l.thicknessMm > 0)
        : [];

      for (let i = outsideLayers.length - 1; i >= 0; i--) {
        const lyr = outsideLayers[i];
        const thick_px = lyr.thicknessMm * scale;

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentR_px, 0, 2 * Math.PI);
        if (showThermalGradient) {
          const grad = ctx.createRadialGradient(centerX, centerY, currentR_px - thick_px, centerX, centerY, currentR_px);
          grad.addColorStop(0, '#f59e0b'); // amber
          grad.addColorStop(1, '#3b82f6'); // blue
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = '#64748b'; // slate
        }
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();

        // Cross-hatch insulation pattern
        drawRadialHatch(ctx, centerX, centerY, currentR_px - thick_px, currentR_px, '#475569');

        currentR_px -= thick_px;
      }

      // Draw Duct Shell
      const ductThick_px = Math.max(2, inputs.ductThicknessMm * scale);
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentR_px, 0, 2 * Math.PI);
      const steelGrad = ctx.createLinearGradient(centerX - currentR_px, centerY - currentR_px, centerX + currentR_px, centerY + currentR_px);
      steelGrad.addColorStop(0, '#cbd5e1');
      steelGrad.addColorStop(0.5, '#475569');
      steelGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = steelGrad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      currentR_px -= ductThick_px;

      // Draw Inside Refractory/Insulation (if insulated)
      const insideLayers = hasInsulation
        ? inputs.layers.filter((l) => l.position === 'inside' && l.thicknessMm > 0)
        : [];
      for (let i = insideLayers.length - 1; i >= 0; i--) {
        const lyr = insideLayers[i];
        const thick_px = lyr.thicknessMm * scale;

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentR_px, 0, 2 * Math.PI);
        if (showThermalGradient) {
          const grad = ctx.createRadialGradient(centerX, centerY, currentR_px - thick_px, centerX, centerY, currentR_px);
          grad.addColorStop(0, '#ef4444'); // red hot
          grad.addColorStop(1, '#f59e0b'); // amber
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = '#b45309'; // amber-700
        }
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#d97706';
        ctx.stroke();

        currentR_px -= thick_px;
      }

      // Draw Fluid Core
      const fluidR_px = Math.max(10, currentR_px);
      ctx.beginPath();
      ctx.arc(centerX, centerY, fluidR_px, 0, 2 * Math.PI);
      const fluidGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, fluidR_px);
      if (inputs.fluidTempC > 200) {
        fluidGrad.addColorStop(0, '#fef08a'); // bright yellow
        fluidGrad.addColorStop(0.6, '#f97316'); // orange
        fluidGrad.addColorStop(1, '#dc2626'); // red
      } else {
        fluidGrad.addColorStop(0, '#bae6fd');
        fluidGrad.addColorStop(1, '#0284c7');
      }
      ctx.fillStyle = fluidGrad;
      ctx.fill();

      // Fluid text label in core
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${inputs.fluidType.toUpperCase()}`, centerX, centerY - 8);
      ctx.font = '11px monospace';
      ctx.fillText(`${inputs.fluidTempC}°C | ${inputs.fluidVelocityMs} m/s`, centerX, centerY + 10);
    } else {
      // Rectangular Duct
      const wCore_px = inputs.widthMm * scale;
      const hCore_px = inputs.heightMm * scale;

      let curW_px = wCore_px + 2 * (totalInsideIns + inputs.ductThicknessMm + totalOutsideIns) * scale;
      let curH_px = hCore_px + 2 * (totalInsideIns + inputs.ductThicknessMm + totalOutsideIns) * scale;

      // Outside layers (if insulated)
      const outsideLayers = hasInsulation
        ? inputs.layers.filter((l) => l.position === 'outside' && l.thicknessMm > 0)
        : [];
      for (let i = outsideLayers.length - 1; i >= 0; i--) {
        const lyr = outsideLayers[i];
        const thick_px = lyr.thicknessMm * scale;

        ctx.fillStyle = showThermalGradient ? '#3b82f6' : '#64748b';
        ctx.fillRect(centerX - curW_px / 2, centerY - curH_px / 2, curW_px, curH_px);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(centerX - curW_px / 2, centerY - curH_px / 2, curW_px, curH_px);

        curW_px -= 2 * thick_px;
        curH_px -= 2 * thick_px;
      }

      // Duct Shell
      const ductThick_px = Math.max(2, inputs.ductThicknessMm * scale);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(centerX - curW_px / 2, centerY - curH_px / 2, curW_px, curH_px);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - curW_px / 2, centerY - curH_px / 2, curW_px, curH_px);

      curW_px -= 2 * ductThick_px;
      curH_px -= 2 * ductThick_px;

      // Inside layers (if insulated)
      const insideLayers = hasInsulation
        ? inputs.layers.filter((l) => l.position === 'inside' && l.thicknessMm > 0)
        : [];
      for (let i = insideLayers.length - 1; i >= 0; i--) {
        const lyr = insideLayers[i];
        const thick_px = lyr.thicknessMm * scale;

        ctx.fillStyle = '#d97706';
        ctx.fillRect(centerX - curW_px / 2, centerY - curH_px / 2, curW_px, curH_px);
        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(centerX - curW_px / 2, centerY - curH_px / 2, curW_px, curH_px);

        curW_px -= 2 * thick_px;
        curH_px -= 2 * thick_px;
      }

      // Fluid Core
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(centerX - curW_px / 2, centerY - curH_px / 2, curW_px, curH_px);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${inputs.fluidType.toUpperCase()}`, centerX, centerY - 6);
      ctx.font = '11px monospace';
      ctx.fillText(`${inputs.fluidTempC}°C`, centerX, centerY + 12);
    }

    // Overlay Dimension & Thermal Callouts
    drawCallouts(ctx, centerX, centerY, scale, width);
  };

  const drawRadialHatch = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rIn: number,
    rOut: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const numLines = 36;
    for (let i = 0; i < numLines; i++) {
      const angle = (i * 2 * Math.PI) / numLines;
      const x1 = cx + rIn * Math.cos(angle);
      const y1 = cy + rIn * Math.sin(angle);
      const x2 = cx + rOut * Math.cos(angle + 0.1);
      const y2 = cy + rOut * Math.sin(angle + 0.1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawSideView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerY = height / 2;
    const startX = 60;
    const ductLengthPx = width - 130;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Fluid arrow & direction
    const isCylinder = inputs.shape === 'cylindrical' || inputs.shape === 'kiln';
    const ductHeightPx = Math.min(180, Math.max(60, (isCylinder ? inputs.innerDiameterMm : inputs.heightMm) * 0.12));

    const hasInsulation = inputs.hasInsulation !== false;
    const totalInsulationThickMm = hasInsulation
      ? inputs.layers.reduce((sum, l) => sum + l.thicknessMm, 0)
      : 0;
    const insThickPx = hasInsulation ? Math.max(6, Math.min(35, totalInsulationThickMm * 0.12)) : 0;

    // Outer Insulation / Jacket (only if insulated)
    if (hasInsulation && insThickPx > 0) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(startX, centerY - ductHeightPx / 2 - insThickPx, ductLengthPx, ductHeightPx + 2 * insThickPx);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(startX, centerY - ductHeightPx / 2 - insThickPx, ductLengthPx, ductHeightPx + 2 * insThickPx);
    } else {
      // Bare duct indicator label
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ BARE DUCT / PIPA TELANJANG (TANPA ISOLASI)', startX + ductLengthPx / 2, centerY - ductHeightPx / 2 - 14);
    }

    // Duct Shell
    ctx.fillStyle = '#334155';
    ctx.fillRect(startX, centerY - ductHeightPx / 2, ductLengthPx, ductHeightPx);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(startX, centerY - ductHeightPx / 2, ductLengthPx, ductHeightPx);

    // Fluid Core
    const fluidGrad = ctx.createLinearGradient(startX, centerY, startX + ductLengthPx, centerY);
    fluidGrad.addColorStop(0, '#ef4444');
    fluidGrad.addColorStop(1, '#f97316');
    ctx.fillStyle = fluidGrad;
    ctx.fillRect(startX, centerY - ductHeightPx / 2 + 6, ductLengthPx, ductHeightPx - 12);

    // Heat loss arrows radiating outwards
    ctx.strokeStyle = '#f87171';
    ctx.fillStyle = '#f87171';
    ctx.lineWidth = 1.5;

    for (let x = startX + 40; x < startX + ductLengthPx - 30; x += 55) {
      // Top heat loss waves
      drawHeatWave(ctx, x, centerY - ductHeightPx / 2 - insThickPx, -1);
      // Bottom heat loss waves
      drawHeatWave(ctx, x, centerY + ductHeightPx / 2 + insThickPx, 1);
    }

    // Inlet Fluid Arrow
    drawFlowArrow(ctx, startX - 45, centerY, startX - 5, '#38bdf8', `${inputs.fluidVelocityMs} m/s`);

    // Outlet Arrow
    drawFlowArrow(ctx, startX + ductLengthPx + 5, centerY, startX + ductLengthPx + 45, '#fb923c', 'Flow');

    // Dimension labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Panjang L = ${inputs.lengthM} m`, startX + ductLengthPx / 2, centerY + ductHeightPx / 2 + insThickPx + 35);
    ctx.fillText(
      `Kehilangan Panas Total: ${(results.heatLossTotalW / 1000).toFixed(2)} kW | Flux: ${results.heatFluxWm2} W/m²`,
      startX + ductLengthPx / 2,
      25
    );
  };

  const drawHeatWave = (ctx: CanvasRenderingContext2D, x: number, y: number, direction: 1 | -1) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 4, y + 10 * direction, x - 4, y + 20 * direction, x, y + 28 * direction);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x, y + 30 * direction);
    ctx.lineTo(x - 3, y + 24 * direction);
    ctx.lineTo(x + 3, y + 24 * direction);
    ctx.closePath();
    ctx.fill();
  };

  const drawFlowArrow = (ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, color: string, label: string) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 8, y - 5);
    ctx.lineTo(x2 - 8, y + 5);
    ctx.closePath();
    ctx.fill();

    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y - 8);
  };

  const drawCallouts = (ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, width: number) => {
    // Top-left KPI badge on canvas
    const hasInsulation = inputs.hasInsulation !== false;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(10, 10, 220, 95);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 220, 95);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STATUS SUHU PERMUKAAN', 18, 24);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle =
      results.personnelProtectionStatus === 'safe'
        ? '#4ade80'
        : results.personnelProtectionStatus === 'warning'
        ? '#fbbf24'
        : '#f87171';
    ctx.fillText(`T_out: ${results.outerSurfaceTempC}°C`, 18, 44);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = hasInsulation ? '#38bdf8' : '#fb923c';
    ctx.fillText(hasInsulation ? `Sistem: Terisolasi (${inputs.layers.length} Lapis)` : `Sistem: Bare Duct (Tanpa Isolasi)`, 18, 59);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Heat Loss: ${(results.heatLossTotalW / 1000).toFixed(2)} kW`, 18, 74);
    ctx.fillText(`Heat Flux: ${results.heatFluxWm2} W/m²`, 18, 89);

    // Right side layer temperature markers
    const rightX = width - 150;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(rightX - 10, 10, 150, 25 + results.layerResults.length * 18);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(rightX - 10, 10, 150, 25 + results.layerResults.length * 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('TEMPERATUR LAPISAN', rightX, 25);

    results.layerResults.forEach((lyr, idx) => {
      ctx.font = '10px monospace';
      ctx.fillStyle = lyr.isOverheating ? '#ef4444' : '#38bdf8';
      const label = lyr.position === 'duct_wall' ? 'Plat Baja' : lyr.name.slice(0, 12);
      ctx.fillText(`${label}: ${lyr.tOuterC.toFixed(0)}°C`, rightX, 42 + idx * 18);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-cross-section"
            onClick={() => setActiveTab('cross')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'cross'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tampak Melintang (Cross-Section)
          </button>
          <button
            type="button"
            id="tab-side-view"
            onClick={() => setActiveTab('side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'side'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Tampak Samping (Profil Panjang)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'cross' && (
            <button
              type="button"
              id="toggle-thermal-gradient"
              onClick={() => setShowThermalGradient(!showThermalGradient)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                showThermalGradient
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
              title="Aktifkan/nonaktifkan gradasi kontur termal"
            >
              <Flame className="w-3.5 h-3.5" />
              Kontur Termal {showThermalGradient ? 'ON' : 'OFF'}
            </button>
          )}

          <button
            type="button"
            id="btn-download-canvas"
            onClick={downloadSnapshot}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Download gambar canvas format PNG"
          >
            <Camera className="w-3.5 h-3.5" />
            Simpan PNG
          </button>
        </div>
      </div>

      {/* Canvas viewport */}
      <div className="relative w-full h-[380px] bg-slate-900 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg cursor-crosshair"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Footer dimension details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400">
        <div>
          <span className="text-slate-500">Material Shell:</span>{' '}
          <span className="text-slate-200 font-medium">{ductMat.name.split('(')[0]}</span>
        </div>
        <div>
          <span className="text-slate-500">Tebal Plat Shell:</span>{' '}
          <span className="text-slate-200 font-medium">{inputs.ductThicknessMm} mm</span>
        </div>
        <div>
          <span className="text-slate-500">Total Tebal Isolasi:</span>{' '}
          <span className="text-slate-200 font-medium">
            {inputs.layers.reduce((sum, l) => sum + l.thicknessMm, 0)} mm
          </span>
        </div>
        <div>
          <span className="text-slate-500">Korelasi Aliran:</span>{' '}
          <span className="text-slate-200 font-medium">
            {results.flowType} (Re = {results.reynoldsNumber.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
};
