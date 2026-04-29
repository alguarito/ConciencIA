# ConciencIA + Orden — I.E. Sor María Juliana

Sistema Inteligente de Apoyo al Debido Proceso y SIEE para la Institución Educativa Sor María Juliana.

## Modos de Operación

### 🧠 ConciencIA (con IA)
Asistente conversacional impulsado por Gemini que guía al docente a través del debido proceso, sugiere rutas de acción y genera formatos institucionales automáticamente.

### 📋 Orden (sin IA, offline)
Wizard paso a paso basado en las rutas del Manual de Convivencia. Selecciona el tipo de caso, llena los formularios y genera todo el expediente documental de una sola vez. No requiere internet.

## Requisitos

- Python 3.9+
- Node.js 18+
- TeX Live (pdflatex)

## Instalación Local

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
python app.py

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## Uso

1. Abre `http://localhost:5173` en tu navegador
2. En **Modo Orden**: Crea un caso → Selecciona la ruta → Llena los datos → Genera el expediente
3. En **Modo ConciencIA**: Configura tu API Key de Gemini en ⚙️ Configuración → Chatea con el asesor

## Estructura

```
├── backend/          # FastAPI + compilador LaTeX
│   └── app.py
├── frontend/         # React + Vite
│   └── src/
├── generated-skills/ # SKILL.md + scripts LaTeX
└── casos/            # Expedientes generados (local, no se sube)
```

## Licencia

Uso exclusivo institucional — I.E. Sor María Juliana, Cartago, Valle del Cauca.
