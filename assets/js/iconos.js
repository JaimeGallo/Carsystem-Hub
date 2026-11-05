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

// Disco de freno realista, dibujado una sola vez. Su fondo es transparente; la pinza y el reflejo van en capas aparte.
const azar = (n) => () => {
  n = (n + 0x6d2b79f5) | 0;
  let t = Math.imul(n ^ (n >>> 15), 1 | n);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pt = (r, a) => [220 + r * Math.cos(((a - 90) * Math.PI) / 180), 220 + r * Math.sin(((a - 90) * Math.PI) / 180)].map((v) => v.toFixed(2));
const anillo = (r1, r2, a0, a1) => `M${pt(r2, a0)}A${r2} ${r2} 0 0 1 ${pt(r2, a1)}L${pt(r1, a1)}A${r1} ${r1} 0 0 0 ${pt(r1, a0)}Z`;

function lienzo(lado) {
  const c = document.createElement('canvas');
  c.width = lado; c.height = lado;
  const x = c.getContext('2d');
  x.translate(lado / 2, lado / 2);
  x.scale(lado / 440, lado / 440);
  return [c, x];
}

function perno(x, px, py, r) {
  const g = x.createRadialGradient(px - r * 0.3, py - r * 0.35, r * 0.1, px, py, r);
  g.addColorStop(0, '#f3f5f7'); g.addColorStop(0.55, '#a4abb3'); g.addColorStop(1, '#4b5158');
  x.fillStyle = g;
  x.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.3;
    x[i ? 'lineTo' : 'moveTo'](px + r * Math.cos(a), py + r * Math.sin(a));
  }
  x.closePath(); x.fill();
  x.fillStyle = '#23272c';
  x.beginPath(); x.arc(px, py, r * 0.42, 0, 7); x.fill();
}

function agujero(x, px, py, r) {
  x.fillStyle = 'rgba(255,255,255,.14)';
  x.beginPath(); x.arc(px + 0.4, py + 0.6, r + 0.8, 0, 7); x.fill();
  const g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
  g.addColorStop(0, '#000'); g.addColorStop(1, '#0a0e13');
  x.fillStyle = g;
  x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
}

function pintarRotor() {
  const [c, x] = lienzo(1320);
  const r = azar(7);
  const acero = x.createRadialGradient(0, 0, 90, 0, 0, 200);
  acero.addColorStop(0, '#8d949b'); acero.addColorStop(0.5, '#b9bfc5'); acero.addColorStop(0.93, '#a4aab1'); acero.addColorStop(1, '#6c7279');
  x.fillStyle = acero;
  x.beginPath(); x.arc(0, 0, 200, 0, 7); x.fill();
  // Marcas circulares del torneado.
  for (let i = 0; i < 900; i++) {
    const rad = 90 + r() * 110;
    const a = r() * 6.28;
    x.strokeStyle = r() > 0.5 ? `rgba(255,255,255,${0.03 + r() * 0.09})` : `rgba(20,24,28,${0.03 + r() * 0.09})`;
    x.lineWidth = 0.2 + r() * 0.35;
    x.beginPath(); x.arc(0, 0, rad, a, a + 1 + r() * 5); x.stroke();
  }
  // Perforaciones en filas curvas.
  for (let s = 0; s < 8; s++) for (let f = -1; f < 2; f++) for (let i = 0; i < 6; i++) {
    const rad = 104 + i * 16.5;
    const a = ((s * 45 + 22.5 + f * 12 + i * 3.4 - 90) * Math.PI) / 180;
    const px = rad * Math.cos(a);
    const py = rad * Math.sin(a);
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.beginPath(); x.arc(px + 0.5, py + 0.6, 3.15, 0, 7); x.fill();
    const g = x.createRadialGradient(px - 0.7, py - 0.8, 0.2, px, py, 2.6);
    g.addColorStop(0, '#000'); g.addColorStop(1, '#2d3136');
    x.fillStyle = g;
    x.beginPath(); x.arc(px, py, 2.6, 0, 7); x.fill();
  }
  x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 1;
  x.beginPath(); x.arc(0, 0, 198.5, 0, 7); x.stroke();
  x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 1.5;
  x.beginPath(); x.arc(0, 0, 200, 0, 7); x.stroke();
  // Campana negra con pernos, agujeros de rueda y eje.
  x.fillStyle = 'rgba(0,0,0,.45)';
  x.beginPath(); x.arc(0, 2, 95, 0, 7); x.fill();
  const hat = x.createRadialGradient(-22, -30, 10, 0, 0, 92);
  hat.addColorStop(0, '#34383d'); hat.addColorStop(0.7, '#17191c'); hat.addColorStop(1, '#0b0c0e');
  x.fillStyle = hat;
  x.beginPath(); x.arc(0, 0, 92, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.2)'; x.lineWidth = 1;
  x.beginPath(); x.arc(0, 0, 91.5, 0, 7); x.stroke();
  x.strokeStyle = 'rgba(0,0,0,.8)'; x.lineWidth = 2;
  x.beginPath(); x.arc(0, 0, 64, 0, 7); x.stroke();
  for (let s = 0; s < 16; s++) {
    const a = ((s * 22.5 + 11.25) * Math.PI) / 180;
    perno(x, 78 * Math.cos(a), 78 * Math.sin(a), 5.2);
  }
  for (let s = 0; s < 5; s++) {
    const a = ((s * 72 - 90) * Math.PI) / 180;
    agujero(x, 42 * Math.cos(a), 42 * Math.sin(a), 8);
  }
  agujero(x, 0, 0, 22);
  return c.toDataURL('image/png');
}

