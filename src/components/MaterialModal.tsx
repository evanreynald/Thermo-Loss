import React, { useState } from 'react';
import { DuctMaterial, InsulationMaterial } from '../types';
import { Language } from '../utils/translations';
import { X, Plus, ShieldCheck, Flame, Check, Trash2 } from 'lucide-react';

interface Props {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  ductMaterials: DuctMaterial[];
  insulationMaterials: InsulationMaterial[];
  onSaveDuctMaterial: (material: DuctMaterial) => void;
  onSaveInsulationMaterial: (material: InsulationMaterial) => void;
  onDeleteDuctMaterial: (materialId: string) => void;
  onDeleteInsulationMaterial: (materialId: string) => void;
}

export const MaterialModal: React.FC<Props> = ({
  lang,
  isOpen,
  onClose,
  ductMaterials,
  insulationMaterials,
  onSaveDuctMaterial,
  onSaveInsulationMaterial,
  onDeleteDuctMaterial,
  onDeleteInsulationMaterial,
}) => {
  const tr = (id: string, en: string) => (lang === 'id' ? id : en);

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

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const customInsulationMaterials = insulationMaterials.filter((m) => m.isCustom);
  const customDuctMaterials = ductMaterials.filter((m) => m.isCustom);

  const handleDeleteClick = (materialId: string, kind: 'insulation' | 'ducting') => {
    if (pendingDeleteId !== materialId) {
      setPendingDeleteId(materialId);
      return;
    }
    if (kind === 'insulation') {
      onDeleteInsulationMaterial(materialId);
    } else {
      onDeleteDuctMaterial(materialId);
    }
    setPendingDeleteId(null);
  };

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
      description: insDescription.trim() || tr('Material isolator kustom ditambahkan pengguna.', 'Custom insulation material added by user.'),
      isCustom: true,
    };

    onSaveInsulationMaterial(newMaterial);
    setSuccessMessage(tr(`Material isolator "${insName}" berhasil disimpan ke Master Data!`, `Insulation material "${insName}" saved to Master Data!`));
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
      description: ductDescription.trim() || tr('Material plat ducting/shell kustom ditambahkan pengguna.', 'Custom ducting/shell plate material added by user.'),
      isCustom: true,
    };

    onSaveDuctMaterial(newMaterial);
    setSuccessMessage(tr(`Material ducting "${ductName}" berhasil disimpan ke Master Data!`, `Ducting material "${ductName}" saved to Master Data!`));
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
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{tr('Tambah Material ke Master Data', 'Add Material to Master Data')}</h2>
              <p className="text-xs text-slate-400">
                {tr('Perkaya database material isolasi panas atau plat ducting/kiln', 'Enrich the thermal insulation or ducting/kiln plate material database')}
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
            onClick={() => {
              setMaterialKind('insulation');
              setPendingDeleteId(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              materialKind === 'insulation'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            {tr('Material Isolator / Refraktori', 'Insulation / Refractory Material')}
          </button>

          <button
            type="button"
            onClick={() => {
              setMaterialKind('ducting');
              setPendingDeleteId(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              materialKind === 'ducting'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {tr('Material Ducting / Shell Logam', 'Ducting / Metal Shell Material')}
          </button>
        </div>

        {successMessage && (
          <div className="m-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Existing Custom Materials List */}
        {(materialKind === 'insulation' ? customInsulationMaterials : customDuctMaterials).length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
            <p className="text-slate-400 font-medium mb-1.5">
              {tr('Material Kustom Tersimpan', 'Saved Custom Materials')} ({materialKind === 'insulation' ? customInsulationMaterials.length : customDuctMaterials.length})
            </p>
            {(materialKind === 'insulation' ? customInsulationMaterials : customDuctMaterials).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg"
              >
                <span className="text-slate-200 truncate">{m.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(m.id, materialKind)}
                  className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    pendingDeleteId === m.id
                      ? 'bg-red-600 text-white'
                      : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                  title={pendingDeleteId === m.id ? tr('Klik lagi untuk konfirmasi', 'Click again to confirm') : tr('Hapus material ini', 'Delete this material')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {pendingDeleteId === m.id ? tr('Yakin?', 'Sure?') : ''}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {materialKind === 'insulation' ? (
            <form onSubmit={handleSaveInsulation} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {tr('Nama Material Isolator *', 'Insulation Material Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={insName}
                  onChange={(e) => setInsName(e.target.value)}
                  placeholder={tr('Contoh: Ceramic Fiber Blanket Grade 1400, Aerogel Pyrogel XTE', 'e.g. Ceramic Fiber Blanket Grade 1400, Aerogel Pyrogel XTE')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{tr('Kategori Isolator', 'Insulator Category')}</label>
                  <select
                    value={insCategory}
                    onChange={(e) => setInsCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="blanket">{tr('Blanket / Selimut Serat (Rockwool/Ceramic)', 'Blanket / Fiber Wrap (Rockwool/Ceramic)')}</option>
                    <option value="board">{tr('Papan Kaku (Board / Slab)', 'Rigid Board (Board / Slab)')}</option>
                    <option value="brick">{tr('Bata Tahan Api (Firebrick / IFB)', 'Firebrick (Firebrick / IFB)')}</option>
                    <option value="castable">{tr('Semen Cor Refraktori (Castable)', 'Refractory Castable')}</option>
                    <option value="calcium_silicate">Calcium Silicate Block</option>
                    <option value="coating">{tr('Cat / Coating Keramik Insulatif', 'Insulating Ceramic Paint / Coating')}</option>
                    <option value="aerogel">{tr('Aerogel Nanopori', 'Nanoporous Aerogel')}</option>
                    <option value="custom">{tr('Kategori Lainnya', 'Other Category')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {tr('Konduktivitas Termal k (W/m·K) *', 'Thermal Conductivity k (W/m·K) *')}
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
                    {tr('Nilai k pada temperatur rata-rata desain (semakin kecil semakin isolatif)', 'k value at mean design temperature (lower means more insulative)')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {tr('Batas Temperatur Maksimal (°C) *', 'Maximum Temperature Limit (°C) *')}
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
                  <label className="block text-slate-300 font-medium mb-1">{tr('Densitas (kg/m³)', 'Density (kg/m³)')}</label>
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
                  {tr('Material ini adalah', 'This material is a')} <span className="font-semibold text-amber-400">{tr('Refraktori / Lining Dalam', 'Refractory / Inner Lining')}</span>{' '}
                  {tr('(Bata tahan api, castable, atau lining kiln internal)', '(Firebrick, castable, or internal kiln lining)')}
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{tr('Keterangan / Catatan Teknis', 'Description / Technical Notes')}</label>
                <textarea
                  rows={2}
                  value={insDescription}
                  onChange={(e) => setInsDescription(e.target.value)}
                  placeholder={tr('Merk, supplier, spesifikasi standar ASTM/SNI...', 'Brand, supplier, ASTM/SNI standard specification...')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md transition-colors"
                >
                  {tr('Simpan Material Isolator', 'Save Insulation Material')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveDuct} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {tr('Nama Material Ducting / Shell *', 'Ducting / Shell Material Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={ductName}
                  onChange={(e) => setDuctName(e.target.value)}
                  placeholder={tr('Contoh: Alloy 800H, Weathering Steel ASTM A242, Titanium Gr. 2', 'e.g. Alloy 800H, Weathering Steel ASTM A242, Titanium Gr. 2')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{tr('Kategori Material', 'Material Category')}</label>
                  <select
                    value={ductCategory}
                    onChange={(e) => setDuctCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="mild_steel">{tr('Baja Karbon Rendah (Mild Steel / Carbon Steel)', 'Low Carbon Steel (Mild Steel / Carbon Steel)')}</option>
                    <option value="stainless_steel">{tr('Baja Tahan Karat (Stainless Steel)', 'Stainless Steel')}</option>
                    <option value="heat_resistant">{tr('Baja Tahan Panas (Heat Resistant Alloy)', 'Heat Resistant Steel (Heat Resistant Alloy)')}</option>
                    <option value="alloy">{tr('Paduan Khusus / Nickel Alloy', 'Special Alloy / Nickel Alloy')}</option>
                    <option value="cast_iron">{tr('Besi Cor (Cast Iron)', 'Cast Iron')}</option>
                    <option value="custom">{tr('Kategori Lainnya', 'Other Category')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {tr('Konduktivitas Termal k (W/m·K) *', 'Thermal Conductivity k (W/m·K) *')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={ductConductivity}
                    onChange={(e) => setDuctConductivity(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    placeholder="45.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {tr('Max Temp Operasi (°C) *', 'Max Operating Temp (°C) *')}
                  </label>
                  <input
                    type="number"
                    required
                    value={ductMaxTemp}
                    onChange={(e) => setDuctMaxTemp(parseInt(e.target.value) || 200)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    placeholder="600"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {tr('Tegangan Izin (MPa) *', 'Allowable Stress (MPa) *')}
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={ductStress}
                    onChange={(e) => setDuctStress(parseFloat(e.target.value) || 50)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    placeholder="120"
                  />
                  <span className="text-[10px] text-slate-500">{tr('Allowable stress ASME B31.3', 'Allowable stress per ASME B31.3')}</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">{tr('Densitas (kg/m³)', 'Density (kg/m³)')}</label>
                  <input
                    type="number"
                    value={ductDensity}
                    onChange={(e) => setDuctDensity(parseInt(e.target.value) || 7850)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    placeholder="7850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{tr('Keterangan / Standar Material', 'Description / Material Standard')}</label>
                <textarea
                  rows={2}
                  value={ductDescription}
                  onChange={(e) => setDuctDescription(e.target.value)}
                  placeholder={tr('Standar pabrik, plat boiler grade, batas korosi...', 'Mill standard, boiler grade plate, corrosion allowance...')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md transition-colors"
                >
                  {tr('Simpan Material Ducting', 'Save Ducting Material')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
