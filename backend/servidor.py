from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

# Permite que la app de React (el celular) se conecte sin bloqueos de seguridad
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ARCHIVO_BD = "datos_panaderia.json"

@app.post("/sync")
async def recibir_sincronizacion(datos: dict):
    # Cuando el celular tiene internet, envía todo y la PC lo guarda aquí
    with open(ARCHIVO_BD, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=4)
    return {"status": "ok", "mensaje": "Sincronización exitosa con la PC"}

@app.get("/ver_datos")
async def ver_datos_pc():
    # Este endpoint es para que tú abras el navegador en la PC y veas qué se vendió
    if os.path.exists(ARCHIVO_BD):
        with open(ARCHIVO_BD, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"mensaje": "Aún no hay datos sincronizados"}
