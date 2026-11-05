// Lógica sin interfaz: búsqueda, disponibilidad, entrega, métricas y flujo de cotización.
// Se ejecuta igual en el navegador y en las pruebas de Node (tests/core.test.mjs).

export const SLA_ALERTA_MIN = 120;
export const SLA_LIMITE_MIN = 240;
export const SEGUIMIENTO_MIN = 24 * 60;
export const MOTIVOS_PERDIDA = [
  'Precio', 'Compró a competidor', 'Respuesta tardía', 'Sin seguimiento', 'Sin disponibilidad', 'Otro',
];
export const ESTADOS_PEDIDO = ['Confirmado', 'Alistando', 'En ruta', 'Entregado'];

// ---------- Formato ----------
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const cop = (n) => '$' + new Intl.NumberFormat('es-CO').format(Math.round(n || 0));
export const copM = (n) => '$' + (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
export const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
export const dec = (n) => n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function dur(min) {
  if (min == null) return 'sin dato';
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  }
  const h = Math.round(m / 60);
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}

export function mediana(v) {
  const s = v.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
}

const contar = (lista, fn) => lista.reduce((o, x) => { const k = fn(x); o[k] = (o[k] || 0) + 1; return o; }, {});

// ---------- Vehículos y compatibilidad ----------
export const VEHICULOS = {
  Chevrolet: ['Aveo', 'Beat', 'Sail', 'Spark', 'Spark GT'],
  Mazda: ['2', '3', 'CX-30'],
  Renault: ['Duster', 'Logan', 'Sandero'],
};

/** Devuelve null si no aplica, o { confirmar } si aplica (con advertencia opcional). */
export function aplica(reglas, v) {
  for (const r of reglas || []) {
    if (r.marca !== '*' && r.marca !== v.marca) continue;
    if (r.modelo !== '*' && r.modelo !== v.modelo) continue;
    if (v.anio && r.desde && (v.anio < r.desde || v.anio > r.hasta)) continue;
    return { confirmar: r.confirmar || null };
  }
  return null;
}

export function buscarPorVehiculo(data, v) {
  return data.productos
    .map((p) => ({ p, m: aplica(data.compatibilidad[p.sku], v) }))
    .filter((x) => x.m)
    .map(({ p, m }) => ({ sku: p.sku, confirmar: m.confirmar }));
}

// Vocabulario que escriben los clientes (AT-01 a AT-09), incluidos síntomas de particulares.
const SINONIMOS = [
  [/pastilla|balata|chilla|frena mal/, ['FR-101']],
  [/disco/, ['FR-102']],
  [/filtro de aceite|aceite/, ['MO-201']],
  [/filtro de aire/, ['FI-601']],
  [/filtro de combustible|filtro de gasolina/, ['FI-602']],
  [/kit|distribuci|correa/, ['MO-202']],
  [/amortiguador|rebota|suspension/, ['SU-301']],
  [/rotula|direccion/, ['SU-302']],
  [/bateria|no prende|no arranca|amperio|\d+ ?ah\b/, ['EL-401']],
  [/alternador|luz de la bateria/, ['EL-402']],
  [/radiador|recalienta/, ['RE-501']],
  [/termostato|k4m/, ['RE-502']],
];

export function extraerVehiculo(texto) {
  const t = norm(texto);
  const v = {};
  const modelos = [
    ['Chevrolet', 'Spark GT', /spark gt/], ['Chevrolet', 'Spark', /spark/], ['Chevrolet', 'Sail', /sail/],
    ['Chevrolet', 'Aveo', /aveo/], ['Chevrolet', 'Beat', /\bbeat\b/],
    ['Mazda', 'CX-30', /cx-?30/], ['Mazda', '3', /mazda ?3\b/], ['Mazda', '2', /mazda ?2\b/],
    ['Renault', 'Sandero', /sandero/], ['Renault', 'Logan', /logan/], ['Renault', 'Duster', /duster/],
  ];
  const m = modelos.find(([, , re]) => re.test(t));
  if (m) { v.marca = m[0]; v.modelo = m[1]; }
  else if (/k4m|renault/.test(t)) { v.marca = 'Renault'; }
  const a = t.match(/\b(19|20)\d{2}\b/);
  if (a) v.anio = Number(a[0]);
  return v;
}

