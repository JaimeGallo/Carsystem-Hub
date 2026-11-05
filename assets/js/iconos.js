// Dibujos propios en línea para las familias de repuestos.
const svg = (cuerpo) => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${cuerpo}</svg>`;

export const ICONOS = {
  Frenos: svg('<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="4.5"/><path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2.1 2.1M22.4 22.4l2.1 2.1M24.5 7.5l-2.1 2.1M9.6 22.4l-2.1 2.1"/>'),
  Motor: svg('<path d="M7 12h3l2-3h8v3h3l2 3v4h-3v3H12l-2-3H7z"/><path d="M4 13v6M16 9V6M13 6h6"/>'),
  Suspensión: svg('<path d="M16 3v4M16 25v4M10 7h12M10 25h12"/><path d="M10 10.5l12 2.5-12 3 12 2.5-12 3"/>'),
  Eléctrico: svg('<rect x="4" y="10" width="24" height="16" rx="2.5"/><path d="M9 10V7h4v3M19 10V7h4v3M9 18h4M11 16v4M19 18h4"/>'),
  Refrigeración: svg('<rect x="5" y="6" width="22" height="20" rx="2.5"/><path d="M11 6v20M16 6v20M21 6v20M5 16h22"/>'),
  Filtros: svg('<path d="M5 6h22l-8.5 10v9l-5 2V16z"/><path d="M10 11h12"/>'),
};

export const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
export const OJO = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V9M8 11.5v.1"/></svg>';
export const CARRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16v-3l2-5.5A2 2 0 0 1 7.9 6h8.2A2 2 0 0 1 18 7.5l2 5.5v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4.5 12h15M7 17v1.5M17 17v1.5"/></svg>';
export const RELOJ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>';
export const ETIQUETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12V4h8l10 10-8 7z"/><circle cx="8" cy="9" r="1.4"/></svg>';
export const PERSONA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>';

export function disco() {
  const huecos = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<circle cx="${200 + 118 * Math.cos(a)}" cy="${200 + 118 * Math.sin(a)}" r="6" fill="var(--fondo)" stroke="currentColor" stroke-width="2"/>`;
  }).join('');
  const ranuras = Array.from({ length: 6 }, (_, i) => `<path d="M200 56 C 262 72 296 112 306 160" stroke="currentColor" stroke-width="2" fill="none" transform="rotate(${i * 60} 200 200)"/>`).join('');
  const pernos = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 5;
    return `<circle cx="${200 + 34 * Math.cos(a)}" cy="${200 + 34 * Math.sin(a)}" r="7" fill="none" stroke="currentColor" stroke-width="2"/>`;
  }).join('');
  return `<svg class="disco" viewBox="0 0 400 400" aria-hidden="true">
    <g class="gira">
      <circle cx="200" cy="200" r="168" fill="var(--sup)" stroke="currentColor" stroke-width="2"/>
      <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" stroke-width="1"/>
      ${ranuras}${huecos}
      <circle cx="200" cy="200" r="78" fill="var(--sup-2)" stroke="currentColor" stroke-width="2"/>
      <circle cx="200" cy="200" r="15" fill="var(--fondo)" stroke="currentColor" stroke-width="2"/>
      ${pernos}
    </g>
    <path class="pinza" d="M322 92 a160 160 0 0 1 38 88 h-46 a116 116 0 0 0 -24 -58 z" fill="currentColor"/>
  </svg>`;
}
