# Carsystem Hub

Prototipo integrado para el reto interdisciplinar **Carsystem Repuestos S.A.S.** (Estud-IA Bootcamps): búsqueda, cotización, compra y decisión en un solo recorrido, construido sobre las nueve bases del expediente Q3 2026.

**Sitio publicado:** https://jaimegallo.github.io/Carsystem-Hub/

> Caso educativo: la empresa, las personas y los registros son ficticios. No escriba datos reales en la demo.

## Qué incluye

| Vista | Rol | Qué demuestra |
|---|---|---|
| Inicio, Diagnóstico, Plan | Comité | Problema priorizado, seis hallazgos con evidencias, fases, restricciones de gerencia y riesgos |
| Catálogo, Mi pedido | Cliente | Búsqueda por vehículo o síntoma, disponibilidad, entrega prometida, solicitud y seguimiento |
| Bandeja | Asesor | Cola única, cronómetro hasta el precio, sugerencia de referencia y mensaje en tres toques |
| Coordinación | Coordinación comercial | Alertas, descuentos, embudo y PQR |
| Bodega | Bodega y mensajería | Pedidos por ruta, reservas y conteos, sin precios |
| Marketing | Marketing y contenidos | Campañas y enlaces con origen que llegan hasta la cotización |
| Gerencia | Gerencia | Línea base, metas, escenario de recuperación y trazabilidad |

## Qué es real y qué es simulado

- **Real:** indicadores calculados desde los CSV, búsqueda por vehículo, flujo de estados, promesa de entrega por rutas y reglas de control.
- **Simulado:** envío por WhatsApp, cambio de rol sin inicio de sesión y almacenamiento en `localStorage` del navegador.
- **Asistente:** usa reglas sobre el texto, no un modelo de lenguaje.
- **Supuesto a validar:** el corte de 30 minutos antes de cada ruta.

Este sitio es estático: no ofrece seguridad real por roles. Producción requiere servidor, autenticación, base de datos y WhatsApp Business API.

## Google Sites

La dirección principal sigue funcionando en un iframe: cuando se inserta en otro sitio, redirige al Dashboard Admin (`dashboard.html`), así que el enlace ya insertado en [carsystemrepuestos](https://sites.google.com/view/carsystemrepuestos) sigue mostrando el tablero. Para insertarlo directamente use `https://jaimegallo.github.io/Carsystem-Hub/dashboard.html`.

## Desarrollo local

```bash
python -m http.server 8080
```

Luego visite `http://localhost:8080`. No hay dependencias ni paso de compilación.

## Datos

- `data/raw/`: los nueve CSV del Centro de Inteligencia, sin cambios.
- `data/hub.json`: se regenera con `python scripts/build_hub_data.py`. Agrega la compatibilidad estructurada por vehículo.
- `data/evidencias.json`: conversaciones, correos, testimonios, reseñas e incidentes citados.
- `data/metrics.json`: agregados del Dashboard Admin.

## Pruebas

```bash
node --test tests/core.test.mjs
```

Verifican que los indicadores reproduzcan el expediente y que se cumplan las reglas de negocio.