const NUMEROS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6 };

export function extraerCantidad(texto) {
  const t = norm(texto).replace(/\b(19|20)\d{2}\b/g, ' ');
  const palabras = 'juegos?|unidad(?:es)?|baterias?|radiadores?|kits?|filtros?|amortiguadores?|termostatos?|discos?|pastillas|rotulas?|alternadores?';
  const r = t.match(new RegExp(`\\b(\\d{1,2}|un|una|dos|tres|cuatro|cinco|seis)\\s+(?:\\w+\\s+)?(?:${palabras})\\b`));
  if (!r) return 1;
  return NUMEROS[r[1]] || Number(r[1]) || 1;
}

export function clasificar(texto) {
  const t = norm(texto);
  if (/garantia|reclamo|no sirve|llego mal|queja|danad/.test(t)) return 'Reclamo o garantía';
  if (/mi pedido|donde esta|y los kits|ya salio/.test(t)) return 'Estado del pedido';
  if (/como se cual|le sirve|sirve para|es compatible/.test(t)) return 'Consulta de compatibilidad';
  return 'Solicitud de cotización';
}

/** Asistente por reglas: propone referencias; la decisión siempre es del asesor. */
export function sugerir(data, texto) {
  const t = norm(texto);
  const vehiculo = extraerVehiculo(texto);
  const piezas = SINONIMOS.filter(([re]) => re.test(t)).flatMap(([, skus]) => skus);
  const unico = [...new Set(piezas)];
  const puntuado = (unico.length ? unico : data.productos.map((p) => p.sku)).map((sku) => {
    const m = vehiculo.marca
      ? aplica(data.compatibilidad[sku], { marca: vehiculo.marca, modelo: vehiculo.modelo || '*', anio: vehiculo.anio })
      : null;
    return { sku, encaja: !!m, confirmar: m?.confirmar || null, porPieza: unico.includes(sku) };
  });
  const candidatos = puntuado
    .filter((c) => c.porPieza || c.encaja)
    .sort((a, b) => Number(b.encaja) - Number(a.encaja))
    .slice(0, 3);
  return { intencion: clasificar(texto), vehiculo, cantidad: extraerCantidad(texto), candidatos };
}

// ---------- Disponibilidad y entrega ----------
export function stockDe(data, st, sku) {
  const inv = data.inventario.find((i) => i.sku === sku);
  const fisico = st.conteos?.[sku]?.fisico ?? inv.stock_fisico;
  const reservado = st.cotizaciones
    .filter((q) => q.sku === sku && q.pedido && !q.pedido.descontado)
    .reduce((s, q) => s + q.cantidad, 0);
  const entregado = st.cotizaciones
    .filter((q) => q.sku === sku && q.pedido?.descontado && (!st.conteos?.[sku] || q.pedido.entregadoEn > st.conteos[sku].t))
    .reduce((s, q) => s + q.cantidad, 0);
  const disponible = Math.max(0, fisico - reservado - entregado);
  return { fisico: fisico - entregado, reservado, disponible, minimo: inv.stock_minimo, reposicion: inv.tiempo_reposicion_dias };
}

const HOY = (d) => d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const hm = (h, m) => h + m / 60;
// La salida es a las 10:00 y a las 15:00; se cierra 30 min antes para alistar (supuesto a validar con bodega).
const RUTAS = [{ etiqueta: '10:00 a. m.', corte: hm(9, 30) }, { etiqueta: '3:00 p. m.', corte: hm(14, 30) }];

