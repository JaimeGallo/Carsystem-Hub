# Carsystem

Plataforma de repuestos del reto interdisciplinar **Carsystem Repuestos S.A.S.** (Estud-IA Bootcamps): búsqueda, cotización, compra y decisión en un solo recorrido, construida sobre las nueve bases del expediente Q3 2026.

**Sitio publicado:** https://jaimegallo.github.io/Carsystem-Hub/

> Caso educativo: la empresa, las personas y los registros son ficticios. No escribas datos reales en la demo.

## Dos caras, una plataforma

| Área | Ruta | Para qué sirve |
|---|---|---|
| Tienda | `#/` | Elegir el carro, ver qué le sirve, cuánto vale y cuándo llega, y pedir cotización |
| Mi pedido | `#/pedido` | Consultar el estado sin llamar |
| Bandeja | `#/equipo/bandeja` | Cola única, reloj hasta el precio, sugerencia de pieza y mensaje listo |
| Coordinación | `#/equipo/coordinacion` | Alertas, descuentos, embudo y reclamos |
| Bodega | `#/equipo/bodega` | Pedidos por ruta, reservas y conteos, sin precios |
| Marketing | `#/equipo/marketing` | Campañas y enlaces con origen |
| Gerencia | `#/equipo/gerencia` | Línea base, metas y actividad reciente |

La propuesta para el comité (diagnóstico, plan e impacto) está en la presentación de PowerPoint, fuera de este sitio.

## Qué es real y qué es simulado

- **Real:** indicadores calculados desde los CSV, búsqueda por vehículo, flujo de estados, promesa de entrega por rutas y reglas de control.
- **Simulado:** envío por WhatsApp, entrada al portal sin inicio de sesión y almacenamiento en `localStorage` del navegador.
- **Asistente:** usa reglas sobre el texto, no un modelo de lenguaje.
- **Supuesto a validar:** el corte de 30 minutos antes de cada ruta.

Este sitio es estático: no ofrece seguridad real por roles. Producción requiere servidor, autenticación, base de datos y WhatsApp Business API.

## Google Sites

Cuando la dirección principal se inserta en un iframe, redirige al dashboard histórico (`dashboard.html`), así que el enlace insertado en [carsystemrepuestos](https://sites.google.com/view/carsystemrepuestos) sigue mostrando el tablero.

## Desarrollo local

```bash
python -m http.server 8080
```

Luego visita `http://localhost:8080`. No hay paso de compilación. Si cambias archivos en `assets/`, sube el número `?v=` en `index.html` y en los `import` para evitar la caché del navegador.

## Datos

- `data/raw/`: los nueve CSV del Centro de Inteligencia, sin cambios.
- `data/hub.json`: se regenera con `python scripts/build_hub_data.py`. Agrega la compatibilidad estructurada por vehículo.
- `data/metrics.json`: agregados del dashboard histórico.

## Pruebas

```bash
node --test tests/core.test.mjs
```

Verifican que los indicadores reproduzcan el expediente y que se cumplan las reglas de negocio.
