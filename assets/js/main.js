// Arranque, rutas, persistencia en el navegador y acciones de la interfaz.
import * as C from './core.js';
import { abrirDialogo, activarTooltips, aviso, cerrarDialogo, esc } from './ui.js';
import { diagnostico, inicio, plan } from './propuesta.js';
import { catalogo, formularioSolicitud, refrescarCatalogo, seguimiento } from './cliente.js';
import { asesor, bodega, coordinacion, gerencia, marketing } from './equipo.js';

const CLAVE = 'carsystem-hub-demo-v1';
const ctx = {
  data: null, evid: null, st: null, k: null,
  ui: {
    catalogo: { marca: '', modelo: '', anio: '', texto: '' }, origen: null, borrador: {}, recupera: 50,
    utm: { campana: 'CMP-06', origen: 'Pauta Instagram' },
  },
};

// localStorage puede fallar en ventanas privadas: la demo sigue funcionando en memoria.
function cargar() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE));
    if (s?.version === 1) return s;
  } catch { /* sin almacenamiento */ }
  return C.estadoInicial();
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(ctx.st)); } catch { /* sin almacenamiento */ }
}

const NAV = [
  ['Propuesta', [['#/', 'Inicio'], ['#/diagnostico', 'Diagnóstico'], ['#/plan', 'Plan']]],
  ['Cliente', [['#/catalogo', 'Catálogo'], ['#/seguimiento', 'Mi pedido']]],
  ['Equipo', [['#/asesor', 'Bandeja'], ['#/coordinacion', 'Coordinación'], ['#/bodega', 'Bodega'], ['#/marketing', 'Marketing'], ['#/gerencia', 'Gerencia']]],
];

function pintarNav(actual) {
  const nuevas = ctx.st.cotizaciones.filter((q) => q.estado === 'Nueva').length;
  const decisiones = ctx.st.descuentos.filter((d) => d.estado === 'Pendiente').length + C.sinSeguimiento(ctx.st).length;
  const pedidos = ctx.st.cotizaciones.filter((q) => q.pedido && q.pedido.estado !== 'Entregado').length;
  const num = { '#/asesor': nuevas, '#/coordinacion': decisiones, '#/bodega': pedidos };
  document.getElementById('nav').innerHTML = NAV.map(([g, items]) => `<div class="nav-grupo">${g}</div>${items.map(([h, t]) =>
    `<a class="nav-item" href="${h}" ${h === actual ? 'aria-current="page"' : ''}>${t}${num[h] ? `<span class="nav-num">${num[h]}</span>` : ''}</a>`).join('')}`).join('');
}

const TITULOS = { '': 'Inicio', diagnostico: 'Diagnóstico', plan: 'Plan', catalogo: 'Catálogo', seguimiento: 'Mi pedido', asesor: 'Bandeja', coordinacion: 'Coordinación', bodega: 'Bodega', marketing: 'Marketing', gerencia: 'Gerencia' };

