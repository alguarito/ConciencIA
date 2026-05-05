import os
import json
import subprocess
import io
import zipfile
import time
import re
import shutil
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import google.generativeai as genai

# Supabase
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase_client: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[Supabase] Connected to {SUPABASE_URL}")
    except Exception as e:
        print(f"[Supabase] Failed to connect: {e}")
        supabase_client = None
else:
    print("[Supabase] No credentials found, using filesystem fallback")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar rutas y archivos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL_PATH = os.path.join(BASE_DIR, "generated-skills", "smj-debido-proceso", "SKILL.md")
SCRIPT_PATH = os.path.join(BASE_DIR, "generated-skills", "smj-debido-proceso", "scripts", "generar_formato_latex.py")
OUTPUT_DIR = os.path.join(BASE_DIR, "salida")
CASOS_DIR = os.path.join(BASE_DIR, "casos")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CASOS_DIR, exist_ok=True)
app.mount("/casos", StaticFiles(directory=CASOS_DIR), name="casos")

# Serve compiled frontend (production)
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="frontend_assets")

# Cargar contexto
def load_context():
    context = "Eres el Asesor de Debido Proceso SMJ.\n"
    if os.path.exists(SKILL_PATH):
        with open(SKILL_PATH, 'r', encoding='utf-8') as f:
            context += f.read()
            
    # Añadimos instrucción explícita para devolver listas de verificación de forma reconocible.
    context += """
    
    INSTRUCCIÓN DEL SISTEMA:
    Cuando identifiques un proceso, SIEMPRE devuelve los pasos o la ruta de acción usando este formato exacto al final de tu respuesta para que la interfaz web pueda construir un checklist dinámico:
    
    <PLAN_ACCION>
    - [ ] Nombre del Paso 1: Descripción corta
    - [ ] Nombre del Paso 2: Descripción corta
    - [ ] Nombre del Paso 3: Descripción corta
    </PLAN_ACCION>
    
    GENERACIÓN DE FORMATOS Y RECOLECCIÓN DE DATOS:
    Si el usuario indica que desea realizar un paso o generar un formato (ej. "implementar paso 1", "generar acta"), ¡NUNCA INVENTES, EMULES NI ASUMAS DATOS!
    Es una regla estricta: Si no tienes los datos reales del estudiante, fecha, lugar y descripción de los hechos, tu única acción permitida es PREGUNTARLE al usuario por esos datos uno por uno o en bloque.
    Solo cuando el usuario te haya respondido con información real, emitirás la etiqueta para generar el formato, incluyendo los datos estructurados en formato JSON.
    Jamás respondas "Voy a emular los datos" o "Aquí hay datos de prueba". Tu respuesta debe ser siempre: "Para proceder con este formato, por favor indícame los siguientes datos reales: ..."
    
    FORMATO EXACTO REQUERIDO PARA GENERAR:
    <GENERAR_FORMATO: nombre-formato>
    {
      "estudiante": "Nombre del estudiante",
      "grado": "10A",
      "descripcion_hechos": "Descripción detallada de lo ocurrido",
      "fecha": "YYYY-MM-DD"
    }
    </GENERAR_FORMATO>
    
    IMPORTANTE SOBRE LA COMUNICACIÓN CON EL USUARIO:
    Tú eres un asistente en una plataforma web. El sistema interceptará la etiqueta <GENERAR_FORMATO> y compilará el PDF automáticamente para el usuario.
    Por lo tanto: ¡NUNCA le hables al usuario sobre "archivos LaTeX", "código fuente", "compiladores", "TeX Live" ni comandos de terminal! Simplemente dile: "He ordenado la generación del documento, en un momento aparecerá en tu visor de PDFs a la derecha."
    
    CATÁLOGO DE FORMATOS DISPONIBLES (usa EXACTAMENTE estos nombres técnicos como nombre-formato):
    - acta-compromiso: Acta de compromiso
    - acta-estudio-caso: Acta de estudio de caso
    - acta-restaurativa: Acta de mediación o círculo restaurativo
    - citacion-acudiente: Citación a padre de familia o acudiente
    - derecho-peticion-academico: Derecho de petición académico
    - informe-coordinacion-rectoria: Informe de Coordinación y Orientación a Rectoría
    - informe-explicativo-debido-proceso: Informe explicativo del Debido Proceso (Garantías Legales)
    - llamado-atencion: Formato de llamado de atención
    - matricula-observacion: Formato de matrícula en observación
    - notificacion-decision: Notificación de decisión institucional
    - plan-mejoramiento: Plan de mejoramiento
    - preinforme: Acta de entrega de preinforme
    - promocion-anticipada: Ruta de promoción anticipada
    - protocolo-tipo-i: Protocolo de atención a situación Tipo I
    - protocolo-tipo-ii: Protocolo de atención a situación Tipo II
    - protocolo-tipo-iii: Protocolo de atención a situación Tipo III
    - reclamacion-academica: Reclamación académica inicial
    - recurso-apelacion: Recurso de apelación
    - recurso-reposicion: Recurso de reposición
    - remision-orientacion: Remisión al Docente Orientador
    - seguimiento-restaurativo: Seguimiento de acuerdos restaurativos
    - solicitud-promocion-posterior: Solicitud de promoción posterior
    - version-libre: Formato para versión libre
    
    IMPORTANTE: NO inventes nombres de formato. Usa ÚNICAMENTE los listados arriba. Si el usuario pide un documento que no está en la lista, indícale cuál de los formatos disponibles se ajusta mejor.
    
    INFORME EXPLICATIVO DEL DEBIDO PROCESO:
    Cuando se genere el formato 'informe-explicativo-debido-proceso', el campo 'explicacion_proceso' DEBE contener un análisis detallado y redactado de forma profesional sobre cómo se están garantizando los derechos del estudiante en este caso específico (derecho a la defensa, presunción de inocencia, contradicción, etc.), citando el Manual de Convivencia y la Ley 115.
    """
    return context

