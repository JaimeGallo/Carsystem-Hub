// Vistas de la propuesta: inicio, diagnóstico y plan. Las cifras salen de indicadores(), nunca a mano.
import { cop, copM, dec, dur, pct } from './core.js';
import { barras, cab, esc, ev, kpi, tabla } from './ui.js';

const PASOS = [
  ['Atraer', 'Marketing mide', 'Cada enlace lleva campaña y origen. La venta se puede rastrear hasta la pieza publicada.', '#/marketing'],
  ['Encontrar', 'El cliente busca', 'Catálogo por vehículo, con compatibilidad, precio y disponibilidad sin escribirle a nadie.', '#/catalogo'],
  ['Cotizar', 'El asesor responde', 'Bandeja única con cronómetro hasta el precio y mensaje listo en tres toques.', '#/asesor'],
  ['Entregar', 'Bodega cumple', 'Pedido con ruta y estado visibles. El inventario se corrige con cada conteo.', '#/bodega'],
  ['Decidir', 'Gerencia aprende', 'Mismo identificador Q### de punta a punta: un solo dato para operar y decidir.', '#/gerencia'],
];

export function inicio(ctx) {
  const k = ctx.k;
  const rapido = k.tramos[0];
  const lento = k.tramos.slice(2).reduce((a, t) => ({ n: a.n + t.n, ganadas: a.ganadas + t.ganadas }), { n: 0, ganadas: 0 });
  return `
  <section class="heroe">
    <div>
      <h1>Pieza correcta, precio y entrega en una sola respuesta</h1>
      <p>Carsystem Hub reúne canales, catálogo, inventario y seguimiento en un mismo recorrido. Este prototipo muestra el flujo de las fases 1 a 3 de la propuesta, construido sobre las nueve bases del expediente Q3 2026.</p>
      <div class="acciones"><a class="btn pri" href="#/asesor">Abrir la bandeja</a><a class="btn" href="#/catalogo">Ver como cliente</a><a class="btn" href="#/diagnostico">Ver diagnóstico</a></div>
    </div>
    <div class="cifra-par">
      <div class="cifra alta"><b>${pct(rapido.ganadas, rapido.n)} %</b><span>de cierre cuando el precio llega en 4 h o menos (${rapido.ganadas} de ${rapido.n})</span></div>
      <div class="cifra baja"><b>${pct(lento.ganadas, lento.n)} %</b><span>de cierre cuando tarda más de 8 h (${lento.ganadas} de ${lento.n})</span></div>
      <p class="pie-cifra">Cruce de COT-01 e INT-01. Es una asociación observada, no una prueba de causa.</p>
    </div>
  </section>

  <section class="seccion">
    <h2>Un recorrido, cinco momentos</h2>
    <ol class="recorrido">${PASOS.map(([et, t, d, h]) => `<li><span class="et">${et}</span><h3><a href="${h}">${t}</a></h3><p>${d}</p></li>`).join('')}</ol>
  </section>

  <section class="seccion">
    <h2>Guion de demostración (3 minutos)</h2>
    <p class="nota-sec">Siete casos del expediente ya están cargados. Sigan este orden en la sustentación; al terminar, “Reiniciar demo” vuelve al punto de partida.</p>
    <ol class="guion">
      <li><span>Busquen un <b>Renault Sandero 2016</b> y pidan una cotización como cliente.</span><a class="btn" href="#/catalogo">Catálogo</a></li>
      <li><span>Abran la solicitud, acepten la sugerencia y envíen precio, stock y entrega.</span><a class="btn" href="#/asesor">Bandeja</a></li>
      <li><span>En <b>Q099</b>, vean cómo el sistema frena la batería sin validar polaridad (caso AT-05).</span><a class="btn" href="#/asesor/Q099">Q099</a></li>
      <li><span>Aprueben o rechacen el descuento de <b>Q102</b>: la decisión sigue siendo humana.</span><a class="btn" href="#/coordinacion">Coordinación</a></li>
      <li><span>Avancen el pedido <b>Q103</b>, que en el expediente llegó 6 horas tarde (AT-08).</span><a class="btn" href="#/bodega">Bodega</a></li>
      <li><span>Consulten el pedido como cliente, sin llamar a nadie.</span><a class="btn" href="#/seguimiento/Q103">Seguimiento</a></li>
      <li><span>Vean cómo todo lo anterior ya aparece en los indicadores.</span><a class="btn" href="#/gerencia">Gerencia</a></li>
    </ol>
  </section>`;
}

