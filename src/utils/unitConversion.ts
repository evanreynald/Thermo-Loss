import { UnitSystem } from './translations';

export const unitHelpers = {
  formatTemp(celsius: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const fahrenheit = celsius * 1.8 + 32;
      return `${fahrenheit.toFixed(1)} °F`;
    }
    return `${celsius.toFixed(1)} °C`;
  },

  formatDim(mm: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const inch = mm / 25.4;
      return `${inch.toFixed(2)} in`;
    }
    return `${mm.toFixed(1)} mm`;
  },

  formatLength(m: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const ft = m * 3.28084;
      return `${ft.toFixed(2)} ft`;
    }
    return `${m.toFixed(1)} m`;
  },

  formatPowerKW(kW: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const kbtu = (kW * 3412.142) / 1000;
      return `${kbtu.toFixed(2)} kBTU/h`;
    }
    return `${kW.toFixed(2)} kW`;
  },

  formatFlux(wm2: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const btuHrFt2 = wm2 * 0.316998;
      return `${btuHrFt2.toFixed(1)} BTU/(h·ft²)`;
    }
    return `${wm2.toFixed(1)} W/m²`;
  },

  formatPressure(bar: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const psi = bar * 14.5038;
      return `${psi.toFixed(1)} psi`;
    }
    return `${bar.toFixed(2)} bar`;
  },

  formatVelocity(ms: number, system: UnitSystem): string {
    if (system === 'imperial') {
      const fps = ms * 3.28084;
      return `${fps.toFixed(1)} ft/s`;
    }
    return `${ms.toFixed(1)} m/s`;
  },

  getUnits(system: UnitSystem) {
    if (system === 'imperial') {
      return {
        temp: '°F',
        dim: 'in',
        length: 'ft',
        power: 'kBTU/h',
        flux: 'BTU/(h·ft²)',
        pressure: 'psi',
        velocity: 'ft/s',
      };
    }
    return {
      temp: '°C',
      dim: 'mm',
      length: 'm',
      power: 'kW',
      flux: 'W/m²',
      pressure: 'bar',
      velocity: 'm/s',
    };
  },
};