SYSTEM_PROMPT = load_context()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    caso_id: str
    messages: List[ChatMessage]
    api_key: Optional[str] = None
    api_key_fallback: Optional[str] = None

class CasoCreateRequest(BaseModel):
    nombre: str

@app.get("/api/casos")
async def get_casos():
    if supabase_client:
        try:
            result = supabase_client.table('casos').select('id, nombre, created_at').order('created_at', desc=True).execute()
            return {"casos": result.data}
        except Exception as e:
            print(f"[Supabase] Error fetching cases: {e}")
    # Filesystem fallback
    casos = []
    if os.path.exists(CASOS_DIR):
        for item in os.listdir(CASOS_DIR):
            if os.path.isdir(os.path.join(CASOS_DIR, item)):
                casos.append({"id": item, "nombre": item})
    casos.sort(key=lambda x: x["id"], reverse=True)
    return {"casos": casos}

@app.post("/api/casos")
async def create_caso(request: CasoCreateRequest):
    timestamp = int(time.time())
    safe_nombre = re.sub(r'[^a-zA-Z0-9]', '_', request.nombre)
    caso_id = f"caso_{timestamp}_{safe_nombre}"
    
    # Always create local dir for PDF compilation
    caso_path = os.path.join(CASOS_DIR, caso_id)
    os.makedirs(os.path.join(caso_path, "documentos"), exist_ok=True)
    
    if supabase_client:
        try:
            supabase_client.table('casos').insert({
                "id": caso_id,
                "nombre": request.nombre
            }).execute()
        except Exception as e:
            print(f"[Supabase] Error creating case: {e}")
    
    return {"id": caso_id, "nombre": request.nombre}

