// Portal del equipo: cada rol ve solo lo que necesita para su trabajo.
import {
  MOTIVOS_PERDIDA, SLA_LIMITE_MIN, cop, copM, dec, dur, indicadoresPiloto, mensajeCotizacion, minutosHastaPrecio,
  nivelSLA, pct, promesaEntrega, proximaRuta, sinSeguimiento, stockDe, sugerir,
} from './core.js?v=4';
import { barras, barras2, cab, esc, etiqueta, kpi, tabla, tacometro } from './ui.js?v=4';

export const hace = (iso) => dur((Date.now() - new Date(iso)) / 60000);
const EMPLEADOS = { E02: 'Patricia', E03: 'Andrés', E04: 'Valentina', E05: 'Jhon Fredy', E06: 'Óscar' };
const nombreCliente = (ctx, q) => ctx.data.clientes.find((c) => c.cliente_id === q.clienteId)?.nombre || q.contacto;
const prod = (ctx, sku) => ctx.data.productos.find((p) => p.sku === sku);

const pastillaEstado = (q) => {
  const n = nivelSLA(q);
  if (!n) return etiqueta(q.estado, { Cotizada: 'info', Ganada: 'ok', Perdida: 'mal' }[q.estado]);
  return etiqueta(dur(minutosHastaPrecio(q)), { ok: 'ok', riesgo: 'aviso', vencido: 'mal' }[n]);
};
const colorSLA = { ok: 'var(--volt)', riesgo: 'var(--naranja)', vencido: 'var(--rojo)' };

