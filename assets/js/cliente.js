// Portal del cliente: catálogo por vehículo, solicitud de cotización y seguimiento.
import { ESTADOS_PEDIDO, VEHICULOS, buscarPorVehiculo, cop, norm, promesaEntrega, sugerir, stockDe } from './core.js';
import { avisoDemo, cab, esc, etiqueta } from './ui.js';

const ANIOS = Array.from({ length: 2023 - 2008 + 1 }, (_, i) => 2023 - i);

function resultados(ctx) {
  const { data, st, ui } = ctx;
  const f = ui.catalogo;
  let lista = data.productos.map((p) => ({ p, confirmar: null, encaja: false }));
  if (f.marca && f.modelo) {
    const v = { marca: f.marca, modelo: f.modelo, anio: f.anio ? Number(f.anio) : null };
    const hits = buscarPorVehiculo(data, v);
    lista = hits.map((h) => ({ p: data.productos.find((x) => x.sku === h.sku), confirmar: h.confirmar, encaja: true }));
  }
  if (f.texto.trim()) {
    const t = norm(f.texto);
    const porSintoma = new Set(sugerir(data, f.texto).candidatos.filter((c) => c.porPieza).map((c) => c.sku));
    lista = lista.filter(({ p }) => porSintoma.has(p.sku) || norm(`${p.producto} ${p.sku} ${p.marca} ${p.categoria} ${p.compatibilidad}`).includes(t));
  }
  if (!lista.length) {
    return `<p class="carta tenue" style="margin-top:13px">No encontramos esa combinación en las referencias de la demo. Un asesor puede ayudarle: <button class="btn" data-act="solicitar" data-sku="">Pedir asesoría</button></p>`;
  }
  return `<div class="prods">${lista.map(({ p, confirmar, encaja }) => {
    const s = stockDe(data, st, p.sku);
    const pr = promesaEntrega(s, 1);
    return `<article class="carta prod">
      <div class="fila entre"><span class="tenue peq mono">${p.sku}</span>${pr.ok ? etiqueta('Disponible', 'ok') : etiqueta('Por encargo', 'aviso')}</div>
      <h3>${esc(p.producto)}</h3>
      <p class="desc">${esc(p.marca)} · ${esc(p.especificacion)}</p>
      <p class="desc">${esc(p.compatibilidad)}</p>
      ${confirmar ? `<p class="peq" style="color:var(--ambar)">Un asesor lo confirma antes de vender: ${esc(confirmar)}</p>` : encaja ? '<p class="peq" style="color:var(--verde)">Compatible con su vehículo</p>' : ''}
      <div class="precio">${cop(p.precio_cop)}</div>
      <p class="peq tenue">Entrega: ${esc(pr.texto)} · Garantía ${p.garantia_meses} meses</p>
      <div class="pie"><button class="btn pri" data-act="solicitar" data-sku="${p.sku}">Pedir cotización</button></div>
    </article>`;
  }).join('')}</div>`;
}