@app.get("/api/casos/{caso_id}")
async def get_caso_details(caso_id: str):
    messages = []
    pdfs = []
    
    if supabase_client:
        try:
            # Get chat messages
            msg_result = supabase_client.table('chat_messages').select('role, content').eq('caso_id', caso_id).order('created_at').execute()
            messages = msg_result.data or []
            
            # Get documents
            doc_result = supabase_client.table('documentos').select('*').eq('caso_id', caso_id).eq('status', 'success').execute()
            for doc in (doc_result.data or []):
                pdfs.append({
                    "name": doc["nombre"],
                    "url": doc.get("storage_path", "")
                })
        except Exception as e:
            print(f"[Supabase] Error loading case details: {e}")
    
    # Filesystem fallback for PDFs
    if not pdfs:
        docs_path = os.path.join(CASOS_DIR, caso_id, "documentos")
        if os.path.exists(docs_path):
            for item in os.listdir(docs_path):
                if item.endswith(".pdf"):
                    pdfs.append({"name": item, "url": f"/casos/{caso_id}/documentos/{item}"})
    
    # Filesystem fallback for messages
    if not messages:
        history_path = os.path.join(CASOS_DIR, caso_id, "chat_history.json")
        if os.path.exists(history_path):
            with open(history_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                messages = data.get("messages", [])
    
    return {"messages": messages, "pdfs": pdfs}

@app.delete("/api/casos/{caso_id}")
async def delete_caso(caso_id: str):
    """Elimina un caso y todos sus documentos."""
    if supabase_client:
        try:
            # Delete from storage
            try:
                files = supabase_client.storage.from_('documentos').list(caso_id)
                if files:
                    paths = [f"{caso_id}/{f['name']}" for f in files]
                    supabase_client.storage.from_('documentos').remove(paths)
            except Exception:
                pass
            # Delete from DB (cascade deletes messages and docs)
            supabase_client.table('casos').delete().eq('id', caso_id).execute()
        except Exception as e:
            print(f"[Supabase] Error deleting case: {e}")
    
    # Also clean local filesystem
    caso_path = os.path.join(CASOS_DIR, caso_id)
    if os.path.exists(caso_path):
        shutil.rmtree(caso_path)
    
    return {"status": "deleted", "id": caso_id}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "supabase": supabase_client is not None}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    api_key_primary = request.api_key or os.environ.get("GEMINI_API_KEY")
    api_key_fallback = request.api_key_fallback or os.environ.get("GEMINI_API_KEY_FALLBACK")
    
    if not api_key_primary:
        raise HTTPException(status_code=400, detail="Se requiere API Key de Gemini")
        
    history = []
    for msg in request.messages[:-1]:
        history.append({"role": "model" if msg.role == "assistant" else "user", "parts": [msg.content]})
        
    def attempt_chat(api_key):
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT
        )
        chat_session = model.start_chat(history=history)
        return chat_session.send_message(request.messages[-1].content)

    try:
        response = attempt_chat(api_key_primary)
        
        # Save chat history to Supabase
        new_msg_user = {"role": "user", "content": request.messages[-1].content}
        new_msg_assistant = {"role": "assistant", "content": response.text}
        
        if supabase_client:
            try:
                supabase_client.table('chat_messages').insert([
                    {"caso_id": request.caso_id, "role": "user", "content": request.messages[-1].content},
                    {"caso_id": request.caso_id, "role": "assistant", "content": response.text}
                ]).execute()
            except Exception as e:
                print(f"[Supabase] Error saving chat: {e}")
        
        # Also save to filesystem as fallback
        new_history = [msg.dict() for msg in request.messages]
        new_history.append({"role": "assistant", "content": response.text})
        history_path = os.path.join(CASOS_DIR, request.caso_id, "chat_history.json")
        os.makedirs(os.path.dirname(history_path), exist_ok=True)
        with open(history_path, 'w', encoding='utf-8') as f:
            json.dump({"messages": new_history}, f, ensure_ascii=False, indent=2)
            
        return {"content": response.text}
    except Exception as e:
        error_msg = str(e).lower()
        # Verificar si es error de quota, rate limit o exhaustion
        if ("quota" in error_msg or "exhausted" in error_msg or "429" in error_msg) and api_key_fallback:
            try:
                print("Primary API Key exhausted. Falling back to secondary API Key...")
                response_fallback = attempt_chat(api_key_fallback)
                return {"content": response_fallback.text}
            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"Fallback también falló: {str(e2)}")
        else:
            raise HTTPException(status_code=500, detail=str(e))

class GenerateFormatRequest(BaseModel):
    caso_id: str
    tipo: str
    datos: Optional[Dict] = None