export function proximaRuta(ahora = new Date()) {
  const d = new Date(ahora);
  for (let i = 0; i < 8; i++) {
    const dia = d.getDay();
    const hora = i === 0 ? hm(d.getHours(), d.getMinutes()) : 0;
    const rutas = dia === 0 ? [] : dia === 6 ? RUTAS.slice(0, 1) : RUTAS;
    const r = rutas.find((x) => hora < x.corte);
    if (r) {
      const texto = i === 0 ? `hoy, ruta de las ${r.etiqueta}` : `${HOY(d)}, ruta de las ${r.etiqueta}`;
      return { ruta: r.etiqueta, texto, diasHasta: i };
    }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

export function promesaEntrega(s, cantidad, ahora = new Date()) {
  if (s.disponible >= cantidad) return { ok: true, texto: proximaRuta(ahora).texto };
  const parcial = s.disponible > 0 ? ` (hay ${s.disponible} de inmediato)` : '';
  return { ok: false, texto: `por encargo, ${s.reposicion} días según proveedor${parcial}` };
}

export function mensajeCotizacion(p, q, promesa) {
  const dcto = q.descuentoPct || 0;
  const unit = Math.round(p.precio_cop * (1 - dcto / 100));
  const estado = promesa.ok ? 'Disponible, verificado en bodega' : 'Sin existencia inmediata';
  return [
    `Hola${q.contacto ? ' ' + q.contacto.split(' ')[0] : ''}, le confirmamos la cotización ${q.id}:`,
    `${q.cantidad} × ${p.producto} ${p.marca} (${p.sku})`,
    `Valor unitario: ${cop(unit)}${dcto ? ` (incluye ${dcto} % autorizado)` : ''}`,
    `Total: ${cop(unit * q.cantidad)}, IVA incluido`,
    `${estado}. Entrega: ${promesa.texto.replace(/\.$/, '')}.`,
    `Garantía: ${p.garantia_meses} meses.`,
    'Si desea confirmar, responda SÍ a este mensaje.',
  ].join('\n');
}

// ---------- Estado de la demo ----------
const minsAtras = (ahora, m) => new Date(ahora.getTime() - m * 60000).toISOString();

function casoDemo(ahora, base) {
  return {
    canal: 'WhatsApp', origen: 'Cliente recurrente', campana: null, descuentoPct: 0, estado: 'Nueva',
    primeraEn: null, cotizadaEn: null, cerradaEn: null, motivo: null, pedido: null, ...base,
    creada: minsAtras(ahora, base.hace),
  };
}

export function estadoInicial(ahora = new Date()) {
  const cotizaciones = [
    casoDemo(ahora, {
      id: 'Q097', hace: 22, clienteId: 'C002', contacto: 'Carlos Úsuga', evidencia: 'AT-01',
      mensaje: 'Buenos días. ¿Tienes pastillas delanteras para Mazda 3 modelo 2017? Necesito 3 juegos, las necesito hoy.',
    }),
    casoDemo(ahora, {
      id: 'Q098', hace: 95, clienteId: 'C006', contacto: 'Laura Gómez', evidencia: 'AT-04',
      origen: 'Publicación Instagram', campana: 'CMP-05',
      mensaje: 'Hola, vi su publicación en Instagram. Necesito los dos amortiguadores delanteros para un Renault Sandero 2016. ¿Cuánto valen?',
    }),
    casoDemo(ahora, {
      id: 'Q099', hace: 220, clienteId: 'C011', contacto: 'Edwin Cano', evidencia: 'AT-05',
      mensaje: 'Buenas. Necesito 2 baterías de 60 amperios para un Chevrolet Sail, es para hoy.',
    }),
    casoDemo(ahora, {
      id: 'Q100', hace: 26, clienteId: null, contacto: 'Cuenta de Instagram', evidencia: 'AT-02', canal: 'Instagram',
      origen: 'Pauta Instagram', campana: 'CMP-02',
      mensaje: 'Hola, vi la publicación de baterías. ¿Cómo sé cuál le sirve a mi carro? ¿Dónde puedo revisar precios?',
    }),
    casoDemo(ahora, {
      id: 'Q101', hace: 130, clienteId: 'C002', contacto: 'Carlos Úsuga', evidencia: 'AT-09',
      primeraEn: minsAtras(ahora, 130), autorespuesta: true,
      mensaje: '¿Tienen termostato para motor K4M? Necesito 3, es para hoy.',
    }),
    casoDemo(ahora, {
      id: 'Q102', hace: 1560, clienteId: 'C005', contacto: 'Mauricio Vélez', evidencia: 'AT-07', estado: 'Cotizada',
      sku: 'RE-501', cantidad: 3, primeraEn: minsAtras(ahora, 1500), cotizadaEn: minsAtras(ahora, 1500),
      mensaje: 'Jhon Fredy, necesito precio de 3 radiadores para Spark GT mecánico.',
    }),
    casoDemo(ahora, {
      id: 'Q103', hace: 70, clienteId: 'C004', contacto: 'Fabio Ríos', evidencia: 'AT-08', estado: 'Ganada',
      sku: 'MO-202', cantidad: 3, primeraEn: minsAtras(ahora, 62), cotizadaEn: minsAtras(ahora, 62), cerradaEn: minsAtras(ahora, 58),
      mensaje: 'Jhon, lo de siempre: 3 kits de distribución del Sail. ¿Me los mandas en la ruta de la mañana?',
      pedido: { estado: 'Confirmado', promesa: proximaRuta(ahora).texto, historial: [{ estado: 'Confirmado', t: minsAtras(ahora, 58) }] },
    }),
  ];
  return {
    version: 1,
    cotizaciones,
    descuentos: [{ id: 'D001', cotizacionId: 'Q102', pct: 5, motivo: 'El taller cotizó a $430.000 con otro proveedor.', estado: 'Pendiente', t: minsAtras(ahora, 40) }],
    pqr: [],
    conteos: {},
    eventos: [{ t: ahora.toISOString(), actor: 'Sistema', accion: 'Demo iniciada con 7 casos reconstruidos del expediente', ref: '' }],
    secuencia: { q: 104, v: 45, c: 13, d: 2, p: 11 },
  };
}

export function registrar(st, actor, accion, ref = '', ahora = new Date()) {
  st.eventos.unshift({ t: ahora.toISOString(), actor, accion, ref });
  st.eventos = st.eventos.slice(0, 80);
}

export const q3 = (n) => 'Q' + String(n).padStart(3, '0');

export function crearSolicitud(st, datos, ahora = new Date()) {
  if (!datos.autoriza) throw new Error('Se requiere autorización de tratamiento de datos');
  if (!datos.contacto?.trim()) throw new Error('Falta el nombre de contacto');
  const q = {
    id: q3(st.secuencia.q++), creada: ahora.toISOString(), clienteId: datos.clienteId || null,
    contacto: datos.contacto.trim(), telefonoParcial: datos.telefonoParcial || '', canal: datos.canal || 'Portal web',
    origen: datos.origen || 'No registrado', campana: datos.campana || null, mensaje: datos.mensaje || '',
    sku: datos.sku || null, cantidad: datos.cantidad || 1, vehiculo: datos.vehiculo || '', descuentoPct: 0, estado: 'Nueva',
    primeraEn: null, cotizadaEn: null, cerradaEn: null, motivo: null, pedido: null, autoriza: true,
  };
  st.cotizaciones.unshift(q);
  registrar(st, 'Cliente', 'Solicitud creada desde el portal', q.id, ahora);
  return q;
}

export function enviarCotizacion(st, id, sku, cantidad, actor = 'Asesor', ahora = new Date()) {
  const q = st.cotizaciones.find((x) => x.id === id);
  if (!sku || !(cantidad > 0)) throw new Error('Seleccione referencia y cantidad');
  q.sku = sku; q.cantidad = cantidad; q.estado = 'Cotizada';
  q.primeraEn ||= ahora.toISOString();
  q.cotizadaEn = ahora.toISOString();
  registrar(st, actor, `Precio, stock y entrega enviados (${sku} × ${cantidad})`, id, ahora);
  return q;
}

export function cerrarGanada(st, id, promesa, actor = 'Asesor', ahora = new Date()) {
  const q = st.cotizaciones.find((x) => x.id === id);
  q.estado = 'Ganada'; q.cerradaEn = ahora.toISOString(); q.motivo = null;
  q.pedido = { estado: 'Confirmado', promesa, historial: [{ estado: 'Confirmado', t: ahora.toISOString() }] };
  registrar(st, actor, 'Cotización ganada; pedido enviado a bodega', id, ahora);
  return q;
}

export function cerrarPerdida(st, id, motivo, actor = 'Asesor', ahora = new Date()) {
  if (!motivo) throw new Error('El motivo es obligatorio para cerrar como perdida');
  const q = st.cotizaciones.find((x) => x.id === id);
  q.estado = 'Perdida'; q.cerradaEn = ahora.toISOString(); q.motivo = motivo;
  registrar(st, actor, `Cotización perdida: ${motivo}`, id, ahora);
  return q;
}

export function solicitarDescuento(st, id, pct_, motivo, ahora = new Date()) {
  if (!(pct_ > 0)) throw new Error('Indique el porcentaje');
  if (!motivo?.trim()) throw new Error('Explique el motivo del descuento');
  const d = { id: 'D' + String(st.secuencia.d++).padStart(3, '0'), cotizacionId: id, pct: pct_, motivo: motivo.trim(), estado: 'Pendiente', t: ahora.toISOString() };
  st.descuentos.unshift(d);
  registrar(st, 'Asesor', `Descuento de ${pct_} % solicitado`, id, ahora);
  return d;
}

export function resolverDescuento(st, id, aprobar, ahora = new Date()) {
  const d = st.descuentos.find((x) => x.id === id);
  d.estado = aprobar ? 'Aprobado' : 'Rechazado';
  if (aprobar) st.cotizaciones.find((q) => q.id === d.cotizacionId).descuentoPct = d.pct;
  registrar(st, 'Coordinación', `Descuento ${d.estado.toLowerCase()} (${d.pct} %)`, d.cotizacionId, ahora);
  return d;
}

export function avanzarPedido(st, id, ahora = new Date()) {
  const q = st.cotizaciones.find((x) => x.id === id);
  const i = ESTADOS_PEDIDO.indexOf(q.pedido.estado);
  if (i >= ESTADOS_PEDIDO.length - 1) return q;
  q.pedido.estado = ESTADOS_PEDIDO[i + 1];
  q.pedido.historial.push({ estado: q.pedido.estado, t: ahora.toISOString() });
  if (q.pedido.estado === 'Entregado') { q.pedido.descontado = true; q.pedido.entregadoEn = ahora.toISOString(); }
  registrar(st, 'Bodega', `Pedido: ${q.pedido.estado}`, id, ahora);
  return q;
}

export function registrarConteo(st, sku, fisico, ahora = new Date()) {
  if (!Number.isInteger(fisico) || fisico < 0) throw new Error('Conteo inválido');
  st.conteos[sku] = { fisico, t: ahora.toISOString() };
  registrar(st, 'Bodega', `Conteo físico: ${fisico} unidades`, sku, ahora);
}

export function crearPQR(st, id, tipo, descripcion, ahora = new Date()) {
  if (!descripcion?.trim()) throw new Error('Describa el caso');
  const q = st.cotizaciones.find((x) => x.id === id);
  const p = { pqr_id: 'PQR-' + st.secuencia.p++, fecha: ahora.toISOString().slice(0, 10), cotizacion_id: id, sku: q.sku, tipo, descripcion: descripcion.trim(), estado: 'Abierta', nueva: true };
  st.pqr.unshift(p);
  registrar(st, 'Cliente', `${tipo} registrada`, id, ahora);
  return p;
}

export function minutosHastaPrecio(q, ahora = new Date()) {
  const fin = q.cotizadaEn ? new Date(q.cotizadaEn) : ahora;
  return (fin - new Date(q.creada)) / 60000;
}

export function nivelSLA(q, ahora = new Date()) {
  if (q.estado !== 'Nueva') return null;
  const m = minutosHastaPrecio(q, ahora);
  if (m >= SLA_LIMITE_MIN) return 'vencido';
  if (m >= SLA_ALERTA_MIN) return 'riesgo';
  return 'ok';
}

export const sinSeguimiento = (st, ahora = new Date()) =>
  st.cotizaciones.filter((q) => q.estado === 'Cotizada' && (ahora - new Date(q.cotizadaEn)) / 60000 >= SEGUIMIENTO_MIN);

// ---------- Indicadores del expediente (Q3 2026) ----------
export function fueraDeHorario(fecha, hora) {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = new Date(a, m - 1, d).getDay();
  const [h, mi] = hora.split(':').map(Number);
  const t = hm(h, mi);
  if (dia === 0) return true;
  return dia === 6 ? !(t >= 7.5 && t < 13) : !(t >= 7.5 && t < 18);
}

export function indicadores(data) {
  const q = data.cotizaciones;
  const porQ = Object.fromEntries(q.map((x) => [x.cotizacion_id, x]));
  const precioLista = Object.fromEntries(data.productos.map((p) => [p.sku, p.precio_cop]));
  const valorQ = (x) => precioLista[x.sku] * x.cantidad;
  const ganadas = q.filter((x) => x.estado === 'Ganada');
  const perdidas = q.filter((x) => x.estado === 'Perdida');
  const valorVentas = data.ventas.reduce((s, v) => s + v.valor_cop, 0);
  const seg = Object.fromEntries(data.clientes.map((c) => [c.cliente_id, c.segmento]));

  const sol = data.interacciones.filter((i) => i.motivo === 'Solicitud de cotización');
  const conPrecio = sol.filter((i) => i.minutos_envio_precio != null);
  const tramos = [
    { etiqueta: 'Hasta 4 h', de: 0, a: 240 }, { etiqueta: '4 a 8 h', de: 240, a: 480 },
    { etiqueta: '8 a 24 h', de: 480, a: 1440 }, { etiqueta: 'Más de 24 h', de: 1440, a: Infinity },
  ].map((t) => {
    const s = conPrecio.filter((i) => i.minutos_envio_precio >= t.de && i.minutos_envio_precio < t.a);
    const g = s.filter((i) => porQ[i.cotizacion_id].estado === 'Ganada').length;
    return { ...t, n: s.length, ganadas: g, tasa: pct(g, s.length) };
  });
  const entrantes = data.interacciones.filter((i) => i.origen_contacto !== 'Contacto saliente' && i.hora_entrada);
  const fuera = entrantes.filter((i) => fueraDeHorario(i.fecha, i.hora_entrada));
  const tasa = (l) => {
    const s = l.filter((i) => porQ[i.cotizacion_id]);
    return { n: s.length, ganadas: s.filter((i) => porQ[i.cotizacion_id].estado === 'Ganada').length };
  };
  const motivoValor = {};
  for (const x of perdidas) motivoValor[x.motivo_perdida] = (motivoValor[x.motivo_perdida] || 0) + valorQ(x);
  const lentasPorPrecio = sol.filter((i) => porQ[i.cotizacion_id].motivo_perdida === 'Precio');
  const reg = data.inventario.reduce((s, i) => s + i.stock_registrado, 0);
  const fis = data.inventario.reduce((s, i) => s + i.stock_fisico, 0);
  const pauta = data.campanas.filter((c) => c.tipo === 'Pauta');
  const perdidasTardanza = perdidas.filter((x) => ['Respuesta tardía', 'Sin seguimiento'].includes(x.motivo_perdida));

  return {
    cotizaciones: q.length, ganadas: ganadas.length, perdidas: perdidas.length,
    tasaCierre: (100 * ganadas.length) / q.length,
    valorVentas, ticket: valorVentas / data.ventas.length,
    valorPerdido: perdidas.reduce((s, x) => s + valorQ(x), 0),
    medianaHoja: mediana(q.map((x) => x.horas_respuesta)) * 60,
    medianaPrecio: mediana(conPrecio.map((i) => i.minutos_envio_precio)),
    medianaPrecioGanada: mediana(conPrecio.filter((i) => porQ[i.cotizacion_id].estado === 'Ganada').map((i) => i.minutos_envio_precio)),
    medianaPrecioPerdida: mediana(conPrecio.filter((i) => porQ[i.cotizacion_id].estado === 'Perdida').map((i) => i.minutos_envio_precio)),
    sinPrecio: sol.length - conPrecio.length,
    tramos,
    entrantes: entrantes.length, fuera: fuera.length,
    cierreFuera: tasa(fuera), cierreDentro: tasa(entrantes.filter((i) => !fueraDeHorario(i.fecha, i.hora_entrada))),
    contactosSinCotizacion: entrantes.filter((i) => !i.cotizacion_id).length,
    motivos: contar(perdidas, (x) => x.motivo_perdida), motivoValor,
    perdidasTardanza: perdidasTardanza.length, valorTardanza: perdidasTardanza.reduce((s, x) => s + valorQ(x), 0),
    precioConDemora: lentasPorPrecio.filter((i) => i.minutos_envio_precio > 240).length, precioTotal: lentasPorPrecio.length,
    canales: contar(q, (x) => x.canal),
    origenRegistrado: sol.filter((i) => i.origen_contacto !== 'No registrado').length, solicitudes: sol.length,
    stockHoja: reg, stockFisico: fis,
    skusCoinciden: data.inventario.filter((i) => i.diferencia === 0).length, skus: data.inventario.length,
    bajoMinimo: data.inventario.filter((i) => i.stock_fisico <= i.stock_minimo).length,
    inversionPauta: pauta.reduce((s, c) => s + c.inversion_cop, 0),
    ventasPauta: pauta.reduce((s, c) => s + c.valor_ventas_con_origen_cop, 0),
    mensajesPlataforma: data.campanas.reduce((s, c) => s + (c.mensajes_recibidos_plataforma || 0), 0),
    contactosCampana: data.campanas.reduce((s, c) => s + c.contactos_registrados, 0),
    consultasPedido: data.interacciones.filter((i) => i.motivo === 'Estado del pedido').length,
    ventas: data.ventas.length,
    postventa: data.interacciones.filter((i) => i.motivo === 'Seguimiento postventa').length,
    talleresActivos: new Set(data.ventas.filter((v) => seg[v.cliente_id] === 'Taller').map((v) => v.cliente_id)).size,
    valorParticulares: data.ventas.filter((v) => seg[v.cliente_id] === 'Particular').reduce((s, v) => s + v.valor_cop, 0),
    motivoRegistrado: perdidas.filter((x) => x.motivo_perdida !== 'No registrado').length,
    sinAutorizacion: data.clientes.filter((c) => c.autoriza_tratamiento_datos !== 'Sí').length,
    pqrAbiertas: data.pqr.filter((p) => p.estado === 'Abierta').length,
  };
}

export function indicadoresPiloto(st, ahora = new Date()) {
  const q = st.cotizaciones;
  const cerradas = q.filter((x) => ['Ganada', 'Perdida'].includes(x.estado));
  const ganadas = cerradas.filter((x) => x.estado === 'Ganada').length;
  const tiempos = q.filter((x) => x.cotizadaEn).map((x) => minutosHastaPrecio(x, ahora));
  const conOrigen = q.filter((x) => x.origen && x.origen !== 'No registrado').length;
  const perdidas = cerradas.filter((x) => x.estado === 'Perdida');
  return {
    total: q.length, cerradas: cerradas.length, ganadas,
    tasa: cerradas.length ? (100 * ganadas) / cerradas.length : null,
    medianaPrecio: mediana(tiempos), origen: pct(conOrigen, q.length),
    motivo: perdidas.length ? pct(perdidas.filter((x) => x.motivo).length, perdidas.length) : null,
    sinPrecio: q.filter((x) => x.estado === 'Nueva').length,
  };
}
