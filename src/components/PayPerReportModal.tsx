import React, { useState } from 'react';
import {
  Shield,
  Building,
  CheckCircle2,
  Sparkles,
  Download,
  X,
  FileText,
  User,
  Check,
} from 'lucide-react';
import { CalculationInputs, CalculationResults, DuctMaterial, ReportMetadata } from '../types';
import { Language, UnitSystem, translations } from '../utils/translations';
import { exportCalculationToPDF } from '../utils/pdfExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inputs: CalculationInputs;
  results: CalculationResults;
  ductMaterial: DuctMaterial;
  canvasElement?: HTMLCanvasElement | null;
  lang?: Language;
  unitSystem?: UnitSystem;
}

export const PayPerReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inputs,
  results,
  ductMaterial,
  canvasElement,
  lang = 'id',
}) => {
  // Report metadata form
  const [projectName, setProjectName] = useState<string>(
    inputs.shape === 'kiln'
      ? 'Rotary Kiln Refractory & Shell Audit'
      : inputs.shape === 'rectangular'
      ? 'Exhaust Ducting Energy Conservation'
      : 'Steam & Flue Gas Thermal Insulation Design'
  );
  const [clientName, setClientName] = useState<string>('PT Industri Nasional / Plant Operations');
  const [engineerName, setEngineerName] = useState<string>('Ir. Specialist Thermal, ST, IPM');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const t = translations[lang];

  if (!isOpen) return null;

  // Handle Exporting Official Certified PDF (100% Free Full Access)
  const handleExportOfficial = () => {
    setIsGenerating(true);

    const metadata: ReportMetadata = {
      projectName: projectName.trim() || 'Proyek Desain Termal Industri',
      clientName: clientName.trim() || 'Fasilitas Operasional',
      engineerName: engineerName.trim() || 'Certified Lead Engineer',
      reportNumber: `CERT-TD-${Date.now().toString().slice(-6)}`,
      dateStr: new Date().toLocaleString(lang === 'id' ? 'id-ID' : 'en-US'),
      isCertified: true,
    };

    setTimeout(() => {
      exportCalculationToPDF(inputs, results, ductMaterial, canvasElement, metadata);
      setIsGenerating(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {lang === 'id'
                    ? 'Ekspor Laporan Rekayasa Resmi (PDF)'
                    : 'Export Official Engineering Report (PDF)'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {lang === 'id' ? '100% Gratis • Akses Penuh' : '100% Free • Full Access'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'id'
                  ? 'Standar ASTM C1055, ASME B31.3 & SMACNA • Stempel Rekayasa & Bebas Watermark'
                  : 'ASTM C1055, ASME B31.3 & SMACNA Compliance • Official Stamp & Watermark-Free'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Free access promotion banner */}
          <div className="flex items-center gap-3 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">
                {lang === 'id'
                  ? 'Akses Penuh Laporan Resmi Tanpa Batas!'
                  : 'Unlimited Full Access Official Reports!'}
              </span>
              <p className="text-emerald-300/80 text-[11px] mt-0.5">
                {lang === 'id'
                  ? 'Seluruh dokumen teknis, kalkulasi heat loss, dan visualisasi kanvas dapat diunduh gratis tanpa biaya dan siap diserahkan ke klien/manajemen.'
                  : 'All technical documents, heat loss calculations, and canvas diagrams are free to download without any payment barrier.'}
              </p>
            </div>
          </div>

          {/* Custom Metadata Inputs */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              {lang === 'id' ? 'Informasi Proyek & Klien (Akan Dicetak di Header PDF)' : 'Project & Client Details (Printed in PDF Header)'}
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'id' ? 'Nama Proyek / Unit Saluran' : 'Project / Ducting Unit Name'}</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  placeholder="e.g. Overhaul Flue Gas Ducting Unit 3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lang === 'id' ? 'Nama Klien / Pabrik' : 'Client / Plant Name'}</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. PT Industri Semen Nusantara"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lang === 'id' ? 'Lead Auditor / Engineer' : 'Lead Auditor / Engineer'}</span>
                  </label>
                  <input
                    type="text"
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. Ir. Budi Santoso, ST, IPM"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Included Features Checklist */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <h5 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'id' ? 'Fitur Laporan Rekayasa Yang Disertakan:' : 'Engineering Report Content Included:'}</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Stempel Lisensi Resmi "THERMODUCT CERTIFIED"</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Bebas dari watermark (Clean & High-Res)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Diagram 2D Cross-Section & Dimensi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Distribusi Suhu Multi-Lapisan Dinding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Standar Kepatuhan ASTM C1055 & ASME B31.3</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Kolom Tanda Tangan Pengesahan Auditor</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              {lang === 'id' ? 'Batal' : 'Cancel'}
            </button>

            <button
              type="button"
              id="confirm-export-pdf-btn"
              onClick={handleExportOfficial}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGenerating
                  ? lang === 'id'
                    ? 'Sedang Mencetak PDF...'
                    : 'Generating PDF...'
                  : lang === 'id'
                  ? 'Unduh Laporan Resmi (PDF Gratis)'
                  : 'Download Official Report (Free PDF)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