export function catalogo(ctx) {
  const f = ctx.ui.catalogo;
  const modelos = f.marca ? VEHICULOS[f.marca] : [];
  return `
  ${cab('Portal del cliente', 'Encuentre el repuesto de su vehículo', 'Consulte compatibilidad, precio y disponibilidad a cualquier hora, sin esperar a que abra el local.')}
  ${ctx.ui.origen ? avisoDemo(`Enlace de campaña detectado: ${ctx.ui.origen.campana}. La cotización quedará atribuida a ese origen.`) : ''}
  <form class="carta filtros" data-submit="nada">
    <label class="campo">Marca<select data-input="f-marca"><option value="">Todas</option>${Object.keys(VEHICULOS).map((m) => `<option ${m === f.marca ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
    <label class="campo">Modelo<select data-input="f-modelo" ${f.marca ? '' : 'disabled'}><option value="">Seleccione</option>${modelos.map((m) => `<option ${m === f.modelo ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
    <label class="campo">Año<select data-input="f-anio"><option value="">Cualquiera</option>${ANIOS.map((a) => `<option ${String(a) === f.anio ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
    <label class="campo">Pieza o síntoma<input data-input="f-texto" value="${esc(f.texto)}" placeholder="pastillas, se recalienta, no arranca…" autocomplete="off"></label>
  </form>
  <div id="res-cat">${resultados(ctx)}</div>`;
}
export const refrescarCatalogo = (ctx) => { document.getElementById('res-cat').innerHTML = resultados(ctx); };

export function formularioSolicitud(ctx, sku) {
  const { data, st, ui } = ctx;
  const f = ui.catalogo;
  const p = data.productos.find((x) => x.sku === sku);
  const veh = f.marca && f.modelo ? `${f.marca} ${f.modelo}${f.anio ? ' ' + f.anio : ''}` : '';
  return `
  <form class="pila" data-submit="crear-solicitud">
    ${p ? `<p><b>${esc(p.producto)}</b> · ${cop(p.precio_cop)}<br><span class="tenue peq">${esc(promesaEntrega(stockDe(data, st, sku), 1).texto)}</span></p>` : '<p class="tenue">Cuéntenos qué necesita y un asesor le responde.</p>'}
    <input type="hidden" name="sku" value="${esc(sku)}">
    <label class="campo">Nombre o taller<input name="contacto" required autocomplete="name"></label>
    <div class="rejilla c2">
      <label class="campo">Vehículo<input name="vehiculo" value="${esc(veh)}" placeholder="Marca, modelo y año"></label>
      <label class="campo">Cantidad<input name="cantidad" type="number" min="1" max="50" value="1" required></label>
    </div>
    <label class="campo">Últimos 4 dígitos del celular<input name="telefono" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="Solo para esta demo"></label>
    <label class="check"><input type="checkbox" name="autoriza" required><span>Autorizo a Carsystem a tratar mis datos para responder esta solicitud (Ley 1581 de 2012).</span></label>
    <p class="tenue peq">Demo: no escriba datos reales. Se guarda solo en este navegador.</p>
    <button class="btn pri">Enviar solicitud</button>
  </form>`;
}

export function seguimiento(ctx, id) {
  const q = id ? ctx.st.cotizaciones.find((x) => x.id === id.toUpperCase()) : null;
  const p = q?.sku ? ctx.data.productos.find((x) => x.sku === q.sku) : null;
  let cuerpo = '';
  if (id && !q) cuerpo = `<p class="carta tenue" style="margin-top:12px">No encontramos la cotización ${esc(id)}.</p>`;
  if (q) {
    const pasos = ['Solicitud recibida', 'Cotización enviada', ...ESTADOS_PEDIDO];
    const h = q.pedido?.historial || [];
    const idx = q.pedido ? 2 + ESTADOS_PEDIDO.indexOf(q.pedido.estado) : q.cotizadaEn ? 1 : 0;
    const perdida = q.estado === 'Perdida';
    cuerpo = `
    <div class="rejilla c2" style="margin-top:12px">
      <div class="carta"><h2>${q.id}</h2>
        ${perdida ? '<p>Esta cotización fue cerrada.</p>' : `
        <ol class="linea-t">${pasos.map((t, i) => {
          const marca = h.find((x) => x.estado === t);
          return `<li class="${i < idx ? 'hecho' : i === idx ? 'actual hecho' : ''}">${t}${marca ? ` <span class="tenue peq">· ${new Date(marca.t).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</span>` : ''}</li>`;
        }).join('')}</ol>`}
      </div>
      <div class="carta pila"><h2>Detalle</h2>
        ${p ? `<p><b>${q.cantidad} × ${esc(p.producto)}</b><br><span class="tenue peq">${esc(p.marca)} · ${p.sku}</span></p>` : '<p class="tenue">Un asesor está identificando la referencia.</p>'}
        ${q.pedido ? `<p class="peq">Promesa de entrega: <b>${esc(q.pedido.promesa)}</b></p>` : ''}
        ${q.estado === 'Ganada' ? `<details><summary class="peq">¿Algún problema con su pedido?</summary>
          <form class="pila" data-submit="crear-pqr" style="margin-top:8px"><input type="hidden" name="id" value="${q.id}">
            <label class="campo">Tipo<select name="tipo"><option>Garantía</option><option>Reclamo</option><option>Queja</option><option>Petición</option></select></label>
            <label class="campo">Qué ocurrió<textarea name="descripcion" required></textarea></label>
            <button class="btn">Registrar</button></form></details>` : ''}
      </div>
    </div>`;
  }
  return `
  ${cab('Portal del cliente', 'Consulte su pedido', `El expediente registra ${ctx.k.consultasPedido} consultas de estado para ${ctx.k.ventas} ventas. Aquí el cliente lo ve sin llamar.`)}
  <form class="carta fila" data-submit="buscar-pedido" style="max-width:420px">
    <label class="campo" style="flex:1">Número de cotización<input name="id" value="${esc(id || '')}" placeholder="Q103" required></label>
    <button class="btn pri" style="align-self:flex-end">Consultar</button>
  </form>${cuerpo}`;
}
