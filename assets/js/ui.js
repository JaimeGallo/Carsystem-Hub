// Utilidades de presentación compartidas por todas las vistas.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const ev = (...codigos) => `<span class="ev-lista">${codigos.map((c) => `<button class="ev" data-act="ev" data-code="${esc(c)}" title="Ver evidencia ${esc(c)}">${esc(c)}</button>`).join('')}</span>`;

export const kpi = (et, val, nota = '') => `<div class="carta kpi"><div class="et">${esc(et)}</div><div class="val">${esc(val)}</div>${nota ? `<div class="nota">${esc(nota)}</div>` : ''}</div>`;

export const etiqueta = (texto, clase = '') => `<span class="et-e ${clase}">${esc(texto)}</span>`;

export const cab = (sobre, titulo, texto = '') => `<header class="cab"><div class="sobre">${esc(sobre)}</div><h1>${esc(titulo)}</h1>${texto ? `<p>${esc(texto)}</p>` : ''}</header>`;

export const avisoDemo = (texto) => `<div class="aviso-demo">${esc(texto)}</div>`;

export function tabla(columnas, filas) {
  const th = columnas.map((c) => `<th class="${c.n ? 'n' : ''}" scope="col">${esc(c.t)}</th>`).join('');
  const tr = filas.map((f) => `<tr>${f.map((v, i) => `<td class="${columnas[i].n ? 'n' : ''}">${v ?? ''}</td>`).join('')}</tr>`).join('');
  return `<div class="tabla-env"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

/** Barras horizontales con valor rotulado; cada fila admite { et, valor, texto, tip, clase }. */
export function barras(filas, { max } = {}) {
  const tope = max ?? Math.max(...filas.map((f) => f.valor), 1);
  return `<div class="barras">${filas.map((f) => `
    <div class="barra" data-tip="${esc(f.tip || `${f.et}: ${f.texto ?? f.valor}`)}">
      <span class="eti">${esc(f.et)}</span>
      <span class="pista"><span class="seg ${f.clase || ''}" style="width:${(100 * f.valor) / tope}%"></span></span>
      <span class="val">${esc(f.texto ?? f.valor)}</span>
    </div>`).join('')}</div>`;
}

/** Barras de dos partes (A + B) con leyenda fija. */
export function barras2(filas, nombres) {
  const tope = Math.max(...filas.map((f) => f.a + f.b), 1);
  return `<div class="leyenda"><span><i></i>${esc(nombres[0])}</span><span><i class="b"></i>${esc(nombres[1])}</span></div>
  <div class="barras">${filas.map((f) => `
    <div class="barra" data-tip="${esc(`${f.et}: ${f.a} ${nombres[0].toLowerCase()}, ${f.b} ${nombres[1].toLowerCase()}`)}">
      <span class="eti">${esc(f.et)}</span>
      <span class="pista" style="background:none">
        <span class="seg" style="width:${(100 * f.a) / tope}%;border-radius:0"></span>
        <span class="seg b" style="width:${(100 * f.b) / tope}%"></span>
      </span>
      <span class="val">${esc(f.a + f.b)}</span>
    </div>`).join('')}</div>`;
}

let tostTimer;
export function aviso(texto, mal = false) {
  const t = document.getElementById('toast');
  t.innerHTML = `<div class="tost ${mal ? 'mal' : ''}">${esc(texto)}</div>`;
  clearTimeout(tostTimer);
  tostTimer = setTimeout(() => { t.innerHTML = ''; }, 3800);
}

export function abrirDialogo(titulo, cuerpo) {
  const d = document.getElementById('dlg');
  d.innerHTML = `<div class="dlg-cab"><h2 id="dlg-titulo">${esc(titulo)}</h2><button class="cerrar" data-act="cerrar-dlg" aria-label="Cerrar">×</button></div><div class="dlg-cuerpo">${cuerpo}</div>`;
  if (!d.open) d.showModal();
}
export const cerrarDialogo = () => document.getElementById('dlg').close();

export function activarTooltips() {
  const tip = document.getElementById('tip');
  document.addEventListener('pointermove', (e) => {
    const b = e.target.closest?.('[data-tip]');
    if (!b) { tip.hidden = true; return; }
    tip.textContent = b.dataset.tip;
    tip.hidden = false;
    const x = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8);
    tip.style.left = `${x}px`;
    tip.style.top = `${e.clientY - tip.offsetHeight - 10}px`;
  });
}
