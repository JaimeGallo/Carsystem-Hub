// Vistas internas por rol: asesor, coordinación, bodega, marketing y gerencia.
import {
  MOTIVOS_PERDIDA, cop, copM, dec, dur, indicadoresPiloto, mensajeCotizacion, minutosHastaPrecio,
  nivelSLA, pct, promesaEntrega, proximaRuta, sinSeguimiento, stockDe, sugerir,
} from './core.js';
import { avisoDemo, barras, barras2, cab, esc, ev, etiqueta, kpi, tabla } from './ui.js';

const EMPLEADOS = { E02: 'Patricia', E03: 'Andrés', E04: 'Valentina', E05: 'Jhon Fredy', E06: 'Óscar' };
export const hace = (iso) => dur((Date.now() - new Date(iso)) / 60000);
const nombreCliente = (ctx, q) => ctx.data.clientes.find((c) => c.cliente_id === q.clienteId)?.nombre || q.contacto;
const prod = (ctx, sku) => ctx.data.productos.find((p) => p.sku === sku);

const QUE_PASO = {
  'AT-01': 'En el expediente: tras 4 horas sin precio, el taller respondió “ya las conseguí”.',
  'AT-02': 'En el expediente: al día siguiente lo enviaron a WhatsApp, sin precio ni orientación.',
  'AT-04': 'En el expediente: el precio llegó 50 horas después y ya había comprado en otro almacén.',
  'AT-05': 'En el expediente: 6,5 horas sin respuesta y la batería no servía por el borne invertido.',
  'AT-07': 'En el expediente: el precio tardó 20 horas, un 2 % no alcanzó y la venta se perdió.',
  'AT-08': 'En el expediente: se prometió la ruta de las 10:00 y llegó después de las 4:00 p. m.',
  'AT-09': 'En el expediente: nadie contestó el sábado y el lunes ya estaba resuelto con otro proveedor.',
};

const pastillaSLA = (q) => {
  const n = nivelSLA(q);
  if (!n) return etiqueta(q.estado, { Cotizada: 'info', Ganada: 'ok', Perdida: 'mal' }[q.estado]);
  const m = dur(minutosHastaPrecio(q));
  return etiqueta(`${m} sin precio`, { ok: 'ok', riesgo: 'aviso', vencido: 'mal' }[n]);
};