function detalle(ctx, q) {
  const { data, st, ui } = ctx;
  const c = data.clientes.find((x) => x.cliente_id === q.clienteId);
  const hist = q.clienteId ? data.cotizaciones.filter((x) => x.cliente_id === q.clienteId) : [];
  const ia = sugerir(data, q.mensaje);
  const sel = ui.borrador[q.id] || { sku: q.sku || ia.candidatos[0]?.sku || '', cantidad: q.sku ? q.cantidad : ia.cantidad };
  ui.borrador[q.id] = sel;
  const p = prod(ctx, sel.sku);
  const advertencia = ia.candidatos.find((x) => x.sku === sel.sku)?.confirmar;
  const promesa = p ? promesaEntrega(stockDe(data, st, sel.sku), sel.cantidad) : null;
  const borrador = p ? mensajeCotizacion(p, { ...q, cantidad: sel.cantidad }, promesa) : '';
  const dcto = st.descuentos.find((d) => d.cotizacionId === q.id);
  const veh = [ia.vehiculo.marca, ia.vehiculo.modelo, ia.vehiculo.anio].filter(Boolean).join(' ');
  const abierta = q.estado === 'Nueva';
  const nivel = nivelSLA(q);
  const min = minutosHastaPrecio(q);

  return `<div class="carta pila">
    <div class="cab-q">
      <div><h2>${esc(nombreCliente(ctx, q))}</h2><p class="tenue peq">${q.id} · ${esc(q.canal)} · ${esc(q.origen)}</p>
      ${c ? `<p class="tenue peq">${esc(c.segmento)} · ${esc(c.condicion_pago || 'Contado')} · ${hist.filter((x) => x.estado === 'Ganada').length} compras de ${hist.length} cotizaciones ${c.autoriza_tratamiento_datos !== 'Sí' ? '· Falta autorización de datos' : ''}</p>` : '<p class="tenue peq">Cliente nuevo</p>'}</div>
      ${abierta ? tacometro(min / SLA_LIMITE_MIN, dur(min), 'sin precio', colorSLA[nivel]) : pastillaEstado(q)}
    </div>
    <div class="burbuja">${esc(q.mensaje || q.vehiculo || 'Solicitud desde la tienda')}</div>
    ${q.autorespuesta ? '<p class="tenue peq">Fuera de horario: ya recibió respuesta automática con el enlace a la tienda.</p>' : ''}
    ${abierta ? `
    <div class="panel-ia">
      <p class="tenue peq">Sugerencia del asistente${veh ? ` para ${esc(veh)}` : ''}</p>
      ${ia.candidatos.length ? ia.candidatos.map((x) => {
        const pr = prod(ctx, x.sku); const s = stockDe(data, st, x.sku);
        return `<div class="sugerencia ${x.sku === sel.sku ? 'activa' : ''}"><div><b class="peq">${esc(pr.producto)}</b><br><span class="peq tenue">${cop(pr.precio_cop)} · ${s.disponible} disponibles</span></div><button class="btn" data-act="elegir-sku" data-id="${q.id}" data-sku="${x.sku}" ${x.sku === sel.sku ? 'disabled' : ''}>${x.sku === sel.sku ? 'Elegida' : 'Usar'}</button></div>`;
      }).join('') : '<p class="peq tenue">Sin coincidencias. Pide marca, modelo y año.</p>'}
      ${advertencia ? `<label class="check ojo"><input type="checkbox" data-input="confirmar-var" data-id="${q.id}" ${sel.confirmar ? 'checked' : ''}><span><b>Antes de cotizar:</b> ${esc(advertencia)}</span></label>` : ''}
    </div>
    <div class="rejilla c2">
      <label class="campo">Referencia<select data-input="b-sku" data-id="${q.id}"><option value="">Elige</option>${data.productos.map((x) => `<option value="${x.sku}" ${x.sku === sel.sku ? 'selected' : ''}>${esc(x.producto)}</option>`).join('')}</select></label>
      <label class="campo">Cantidad<input type="number" min="1" max="50" value="${sel.cantidad}" data-input="b-cant" data-id="${q.id}"></label>
    </div>
    ${p ? `<div class="burbuja sal">${esc(borrador)}</div>` : ''}
    <div class="fila">
      <button class="btn pri" data-act="enviar" data-id="${q.id}" ${!p || (advertencia && !sel.confirmar) ? 'disabled' : ''}>Enviar por WhatsApp</button>
      <button class="btn" data-act="copiar" data-texto="${esc(borrador)}" ${p ? '' : 'disabled'}>Copiar</button>
    </div>` : ''}
    ${q.estado === 'Cotizada' ? `
    <p>Cotizado hace ${hace(q.cotizadaEn)}: <b>${q.cantidad} × ${esc(prod(ctx, q.sku).producto)}</b>, ${cop(prod(ctx, q.sku).precio_cop * (1 - q.descuentoPct / 100) * q.cantidad)}${q.descuentoPct ? ` con ${q.descuentoPct} %` : ''}.</p>
    ${dcto ? `<p class="peq">Descuento de ${dcto.pct} %: ${etiqueta(dcto.estado, dcto.estado === 'Aprobado' ? 'ok' : dcto.estado === 'Rechazado' ? 'mal' : 'aviso')}</p>` : ''}
    <div class="fila"><button class="btn pri" data-act="ganar" data-id="${q.id}">Marcar ganada</button><button class="btn" data-act="pedir-dcto" data-id="${q.id}">Pedir descuento</button></div>
    <div class="fila" style="align-items:flex-end"><label class="campo" style="flex:1">Si se perdió, ¿por qué?<select id="motivo-${q.id}"><option value="">Elige un motivo</option>${MOTIVOS_PERDIDA.map((m) => `<option>${m}</option>`).join('')}</select></label><button class="btn pel" data-act="perder" data-id="${q.id}" style="padding:12px 16px">Cerrar perdida</button></div>` : ''}
    ${['Ganada', 'Perdida'].includes(q.estado) ? `<p>${pastillaEstado(q)} ${q.motivo ? esc(q.motivo) : ''}${q.pedido ? `Pedido ${esc(q.pedido.estado.toLowerCase())}.` : ''} <a class="tenue" href="#/pedido/${q.id}">Ver como cliente</a></p>` : ''}
  </div>`;
}

export function asesor(ctx, id) {
  const orden = { Nueva: 0, Cotizada: 1, Ganada: 2, Perdida: 3 };
  const cola = [...ctx.st.cotizaciones].sort((a, b) => orden[a.estado] - orden[b.estado] || new Date(a.creada) - new Date(b.creada));
  const actual = ctx.st.cotizaciones.find((q) => q.id === id) || cola[0];
  return `
  ${cab('Bandeja', 'Todos los canales en una cola. El reloj corre hasta enviar el precio.')}
  <div class="bandeja">
    <nav class="cola" aria-label="Solicitudes">${cola.map((q) => `
      <a class="tiquete" href="#/equipo/bandeja/${q.id}" aria-current="${q === actual}">
        <span class="fila entre"><b class="peq">${esc(nombreCliente(ctx, q))}</b>${pastillaEstado(q)}</span>
        <span class="res">${esc(q.mensaje || q.vehiculo || 'Solicitud de la tienda')}</span>
      </a>`).join('')}</nav>
    ${actual ? detalle(ctx, actual) : ''}
  </div>`;
}

