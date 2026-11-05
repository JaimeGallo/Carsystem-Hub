"""Genera data/hub.json a partir de los 9 CSV del expediente (data/raw/).

Uso, desde la raíz del repositorio:

    python scripts/build_hub_data.py

Las tablas se copian sin alterar. Lo único que se agrega a mano es COMPATIBILIDAD:
la versión estructurada del texto libre de productos.csv, para poder buscar por
vehículo. Cuando la ficha no alcanza para asegurar la pieza, `confirmar` obliga a
que el asesor valide antes de cotizar (casos AT-05 y PQR-02 del expediente).
"""

import csv
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TABLAS = [
    "campanas", "clientes", "cotizaciones", "interacciones", "inventario",
    "pqr", "productos", "publicaciones", "ventas",
]
NUMERICAS = {
    "cantidad", "valor_cop", "precio_cop", "garantia_meses", "stock_registrado",
    "stock_fisico", "diferencia", "stock_minimo", "tiempo_reposicion_dias",
    "costo_promedio_cop", "unidades_vendidas_jul_sep", "inversion_cop",
    "publicaciones", "alcance", "interacciones", "clics",
    "mensajes_recibidos_plataforma", "contactos_registrados",
    "cotizaciones_con_origen", "ventas_con_origen",
    "valor_ventas_con_origen_cop", "horas_respuesta",
    "minutos_primera_respuesta", "minutos_envio_precio", "dias_resolucion",
}

COMPATIBILIDAD = {
    "FR-101": [
        {"marca": "Mazda", "modelo": "3", "desde": 2014, "hasta": 2019},
        {"marca": "Mazda", "modelo": "2", "desde": 2015, "hasta": 2020},
        {"marca": "Mazda", "modelo": "CX-30", "desde": 2020, "hasta": 2022},
    ],
    "FR-102": [
        {"marca": "Renault", "modelo": "Logan", "desde": 2013, "hasta": 2020},
        {"marca": "Renault", "modelo": "Sandero", "desde": 2013, "hasta": 2020},
        {"marca": "Renault", "modelo": "Duster", "desde": 2012, "hasta": 2019,
         "confirmar": "Aplica solo a Duster 4x2."},
    ],
    "MO-201": [
        {"marca": "Chevrolet", "modelo": "Spark"},
        {"marca": "Chevrolet", "modelo": "Spark GT"},
        {"marca": "Chevrolet", "modelo": "Sail"},
        {"marca": "Chevrolet", "modelo": "Aveo"},
        {"marca": "Renault", "modelo": "*",
         "confirmar": "Solo motores 1.4/1.6 con rosca 3/4-16 UNF."},
    ],
    "MO-202": [
        {"marca": "Chevrolet", "modelo": "Sail", "desde": 2011, "hasta": 2019},
        {"marca": "Chevrolet", "modelo": "Aveo", "desde": 2008, "hasta": 2017},
    ],
    "SU-301": [
        {"marca": "Renault", "modelo": "Sandero", "desde": 2012, "hasta": 2019},
        {"marca": "Renault", "modelo": "Logan", "desde": 2012, "hasta": 2019},
    ],
    "SU-302": [
        {"marca": "Chevrolet", "modelo": "Spark GT", "desde": 2011, "hasta": 2021},
        {"marca": "Chevrolet", "modelo": "Beat", "desde": 2011, "hasta": 2021},
    ],
    "EL-401": [
        {"marca": "*", "modelo": "*",
         "confirmar": "Polaridad y borne dependen del vehículo: valide antes de cotizar."},
    ],
    "EL-402": [
        {"marca": "Chevrolet", "modelo": "Sail", "desde": 2013, "hasta": 2019,
         "confirmar": "Verifique que el conector sea de 3 pines."},
    ],
    "RE-501": [
        {"marca": "Chevrolet", "modelo": "Spark GT", "desde": 2011, "hasta": 2020,
         "confirmar": "Solo transmisión mecánica."},
        {"marca": "Chevrolet", "modelo": "Beat", "desde": 2011, "hasta": 2020,
         "confirmar": "Solo transmisión mecánica."},
    ],
    "RE-502": [
        {"marca": "Renault", "modelo": "*", "confirmar": "Solo motor K4M 1.6 16V."},
    ],
    "FI-601": [
        {"marca": "Renault", "modelo": "Logan", "confirmar": "Solo motor 1.6."},
        {"marca": "Renault", "modelo": "Sandero", "confirmar": "Solo motor 1.6."},
        {"marca": "Renault", "modelo": "Duster", "confirmar": "Solo motor 1.6."},
    ],
    "FI-602": [
        {"marca": "Chevrolet", "modelo": "Sail"},
        {"marca": "Chevrolet", "modelo": "Aveo"},
    ],
}


def valor(columna, texto):
    if columna in NUMERICAS:
        if texto == "":
            return None
        numero = float(texto)
        return int(numero) if numero.is_integer() else numero
    return texto


def leer(nombre):
    with open(RAIZ / "data" / "raw" / f"{nombre}.csv", encoding="utf-8-sig", newline="") as f:
        return [{k: valor(k, v) for k, v in fila.items()} for fila in csv.DictReader(f)]


def main():
    datos = {nombre: leer(nombre) for nombre in TABLAS}
    faltan = {p["sku"] for p in datos["productos"]} - set(COMPATIBILIDAD)
    if faltan:
        raise SystemExit(f"Falta compatibilidad para: {sorted(faltan)}")
    datos["compatibilidad"] = COMPATIBILIDAD
    salida = RAIZ / "data" / "hub.json"
    salida.write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{salida.relative_to(RAIZ)}: " + ", ".join(f"{t} {len(datos[t])}" for t in TABLAS))


if __name__ == "__main__":
    main()