function detalle(ctx, q) {
  const { data, st, ui } = ctx;
  const c = data.clientes.find((x) => x.cliente_id === q.clienteId);
  const hist = q.clienteId ? data.cotizaciones.filter((x) => x.cliente_id === q.clienteId) : [];
  const ia = sugerir(data, q.mensaje);
  const sel = ui.borrador[q.id] || { sku: q.sku || ia.candidatos[0]?.sku || '', cantidad: q.sku ? q.cantidad : ia.cantidad };
  ui.borrador[q.id] = sel;
  const p = prod(ctx, sel.sku);
  const conf = sel.confirmar ?? null;
  const advertencia = ia.candidatos.find((x) => x.sku === sel.sku)?.confirmar;
  const promesa = p ? promesaEntrega(stockDe(data, st, sel.sku), sel.cantidad) : null;
  const borrador = p ? mensajeCotizacion(p, { ...q, cantidad: sel.cantidad }, promesa) : '';
  const dcto = st.descuentos.find((d) => d.cotizacionId === q.id);
  const veh = [ia.vehiculo.marca, ia.vehiculo.modelo, ia.vehiculo.anio].filter(Boolean).join(' ');
  const abierta = q.estado === 'Nueva';

  return `<div class="carta pila">
    <div class="fila entre"><div><h2>${q.id} · ${esc(nombreCliente(ctx, q))}</h2><p class="tenue peq">${esc(q.canal)} · hace ${hace(q.creada)} · origen: ${esc(q.origen)}</p></div>${pastillaSLA(q)}</div>
    <div class="burbuja">${esc(q.mensaje || `${q.vehiculo || 'Solicitud desde el portal'}`)}</div>
    ${q.autorespuesta ? '<p class="tenue peq">Fuera de horario: respuesta automática enviada con el enlace al catálogo.</p>' : ''}
    ${q.evidencia ? `<div class="antes"><div class="fila">${esc(QUE_PASO[q.evidencia] || 'Caso reconstruido del expediente.')} ${ev(q.evidencia)}</div></div>` : ''}
    ${c ? `<p class="peq"><b>${c.cliente_id}</b> · ${esc(c.segmento)} · ${esc(c.condicion_pago || 'Contado')} · ${hist.length} cotizaciones, ${hist.filter((x) => x.estado === 'Ganada').length} ganadas en Q3 ${c.autoriza_tratamiento_datos !== 'Sí' ? '· ' + etiqueta('Falta autorización de datos', 'aviso') : ''}</p>` : '<p class="peq tenue">Prospecto sin ficha: se crea C### al confirmar.</p>'}
    ${abierta ? `
    <div class="panel-ia">
      <div class="fila entre"><b class="peq">Asistente por reglas</b><span class="tenue peq">${esc(ia.intencion)}${veh ? ' · ' + esc(veh) : ''}</span></div>
      ${ia.candidatos.length ? ia.candidatos.map((x) => {
        const pr = prod(ctx, x.sku); const s = stockDe(data, st, x.sku);
        return `<div class="sugerencia ${x.sku === sel.sku ? 'activa' : ''}"><div><b class="peq">${esc(pr.producto)}</b> <span class="mono tenue">${x.sku}</span><br><span class="peq tenue">${cop(pr.precio_cop)} · ${s.disponible} disponibles</span></div><button class="btn" data-act="elegir-sku" data-id="${q.id}" data-sku="${x.sku}" ${x.sku === sel.sku ? 'disabled' : ''}>${x.sku === sel.sku ? 'Elegida' : 'Usar'}</button></div>`;
      }).join('') : '<p class="peq tenue">Sin coincidencias: pida marca, modelo y año.</p>'}
      ${advertencia ? `<label class="check" style="color:var(--ambar)"><input type="checkbox" data-input="confirmar-var" data-id="${q.id}" ${conf ? 'checked' : ''}><span><b>Confirmar antes de cotizar.</b> ${esc(advertencia)}</span></label>` : ''}
    </div>
    <div class="rejilla c2">
      <label class="campo">Referencia<select data-input="b-sku" data-id="${q.id}"><option value="">Seleccione</option>${data.productos.map((x) => `<option value="${x.sku}" ${x.sku === sel.sku ? 'selected' : ''}>${x.sku} · ${esc(x.producto)}</option>`).join('')}</select></label>
      <label class="campo">Cantidad<input type="number" min="1" max="50" value="${sel.cantidad}" data-input="b-cant" data-id="${q.id}"></label>
    </div>
    ${p ? `<div class="burbuja sal">${esc(borrador)}</div>` : ''}
    <div class="fila">
      <button class="btn pri" data-act="enviar" data-id="${q.id}" ${!p || (advertencia && !conf) ? 'disabled' : ''}>Enviar por WhatsApp (simulado)</button>
      <button class="btn" data-act="copiar" data-texto="${esc(borrador)}" ${p ? '' : 'disabled'}>Copiar mensaje</button>
    </div>
    ${advertencia && !conf ? '<p class="peq" style="color:var(--ambar)">El envío se habilita cuando confirme la variante con el cliente.</p>' : ''}` : ''}
    ${q.estado === 'Cotizada' ? `
    <p class="peq">Cotizado hace ${hace(q.cotizadaEn)}: <b>${q.cantidad} × ${esc(prod(ctx, q.sku).producto)}</b>, ${cop(prod(ctx, q.sku).precio_cop * (1 - q.descuentoPct / 100) * q.cantidad)}${q.descuentoPct ? ` con ${q.descuentoPct} %` : ''}.</p>
    ${dcto ? `<p class="peq">Descuento de ${dcto.pct} %: ${etiqueta(dcto.estado, dcto.estado === 'Aprobado' ? 'ok' : dcto.estado === 'Rechazado' ? 'mal' : 'aviso')}</p>` : ''}
    <div class="fila"><button class="btn pri" data-act="ganar" data-id="${q.id}">Marcar ganada</button><button class="btn" data-act="pedir-dcto" data-id="${q.id}">Solicitar descuento</button></div>
    <div class="fila" style="align-items:flex-end"><label class="campo" style="flex:1">Si se perdió, motivo (obligatorio)<select id="motivo-${q.id}"><option value="">Seleccione</option>${MOTIVOS_PERDIDA.map((m) => `<option>${m}</option>`).join('')}</select></label><button class="btn pel" data-act="perder" data-id="${q.id}">Cerrar perdida</button></div>` : ''}
    ${['Ganada', 'Perdida'].includes(q.estado) ? `<p class="peq">Cerrada: <b>${q.estado}</b>${q.motivo ? ` · ${esc(q.motivo)}` : ''}${q.pedido ? ` · pedido ${esc(q.pedido.estado.toLowerCase())}` : ''}. <a href="#/seguimiento/${q.id}">Ver como cliente</a></p>` : ''}
  </div>`;
}