export function coordinacion(ctx) {
  const { st, data } = ctx;
  const alertas = sinSeguimiento(st);
  const vencidas = st.cotizaciones.filter((q) => nivelSLA(q) === 'vencido');
  const pendientes = st.descuentos.filter((d) => d.estado === 'Pendiente');
  const pqr = [...st.pqr, ...data.pqr.filter((p) => p.estado === 'Abierta')];
  return `
  ${cab('Coordinación', 'Lo que necesita atención hoy.')}
  <div class="rejilla c4">
    ${kpi('Abiertas', st.cotizaciones.filter((q) => ['Nueva', 'Cotizada'].includes(q.estado)).length)}
    ${kpi('Más de 4 h sin precio', vencidas.length)}
    ${kpi('Sin seguimiento', alertas.length, 'más de 24 h')}
    ${kpi('Descuentos por decidir', pendientes.length)}
  </div>
  <section class="seccion rejilla c2">
    <div class="carta pila"><h2>Descuentos</h2>${pendientes.length ? pendientes.map((d) => {
      const q = st.cotizaciones.find((x) => x.id === d.cotizacionId);
      const p = prod(ctx, q.sku);
      const costo = data.inventario.find((i) => i.sku === q.sku).costo_promedio_cop;
      return `<div class="pila" style="gap:6px"><p><b>${esc(nombreCliente(ctx, q))}</b> pide ${d.pct} %</p><p class="peq tenue">${esc(d.motivo)}</p><p class="peq">${cop(p.precio_cop)} → ${cop(p.precio_cop * (1 - d.pct / 100))} · Costo ${cop(costo)}</p><div class="fila"><button class="btn pri" data-act="dcto-si" data-id="${d.id}">Aprobar</button><button class="btn" data-act="dcto-no" data-id="${d.id}">Rechazar</button></div></div>`;
    }).join('') : '<p class="tenue">Nada por decidir.</p>'}</div>
    <div class="carta pila"><h2>Alertas</h2>
      ${vencidas.map((q) => `<a class="tarj" href="#/equipo/bandeja/${q.id}"><b>${esc(nombreCliente(ctx, q))}</b> · ${hace(q.creada)} sin precio</a>`).join('')}
      ${alertas.map((q) => `<a class="tarj" href="#/equipo/bandeja/${q.id}"><b>${esc(nombreCliente(ctx, q))}</b> · sin respuesta hace ${hace(q.cotizadaEn)}</a>`).join('')}
      ${!vencidas.length && !alertas.length ? '<p class="tenue">Nada pendiente.</p>' : ''}
    </div>
  </section>
  <section class="seccion"><h2>Embudo</h2><div class="tablero">${['Nueva', 'Cotizada', 'Ganada', 'Perdida'].map((e) => {
    const qs = st.cotizaciones.filter((q) => q.estado === e);
    return `<div class="columna"><h3>${e}<span>${qs.length}</span></h3>${qs.map((q) => `<a class="tarj" href="#/equipo/bandeja/${q.id}">${esc(nombreCliente(ctx, q))}${q.motivo ? `<br><span class="tenue">${esc(q.motivo)}</span>` : ''}</a>`).join('')}</div>`;
  }).join('')}</div></section>
  <section class="seccion"><h2>Reclamos abiertos</h2><div class="carta">${pqr.length ? tabla([{ t: 'Código' }, { t: 'Tipo' }, { t: 'Referencia' }, { t: 'Qué pasó' }, { t: 'Responsable' }],
    pqr.map((p) => [esc(p.pqr_id), esc(p.tipo), esc(p.sku), esc(p.descripcion), esc(EMPLEADOS[p.responsable] || 'Coordinación')])) : '<p class="tenue">Sin casos abiertos.</p>'}</div></section>`;
}