export function diagnostico(ctx) {
  const k = ctx.k;
  const f = (titulo, obs, hip, evid, grafico) => `
    <article class="carta hallazgo">
      <div><h3>${titulo}</h3><p>${obs}</p><div class="etq">Hipótesis</div><p class="hip">${hip}</p><div class="etq">Evidencias</div>${ev(...evid)}</div>
      <div>${grafico}</div>
    </article>`;
  const camp = ctx.data.campanas;
  return `
  ${cab('Problema y diagnóstico', 'El cliente no recibe a tiempo una respuesta completa', 'Carsystem atiende bien, pero la pieza, el precio, la existencia y la entrega viven en herramientas distintas. Reunirlos toma horas, y ese tiempo es lo que más se asocia con perder la venta.')}
  <div class="rejilla c4">
    ${kpi('Tasa de cierre', `${dec(k.tasaCierre)} %`, `${k.ganadas} de ${k.cotizaciones} cotizaciones`)}
    ${kpi('Ventas del trimestre', copM(k.valorVentas), `${k.ventas} ventas · VTA-01`)}
    ${kpi('Cotizado y no vendido', copM(k.valorPerdido), 'a precio de lista · COT-01')}
    ${kpi('Mediana hasta el precio', dur(k.medianaPrecio), `${k.sinPrecio} perdidas nunca recibieron precio`)}
  </div>
  <section class="seccion pila">
    <h2>Seis hallazgos</h2>
    ${f('1. El precio que llega tarde no se vende',
      `La mediana hasta el precio fue de ${dur(k.medianaPrecioGanada)} en las ganadas y ${dur(k.medianaPrecioPerdida)} en las perdidas. Ninguna de las ${k.tramos[3].n} cotizaciones con precio después de 24 h se cerró.`,
      'El cliente con urgencia compra donde le responden primero. También puede influir la complejidad de la pieza: el dato muestra asociación, no causa.',
      ['COT-01', 'INT-01', 'AT-01', 'AT-06', 'AT-09'],
      `<div class="etq" style="margin-top:0">Cierre según el tiempo hasta el precio</div>${barras(k.tramos.map((t) => ({ et: t.etiqueta, valor: t.tasa, texto: `${t.tasa} %`, tip: `${t.ganadas} ganadas de ${t.n} cotizaciones`, clase: t.tasa < 40 ? 'b' : '' })), { max: 100 })}`)}
    ${f('2. El indicador oficial no mide lo que el cliente espera',
      `La hoja registra el primer mensaje, no el precio. En Q015 la hoja dice 1,2 h, pero el precio llegó 50 horas después y la venta se perdió. El Hub mide hasta el precio.`,
      'El equipo cumple el indicador que tiene: acusar recibo rápido. Por eso gerencia no ve la demora real.',
      ['AT-04', 'TES-04', 'TES-02', 'OPE-01'],
      `<div class="etq" style="margin-top:0">Caso Q015 (Sandero 2016)</div>${barras([{ et: 'Según la hoja', valor: 72, texto: '1,2 h' }, { et: 'Hasta el precio', valor: 3035, texto: '50,6 h', clase: 'b' }])}`)}
    ${f('3. Un tercio de los contactos llega con el local cerrado',
      `${k.fuera} de ${k.entrantes} contactos entrantes (${pct(k.fuera, k.entrantes)} %) llegaron fuera de horario. Sus cotizaciones cerraron ${pct(k.cierreFuera.ganadas, k.cierreFuera.n)} %, frente a ${pct(k.cierreDentro.ganadas, k.cierreDentro.n)} % en horario.`,
      'Un catálogo con precio y disponibilidad atendería parte de esa demanda sin ampliar turnos.',
      ['INT-01', 'AT-06', 'AT-09', 'RES-02'],
      `<div class="etq" style="margin-top:0">Cierre según hora de llegada</div>${barras([{ et: 'En horario', valor: pct(k.cierreDentro.ganadas, k.cierreDentro.n), texto: `${pct(k.cierreDentro.ganadas, k.cierreDentro.n)} %`, tip: `${k.cierreDentro.ganadas} de ${k.cierreDentro.n}` }, { et: 'Fuera de horario', valor: pct(k.cierreFuera.ganadas, k.cierreFuera.n), texto: `${pct(k.cierreFuera.ganadas, k.cierreFuera.n)} %`, tip: `${k.cierreFuera.ganadas} de ${k.cierreFuera.n}`, clase: 'b' }], { max: 100 })}`)}
    ${f('4. El inventario de la hoja no se puede usar para cotizar',
      `La hoja suma ${k.stockHoja} unidades y el conteo físico ${k.stockFisico}. Coinciden ${k.skusCoinciden} de ${k.skus} referencias, y ${k.bajoMinimo} están en el mínimo o por debajo.`,
      'Como la hoja no es confiable, el asesor confirma con bodega antes de dar el precio, lo que explicaría parte de la demora del hallazgo 1.',
      ['INV-01', 'TES-06', 'INC-02', 'INC-05'],
      `<div class="etq" style="margin-top:0">Unidades, 30 de septiembre</div>${barras([{ et: 'Hoja', valor: k.stockHoja, clase: 'g' }, { et: 'Conteo físico', valor: k.stockFisico, clase: 'b' }])}`)}
    ${f('5. No se sabe qué comunicación vende',
      `Las plataformas reportan ${k.mensajesPlataforma} mensajes y solo ${k.contactosCampana} quedaron como contactos registrados. La pauta costó ${copM(k.inversionPauta)} y dejó ${copM(k.ventasPauta)} en ventas atribuidas; la difusión a talleres, sin costo, dejó ${copM(camp[2].valor_ventas_con_origen_cop)}.`,
      `La atribución es incompleta: ${k.solicitudes - k.origenRegistrado} de ${k.solicitudes} solicitudes no tienen origen, así que estas cifras son un piso.`,
      ['MKT-01', 'MKT-02', 'TES-09', 'AT-02'],
      `<div class="etq" style="margin-top:0">Ventas atribuidas por campaña</div>${barras(camp.map((c) => ({ et: c.campana_id, valor: c.valor_ventas_con_origen_cop, texto: copM(c.valor_ventas_con_origen_cop), tip: `${c.nombre}: ${c.ventas_con_origen} ventas, inversión ${cop(c.inversion_cop)}` })))}`)}
    ${f('6. La operación depende de personas y dispositivos',
      `${k.sinAutorizacion} de ${ctx.data.clientes.length} clientes no tienen autorización de datos registrada. Hubo cinco incidentes en el trimestre, sin copia registrada desde el 14 de agosto. Las listas de precios y chats de talleres están en celulares personales.`,
      'Si un asesor se va o falla un equipo, se pierden relaciones y promesas de venta.',
      ['TES-05', 'TES-08', 'INC-03', 'INC-04', 'TEC-03'],
      `<div class="etq" style="margin-top:0">Motivos registrados de pérdida</div>${barras(Object.entries(k.motivos).sort((a, b) => b[1] - a[1]).map(([m, n]) => ({ et: m, valor: n, clase: 'g' })))}<p class="tenue peq" style="margin-top:7px">Se completan los viernes y no siempre los escribe quien atendió. ${k.precioConDemora} de las ${k.precioTotal} marcadas “Precio” recibieron el precio después de 4 h.</p>`)}
  </section>`;
}