export function asesor(ctx, id) {
  const { st } = ctx;
  const orden = { Nueva: 0, Cotizada: 1, Ganada: 2, Perdida: 3 };
  const cola = [...st.cotizaciones].sort((a, b) => orden[a.estado] - orden[b.estado] || new Date(a.creada) - new Date(b.creada));
  const actual = st.cotizaciones.find((q) => q.id === id) || cola[0];
  return `
  ${cab('Asesor comercial', 'Bandeja única', 'WhatsApp, Instagram y portal en una sola cola. El cronómetro corre hasta enviar el precio, no hasta el primer saludo.')}
  ${avisoDemo('Datos simulados: siete casos reconstruidos de los chats del expediente. Las conversaciones se guardan solo en este navegador.')}
  <div class="bandeja">
    <div class="cola" aria-label="Solicitudes">${cola.map((q) => `
      <a href="#/asesor/${q.id}" style="text-decoration:none;color:inherit"><span class="tiquete" aria-pressed="${q === actual}">
        <span class="fila entre"><b>${q.id}</b>${pastillaSLA(q)}</span>
        <span class="peq">${esc(nombreCliente(ctx, q))}</span>
        <span class="res">${esc(q.mensaje || q.vehiculo || 'Solicitud del portal')}</span>
      </span></a>`).join('')}</div>
    ${actual ? detalle(ctx, actual) : ''}
  </div>`;
}

export function coordinacion(ctx) {
  const { st, data } = ctx;
  const alertas = sinSeguimiento(st);
  const vencidas = st.cotizaciones.filter((q) => nivelSLA(q) === 'vencido');
  const pendientes = st.descuentos.filter((d) => d.estado === 'Pendiente');
  const estados = ['Nueva', 'Cotizada', 'Ganada', 'Perdida'];
  const pqr = [...st.pqr, ...data.pqr.filter((p) => p.estado === 'Abierta')];
  return `
  ${cab('Coordinación comercial', 'Control del día', 'Lo que necesita atención hoy, sin esperar a la consolidación del viernes.')}
  <div class="rejilla c4">
    ${kpi('Abiertas', st.cotizaciones.filter((q) => ['Nueva', 'Cotizada'].includes(q.estado)).length, 'nuevas y cotizadas')}
    ${kpi('Más de 4 h sin precio', vencidas.length, 'objetivo: ninguna')}
    ${kpi('Sin seguimiento', alertas.length, 'cotizadas hace más de 24 h')}
    ${kpi('Descuentos por decidir', pendientes.length)}
  </div>
  <section class="seccion rejilla c2">
    <div class="carta pila"><h2>Descuentos</h2>${pendientes.length ? pendientes.map((d) => {
      const q = st.cotizaciones.find((x) => x.id === d.cotizacionId);
      const p = prod(ctx, q.sku);
      const margen = ctx.data.inventario.find((i) => i.sku === q.sku).costo_promedio_cop;
      const precio = p.precio_cop * (1 - d.pct / 100);
      return `<div class="pila" style="gap:5px"><p><b>${q.id}</b> · ${esc(nombreCliente(ctx, q))} pide ${d.pct} %</p><p class="peq tenue">${esc(d.motivo)}</p><p class="peq">Precio: ${cop(p.precio_cop)} → ${cop(precio)} · Costo: ${cop(margen)}</p><div class="fila"><button class="btn pri" data-act="dcto-si" data-id="${d.id}">Aprobar</button><button class="btn" data-act="dcto-no" data-id="${d.id}">Rechazar</button></div></div>`;
    }).join('') : '<p class="tenue">No hay solicitudes pendientes.</p>'}<p class="peq tenue">La automatización nunca autoriza descuentos.</p></div>
    <div class="carta pila"><h2>Alertas</h2>
      ${vencidas.map((q) => `<p class="peq">${etiqueta('Sin precio', 'mal')} <a href="#/asesor/${q.id}">${q.id}</a> · ${esc(nombreCliente(ctx, q))}, hace ${hace(q.creada)}</p>`).join('')}
      ${alertas.map((q) => `<p class="peq">${etiqueta('Seguimiento', 'aviso')} <a href="#/asesor/${q.id}">${q.id}</a> · ${esc(nombreCliente(ctx, q))}, sin respuesta hace ${hace(q.cotizadaEn)}</p>`).join('')}
      ${!vencidas.length && !alertas.length ? '<p class="tenue">Nada pendiente.</p>' : ''}
    </div>
  </section>
  <section class="seccion"><h2>Embudo de cotizaciones</h2><div class="tablero">${estados.map((e) => {
    const qs = st.cotizaciones.filter((q) => q.estado === e);
    return `<div class="columna"><h3>${e}<span>${qs.length}</span></h3>${qs.map((q) => `<div class="tarj"><a href="#/asesor/${q.id}">${q.id}</a> ${esc(nombreCliente(ctx, q))}${q.motivo ? `<br><span class="tenue">${esc(q.motivo)}</span>` : ''}</div>`).join('')}</div>`;
  }).join('')}</div></section>
  <section class="seccion"><h2>PQR abiertas</h2><div class="carta">${pqr.length ? tabla([{ t: 'Código' }, { t: 'Tipo' }, { t: 'Vínculo' }, { t: 'Descripción' }, { t: 'Responsable' }],
    pqr.map((p) => [esc(p.pqr_id), esc(p.tipo), `${esc(p.cotizacion_id || '')} · ${esc(p.sku)}`, esc(p.descripcion), esc(EMPLEADOS[p.responsable] || 'Coordinación')])) : '<p class="tenue">Sin casos abiertos.</p>'}</div></section>`;
}

