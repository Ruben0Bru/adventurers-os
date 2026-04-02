import os
import uuid
import requests
from dotenv import load_dotenv
from extractor_excel import extraer_catalogo_excel

# ==========================================
# 1. CREDENCIALES
# ==========================================
load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("[ERROR CRÍTICO] Faltan variables en .env.local")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# ==========================================
# 2. ESQUEMA ESTRICTO (Según tu Diagrama)
# ==========================================
TABLA_CLASES = "club_clase"
TABLA_REQUISITOS = "catalogo_requisito"
# TABLA PIVOTE ELIMINADA: No existe ni se necesita.

def obtener_contexto_sesion():
    url = f"{SUPABASE_URL}/rest/v1/{TABLA_CLASES}?nombre=eq.Corderitos&select=id_clase"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and len(res.json()) > 0:
        return res.json()[0].get("id_clase")
    raise ValueError("[-] No se pudo resolver el contexto de la clase 'Corderitos'.")

def ejecutar_pipeline():
    try:
        # FASE 0: Extracción (Desde tu archivo .xlsx nativo)
        datos_crudos = extraer_catalogo_excel("plantilla_requisitos.xlsx")
        
        # FASE 1: Obtener contexto
        id_clase_contexto = obtener_contexto_sesion()
        print(f"[Inyector] Contexto resuelto. UUID Clase: {id_clase_contexto}")

        # FASE 2: Transformación (Un solo Payload)
        payload_maestra = []

        for item in datos_crudos:
            payload_maestra.append({
                "id_requisito": str(uuid.uuid4()),
                "id_clase": id_clase_contexto,      # Relación 1:N directa
                "eje_curricular": item["eje_curricular"],
                "titulo": item["titulo"],
                "descripcion": item["descripcion"]
            })

        # FASE 3: Carga (La única ingesta real que necesitas)
        print(f"[Inyector] Disparando {len(payload_maestra)} registros a '{TABLA_REQUISITOS}'...")
        res_req = requests.post(f"{SUPABASE_URL}/rest/v1/{TABLA_REQUISITOS}", json=payload_maestra, headers=HEADERS)
        
        if res_req.status_code in [200, 201]:
            print("\n[🚀] ¡VICTORIA! Catálogo inyectado perfectamente.")
        else:
            raise Exception(f"Fallo en inserción maestra: {res_req.text}")

    except Exception as e:
        print(f"\n[❌] FALLO DE SISTEMA: {e}")

if __name__ == "__main__":
    ejecutar_pipeline()