const RESTRICCIONES = [
  ['Presupuesto: $38 M el primer año', 'Servicios en la nube con pago mensual, sin compras grandes de entrada. Costos por cotizar antes de aprobar.'],
  ['Máximo una contratación nueva', 'Un administrador de datos y catálogo. La operación la mantiene el equipo actual; el soporte técnico sigue externo por horas.'],
  ['Piloto visible en 90 días', 'La Fase 1 entra primero en WhatsApp y mostrador. Esta interfaz ya sirve para validar el flujo con el equipo.'],
  ['Sin cambios grandes en diciembre', 'Del 1 al 31 de diciembre solo se mide y se capacita. El cambio operativo sale antes o se retoma en enero.'],
  ['La atención no se puede detener', 'WhatsApp, teléfono y mostrador siguen iguales: el Hub se agrega encima y reemplaza las hojas por etapas.'],
  ['Habilidades digitales básicas', 'Cotizar en tres toques y sesiones cortas dentro de la jornada laboral.'],
  ['Ley de datos y facturación', 'Autorización obligatoria en cada solicitud (Ley 1581). La factura sigue en el software contable actual.'],
];

const AREAS = [
  ['Marketing digital', 'Campañas con enlace etiquetado y segmentos taller / particular.', 'Marketing'],
  ['Contenidos', 'Fichas, guías de compatibilidad y plantillas con el tono de la marca.', 'Catálogo, mensajes'],
  ['E-commerce', 'Catálogo por vehículo y solicitud de cotización; condiciones por taller.', 'Catálogo'],
  ['Desarrollo web', 'Aplicación por roles, cotizaciones, pedidos y eventos de trazabilidad.', 'Todas las vistas'],
  ['IA y automatización', 'Clasificar mensajes, sugerir referencia y alertar; no autoriza descuentos.', 'Bandeja, Coordinación'],
  ['Cloud y ciberseguridad', 'Roles, MFA, respaldos, consentimiento y plan de continuidad.', 'Plan, permisos'],
  ['Datos', 'Modelo Q### / C### / V###, limpieza del expediente, indicadores y línea base.', 'Diagnóstico, Gerencia'],
];