export function bodega(ctx) {
  const { st, data } = ctx;
  const pedidos = st.cotizaciones.filter((q) => q.pedido && q.pedido.estado !== 'Entregado');
  const inv = data.inventario.map((i) => ({ i, s: stockDe(data, st, i.sku) }));
  const bajo = inv.filter(({ s }) => s.disponible <= s.minimo);
  const r = proximaRuta();
  const accion = { Confirmado: 'Iniciar alistamiento', Alistando: 'Salió a ruta', 'En ruta': 'Confirmar entrega' };
  return `
  ${cab('Bodega y mensajería', 'Pedidos y existencias', `Próxima salida: ${r.texto}. Esta vista no muestra precios, márgenes ni conversaciones.`)}
  <div class="rejilla c3">
    ${kpi('Por alistar o en ruta', pedidos.length)}
    ${kpi('Referencias bajo mínimo', bajo.length, 'según lo disponible')}
    ${kpi('Referencias recontadas', Object.keys(st.conteos).length, `de ${data.inventario.length} en esta demo`)}
  </div>
  <section class="seccion"><h2>Pedidos</h2><div class="pila">${pedidos.length ? pedidos.map((q) => `
    <div class="carta fila entre"><div><b>${q.id}</b> · ${q.cantidad} × ${esc(prod(ctx, q.sku).producto)} <span class="mono tenue">${q.sku}</span><br><span class="peq tenue">${esc(nombreCliente(ctx, q))} · ${esc(q.pedido.promesa)}</span></div>
    <div class="fila">${etiqueta(q.pedido.estado, 'info')}<button class="btn pri" data-act="avanzar" data-id="${q.id}">${accion[q.pedido.estado]}</button></div></div>`).join('') : '<p class="carta tenue">No hay pedidos activos.</p>'}</div></section>
  <section class="seccion"><h2>Inventario</h2><p class="nota-sec">El sistema parte del conteo físico del 30 de septiembre, no de la hoja. Cada conteo nuevo queda registrado.</p>
  <div class="carta">${tabla([{ t: 'SKU' }, { t: 'Producto' }, { t: 'Hoja (ant.)', n: 1 }, { t: 'Físico', n: 1 }, { t: 'Reservado', n: 1 }, { t: 'Disponible', n: 1 }, { t: 'Mínimo', n: 1 }, { t: 'Conteo' }],
    inv.map(({ i, s }) => [`<span class="mono">${i.sku}</span>`, esc(i.producto), i.stock_registrado, s.fisico, s.reservado, `${s.disponible} ${s.disponible <= s.minimo ? etiqueta('Bajo', 'aviso') : ''}`, s.minimo,
      `<form class="fila" data-submit="conteo" style="flex-wrap:nowrap"><input type="hidden" name="sku" value="${i.sku}"><input aria-label="Conteo de ${i.sku}" name="fisico" type="number" min="0" style="width:70px" required><button class="btn">Guardar</button></form>`]))}</div></section>`;
}