function pintarLuz() {
  // El reflejo no gira con el disco, igual que la luz sobre el metal.
  const [c, x] = lienzo(880);
  const g = x.createConicGradient(-0.5, 0, 0);
  [[0, 0.18], [0.07, 0.95], [0.15, 0.12], [0.26, 0.34], [0.38, 0.02], [0.5, 0.22], [0.57, 0.85], [0.65, 0.1], [0.78, 0.3], [0.9, 0.03], [1, 0.18]]
    .forEach(([p, a]) => g.addColorStop(p, `rgba(${a > 0.15 ? '255,255,255' : '0,0,0'},${a > 0.15 ? a : 0.5})`));
  x.fillStyle = g;
  x.beginPath(); x.arc(0, 0, 200, 0, 7); x.arc(0, 0, 92, 0, 7, true); x.fill();
  return c.toDataURL('image/png');
}

function pinza() {
  const a = 28;
  const curvo = (r1, r2, a0, a1, extra) => `<path d="${anillo(r1, r2, a0, a1)}" ${extra}/>`;
  const tornillo = (rad, ang) => {
    const [px, py] = pt(rad, ang);
    return `<circle cx="${px}" cy="${py}" r="4.6" fill="url(#plata)" stroke="#3b0408"/><circle cx="${px}" cy="${py}" r="1.7" fill="#2a2d31"/>`;
  };
  const piston = (d) => {
    const [px, py] = pt(166, d);
    return `<circle cx="${px}" cy="${py}" r="6.5" fill="#e0242f" stroke="#7c0810" stroke-width="1.2"/>`;
  };
  return curvo(153, 212, -a, a, 'fill="url(#rojo)" stroke="#a50d18" stroke-width="7" stroke-linejoin="round"')
    + curvo(196, 206, -a + 3, a - 3, 'fill="#fff" opacity=".2"')
    + curvo(176, 179, -a + 2, a - 2, 'fill="#58050a"')
    + curvo(155, 161, -a + 3, a - 3, 'fill="#58050a" opacity=".55"')
    + piston(-13) + piston(13) + tornillo(190, -a + 5) + tornillo(190, a - 5) + tornillo(190, 0);
}

let capas;
export function disco() {
  capas ||= { rotor: pintarRotor(), luz: pintarLuz(), pinza: pinza() };
  // El retraso negativo evita que el giro salte cuando la tienda se vuelve a dibujar.
  const retraso = (performance.now() / 1000) % 80;
  return `<svg class="disco" viewBox="0 0 440 440" aria-hidden="true">
    <defs>
      <radialGradient id="rojo" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ff5146"/><stop offset=".5" stop-color="#d3121f"/><stop offset="1" stop-color="#7c0810"/></radialGradient>
      <radialGradient id="plata" cx=".35" cy=".3"><stop offset="0" stop-color="#f3f5f7"/><stop offset="1" stop-color="#6d747b"/></radialGradient>
    </defs>
    <g class="gira" style="animation-delay:-${retraso.toFixed(2)}s"><image href="${capas.rotor}" width="440" height="440"/></g>
    <image class="luz" href="${capas.luz}" width="440" height="440"/>
    <g class="pinza" transform="rotate(48 220 220)">${capas.pinza}</g>
  </svg>`;
}