const si = '<span class="si">Sí</span>';
const no = '<span class="no">—</span>';
const PERMISOS = [
  ['Clientes y chats', no, si, si, no, no, si],
  ['Precio de lista y descuentos', 'Precio', 'Solicita', 'Aprueba', no, no, 'Consulta'],
  ['Costo y margen', no, no, si, no, no, si],
  ['Stock y conteos', 'Disponible', 'Consulta', 'Consulta', 'Edita', no, 'Consulta'],
  ['Campañas', no, no, no, no, si, 'Consulta'],
  ['Usuarios y auditoría', no, no, no, no, no, si],
];

export function plan() {
  const fases = [
    ['Fase 1 · Fundación', 'Cotizar con rastro', ['WhatsApp Business compartido', 'Bandeja y cotizaciones Q###', 'Fichas C### y roles', 'Tablero de cierre'], true],
    ['Fase 2 · Catálogo', 'Inventario confiable', ['Conteo y mínimos', 'Catálogo con compatibilidad', 'Precio + stock + entrega en un mensaje', 'Portal para talleres'], true],
    ['Fase 3 · Experiencia', 'De punta a punta', ['Origen hasta la venta', 'Estado del pedido', 'Seguimientos y postventa', 'PQR ligadas a la venta'], true],
    ['Fase 4 · Inteligencia', 'Decidir y escalar', ['Predicción de quiebres', 'Reconocimiento por foto', 'Retención de talleres'], false],
  ];
  return `
  ${cab('Propuesta y plan', 'Una plataforma, por etapas, dentro de lo que la empresa puede sostener', 'Primero cotizar con rastro; luego confiar en el inventario; después conectar todo el recorrido. Cada fase entrega valor sin esperar la siguiente.')}
  <section><div class="fases">${fases.map(([t, s, it, mvp]) => `<div class="carta fase ${mvp ? 'mvp' : ''}"><h3>${t}</h3><p class="tenue peq">${s}</p><ul>${it.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>
  <p class="tenue peq" style="margin-top:8px">Borde verde: flujo representado en este prototipo. La Fase 4 queda fuera hasta tener datos confiables.</p></section>
  <section class="seccion">
    <h2>Primeros 90 días</h2>
    <div class="rejilla c3">
      <div class="carta"><h3>Días 1 a 30: sin software nuevo</h3><ul><li>Plantilla única de cotización</li><li>Origen y motivo al cerrar, por quien atendió</li><li>Conteo de las 12 referencias</li><li>MFA en correo y redes; copia semanal</li></ul></div>
      <div class="carta"><h3>Diciembre: temporada alta</h3><ul><li>Sin cambios en la operación</li><li>Medir la línea base hasta el precio</li><li>Capacitación corta en la jornada</li></ul></div>
      <div class="carta"><h3>Hasta el día 90: piloto</h3><ul><li>Bandeja y Q### con WhatsApp y mostrador</li><li>Tablero de cierre para gerencia</li><li>Decidir si se pasa a la Fase 2</li></ul></div>
    </div>
  </section>
  <section class="seccion"><h2>Cómo cumple las restricciones de gerencia</h2><p class="nota-sec">Evidencia ${ev('GER-02')}</p><div class="carta">${tabla([{ t: 'Restricción' }, { t: 'Decisión de la propuesta' }], RESTRICCIONES.map(([a, b]) => [`<b>${esc(a)}</b>`, esc(b)]))}</div></section>
  <section class="seccion"><h2>Aportes por disciplina</h2><p class="nota-sec">Antes de presentar, conserven solo las áreas que estén en su equipo: el reto pide no inventar aportes de perfiles ausentes.</p><div class="carta">${tabla([{ t: 'Área' }, { t: 'Aporte a la misma solución' }, { t: 'Dónde se ve' }], AREAS.map(([a, b, c]) => [`<b>${a}</b>`, b, c]))}</div></section>
  <section class="seccion"><h2>Quién ve qué en producción</h2><div class="carta">${tabla([{ t: 'Información' }, { t: 'Cliente' }, { t: 'Asesor' }, { t: 'Coordinación' }, { t: 'Bodega' }, { t: 'Marketing' }, { t: 'Gerencia' }], PERMISOS)}</div></section>
  <section class="seccion rejilla c2">
    <div class="carta"><h2>Riesgos a gestionar</h2><ul>
      <li><b>Adopción:</b> si cotizar es más lento que en WhatsApp, no se usará. Se mide el tiempo por cotización desde el piloto.</li>
      <li><b>Calidad de datos:</b> se empieza con 12 referencias contadas, no migrando las hojas.</li>
      <li><b>Trato humano:</b> la automatización sugiere; el asesor envía y la coordinación aprueba descuentos.</li>
      <li><b>Compatibilidad:</b> una sugerencia errada genera devoluciones. Las piezas con variantes exigen confirmación.</li>
      <li><b>Fraude y accesos:</b> protocolo para cambios de cuenta bancaria, cuentas individuales y MFA.</li>
    </ul></div>
    <div class="carta"><h2>Qué es real y qué es simulado</h2><ul>
      <li><b>Real:</b> las 9 bases, los indicadores, la búsqueda por vehículo, el flujo de estados y la promesa de entrega calculada por rutas.</li>
      <li><b>Simulado:</b> envío por WhatsApp, cambio de rol sin inicio de sesión y almacenamiento en este navegador.</li>
      <li><b>Asistente:</b> usa reglas sobre el texto del cliente, no un modelo de lenguaje.</li>
      <li><b>Para producción:</b> servidor con autenticación y permisos reales, base de datos, MFA, respaldos y WhatsApp Business API.</li>
    </ul></div>
  </section>`;
}
