import React from 'react';
import { InsulationLayer, InsulationMaterial, InsulationPosition } from '../types';
import {
  Plus,
  Trash2,
  Layers,
  AlertCircle,
  ShieldAlert,
  Edit3,
  Check,
} from 'lucide-react';

interface Props {
  hasInsulation: boolean;
  onToggleHasInsulation: (enabled: boolean) => void;
  layers: InsulationLayer[];
  isMultiLayer: boolean;
  insulationMaterials: InsulationMaterial[];
  onToggleMultiLayer: (enabled: boolean) => void;
  onUpdateLayers: (layers: InsulationLayer[]) => void;
  onOpenAddMaterialModal: () => void;
  ductMaterialName?: string;
}

export const LayerManager: React.FC<Props> = ({
  hasInsulation,
  onToggleHasInsulation,
  layers,
  isMultiLayer,
  insulationMaterials,
  onToggleMultiLayer,
  onUpdateLayers,
  onOpenAddMaterialModal,
  ductMaterialName = 'Shell Ducting',
}) => {
  // Determine current dropdown value for insulation configuration
  const currentConfigValue = !hasInsulation
    ? 'bare'
    : isMultiLayer && layers.some((l) => l.position === 'inside')
    ? 'lining_jacketing'
    : isMultiLayer
    ? 'multi_out'
    : 'single';

  const handleConfigChange = (val: string) => {
    if (val === 'bare') {
      onToggleHasInsulation(false);
    } else if (val === 'single') {
      onToggleHasInsulation(true);
      onToggleMultiLayer(false);
      // Keep only 1 outside layer
      const firstOut = layers.find((l) => l.position === 'outside') || {
        id: `layer-${Date.now()}`,
        materialId: insulationMaterials[0]?.id || 'mat-rockwool',
        position: 'outside' as InsulationPosition,
        thicknessMm: 50,
        name: insulationMaterials[0]?.name || 'Rockwool Blanket',
      };
      onUpdateLayers([{ ...firstOut, position: 'outside' }]);
    } else if (val === 'multi_out') {
      onToggleHasInsulation(true);
      onToggleMultiLayer(true);
      if (layers.length < 2) {
        const mat2 = insulationMaterials[1] || insulationMaterials[0];
        onUpdateLayers([
          ...layers,
          {
            id: `layer-${Date.now()}`,
            materialId: mat2.id,
            position: 'outside',
            thicknessMm: 30,
            name: mat2.name,
          },
        ]);
      }
    } else if (val === 'lining_jacketing') {
      onToggleHasInsulation(true);
      onToggleMultiLayer(true);
      const hasInside = layers.some((l) => l.position === 'inside');
      const hasOutside = layers.some((l) => l.position === 'outside');
      const newLayers = [...layers];

      if (!hasInside) {
        const refrMat = insulationMaterials.find((m) => m.isRefractory) || insulationMaterials[0];
        newLayers.unshift({
          id: `layer-refr-${Date.now()}`,
          materialId: refrMat.id,
          position: 'inside',
          thicknessMm: 114,
          name: refrMat.name,
        });
      }
      if (!hasOutside) {
        const outMat = insulationMaterials.find((m) => !m.isRefractory) || insulationMaterials[0];
        newLayers.push({
          id: `layer-out-${Date.now()}`,
          materialId: outMat.id,
          position: 'outside',
          thicknessMm: 50,
          name: outMat.name,
        });
      }
      onUpdateLayers(newLayers);
    }
  };

  const handleAddLayer = (pos: InsulationPosition) => {
    const defaultMat =
      pos === 'inside'
        ? insulationMaterials.find((m) => m.isRefractory) || insulationMaterials[0]
        : insulationMaterials.find((m) => !m.isRefractory) || insulationMaterials[0];

    const newLayer: InsulationLayer = {
      id: `layer-${Date.now()}`,
      materialId: defaultMat.id,
      position: pos,
      thicknessMm: pos === 'inside' ? 100 : 50,
      name: defaultMat.name,
      customConductivity: defaultMat.thermalConductivity,
      customMaxTempC: defaultMat.maxServiceTempC,
    };

    onUpdateLayers([...layers, newLayer]);
  };

  const handleRemoveLayer = (id: string) => {
    if (layers.length <= 1) {
      onToggleHasInsulation(false);
      return;
    }
    onUpdateLayers(layers.filter((l) => l.id !== id));
  };

  const handleUpdateLayer = (id: string, updates: Partial<InsulationLayer>) => {
    onUpdateLayers(
      layers.map((l) => {
        if (l.id === id) {
          const updated = { ...l, ...updates };
          if (updates.materialId && updates.materialId !== 'custom_manual') {
            const mat = insulationMaterials.find((m) => m.id === updates.materialId);
            if (mat) {
              updated.name = mat.name;
              // If not in manual mode, update conductivities to match material
              if (!updated.isManualConductivity) {
                updated.customConductivity = mat.thermalConductivity;
                updated.customMaxTempC = mat.maxServiceTempC;
              }
            }
          }
          return updated;
        }
        return l;
      })
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      {/* Header and Master Data Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">4. Konfigurasi Lapisan Isolasi</h3>
        </div>

        <button
          type="button"
          onClick={onOpenAddMaterialModal}
          className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          + Master Data Material
        </button>
      </div>

      {/* DROPDOWN MENU KONFIGURASI LAPISAN ISOLASI (Sesuai Permintaan User a.4) */}
      <div className="space-y-1.5">
        <label htmlFor="insulation-config-select" className="block text-xs font-semibold text-slate-300">
          Pilihan Konfigurasi Isolasi:
        </label>
        <select
          id="insulation-config-select"
          value={currentConfigValue}
          onChange={(e) => handleConfigChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
        >
          <option value="single">🛡️ Dengan Isolasi (Single-Layer / 1 Lapis Luar)</option>
          <option value="multi_out">📚 Dengan Isolasi (Multi-Layer / Lapis Luar Bertingkat)</option>
          <option value="lining_jacketing">🧱 Refraktori Dalam + Isolasi Luar (Lining + Shell + Jacket)</option>
          <option value="bare">⚠️ Tanpa Isolasi (Bare Duct / Pipa Telanjang)</option>
        </select>
        <p className="text-[11px] text-slate-500">
          {currentConfigValue === 'bare'
            ? 'Pipa beroperasi tanpa isolasi. Panas langsung terbuang ke udara bebas.'
            : currentConfigValue === 'single'
            ? 'Konfigurasi standar 1 lapis isolasi eksternal (Rockwool, Glasswool, Calcium Silicate, dll).'
            : currentConfigValue === 'lining_jacketing'
            ? 'Kombinasi bata tahan api / castable di dalam saluran dan isolasi penahan panas di luar.'
            : 'Multi-layer dengan beberapa lapis isolasi berbeda untuk efisiensi termal bertingkat.'}
        </p>
      </div>

      {/* Case 1: Tanpa Isolasi (Bare Pipe / Bare Ducting) */}
      {!hasInsulation ? (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Kondisi: Pipa / Ducting Telanjang (Uninsulated / Bare)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">
                  0 mm Isolator
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ducting saat ini beroperasi tanpa isolasi. Panas fluida mengalir langsung menembus plat baja shell ({ductMaterialName}) dan terbuang ke udara bebas melalui konveksi dan radiasi termal.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">Ingin beralih memasang isolasi?</span>
            <button
              type="button"
              onClick={() => handleConfigChange('single')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Pasang Lapisan Isolasi
            </button>
          </div>
        </div>
      ) : (
        /* Case 2: Dengan Lapisan Isolasi */
        <div className="space-y-3">
          {/* Layer List */}
          <div className="space-y-3">
            {layers.map((layer, index) => {
              const selectedMat = insulationMaterials.find((m) => m.id === layer.materialId);
              const currentConductivity =
                layer.customConductivity !== undefined && layer.customConductivity > 0
                  ? layer.customConductivity
                  : selectedMat?.thermalConductivity || 0.04;
              const currentMaxTemp =
                layer.customMaxTempC !== undefined && layer.customMaxTempC > 0
                  ? layer.customMaxTempC
                  : selectedMat?.maxServiceTempC || 650;

              return (
                <div
                  key={layer.id}
                  className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 text-xs shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {index + 1}
                      </span>
                      <select
                        value={layer.position}
                        onChange={(e) =>
                          handleUpdateLayer(layer.id, { position: e.target.value as InsulationPosition })
                        }
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px] font-semibold"
                      >
                        <option value="outside">Isolator di LUAR Shell (Eksternal)</option>
                        <option value="inside">Refraktori di DALAM Shell (Lining/Bata)</option>
                      </select>
                    </div>

                    {/* Toggle Input k Manual Button (Sesuai Permintaan User a.1) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateLayer(layer.id, {
                            isManualConductivity: !layer.isManualConductivity,
                            customConductivity: currentConductivity,
                            customMaxTempC: currentMaxTemp,
                          })
                        }
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          layer.isManualConductivity
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                        title="Input nilai konduktivitas termal (k) secara manual tanpa menambah katalog baru"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" />
                        <span>{layer.isManualConductivity ? '✓ k Manual Aktif' : 'Input k Manual'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveLayer(layer.id)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title={layers.length <= 1 ? 'Jadikan tanpa isolasi' : 'Hapus lapisan ini'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Inputs Row: Material selection & Thickness */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    {/* Material Selector (col 8) */}
                    <div className="sm:col-span-8">
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                        Pilihan Material Isolasi:
                      </label>
                      <select
                        value={layer.isManualConductivity ? 'custom_manual' : layer.materialId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom_manual') {
                            handleUpdateLayer(layer.id, {
                              isManualConductivity: true,
                              customConductivity: currentConductivity || 0.04,
                              customMaxTempC: currentMaxTemp || 650,
                              name: layer.name?.includes('Custom') ? layer.name : 'Custom Insulation',
                            });
                          } else {
                            handleUpdateLayer(layer.id, {
                              materialId: val,
                              isManualConductivity: false,
                            });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-medium"
                      >
                        <option value="custom_manual">
                          ✏️ [Manual Override] Input Nilai k Sendiri (Tanpa Katalog)
                        </option>
                        <optgroup label="Isolator Blanket, Board, & Silicate (Eksternal)">
                          {insulationMaterials
                            .filter((m) => !m.isRefractory)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} (k={m.thermalConductivity} W/m·K, Max {m.maxServiceTempC}°C)
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="Bata Tahan Api & Castable (Internal / Lining)">
                          {insulationMaterials
                            .filter((m) => m.isRefractory)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} (k={m.thermalConductivity} W/m·K, Max {m.maxServiceTempC}°C)
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Thickness Input (col 4) */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                        Tebal Lapisan:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="800"
                          value={layer.thicknessMm}
                          onChange={(e) =>
                            handleUpdateLayer(layer.id, {
                              thicknessMm: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-right text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-slate-400 text-xs font-semibold shrink-0">mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Conductivity Editor Box (If manual conductivity is active) */}
                  {layer.isManualConductivity ? (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-300 flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          Input Manual Konduktivitas Termal (k):
                        </span>
                        <span className="text-[10px] text-amber-300/80">Langsung digunakan dalam rumus</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Nama Material (Opsional):</label>
                          <input
                            type="text"
                            value={layer.name || ''}
                            onChange={(e) => handleUpdateLayer(layer.id, { name: e.target.value })}
                            placeholder="e.g. Aerogel Blanket Spesial"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5 font-bold text-amber-300">
                            Konduktivitas k (W/m·K) *:
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.005"
                            max="10.0"
                            value={currentConductivity}
                            onChange={(e) =>
                              handleUpdateLayer(layer.id, {
                                customConductivity: Math.max(0.005, parseFloat(e.target.value) || 0.04),
                              })
                            }
                            className="w-full bg-slate-900 border border-amber-500/60 rounded px-2 py-1 text-amber-300 font-mono font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Max Temp (°C):</label>
                          <input
                            type="number"
                            min="50"
                            max="2000"
                            value={currentMaxTemp}
                            onChange={(e) =>
                              handleUpdateLayer(layer.id, {
                                customMaxTempC: parseInt(e.target.value) || 650,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Quick preset buttons for common k values */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                        <span>Contoh acuan:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayer(layer.id, { customConductivity: 0.038, customMaxTempC: 650 })}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300"
                        >
                          Rockwool (0.038)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayer(layer.id, { customConductivity: 0.065, customMaxTempC: 1000 })}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300"
                        >
                          CalSil (0.065)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayer(layer.id, { customConductivity: 0.022, customMaxTempC: 650 })}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300"
                        >
                          Aerogel (0.022)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLayer(layer.id, { customConductivity: 0.12, customMaxTempC: 1300 })}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300"
                        >
                          Ceramic Fiber (0.12)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                      <span>
                        Nilai Termal: k ={' '}
                        <strong className="text-slate-300 font-mono">{currentConductivity} W/m·K</strong> | Max{' '}
                        <strong className="text-slate-300 font-mono">{currentMaxTemp}°C</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateLayer(layer.id, {
                            isManualConductivity: true,
                            customConductivity: currentConductivity,
                            customMaxTempC: currentMaxTemp,
                          })
                        }
                        className="text-amber-400 hover:underline text-[10px]"
                      >
                        Ubah nilai k lapisan ini
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Layer Buttons if Multi-Layer is Enabled */}
          {isMultiLayer ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAddLayer('outside')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                + Tambah Lapis Isolasi Luar
              </button>
              <button
                type="button"
                onClick={() => handleAddLayer('inside')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                + Tambah Refraktori Dalam (Kiln / Lining)
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Mode single-layer aktif.
              </span>
              <button
                type="button"
                onClick={() => handleConfigChange('multi_out')}
                className="text-blue-400 hover:underline text-[11px] font-medium"
              >
                + Ubah ke Multi-Layer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
