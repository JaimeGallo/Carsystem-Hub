// Ejecutar con: node --test tests/core.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as c from '../assets/js/core.js';

const data = JSON.parse(readFileSync(new URL('../data/hub.json', import.meta.url), 'utf8'));
const lunes = new Date(2026, 10, 2, 8, 0);

test('los indicadores reproducen el expediente', () => {
  const k = c.indicadores(data);
  assert.equal(k.cotizaciones, 96);
  assert.equal(k.ganadas, 44);
  assert.equal(k.valorVentas, 27515000);
  assert.equal(k.stockHoja, 284);
  assert.equal(k.stockFisico, 127);
  assert.equal(k.skusCoinciden, 0);
  assert.equal(k.bajoMinimo, 4);
  assert.equal(k.perdidasTardanza, 17);
  assert.equal(k.mensajesPlataforma, 242);
  assert.equal(k.contactosCampana, 80);
  assert.equal(k.sinPrecio, 7);
  assert.equal(k.precioConDemora, 10);
  assert.equal(k.precioTotal, 13);
  assert.equal(k.fuera, 66);
  assert.equal(k.entrantes, 198);
});

test('el cierre cae con el tiempo hasta el precio', () => {
  const t = c.indicadores(data).tramos;
  assert.deepEqual(t.map((x) => [x.n, x.ganadas]), [[34, 27], [22, 12], [24, 5], [9, 0]]);
});

test('la búsqueda por vehículo respeta los años', () => {
  const skus = (v) => c.buscarPorVehiculo(data, v).map((x) => x.sku);
  assert.ok(skus({ marca: 'Mazda', modelo: '3', anio: 2017 }).includes('FR-101'));
  assert.ok(!skus({ marca: 'Mazda', modelo: '3', anio: 2020 }).includes('FR-101'));
  assert.ok(skus({ marca: 'Renault', modelo: 'Sandero', anio: 2016 }).includes('SU-301'));
});

test('el asistente entiende los mensajes reales del expediente', () => {
  const a = c.sugerir(data, 'Buenos días. ¿Tienes pastillas delanteras para Mazda 3 modelo 2017? Necesito 3 juegos, las necesito hoy.');
  assert.equal(a.candidatos[0].sku, 'FR-101');
  assert.equal(a.cantidad, 3);
  assert.deepEqual(a.vehiculo, { marca: 'Mazda', modelo: '3', anio: 2017 });
  const b = c.sugerir(data, 'Necesito 2 baterías de 60 amperios para un Chevrolet Sail, es para hoy.');
  assert.equal(b.candidatos[0].sku, 'EL-401');
  assert.match(b.candidatos[0].confirmar, /Polaridad/);
  assert.equal(b.cantidad, 2);
  const d = c.sugerir(data, 'Necesito los dos amortiguadores delanteros para un Renault Sandero 2016');
  assert.equal(d.candidatos[0].sku, 'SU-301');
  assert.equal(d.cantidad, 2);
  assert.equal(c.sugerir(data, 'vi la publicación. ¿Cómo sé cuál le sirve a mi carro?').intencion, 'Consulta de compatibilidad');
});

test('la promesa de entrega respeta las rutas y el horario', () => {
  assert.equal(c.proximaRuta(lunes).texto, 'hoy, ruta de las 10:00 a. m.');
  assert.equal(c.proximaRuta(new Date(2026, 10, 2, 10, 0)).ruta, '3:00 p. m.');
  assert.equal(c.proximaRuta(new Date(2026, 10, 2, 16, 0)).ruta, '10:00 a. m.');
  assert.equal(c.proximaRuta(new Date(2026, 10, 2, 16, 0)).diasHasta, 1);
  assert.equal(c.proximaRuta(new Date(2026, 10, 7, 12, 0)).diasHasta, 2, 'sábado tarde pasa al lunes');
  assert.equal(c.proximaRuta(new Date(2026, 10, 8, 9, 0)).diasHasta, 1, 'domingo pasa al lunes');
});

test('una cotización recorre el flujo y descuenta inventario al entregar', () => {
  const st = c.estadoInicial(lunes);
  const inicial = c.stockDe(data, st, 'FR-101').disponible;
  const q = c.crearSolicitud(st, { contacto: 'Ana Prueba', autoriza: true, sku: 'FR-101', cantidad: 2, origen: 'Pauta', campana: 'CMP-06' }, lunes);
  assert.equal(q.id, 'Q104');
  assert.equal(c.nivelSLA(q, new Date(lunes.getTime() + 300 * 60000)), 'vencido');
  c.enviarCotizacion(st, q.id, 'FR-101', 2, 'Asesor', lunes);
  assert.equal(c.nivelSLA(q, lunes), null);
  c.cerrarGanada(st, q.id, 'hoy', 'Asesor', lunes);
  assert.equal(c.stockDe(data, st, 'FR-101').disponible, inicial - 2);
  ['Alistando', 'En ruta', 'Entregado'].forEach(() => c.avanzarPedido(st, q.id, lunes));
  assert.equal(q.pedido.estado, 'Entregado');
  assert.equal(c.stockDe(data, st, 'FR-101').disponible, inicial - 2);
  assert.equal(c.stockDe(data, st, 'FR-101').reservado, 0);
});

test('las reglas de control no se pueden saltar', () => {
  const st = c.estadoInicial(lunes);
  assert.throws(() => c.crearSolicitud(st, { contacto: 'Sin permiso' }), /autorización/);
  assert.throws(() => c.cerrarPerdida(st, 'Q097', ''), /motivo/);
  const d = c.solicitarDescuento(st, 'Q097', 10, 'Taller recurrente', lunes);
  assert.equal(st.cotizaciones.find((q) => q.id === 'Q097').descuentoPct, 0, 'solicitar no aplica el descuento');
  c.resolverDescuento(st, d.id, true, lunes);
  assert.equal(st.cotizaciones.find((q) => q.id === 'Q097').descuentoPct, 10);
});

test('el conteo físico reemplaza el stock', () => {
  const st = c.estadoInicial(lunes);
  c.registrarConteo(st, 'FI-601', 20, lunes);
  assert.equal(c.stockDe(data, st, 'FI-601').disponible, 20);
  assert.throws(() => c.registrarConteo(st, 'FI-601', -1));
});

test('el mensaje incluye precio, stock y entrega', () => {
  const p = data.productos.find((x) => x.sku === 'SU-301');
  const m = c.mensajeCotizacion(p, { id: 'Q098', contacto: 'Laura Gómez', cantidad: 2, descuentoPct: 0 }, { ok: true, texto: 'hoy, ruta de las 3:00 p. m.' });
  assert.match(m, /Total: \$572\.000/);
  assert.match(m, /ruta de las 3:00/);
  assert.match(m, /Garantía/);
});

test('el mensaje no duplica ni recorta el punto final', () => {
  const p = data.productos.find((x) => x.sku === 'SU-301');
  const q = { id: 'Q098', contacto: 'Laura', cantidad: 1, descuentoPct: 0 };
  assert.ok(c.mensajeCotizacion(p, q, { ok: true, texto: 'hoy, ruta de las 10:00 a. m.' }).includes('10:00 a. m.\n'));
  assert.ok(c.mensajeCotizacion(p, q, { ok: false, texto: 'por encargo, 7 días según proveedor' }).includes('según proveedor.\n'));
});
