import React, { useState } from 'react';
import { DuctMaterial, InsulationMaterial } from '../types';
import { X, Plus, ShieldCheck, Flame, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveDuctMaterial: (material: DuctMaterial) => void;
  onSaveInsulationMaterial: (material: InsulationMaterial) => void;
}

export const MaterialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveDuctMaterial,
  onSaveInsulationMaterial,
}) => {
  const [materialKind, setMaterialKind] = useState<'insulation' | 'ducting'>('insulation');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Insulation form state
  const [insName, setInsName] = useState('');
  const [insCategory, setInsCategory] = useState<InsulationMaterial['category']>('blanket');
  const [insConductivity, setInsConductivity] = useState<number>(0.045);
  const [insMaxTemp, setInsMaxTemp] = useState<number>(800);
  const [insDensity, setInsDensity] = useState<number>(128);
  const [insIsRefractory, setInsIsRefractory] = useState<boolean>(false);
  const [insDescription, setInsDescription] = useState('');

  // Duct form state
  const [ductName, setDuctName] = useState('');
  const [ductCategory, setDuctCategory] = useState<DuctMaterial['category']>('mild_steel');
  const [ductConductivity, setDuctConductivity] = useState<number>(50);
  const [ductMaxTemp, setDuctMaxTemp] = useState<number>(450);
  const [ductStress, setDuctStress] = useState<number>(120);
  const [ductDensity, setDuctDensity] = useState<number>(7850);
  const [ductDescription, setDuctDescription] = useState('');

  if (!isOpen) return null;

  const handleSaveInsulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insName.trim()) return;

    const newMaterial: InsulationMaterial = {
      id: `custom-ins-${Date.now()}`,
      name: insName.trim(),
      category: insCategory,
      thermalConductivity: Math.max(0.005, insConductivity),
      maxServiceTempC: Math.max(50, insMaxTemp),
      densityKgM3: Math.max(10, insDensity),
      isRefractory: insIsRefractory,
      description: insDescription.trim() || 'Material isolator kustom ditambahkan pengguna.',
      isCustom: true,
    };

    onSaveInsulationMaterial(newMaterial);
    setSuccessMessage(`Material isolator "${insName}" berhasil disimpan ke Master Data!`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1200);
  };

  const handleSaveDuct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ductName.trim()) return;

    const newMaterial: DuctMaterial = {
      id: `custom-duct-${Date.now()}`,
      name: ductName.trim(),
      category: ductCategory,
      thermalConductivity: Math.max(0.5, ductConductivity),
      maxServiceTempC: Math.max(100, ductMaxTemp),
      allowableStressMpa: Math.max(10, ductStress),
      densityKgM3: Math.max(1000, ductDensity),
      description: ductDescription.trim() || 'Material plat ducting/shell kustom ditambahkan pengguna.',
      isCustom: true,
    };

    onSaveDuctMaterial(newMaterial);
    setSuccessMessage(`Material ducting "${ductName}" berhasil disimpan ke Master Data!`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Tambah Material ke Master Data</h2>
              <p className="text-xs text-slate-400">
                Perkaya database material isolasi panas atau plat ducting/kiln
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

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setMaterialKind('insulation')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              materialKind === 'insulation'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            Material Isolator / Refraktori
          </button>

          <button
            type="button"
            onClick={() => setMaterialKind('ducting')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              materialKind === 'ducting'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Material Ducting / Shell Logam
          </button>
        </div>

        {successMessage && (
          <div className="m-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {materialKind === 'insulation' ? (
            <form onSubmit={handleSaveInsulation} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nama Material Isolator *
                </label>
                <input
                  type="text"
                  required
                  value={insName}
                  onChange={(e) => setInsName(e.target.value)}
                  placeholder="Contoh: Ceramic Fiber Blanket Grade 1400, Aerogel Pyrogel XTE"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori Isolator</label>
                  <select
                    value={insCategory}
                    onChange={(e) => setInsCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="blanket">Blanket / Selimut Serat (Rockwool/Ceramic)</option>
                    <option value="board">Papan Kaku (Board / Slab)</option>
                    <option value="brick">Bata Tahan Api (Firebrick / IFB)</option>
                    <option value="castable">Semen Cor Refraktori (Castable)</option>
                    <option value="calcium_silicate">Calcium Silicate Block</option>
                    <option value="coating">Cat / Coating Keramik Insulatif</option>
                    <option value="aerogel">Aerogel Nanopori</option>
                    <option value="custom">Kategori Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Konduktivitas Termal k (W/m·K) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={insConductivity}
                    onChange={(e) => setInsConductivity(parseFloat(e.target.value) || 0.01)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="0.040"
                  />
                  <span className="text-[10px] text-slate-500">
                    Nilai k pada temperatur rata-rata desain (semakin kecil semakin isolatif)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Batas Temperatur Maksimal (°C) *
                  </label>
                  <input
                    type="number"
                    required
                    value={insMaxTemp}
                    onChange={(e) => setInsMaxTemp(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="1260"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Densitas (kg/m³)</label>
                  <input
                    type="number"
                    value={insDensity}
                    onChange={(e) => setInsDensity(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="128"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="chk-refractory"
                  checked={insIsRefractory}
                  onChange={(e) => setInsIsRefractory(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="chk-refractory" className="text-slate-300 cursor-pointer">
                  Material ini adalah <span className="font-semibold text-amber-400">Refraktori / Lining Dalam</span>{' '}
                  (Bata tahan api, castable, atau lining kiln internal)
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Keterangan / Catatan Teknis</label>
                <textarea
                  rows={2}
                  value={insDescription}
                  onChange={(e) => setInsDescription(e.target.value)}
                  placeholder="Merk, supplier, spesifikasi standar ASTM/SNI..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md transition-colors"
                >
                  Simpan Material Isolator
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveDuct} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nama Material Ducting / Shell *
                </label>
                <input
                  type="text"
                  required
                  value={ductName}
                  onChange={(e) => setDuctName(e.target.value)}
                  placeholder="Contoh: Alloy 800H, Weathering Steel ASTM A242, Titanium Gr. 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori Material</label>
                  <select
                    value={ductCategory}
                    onChange={(e) => setDuctCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="mild_steel">Baja Karbon Rendah (Mild Steel / Carbon Steel)</option>
                    <option value="stainless_steel">Baja Tahan Karat (Stainless Steel)</option>
                    <option value="heat_resistant">Baja Tahan Panas (Heat Resistant Alloy)</option>
                    <option value="alloy">Paduan Khusus / Nickel Alloy</option>
                    <option value="cast_iron">Besi Cor (Cast Iron)</option>
                    <option value="custom">Kategori Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Konduktivitas Termal k (W/m·K) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={ductConductivity}
                    onChange={(e) => setDuctConductivity(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="45.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Max Temp Operasi (°C) *
                  </label>
                  <input
                    type="number"
                    required
                    value={ductMaxTemp}
                    onChange={(e) => setDuctMaxTemp(parseInt(e.target.value) || 200)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="600"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Tegangan Izin (MPa) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={ductStress}
                    onChange={(e) => setDuctStress(parseFloat(e.target.value) || 50)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="120"
                  />
                  <span className="text-[10px] text-slate-500">Allowable stress ASME B31.3</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Densitas (kg/m³)</label>
                  <input
                    type="number"
                    value={ductDensity}
                    onChange={(e) => setDuctDensity(parseInt(e.target.value) || 7850)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="7850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Keterangan / Standar Material</label>
                <textarea
                  rows={2}
                  value={ductDescription}
                  onChange={(e) => setDuctDescription(e.target.value)}
                  placeholder="Standar pabrik, plat boiler grade, batas korosi..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md transition-colors"
                >
                  Simpan Material Ducting
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
