// Tienda del cliente: el vehículo primero, y la pieza, el precio y la entrega a la vista.
import { ESTADOS_PEDIDO, VEHICULOS, buscarPorVehiculo, cop, norm, promesaEntrega, sugerir, stockDe } from './core.js?v=4';
import { CHECK, ETIQUETA, ICONOS, OJO, PERSONA, RELOJ, disco } from './iconos.js?v=4';
import { cab, esc } from './ui.js?v=4';

const ANIOS = Array.from({ length: 2023 - 2008 + 1 }, (_, i) => 2023 - i);
export const nombreCarro = (v) => (v?.marca && v?.modelo ? [v.marca, v.modelo, v.anio].filter(Boolean).join(' ') : '');

function coincidencias(ctx) {
  const { data, ui } = ctx;
  const v = ui.carro;
  let lista = data.productos.map((p) => ({ p, confirmar: null, encaja: false }));
  if (v.marca && v.modelo) {
    lista = buscarPorVehiculo(data, { marca: v.marca, modelo: v.modelo, anio: v.anio ? Number(v.anio) : null })
      .map((h) => ({ p: data.productos.find((x) => x.sku === h.sku), confirmar: h.confirmar, encaja: true }));
  }
  if (ui.cat) lista = lista.filter(({ p }) => p.categoria === ui.cat);
  if (ui.texto.trim()) {
    const t = norm(ui.texto);
    const sintoma = new Set(sugerir(data, ui.texto).candidatos.filter((c) => c.porPieza).map((c) => c.sku));
    lista = lista.filter(({ p }) => sintoma.has(p.sku) || norm(`${p.producto} ${p.sku} ${p.marca} ${p.categoria} ${p.compatibilidad}`).includes(t));
  }
  return lista;
}

function tarjeta(ctx, { p, confirmar, encaja }) {
  const pr = promesaEntrega(stockDe(ctx.data, ctx.st, p.sku), 1);
  const carro = nombreCarro(ctx.ui.carro);
  return `<article class="carta prod">
    <div class="fila entre"><span class="ico">${ICONOS[p.categoria]}</span><span class="tenue peq mono">${p.sku}</span></div>
    <h3>${esc(p.producto)}</h3>
    <p class="desc">${esc(p.marca)} · ${esc(p.especificacion.split(' · ').slice(0, 2).join(' · '))}</p>
    ${confirmar ? `<p class="encaja ojo">${OJO}<span>${esc(confirmar.split(':')[0].replace(/\.$/, ''))}. Un asesor lo confirma contigo.</span></p>` : encaja ? `<p class="encaja">${CHECK}<span>Encaja en tu ${esc(carro)}</span></p>` : `<p class="desc">${esc(p.compatibilidad)}</p>`}
    <div class="precio">${cop(p.precio_cop)}</div>
    <p class="peq fila" style="flex-wrap:nowrap;align-items:baseline"><span class="punto ${pr.ok ? '' : 'ojo'}"></span><span>${pr.ok ? 'Llega' : ''} ${esc(pr.texto)}</span></p>
    <div class="pie"><button class="btn pri" data-act="solicitar" data-sku="${p.sku}">Cotizar</button></div>
  </article>`;
}

function resultados(ctx) {
  const lista = coincidencias(ctx);
  const carro = nombreCarro(ctx.ui.carro);
  const titulo = carro ? `Para tu ${esc(carro)}` : 'Todos los repuestos';
  const cuerpo = lista.length
    ? `<div class="prods">${lista.map((x) => tarjeta(ctx, x)).join('')}</div>`
    : `<div class="carta pila"><p>No encontramos esa combinación entre nuestras referencias.</p><div><button class="btn pri" data-act="solicitar" data-sku="">Pedirle ayuda a un asesor</button></div></div>`;
  return `<div class="fila entre" style="margin-bottom:12px"><h2>${titulo}</h2><span class="tenue peq">${lista.length} ${lista.length === 1 ? 'opción' : 'opciones'}</span></div>${cuerpo}`;
}

