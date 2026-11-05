# Carsystem Hub

Dashboard Admin de métricas para el reto interdisciplinar **Carsystem Repuestos S.A.S.** (Estud-IA Bootcamps).

## Sitio publicado (GitHub Pages)

**URL del dashboard:** https://jaimegallo.github.io/Carsystem-Hub/

## Cómo embeberlo en Google Sites

1. Abre el sitio de la compañera en modo edición: [carsystemrepuestos](https://sites.google.com/view/carsystemrepuestos).
2. Crea una página nueva, por ejemplo **Dashboard Admin** o **Gerencia**.
3. **Insertar → Embed → Por URL**.
4. Pega: `https://jaimegallo.github.io/Carsystem-Hub/`
5. Marca **Página completa** / ajusta altura si Sites lo permite.
6. Publica el sitio.

Sugerencia de menú: **Catálogo** (experiencia cliente actual) + **Dashboard Admin** (métricas internas).

## Datos

- Fuente: 9 bases CSV del Centro de Inteligencia (`data/raw/`).
- Agregados para el dashboard: `data/metrics.json`.
- Periodo del expediente: julio – septiembre 2026 (caso educativo ficticio).

## Desarrollo local

Abre `index.html` con un servidor estático (necesario para cargar el JSON):

```bash
python -m http.server 8080
```

Luego visita `http://localhost:8080`.

## Regenerar métricas

```bash
# desde la raíz del repo, con los CSV en data/raw/
python -c "print('Usa el script de agregación del equipo o vuelve a generar data/metrics.json')"
```