export function bodega(ctx) {
  const { st, data } = ctx;
  const pedidos = st.cotizaciones.filter((q) => q.pedido && q.pedido.estado !== 'Entregado');
  const inv = data.inventario.map((i) => ({ i, s: stockDe(data, st, i.sku) }));
  const accion = { Confirmado: 'Alistar', Alistando: 'Salió a ruta', 'En ruta': 'Entregado' };
  return `
  ${cab('Bodega', `Próxima salida: ${proximaRuta().texto}`)}
  <section class="pila">${pedidos.length ? pedidos.map((q) => `
    <div class="carta fila entre"><div><b>${q.cantidad} × ${esc(prod(ctx, q.sku).producto)}</b><br><span class="peq tenue">${esc(nombreCliente(ctx, q))} · ${esc(q.pedido.promesa)}</span></div>
    <div class="fila">${etiqueta(q.pedido.estado, 'info')}<button class="btn pri" data-act="avanzar" data-id="${q.id}">${accion[q.pedido.estado]}</button></div></div>`).join('') : '<p class="carta tenue">No hay pedidos activos.</p>'}</section>
  <section class="seccion"><h2>Existencias</h2>
  <div class="carta">${tabla([{ t: 'Referencia' }, { t: 'Físico', n: 1 }, { t: 'Reservado', n: 1 }, { t: 'Disponible', n: 1 }, { t: 'Mínimo', n: 1 }, { t: 'Nuevo conteo' }],
    inv.map(({ i, s }) => [`${esc(i.producto)}<br><span class="mono tenue">${i.sku}</span>`, s.fisico, s.reservado, `${s.disponible} ${s.disponible <= s.minimo ? etiqueta('Bajo', 'aviso') : ''}`, s.minimo,
      `<form class="fila" data-submit="conteo" style="flex-wrap:nowrap"><input type="hidden" name="sku" value="${i.sku}"><input aria-label="Conteo de ${i.producto}" name="fisico" type="number" min="0" style="width:84px;padding:7px 10px" required><button class="btn" style="padding:7px 13px">Guardar</button></form>`]))}</div></section>`;
}