export function tienda(ctx) {
  const { ui, data } = ctx;
  const v = ui.carro;
  const familias = [...new Set(data.productos.map((p) => p.categoria))];
  return `
  <section class="heroe">
    <div>
      <h1>El repuesto correcto, sin dar vueltas.</h1>
      <p class="sub">Dinos qué carro tienes y mira qué le sirve, cuánto vale y cuándo te llega.</p>
      <form class="selector" data-submit="nada" aria-label="Elige tu vehículo">
        <label class="campo">Marca<select data-input="c-marca"><option value="">Elige</option>${Object.keys(VEHICULOS).map((m) => `<option ${m === v.marca ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        <label class="campo">Modelo<select data-input="c-modelo" ${v.marca ? '' : 'disabled'}><option value="">Elige</option>${(VEHICULOS[v.marca] || []).map((m) => `<option ${m === v.modelo ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        <label class="campo anio">Año<select data-input="c-anio"><option value="">Cualquiera</option>${ANIOS.map((a) => `<option ${String(a) === String(v.anio) ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
        <label class="campo ancho">¿Qué necesitas o qué le pasa?<input data-input="c-texto" value="${esc(ui.texto)}" placeholder="Pastillas, batería, se recalienta…" autocomplete="off"></label>
      </form>
    </div>
    ${disco()}
  </section>
  <section class="cats" aria-label="Familias de repuestos">${familias.map((c) => `<button class="cat" data-act="cat" data-cat="${esc(c)}" aria-pressed="${ui.cat === c}">${ICONOS[c]}<b>${esc(c)}</b></button>`).join('')}</section>
  <section class="seccion" id="res">${resultados(ctx)}</section>
  <section class="ventajas">
    <div class="ventaja">${ETIQUETA}<span><b>Precio a la vista</b>Sin escribir ni esperar.</span></div>
    <div class="ventaja">${RELOJ}<span><b>Dos rutas al día</b>10:00 a. m. y 3:00 p. m. en el área metropolitana.</span></div>
    <div class="ventaja">${PERSONA}<span><b>Un asesor te respalda</b>Valida tu pieza antes de la venta.</span></div>
  </section>`;
}
export const refrescarResultados = (ctx) => { document.getElementById('res').innerHTML = resultados(ctx); };

export function formularioSolicitud(ctx, sku) {
  const { data, st, ui } = ctx;
  const p = data.productos.find((x) => x.sku === sku);
  return `
  <form class="pila" data-submit="crear-solicitud">
    ${p ? `<div class="fila entre"><b>${esc(p.producto)}</b><b>${cop(p.precio_cop)}</b></div><p class="tenue peq" style="margin-top:-6px">${esc(promesaEntrega(stockDe(data, st, sku), 1).texto)}</p>` : '<p class="tenue">Cuéntanos qué necesitas y un asesor te responde.</p>'}
    <input type="hidden" name="sku" value="${esc(sku)}">
    <label class="campo">Tu nombre o taller<input name="contacto" required autocomplete="name"></label>
    <div class="rejilla c2">
      <label class="campo">Vehículo<input name="vehiculo" value="${esc(nombreCarro(ui.carro))}" placeholder="Marca, modelo y año"></label>
      <label class="campo">Cantidad<input name="cantidad" type="number" min="1" max="50" value="1" required></label>
    </div>
    <label class="check"><input type="checkbox" name="autoriza" required><span>Autorizo tratar mis datos para responder esta solicitud (Ley 1581 de 2012).</span></label>
    <p class="tenue peq">Demo: no escribas datos reales. Se guarda solo en este navegador.</p>
    <button class="btn pri" style="justify-content:center">Enviar solicitud</button>
  </form>`;
}

export function pedido(ctx, id) {
  const q = id ? ctx.st.cotizaciones.find((x) => x.id === id.toUpperCase()) : null;
  const p = q?.sku ? ctx.data.productos.find((x) => x.sku === q.sku) : null;
  let cuerpo = '';
  if (id && !q) cuerpo = `<p class="carta tenue" style="margin-top:14px">No encontramos el pedido ${esc(id)}.</p>`;
  if (q) {
    const pasos = ['Solicitud recibida', 'Cotización enviada', ...ESTADOS_PEDIDO];
    const h = q.pedido?.historial || [];
    const idx = q.pedido ? 2 + ESTADOS_PEDIDO.indexOf(q.pedido.estado) : q.cotizadaEn ? 1 : 0;
    cuerpo = `
    <div class="rejilla c2" style="margin-top:14px">
      <div class="carta"><h2>${q.id}</h2>
        ${q.estado === 'Perdida' ? '<p class="tenue" style="margin-top:8px">Esta cotización fue cerrada.</p>' : `
        <ol class="linea-t">${pasos.map((t, i) => {
          const marca = h.find((x) => x.estado === t);
          return `<li class="${i < idx ? 'hecho' : i === idx ? 'actual hecho' : ''}">${t}${marca ? ` <span class="tenue peq">· ${new Date(marca.t).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</span>` : ''}</li>`;
        }).join('')}</ol>`}
      </div>
      <div class="carta pila"><h2>Detalle</h2>
        ${p ? `<div class="fila" style="flex-wrap:nowrap"><span class="ico" style="width:38px;color:var(--volt);flex:none">${ICONOS[p.categoria]}</span><p><b>${q.cantidad} × ${esc(p.producto)}</b><br><span class="tenue peq">${esc(p.marca)}</span></p></div>` : '<p class="tenue">Un asesor está identificando tu pieza.</p>'}
        ${q.pedido ? `<p class="peq tenue">Entrega prometida</p><p style="margin-top:-10px"><b>${esc(q.pedido.promesa)}</b></p>` : ''}
        ${q.estado === 'Ganada' ? `<details><summary class="peq tenue">¿Algún problema con tu pedido?</summary>
          <form class="pila" data-submit="crear-pqr" style="margin-top:9px"><input type="hidden" name="id" value="${q.id}">
            <label class="campo">Tipo<select name="tipo"><option>Garantía</option><option>Reclamo</option><option>Queja</option><option>Petición</option></select></label>
            <label class="campo">Qué pasó<textarea name="descripcion" required></textarea></label>
            <div><button class="btn">Registrar</button></div></form></details>` : ''}
      </div>
    </div>`;
  }
  return `
  ${cab('Mi pedido', 'Mira en qué va tu pedido sin tener que llamar.')}
  <form class="carta fila" data-submit="buscar-pedido" style="max-width:460px;align-items:flex-end">
    <label class="campo" style="flex:1">Número de cotización<input name="id" value="${esc(id || '')}" placeholder="Q103" required></label>
    <button class="btn pri" style="padding:12px 18px">Consultar</button>
  </form>${cuerpo}`;
}