@app.post("/api/generate-pdf")
async def generate_pdf(request: GenerateFormatRequest):
    try:
        caso_docs_dir = os.path.join(CASOS_DIR, request.caso_id, "documentos")
        os.makedirs(caso_docs_dir, exist_ok=True)
        
        datos_path = os.path.join(caso_docs_dir, f"datos_{request.tipo}.json")
        with open(datos_path, 'w', encoding='utf-8') as f:
            json.dump(request.datos or {}, f, ensure_ascii=False, indent=2)
            
        salida_tex = os.path.join(caso_docs_dir, f"{request.tipo}.tex")
        
        cmd = ["python", SCRIPT_PATH, "--tipo", request.tipo, "--salida", salida_tex, "--datos", datos_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return {"status": "error", "message": "Error generando archivo TeX", "details": result.stderr}
            
        compile_cmd = ["pdflatex", "-interaction=nonstopmode", "-output-directory", caso_docs_dir, salida_tex]
        comp_result = subprocess.run(compile_cmd, capture_output=True, text=True)
        
        pdf_filename = f"{request.tipo}.pdf"
        pdf_path = os.path.join(caso_docs_dir, pdf_filename)
        
        if os.path.exists(pdf_path):
            return {"status": "success", "pdf_url": f"/casos/{request.caso_id}/documentos/{pdf_filename}"}
        else:
            return {"status": "error", "message": "No se pudo generar el PDF.", "details": comp_result.stdout}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# MODO ORDEN — Endpoints offline (sin IA)
# ============================================================

import sys
sys.path.insert(0, os.path.join(BASE_DIR, "generated-skills", "smj-debido-proceso", "scripts"))
from generar_formato_latex import FORMATOS, PAQUETES, LABELS, COMMON_FIELDS

RUTA_DESCRIPTIONS = {
    "falta-leve": {"nombre": "Falta Leve", "descripcion": "Incumplimientos menores al Manual de Convivencia", "articulos": "Arts. 37, 39, 42, 43", "categoria": "convivencia", "etiquetas": ["Llegadas tarde", "Uniforme", "Desorden leve"]},
    "falta-grave": {"nombre": "Falta Grave", "descripcion": "Incumplimientos graves que afectan la convivencia", "articulos": "Arts. 37, 42, 43", "categoria": "convivencia", "etiquetas": ["Irrespeto reiterado", "Evasión de clase", "Fraude escolar"]},
    "falta-gravisima": {"nombre": "Falta Gravísima", "descripcion": "Conductas que atentan contra la integridad o la ley", "articulos": "Arts. 35, 42, 43", "categoria": "convivencia", "etiquetas": ["Agresión grave", "Daño a la infraestructura", "Reincidencia"]},
    "situacion-tipo-i": {"nombre": "Situación Tipo I", "descripcion": "Conflictos manejados inadecuadamente sin daño al cuerpo o la salud", "articulos": "Art. 33", "categoria": "convivencia", "etiquetas": ["Peleas verbales", "Chismes", "Discusiones sin lesiones"]},
    "situacion-tipo-ii": {"nombre": "Situación Tipo II", "descripcion": "Agresión escolar, acoso o ciberacoso (no delito)", "articulos": "Art. 34", "categoria": "convivencia", "etiquetas": ["Bullying", "Ciberacoso", "Agresión física sin incapacidad"]},
    "situacion-tipo-iii": {"nombre": "Situación Tipo III", "descripcion": "Conductas que constituyen presunto delito", "articulos": "Art. 35", "categoria": "convivencia", "etiquetas": ["Armas", "Drogas", "Abuso sexual", "Lesiones personales"]},
    "justicia-restaurativa": {"nombre": "Justicia Restaurativa", "descripcion": "Mediación y círculos restaurativos", "articulos": "Arts. 45, 46, 47", "categoria": "convivencia", "etiquetas": ["Acuerdos", "Reparación", "Mediación voluntaria"]},
    "reclamacion-academica": {"nombre": "Reclamación Académica", "descripcion": "Inconformidad con valoraciones o decisiones académicas", "articulos": "SIEE Art. 13", "categoria": "academico", "etiquetas": ["Revisión de notas", "Debido proceso evaluativo"]},
    "promocion-posterior": {"nombre": "Promoción Posterior", "descripcion": "Solicitud de promoción fuera del periodo regular", "articulos": "SIEE Art. 3", "categoria": "academico", "etiquetas": ["Estudiante rezagado", "Aceleración de aprendizaje"]},
    "promocion-anticipada": {"nombre": "Promoción Anticipada", "descripcion": "Promoción antes de finalizar el año lectivo", "articulos": "SIEE Art. 3, literal 10", "categoria": "academico", "etiquetas": ["Talento excepcional", "Rendimiento superior"]},
}

@app.get("/api/rutas")
async def get_rutas():
    """Devuelve el catálogo completo de rutas, formatos y campos para el modo Orden."""
    rutas = []
    for ruta_id, formato_ids in PAQUETES.items():
        desc = RUTA_DESCRIPTIONS.get(ruta_id, {"nombre": ruta_id, "descripcion": "", "articulos": ""})
        formatos = []
        for fmt_id in formato_ids:
            fmt_info = FORMATOS.get(fmt_id, {})
            # Collect all unique field keys for this format
            campos_especificos = []
            for _, keys in fmt_info.get("secciones", []):
                for key in keys:
                    if key not in [f for row in COMMON_FIELDS for f in row]:
                        campos_especificos.append({
                            "key": key,
                            "label": LABELS.get(key, key.replace("_", " ").title())
                        })
            formatos.append({
                "id": fmt_id,
                "codigo": fmt_info.get("codigo", ""),
                "titulo": fmt_info.get("titulo", fmt_id),
                "campos_especificos": campos_especificos
            })
        rutas.append({
            "id": ruta_id,
            "nombre": desc["nombre"],
            "descripcion": desc["descripcion"],
            "articulos": desc["articulos"],
            "categoria": desc.get("categoria", "convivencia"),
            "etiquetas": desc.get("etiquetas", []),
            "formatos": formatos,
            "total_formatos": len(formatos)
        })
    
    # Campos generales compartidos
    campos_generales = []
    for row in COMMON_FIELDS:
        for key in row:
            campos_generales.append({"key": key, "label": LABELS.get(key, key)})
    
    return {"rutas": rutas, "campos_generales": campos_generales}

class BatchGenerateRequest(BaseModel):
    caso_id: str
    ruta: str
    datos: Dict

@app.post("/api/generate-batch")
async def generate_batch(request: BatchGenerateRequest):
    """Genera TODOS los formatos de una ruta de golpe."""
    if request.ruta not in PAQUETES:
        raise HTTPException(status_code=400, detail=f"Ruta desconocida: {request.ruta}")
    
    caso_docs_dir = os.path.join(CASOS_DIR, request.caso_id, "documentos")
    os.makedirs(caso_docs_dir, exist_ok=True)
    
    # Save full data JSON
    datos_path = os.path.join(caso_docs_dir, "datos_completos.json")
    with open(datos_path, 'w', encoding='utf-8') as f:
        json.dump(request.datos, f, ensure_ascii=False, indent=2)
    
    results = []
    for i, formato_id in enumerate(PAQUETES[request.ruta], start=1):
        try:
            titulo = FORMATOS.get(formato_id, {}).get("titulo", formato_id).replace(' ', '_').replace('/', '_')
            base_filename = f"{i}_{titulo}"
            salida_tex = os.path.join(caso_docs_dir, f"{base_filename}.tex")
            
            cmd = ["python", SCRIPT_PATH, "--tipo", formato_id, "--salida", salida_tex, "--datos", datos_path]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                results.append({"id": formato_id, "status": "error", "message": result.stderr[:200]})
                continue
            
            compile_cmd = ["pdflatex", "-interaction=nonstopmode", "-output-directory", caso_docs_dir, salida_tex]
            subprocess.run(compile_cmd, capture_output=True, text=True)
            
            pdf_filename = f"{base_filename}.pdf"
            pdf_path = os.path.join(caso_docs_dir, pdf_filename)
            
            if os.path.exists(pdf_path):
                pdf_url = f"/casos/{request.caso_id}/documentos/{pdf_filename}"
                
                # Upload to Supabase Storage
                if supabase_client:
                    try:
                        storage_path = f"{request.caso_id}/{pdf_filename}"
                        with open(pdf_path, 'rb') as pdf_file:
                            supabase_client.storage.from_('documentos').upload(
                                storage_path, pdf_file.read(),
                                file_options={"content-type": "application/pdf", "upsert": "true"}
                            )
                        # Get public URL
                        public_url = supabase_client.storage.from_('documentos').get_public_url(storage_path)
                        pdf_url = public_url
                        
                        # Register in documentos table
                        supabase_client.table('documentos').insert({
                            "caso_id": request.caso_id,
                            "nombre": pdf_filename,
                            "tipo": formato_id,
                            "storage_path": public_url,
                            "status": "success"
                        }).execute()
                    except Exception as e:
                        print(f"[Supabase] Error uploading PDF {pdf_filename}: {e}")
                
                results.append({
                    "id": formato_id,
                    "status": "success",
                    "name": pdf_filename,
                    "url": pdf_url
                })
            else:
                results.append({"id": formato_id, "status": "error", "message": "pdflatex no generó el archivo"})
        except Exception as e:
            results.append({"id": formato_id, "status": "error", "message": str(e)})
    
    # Save datos_generales to Supabase
    if supabase_client:
        try:
            supabase_client.table('casos').update({
                "datos_generales": request.datos,
                "ruta": request.ruta
            }).eq('id', request.caso_id).execute()
        except Exception as e:
            print(f"[Supabase] Error updating case data: {e}")
    
    return {"results": results}


@app.get("/api/casos/{caso_id}/descargar-zip")
async def descargar_zip(caso_id: str):
    """Genera y descarga un archivo ZIP con todos los PDFs del caso."""
    caso_docs_dir = os.path.join(CASOS_DIR, caso_id, "documentos")
    if not os.path.exists(caso_docs_dir):
        raise HTTPException(status_code=404, detail="No hay documentos generados para este caso")
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(caso_docs_dir):
            for file in files:
                if file.endswith(".pdf"):
                    file_path = os.path.join(root, file)
                    zf.write(file_path, arcname=file)
    
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer, 
        media_type="application/zip", 
        headers={"Content-Disposition": f"attachment; filename=Expediente_{caso_id}.zip"}
    )

# SPA catch-all: serve index.html for any non-API route
if os.path.exists(FRONTEND_DIST):
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    # Puerto por defecto 7860 (HuggingFace/Render Docker) o variable de entorno PORT
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