export function marketing(ctx) {
  const { data, st, k } = ctx;
  const sim = st.cotizaciones.filter((q) => q.campana);
  const u = ctx.ui.utm;
  const hash = `#/?campana=${encodeURIComponent(u.campana)}&origen=${encodeURIComponent(u.origen)}`;
  const enlace = `${location.origin}${location.pathname}${hash}`;
  return `
  ${cab('Marketing', 'Qué comunicación termina en una venta.')}
  <div class="rejilla c3">
    ${kpi('Mensajes en plataformas', k.mensajesPlataforma, 'julio a septiembre')}
    ${kpi('Contactos con origen', k.contactosCampana)}
    ${kpi('Solicitudes con origen', `${pct(k.origenRegistrado, k.solicitudes)} %`, 'meta: 85 %')}
  </div>
  <section class="seccion"><h2>Campañas</h2><div class="carta">${tabla(
    [{ t: 'Campaña' }, { t: 'Inversión', n: 1 }, { t: 'Contactos', n: 1 }, { t: 'Cotizaciones', n: 1 }, { t: 'Ventas', n: 1 }, { t: 'Valor', n: 1 }],
    data.campanas.map((c) => [`${esc(c.nombre)}<br><span class="tenue peq">${esc(c.tipo)}</span>`, c.inversion_cop ? cop(c.inversion_cop) : 'Sin pauta', c.contactos_registrados, c.cotizaciones_con_origen, c.ventas_con_origen, cop(c.valor_ventas_con_origen_cop)]))}
  </div></section>
  <section class="seccion rejilla c2">
    <form class="carta pila" data-submit="nada"><h2>Crear enlace</h2>
      <div class="rejilla c2"><label class="campo">Campaña<input data-input="u-campana" value="${esc(u.campana)}"></label>
      <label class="campo">Origen<select data-input="u-origen">${['Pauta Instagram', 'Publicación Instagram', 'Publicación Facebook', 'Perfil de Google', 'Difusión WhatsApp talleres'].map((o) => `<option ${o === u.origen ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div>
      <input aria-label="Enlace generado" id="utm-url" readonly value="${esc(enlace)}">
      <div class="fila"><button type="button" class="btn pri" data-act="copiar" data-texto="${esc(enlace)}">Copiar enlace</button><a class="btn" href="${esc(hash)}">Probar</a></div>
    </form>
    <div class="carta"><h2 style="margin-bottom:9px">Atribuidas en esta demo</h2>${sim.length ? tabla([{ t: 'Cliente' }, { t: 'Campaña' }, { t: 'Estado' }], sim.map((q) => [esc(nombreCliente(ctx, q)), esc(q.campana), etiqueta(q.estado)])) : '<p class="tenue">Aún no hay.</p>'}</div>
  </section>`;
}

export function gerencia(ctx) {
  const { data, st, ui, k } = ctx;
  const p = indicadoresPiloto(st);
  const meses = { '2026-07': 'Julio', '2026-08': 'Agosto', '2026-09': 'Septiembre' };
  const conf = (t) => (t == null ? 'Sin cierres' : `${Math.round(t)} % (${p.ganadas} de ${p.cerradas})`);
  const metas = [
    ['Tiempo hasta el precio', dur(k.medianaPrecio), '≤ 4 h', p.medianaPrecio == null ? 'Sin datos' : dur(p.medianaPrecio)],
    ['Tasa de cierre', `${dec(k.tasaCierre)} %`, '≥ 55 %', conf(p.tasa)],
    ['Perdidas por demora', k.perdidasTardanza, '−50 %', st.cotizaciones.filter((q) => ['Respuesta tardía', 'Sin seguimiento'].includes(q.motivo)).length],
    ['Solicitudes con origen', `${pct(k.origenRegistrado, k.solicitudes)} %`, '≥ 85 %', `${p.origen} %`],
    ['Perdidas con motivo', `${pct(k.motivoRegistrado, k.perdidas)} %`, '100 %', p.motivo == null ? 'Sin cierres' : `${p.motivo} %`],
    ['Referencias recontadas', `${k.skusCoinciden} de ${k.skus} coinciden`, '≥ 95 %', `${Object.keys(st.conteos).length} de ${k.skus}`],
  ];
  const recuperado = (k.valorTardanza * ui.recupera) / 100;
  return `
  ${cab('Gerencia', 'Una sola fuente de datos para decidir.')}
  <div class="rejilla c3">
    <div class="carta" style="text-align:center">${tacometro(k.tasaCierre / 100, `${dec(k.tasaCierre)} %`, 'tasa de cierre', 'var(--volt)', 'gauge gauge-g')}<p class="tenue peq">Meta: 55 %</p></div>
    ${kpi('Ventas del trimestre', copM(k.valorVentas), `${k.ventas} ventas · ticket ${cop(k.ticket)}`)}
    ${kpi('Tiempo hasta el precio', dur(k.medianaPrecio), `Ganadas ${dur(k.medianaPrecioGanada)} · perdidas ${dur(k.medianaPrecioPerdida)}`)}
  </div>
  <section class="seccion rejilla c2">
    <div class="carta"><h2 style="margin-bottom:12px">Cierre según el tiempo hasta el precio</h2>${barras(k.tramos.map((t) => ({ et: t.etiqueta, valor: t.tasa, texto: `${t.tasa} %`, tip: `${t.ganadas} de ${t.n} cotizaciones`, clase: t.tasa < 40 ? 'b' : '' })), { max: 100 })}</div>
    <div class="carta"><h2 style="margin-bottom:12px">Cotizaciones por mes</h2>${barras2(Object.entries(meses).map(([m, n]) => { const s = data.cotizaciones.filter((q) => q.fecha.startsWith(m)); const a = s.filter((q) => q.estado === 'Ganada').length; return { et: n, a, b: s.length - a }; }), ['Ganadas', 'Perdidas'])}</div>
  </section>
  <section class="seccion"><h2>Indicadores del cambio</h2><p class="nota-sec">“Demo” resume los casos simulados de este navegador; no es un resultado real.</p><div class="carta">${tabla([{ t: 'Indicador' }, { t: 'Julio a septiembre' }, { t: 'Meta' }, { t: 'Demo' }], metas)}</div></section>
  <section class="seccion rejilla c2">
    <div class="carta pila"><h2>Si recuperamos lo perdido por demora</h2>
      <label class="campo">Recuperar ${ui.recupera} % de ${k.perdidasTardanza} cotizaciones<input type="range" min="0" max="100" step="5" value="${ui.recupera}" data-input="recupera"></label>
      <div class="kpi"><div class="val">${copM(recuperado)}</div><div class="nota">por trimestre, +${((100 * recuperado) / k.valorVentas).toFixed(0)} % sobre las ventas. Escenario ilustrativo de ingresos.</div></div>
    </div>
    <div class="carta"><h2 style="margin-bottom:9px">Actividad reciente</h2><div class="tabla-env" style="max-height:230px;overflow-y:auto">${tabla([{ t: 'Hace' }, { t: 'Quién' }, { t: 'Qué' }], st.eventos.slice(0, 20).map((e) => [hace(e.t), esc(e.actor), `${esc(e.accion)} ${esc(e.ref)}`]))}</div></div>
  </section>
  <p class="peq" style="margin-top:18px"><a class="tenue" href="dashboard.html">Abrir el dashboard histórico</a></p>`;
}
