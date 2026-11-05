// Arranque, rutas, persistencia en el navegador y acciones de la interfaz.
import * as C from './core.js?v=5';
import { abrirDialogo, activarTooltips, aviso, cerrarDialogo, esc } from './ui.js?v=5';
import { CARRO } from './iconos.js?v=5';
import { formularioSolicitud, nombreCarro, pedido, refrescarResultados, tienda } from './tienda.js?v=5';
import { asesor, bodega, coordinacion, gerencia, marketing } from './equipo.js?v=5';

const CLAVE = 'carsystem-hub-demo-v1';
const CLAVE_CARRO = 'carsystem-mi-carro';
const ctx = {
  data: null, st: null, k: null,
  ui: { carro: { marca: '', modelo: '', anio: '' }, texto: '', cat: '', origen: null, borrador: {}, recupera: 50, utm: { campana: 'CMP-06', origen: 'Pauta Instagram' } },
};

// El almacenamiento puede fallar en ventanas privadas: la demo sigue funcionando en memoria.
const leer = (a, k) => { try { return JSON.parse(a.getItem(k)); } catch { return null; } };
const escribir = (a, k, v) => { try { a.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const guardar = () => escribir(localStorage, CLAVE, ctx.st);

const RUTAS_ANTIGUAS = { catalogo: '#/', seguimiento: '#/pedido', asesor: '#/equipo', coordinacion: '#/equipo/coordinacion', bodega: '#/equipo/bodega', marketing: '#/equipo/marketing', gerencia: '#/equipo/gerencia', diagnostico: '#/', plan: '#/' };

const LOGO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>';
const PESTANAS = [['bandeja', 'Bandeja'], ['coordinacion', 'Coordinación'], ['bodega', 'Bodega'], ['marketing', 'Marketing'], ['gerencia', 'Gerencia']];

function pintarMarco(seccion, sub) {
  const b = document.getElementById('barra');
  const p = document.getElementById('pie');
  if (seccion === 'equipo') {
    const st = ctx.st;
    const num = {
      bandeja: st.cotizaciones.filter((q) => q.estado === 'Nueva').length,
      coordinacion: st.descuentos.filter((d) => d.estado === 'Pendiente').length + C.sinSeguimiento(st).length,
      bodega: st.cotizaciones.filter((q) => q.pedido && q.pedido.estado !== 'Entregado').length,
    };
    const actual = sub || 'bandeja';
    b.innerHTML = `<div class="barra-int"><a class="marca" href="#/equipo">${LOGO}Carsystem <small>Equipo</small></a>
      <nav class="pestanas" aria-label="Áreas del equipo">${PESTANAS.map(([r, t]) => `<a class="enl" href="#/equipo/${r}" ${r === actual ? 'aria-current="page"' : ''}>${t}${num[r] ? `<span class="num">${num[r]}</span>` : ''}</a>`).join('')}</nav>
      <div class="barra-der"><a class="enl" href="#/">Ver tienda</a></div></div>`;
    b.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    p.innerHTML = '<div class="pie-int"><span>Prototipo con datos simulados. Caso educativo Estud-IA.</span><button class="btn-link" data-act="reiniciar">Reiniciar demo</button></div>';
  } else {
    const carro = nombreCarro(ctx.ui.carro);
    b.innerHTML = `<div class="barra-int"><a class="marca" href="#/">${LOGO}Carsystem</a>
      <div class="barra-der">${carro ? `<button class="mi-carro" data-act="cambiar-carro" title="Cambiar de carro">${CARRO}${esc(carro)}</button>` : ''}
      <a class="enl" href="#/pedido" ${seccion === 'pedido' ? 'aria-current="page"' : ''}>Mi pedido</a></div></div>`;
    p.innerHTML = '<div class="pie-int"><span>Prototipo del caso educativo Estud-IA. La empresa y las personas son ficticias.</span><a href="#/equipo">Portal del equipo</a></div>';
  }
}

function render(mantenerScroll = false) {
  const [ruta, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [seccion = '', sub, param] = ruta.split('/');
  if (RUTAS_ANTIGUAS[seccion]) {
    const q = query ? `?${query}` : '';
    location.replace(`${RUTAS_ANTIGUAS[seccion]}${sub ? `/${seccion === 'asesor' ? `bandeja/${sub}` : sub}` : ''}${q}`);
    return;
  }
  const q = new URLSearchParams(query);
  if (q.get('campana')) {
    ctx.ui.origen = { campana: q.get('campana'), origen: q.get('origen') || 'Enlace de campaña' };
    escribir(sessionStorage, 'carsystem-origen', ctx.ui.origen);
  }
  const equipo = { bandeja: (c) => asesor(c, param), coordinacion, bodega, marketing, gerencia };
  const m = document.getElementById('contenido');
  const y = scrollY;
  if (seccion === 'equipo') m.innerHTML = (equipo[sub] || equipo.bandeja)(ctx);
  else if (seccion === 'pedido') m.innerHTML = pedido(ctx, sub);
  else m.innerHTML = tienda(ctx);
  pintarMarco(seccion, sub);
  const nombre = seccion === 'equipo' ? (PESTANAS.find(([r]) => r === sub)?.[1] || 'Bandeja') : seccion === 'pedido' ? 'Mi pedido' : '';
  document.title = nombre ? `${nombre} · Carsystem` : 'Carsystem · Repuestos para tu carro';
  if (mantenerScroll) scrollTo(0, y); else { scrollTo(0, 0); m.focus({ preventScroll: true }); }
}

function cambio(fn, mensaje) {
  try {
    fn();
    guardar();
    render(true);
    if (mensaje) aviso(mensaje);
  } catch (e) {
    aviso(e.message, true);
  }
}

const elegirCarro = () => { escribir(localStorage, CLAVE_CARRO, ctx.ui.carro); render(true); };

const ACCIONES = {
  'cerrar-dlg': cerrarDialogo,
  reiniciar: () => {
    if (!confirm('¿Reiniciar la demo? Se borran los cambios guardados en este navegador.')) return;
    ctx.st = C.estadoInicial(); ctx.ui.borrador = {}; guardar(); render(); aviso('Demo reiniciada');
  },
  'cambiar-carro': () => { ctx.ui.carro = { marca: '', modelo: '', anio: '' }; elegirCarro(); if (location.hash.length > 2) location.hash = '#/'; },
  cat: (d) => { ctx.ui.cat = ctx.ui.cat === d.cat ? '' : d.cat; render(true); },
  solicitar: (d) => abrirDialogo(d.sku ? 'Pedir cotización' : 'Hablar con un asesor', formularioSolicitud(ctx, d.sku)),
  'elegir-sku': (d) => { Object.assign(ctx.ui.borrador[d.id], { sku: d.sku, confirmar: null }); render(true); },
  enviar: (d) => cambio(() => { const b = ctx.ui.borrador[d.id]; C.enviarCotizacion(ctx.st, d.id, b.sku, b.cantidad); }, 'Cotización enviada'),
  copiar: async (d) => {
    try { await navigator.clipboard.writeText(d.texto); aviso('Copiado'); } catch { aviso('No se pudo copiar', true); }
  },
  ganar: (d) => cambio(() => {
    const q = ctx.st.cotizaciones.find((x) => x.id === d.id);
    C.cerrarGanada(ctx.st, d.id, C.promesaEntrega(C.stockDe(ctx.data, ctx.st, q.sku), q.cantidad).texto);
  }, 'Venta ganada. Pedido en bodega'),
  perder: (d) => cambio(() => C.cerrarPerdida(ctx.st, d.id, document.getElementById(`motivo-${d.id}`).value), 'Cerrada con motivo'),
  'pedir-dcto': (d) => abrirDialogo('Pedir descuento', `<form class="pila" data-submit="crear-dcto"><input type="hidden" name="id" value="${esc(d.id)}">
    <label class="campo">Porcentaje<input name="pct" type="number" min="1" max="30" required></label>
    <label class="campo">Motivo<textarea name="motivo" required></textarea></label>
    <p class="tenue peq">Lo decide coordinación.</p><button class="btn pri" style="justify-content:center">Enviar</button></form>`),
  'dcto-si': (d) => cambio(() => C.resolverDescuento(ctx.st, d.id, true), 'Descuento aprobado'),
  'dcto-no': (d) => cambio(() => C.resolverDescuento(ctx.st, d.id, false), 'Descuento rechazado'),
  avanzar: (d) => cambio(() => C.avanzarPedido(ctx.st, d.id), 'Actualizado. El cliente ya lo ve'),
};

const ENVIOS = {
  nada: () => {},
  'crear-solicitud': (f) => {
    const o = ctx.ui.origen;
    const sku = f.get('sku');
    const q = C.crearSolicitud(ctx.st, {
      contacto: f.get('contacto'), vehiculo: f.get('vehiculo'), sku, cantidad: Number(f.get('cantidad')), autoriza: f.get('autoriza') === 'on',
      origen: o?.origen || 'Tienda directa', campana: o?.campana,
      mensaje: [sku ? ctx.data.productos.find((p) => p.sku === sku).producto : '', f.get('vehiculo')].filter(Boolean).join(' para '),
    });
    guardar();
    cerrarDialogo();
    render(true);
    abrirDialogo('¡Listo! Recibimos tu solicitud', `<p>Tu número es <b>${q.id}</b>. Un asesor valida tu pieza y te confirma el valor final.</p><div class="fila"><a class="btn pri" href="#/pedido/${q.id}" data-act="cerrar-dlg">Ver mi pedido</a><a class="btn" href="#/equipo/bandeja/${q.id}" data-act="cerrar-dlg">Ver como asesor</a></div>`);
  },
  'buscar-pedido': (f) => { location.hash = `#/pedido/${f.get('id').trim().toUpperCase()}`; },
  'crear-dcto': (f) => { cerrarDialogo(); cambio(() => C.solicitarDescuento(ctx.st, f.get('id'), Number(f.get('pct')), f.get('motivo')), 'Enviado a coordinación'); },
  'crear-pqr': (f) => cambio(() => C.crearPQR(ctx.st, f.get('id'), f.get('tipo'), f.get('descripcion')), 'Caso registrado'),
  conteo: (f) => cambio(() => C.registrarConteo(ctx.st, f.get('sku'), Number(f.get('fisico'))), 'Conteo guardado'),
};

const ENTRADAS = {
  'c-marca': (v) => { Object.assign(ctx.ui.carro, { marca: v, modelo: '' }); elegirCarro(); },
  'c-modelo': (v) => { ctx.ui.carro.modelo = v; elegirCarro(); },
  'c-anio': (v) => { ctx.ui.carro.anio = v; elegirCarro(); },
  'c-texto': (v) => { ctx.ui.texto = v; refrescarResultados(ctx); },
  'b-sku': (v, e) => { Object.assign(ctx.ui.borrador[e.dataset.id], { sku: v, confirmar: null }); render(true); },
  'b-cant': (v, e) => { ctx.ui.borrador[e.dataset.id].cantidad = Math.max(1, Number(v) || 1); render(true); },
  'confirmar-var': (_, e) => { ctx.ui.borrador[e.dataset.id].confirmar = e.checked; render(true); },
  'u-campana': (v) => { ctx.ui.utm.campana = v.trim(); render(true); },
  'u-origen': (v) => { ctx.ui.utm.origen = v; render(true); },
  recupera: (v) => { ctx.ui.recupera = Number(v); render(true); },
};

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (b) ACCIONES[b.dataset.act]?.(b.dataset, b);
});
document.addEventListener('submit', (e) => {
  const n = e.target.dataset.submit;
  if (!n) return;
  e.preventDefault();
  try { ENVIOS[n](new FormData(e.target)); } catch (err) { aviso(err.message, true); }
});
// El texto y el deslizador responden al escribir; el resto al terminar, para no perder el foco.
const EN_VIVO = ['c-texto', 'recupera'];
document.addEventListener('input', (e) => { if (EN_VIVO.includes(e.target.dataset.input)) ENTRADAS[e.target.dataset.input](e.target.value, e.target); });
document.addEventListener('change', (e) => {
  const n = e.target.dataset.input;
  if (n && !EN_VIVO.includes(n)) ENTRADAS[n](e.target.value, e.target);
});
addEventListener('hashchange', () => render());

async function arrancar() {
  try {
    const r = await fetch('data/hub.json');
    if (!r.ok) throw new Error('datos');
    ctx.data = await r.json();
    ctx.k = C.indicadores(ctx.data);
    const s = leer(localStorage, CLAVE);
    ctx.st = s?.version === 1 ? s : C.estadoInicial();
    const carro = leer(localStorage, CLAVE_CARRO);
    if (carro) ctx.ui.carro = carro;
    ctx.ui.origen = leer(sessionStorage, 'carsystem-origen');
    activarTooltips();
    render();
  } catch {
    document.getElementById('contenido').innerHTML = '<p class="carta">No se pudieron cargar los datos. Abre el sitio desde un servidor web (GitHub Pages o <code>python -m http.server</code>).</p>';
  }
}
arrancar();