export function marketing(ctx) {
  const { data, st } = ctx;
  const k = ctx.k;
  const sim = st.cotizaciones.filter((q) => q.campana);
  const u = ctx.ui.utm;
  const enlace = `${location.origin}${location.pathname}#/catalogo?campana=${encodeURIComponent(u.campana)}&origen=${encodeURIComponent(u.origen)}`;
  return `
  ${cab('Marketing y contenidos', 'De la publicación a la venta', 'Las cifras de Q3 muestran el vacío de atribución. Los enlaces etiquetados permiten medir cada contacto desde ahora.')}
  <div class="rejilla c3">
    ${kpi('Mensajes en plataformas', k.mensajesPlataforma, 'MKT-01')}
    ${kpi('Contactos con origen', k.contactosCampana, `${pct(k.contactosCampana, k.mensajesPlataforma)} % frente a los mensajes`)}
    ${kpi('Solicitudes con origen', `${pct(k.origenRegistrado, k.solicitudes)} %`, 'meta ≥ 85 %')}
  </div>
  <section class="seccion"><h2>Campañas de Q3</h2><div class="carta">${tabla(
    [{ t: 'Campaña' }, { t: 'Inversión', n: 1 }, { t: 'Mensajes', n: 1 }, { t: 'Contactos', n: 1 }, { t: 'Cotiz.', n: 1 }, { t: 'Ventas', n: 1 }, { t: 'Valor', n: 1 }, { t: 'Valor / inversión', n: 1 }],
    data.campanas.map((c) => [`<b>${esc(c.nombre)}</b><br><span class="tenue peq">${c.campana_id} · ${esc(c.tipo)}</span>`, c.inversion_cop ? cop(c.inversion_cop) : 'Sin pauta', c.mensajes_recibidos_plataforma ?? '—', c.contactos_registrados, c.cotizaciones_con_origen, c.ventas_con_origen, cop(c.valor_ventas_con_origen_cop),
      c.inversion_cop ? `${(c.valor_ventas_con_origen_cop / c.inversion_cop).toFixed(2)} ×` : '—']))}
  <p class="tenue peq" style="margin-top:8px">Valor atribuido sobre datos incompletos: sirve para priorizar, no como retorno exacto. ${ev('MKT-01', 'TES-09')}</p></div></section>
  <section class="seccion rejilla c2">
    <form class="carta pila" data-submit="nada"><h2>Crear enlace de campaña</h2>
      <label class="campo">Código de campaña<input data-input="u-campana" value="${esc(u.campana)}"></label>
      <label class="campo">Origen<select data-input="u-origen">${['Pauta Instagram', 'Publicación Instagram', 'Publicación Facebook', 'Perfil de Google', 'Difusión WhatsApp talleres'].map((o) => `<option ${o === u.origen ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      <input aria-label="Enlace generado" id="utm-url" readonly value="${esc(enlace)}">
      <div class="fila"><button type="button" class="btn pri" data-act="copiar" data-texto="${esc(enlace)}">Copiar enlace</button><a class="btn" href="${esc(enlace.slice(enlace.indexOf('#')))}">Probarlo</a></div>
    </form>
    <div class="carta"><h2>Atribución en esta demo</h2>${sim.length ? tabla([{ t: 'Cotización' }, { t: 'Campaña' }, { t: 'Origen' }, { t: 'Estado' }], sim.map((q) => [`<a href="#/asesor/${q.id}">${q.id}</a>`, esc(q.campana), esc(q.origen), etiqueta(q.estado)])) : '<p class="tenue">Sin cotizaciones atribuidas.</p>'}</div>
  </section>`;
}

export function gerencia(ctx) {
  const { data, st, ui } = ctx;
  const k = ctx.k;
  const p = indicadoresPiloto(st);
  const meses = ['2026-07', '2026-08', '2026-09'];
  const nom = { '2026-07': 'Julio', '2026-08': 'Agosto', '2026-09': 'Septiembre' };
  const conf = (t) => (t == null ? 'Sin cierres' : `${Math.round(t)} % (${p.ganadas} de ${p.cerradas})`);
  const metas = [
    ['Tiempo hasta el precio (mediana)', dur(k.medianaPrecio), '≤ 4 h', p.medianaPrecio == null ? 'Sin datos' : dur(p.medianaPrecio)],
    ['Tasa de cierre', `${dec(k.tasaCierre)} %`, '≥ 55 %', conf(p.tasa)],
    ['Pérdidas por tardanza o sin seguimiento', k.perdidasTardanza, '−50 %', st.cotizaciones.filter((q) => ['Respuesta tardía', 'Sin seguimiento'].includes(q.motivo)).length],
    ['Solicitudes con origen', `${pct(k.origenRegistrado, k.solicitudes)} %`, '≥ 85 %', `${p.origen} %`],
    ['Perdidas con motivo', `${pct(k.motivoRegistrado, k.perdidas)} %`, '100 %', p.motivo == null ? 'Sin cierres' : `${p.motivo} %`],
    ['Referencias hoja = físico', `${k.skusCoinciden} de ${k.skus}`, '≥ 95 %', `${Object.keys(st.conteos).length} recontadas`],
    ['Talleres con compra en el trimestre', k.talleresActivos, '15 con compra mensual', '—'],
  ];
  const recuperado = (k.valorTardanza * ui.recupera) / 100;
  return `
  ${cab('Gerencia', 'Tablero de decisión', 'Expediente Q3 2026 como línea base y, al lado, lo que produce el nuevo flujo. Todos los números salen de las mismas tablas.')}
  <div class="rejilla c4">
    ${kpi('Ventas Q3', copM(k.valorVentas), `Ticket ${cop(k.ticket)}`)}
    ${kpi('Tasa de cierre', `${dec(k.tasaCierre)} %`, `${k.ganadas} de ${k.cotizaciones}`)}
    ${kpi('Hasta el precio', dur(k.medianaPrecio), `Ganadas ${dur(k.medianaPrecioGanada)} · perdidas ${dur(k.medianaPrecioPerdida)}`)}
    ${kpi('Inventario hoja vs. físico', `${k.stockHoja} / ${k.stockFisico}`, `${k.skusCoinciden} de ${k.skus} coinciden`)}
  </div>
  <section class="seccion rejilla c2">
    <div class="carta"><h2>Cierre por tiempo hasta el precio</h2>${barras(k.tramos.map((t) => ({ et: t.etiqueta, valor: t.tasa, texto: `${t.tasa} %`, tip: `${t.ganadas} de ${t.n}`, clase: t.tasa < 40 ? 'b' : '' })), { max: 100 })}<p class="tenue peq" style="margin-top:8px">Base: ${k.tramos.reduce((s, t) => s + t.n, 0)} cotizaciones con hora de precio. ${ev('COT-01', 'INT-01')}</p></div>
    <div class="carta"><h2>Cotizaciones por mes</h2>${barras2(meses.map((m) => { const s = data.cotizaciones.filter((q) => q.fecha.startsWith(m)); const a = s.filter((q) => q.estado === 'Ganada').length; return { et: nom[m], a, b: s.length - a }; }), ['Ganadas', 'Perdidas'])}</div>
  </section>
  <section class="seccion"><h2>Indicadores del cambio</h2><div class="carta">${tabla([{ t: 'Indicador' }, { t: 'Línea base Q3' }, { t: 'Meta' }, { t: 'Demo actual' }], metas)}
  <p class="tenue peq" style="margin-top:8px">“Demo actual” refleja los casos simulados de este navegador; no es un resultado real.</p></div></section>
  <section class="seccion rejilla c2">
    <div class="carta pila"><h2>¿Cuánto vale recuperar lo perdido por demora?</h2>
      <p class="peq">En Q3 se perdieron ${k.perdidasTardanza} cotizaciones por respuesta tardía o sin seguimiento, por ${copM(k.valorTardanza)} a precio de lista.</p>
      <label class="campo">Porcentaje recuperado: ${ui.recupera} %<input type="range" min="0" max="100" step="5" value="${ui.recupera}" data-input="recupera"></label>
      <div class="kpi"><div class="val">${copM(recuperado)}</div><div class="nota">por trimestre, equivalente a +${((100 * recuperado) / k.valorVentas).toFixed(0)} % sobre las ventas de Q3</div></div>
      <p class="tenue peq">Escenario ilustrativo de ingresos, no de margen. La meta 2027 es +20 %.</p>
    </div>
    <div class="carta"><h2>Trazabilidad reciente</h2><div class="tabla-env" style="max-height:290px;overflow-y:auto">${tabla([{ t: 'Hace' }, { t: 'Quién' }, { t: 'Qué' }, { t: 'Ref.' }], st.eventos.slice(0, 20).map((e) => [hace(e.t), esc(e.actor), esc(e.accion), esc(e.ref)]))}</div></div>
  </section>
  <p class="peq" style="margin-top:18px"><a href="dashboard.html">Abrir el Dashboard Admin completo</a></p>`;
}