function render(mantenerScroll = false) {
  const [ruta, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [seccion = '', param] = ruta.split('/');
  const q = new URLSearchParams(query);
  if (seccion === 'catalogo' && q.get('campana')) {
    ctx.ui.origen = { campana: q.get('campana'), origen: q.get('origen') || 'Enlace de campaña' };
    try { sessionStorage.setItem('carsystem-origen', JSON.stringify(ctx.ui.origen)); } catch { /* opcional */ }
  }
  const vistas = { '': inicio, diagnostico, plan: () => plan(ctx), catalogo, seguimiento: (c) => seguimiento(c, param), asesor: (c) => asesor(c, param), coordinacion, bodega, marketing, gerencia };
  const vista = vistas[seccion] || inicio;
  const m = document.getElementById('contenido');
  const y = scrollY;
  m.innerHTML = vista(ctx);
  pintarNav(seccion ? `#/${seccion}` : '#/');
  document.title = `${TITULOS[seccion] ?? 'Inicio'} · Carsystem Hub`;
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

function verEvidencia(code) {
  const E = ctx.evid;
  const conv = E.conversaciones.find((x) => x.codigo === code);
  const correo = E.correos.find((x) => x.codigo === code);
  const persona = E.equipo.find((x) => x.testimonio.codigo === code);
  const res = E.resenas.find((x) => x.codigo === code);
  const inc = E.incidentes.find((x) => x.codigo === code);
  if (conv) {
    return abrirDialogo(`${code} · ${conv.titulo}`, `<p class="tenue peq">${esc(conv.canal)} · ${esc(conv.contactoVisible)}</p><div class="chat">${conv.mensajes.map((m) =>
      m.autor === 'nota' ? `<div class="nota">${esc(m.texto)}</div>` : `<div class="burbuja ${m.autor === 'asesor' ? 'sal' : ''}">${esc(m.texto)}<div class="mt">${esc(m.fecha)} ${esc(m.hora)}</div></div>`).join('')}</div><p class="tenue peq">${esc(conv.fuente)}</p>`);
  }
  if (correo) return abrirDialogo(`${code} · ${correo.asunto}`, correo.mensajes.map((m) => `<div class="carta"><b class="peq">${esc(m.de)}</b><p style="white-space:pre-line">${esc(m.cuerpo)}</p></div>`).join(''));
  if (persona) return abrirDialogo(`${code} · ${persona.nombre}`, `<p class="tenue peq">${esc(persona.cargo)}</p><p>“${esc(persona.testimonio.texto)}”</p><p class="tenue peq">${esc(persona.testimonio.contexto)}</p>`);
  if (res) return abrirDialogo(`${code} · Reseña de ${res.estrellas} estrellas`, `<p>“${esc(res.texto)}”</p><p class="tenue peq">${esc(res.fecha)}</p>`);
  if (inc) return abrirDialogo(`${code} · ${inc.titulo}`, `<p>${esc(inc.impacto)}</p><p class="tenue peq">${esc(inc.fecha)} · duración ${esc(inc.duracion)}</p>`);
  const REF = {
    'COT-01': 'Base de 96 cotizaciones con canal, horas de respuesta, estado y motivo de pérdida.',
    'VTA-01': 'Base de 44 ventas registradas desde cotizaciones ganadas.',
    'INT-01': 'Base de 204 interacciones reconstruidas desde chats, llamadas e Instagram.',
    'INV-01': 'Inventario de 12 referencias: hoja frente al conteo físico del 30 de septiembre.',
    'MKT-01': 'Resultados de las 5 campañas del trimestre.', 'MKT-02': 'Las 22 publicaciones de Instagram y Facebook.',
    'OPE-01': 'Documentación del proceso comercial actual en nueve etapas.',
    'GER-02': 'Restricciones de la gerencia: presupuesto, personas, tiempo, continuidad, adopción y normativa.',
    'TEC-03': 'Prácticas actuales de seguridad: cuentas compartidas, sin verificación en dos pasos, permisos amplios y datos personales.',
  };
  return abrirDialogo(code, `<p>${esc(REF[code] || 'Evidencia del expediente.')}</p><p class="tenue peq">Consulte el detalle en el Centro de Inteligencia de Carsystem.</p>`);
}

const ACCIONES = {
  ev: (d) => verEvidencia(d.code),
  'cerrar-dlg': cerrarDialogo,
  reiniciar: () => {
    if (!confirm('¿Reiniciar la demo? Se borran los cambios guardados en este navegador.')) return;
    ctx.st = C.estadoInicial(); ctx.ui.borrador = {}; guardar(); render(); aviso('Demo reiniciada');
  },
  solicitar: (d) => abrirDialogo(d.sku ? 'Pedir cotización' : 'Pedir asesoría', formularioSolicitud(ctx, d.sku)),
  'elegir-sku': (d) => {
    const b = ctx.ui.borrador[d.id]; b.sku = d.sku; b.confirmar = null; render(true);
  },
  enviar: (d) => cambio(() => { const b = ctx.ui.borrador[d.id]; C.enviarCotizacion(ctx.st, d.id, b.sku, b.cantidad); }, 'Cotización enviada: precio, stock y entrega'),
  copiar: async (d) => {
    try { await navigator.clipboard.writeText(d.texto); aviso('Copiado'); } catch { aviso('No se pudo copiar', true); }
  },
  ganar: (d) => cambio(() => {
    const q = ctx.st.cotizaciones.find((x) => x.id === d.id);
    C.cerrarGanada(ctx.st, d.id, C.promesaEntrega(C.stockDe(ctx.data, ctx.st, q.sku), q.cantidad).texto);
  }, 'Venta ganada: pedido enviado a bodega'),
  perder: (d) => cambio(() => C.cerrarPerdida(ctx.st, d.id, document.getElementById(`motivo-${d.id}`).value), 'Cerrada con motivo registrado'),
  'pedir-dcto': (d) => abrirDialogo('Solicitar descuento', `<form class="pila" data-submit="crear-dcto"><input type="hidden" name="id" value="${esc(d.id)}">
    <label class="campo">Porcentaje<input name="pct" type="number" min="1" max="30" required></label>
    <label class="campo">Motivo<textarea name="motivo" required></textarea></label>
    <p class="tenue peq">Lo decide la coordinación comercial.</p><button class="btn pri">Enviar a coordinación</button></form>`),
  'dcto-si': (d) => cambio(() => C.resolverDescuento(ctx.st, d.id, true), 'Descuento aprobado'),
  'dcto-no': (d) => cambio(() => C.resolverDescuento(ctx.st, d.id, false), 'Descuento rechazado'),
  avanzar: (d) => cambio(() => C.avanzarPedido(ctx.st, d.id), 'Estado actualizado; el cliente ya lo ve'),
};

const ENVIOS = {
  nada: () => {},
  'crear-solicitud': (f) => {
    const o = ctx.ui.origen;
    const q = C.crearSolicitud(ctx.st, {
      contacto: f.get('contacto'), vehiculo: f.get('vehiculo'), sku: f.get('sku'), cantidad: Number(f.get('cantidad')), autoriza: f.get('autoriza') === 'on',
      telefonoParcial: f.get('telefono'), origen: o?.origen || 'Portal directo', campana: o?.campana,
      mensaje: [f.get('vehiculo'), f.get('sku') ? C.norm(ctx.data.productos.find((p) => p.sku === f.get('sku')).producto) : ''].filter(Boolean).join(' · '),
    });
    guardar();
    cerrarDialogo();
    render(true);
    abrirDialogo(`Solicitud ${q.id} recibida`, `<p>Un asesor valida la disponibilidad y le responde con el valor final.</p><div class="fila"><a class="btn pri" href="#/seguimiento/${q.id}" data-act="cerrar-dlg">Seguir mi solicitud</a><a class="btn" href="#/asesor/${q.id}" data-act="cerrar-dlg">Ver como asesor</a></div>`);
  },
  'buscar-pedido': (f) => { location.hash = `#/seguimiento/${f.get('id').trim().toUpperCase()}`; },
  'crear-dcto': (f) => { cerrarDialogo(); cambio(() => C.solicitarDescuento(ctx.st, f.get('id'), Number(f.get('pct')), f.get('motivo')), 'Solicitud enviada a coordinación'); },
  'crear-pqr': (f) => cambio(() => C.crearPQR(ctx.st, f.get('id'), f.get('tipo'), f.get('descripcion')), 'Caso registrado y ligado a la venta'),
  conteo: (f) => cambio(() => C.registrarConteo(ctx.st, f.get('sku'), Number(f.get('fisico'))), 'Conteo guardado'),
};

const ENTRADAS = {
  'f-marca': (v) => { Object.assign(ctx.ui.catalogo, { marca: v, modelo: '' }); render(true); },
  'f-modelo': (v) => { ctx.ui.catalogo.modelo = v; refrescarCatalogo(ctx); },
  'f-anio': (v) => { ctx.ui.catalogo.anio = v; refrescarCatalogo(ctx); },
  'f-texto': (v) => { ctx.ui.catalogo.texto = v; refrescarCatalogo(ctx); },
  'b-sku': (v, e) => { const b = ctx.ui.borrador[e.dataset.id]; b.sku = v; b.confirmar = null; render(true); },
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
// Texto libre se refresca al escribir; números y enlaces al terminar, para no perder el foco.
document.addEventListener('input', (e) => { if (['f-texto', 'recupera'].includes(e.target.dataset.input)) ENTRADAS[e.target.dataset.input](e.target.value, e.target); });
document.addEventListener('change', (e) => {
  const n = e.target.dataset.input;
  if (n && !['f-texto', 'recupera'].includes(n)) ENTRADAS[n](e.target.value, e.target);
});
addEventListener('hashchange', () => render());

async function arrancar() {
  try {
    const [d, ev_] = await Promise.all(['data/hub.json', 'data/evidencias.json'].map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); })));
    ctx.data = d; ctx.evid = ev_;
    ctx.k = C.indicadores(d);
    ctx.st = cargar();
    try { ctx.ui.origen = JSON.parse(sessionStorage.getItem('carsystem-origen')); } catch { /* opcional */ }
    activarTooltips();
    render();
  } catch (e) {
    document.getElementById('contenido').innerHTML = '<p class="carta">No se pudieron cargar los datos. Abra el sitio desde un servidor web (GitHub Pages o <code>python -m http.server</code>).</p>';
  }
}
arrancar();
