#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from typing import Any


SKILL_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LOGO = SKILL_ROOT / "assets" / "logo-institucion.png"

LABELS = {
    "fecha": "Fecha",
    "hora": "Hora",
    "lugar": "Lugar",
    "sede": "Sede",
    "jornada": "Jornada",
    "grado": "Grado",
    "grupo": "Grupo",
    "estudiante": "Estudiante",
    "documento_estudiante": "Documento del estudiante",
    "acudiente": "Acudiente",
    "documento_acudiente": "Documento del acudiente",
    "parentesco": "Parentesco",
    "telefono_acudiente": "Telefono del acudiente",
    "correo_acudiente": "Correo del acudiente",
    "responsable": "Responsable institucional",
    "cargo": "Cargo",
    "area_asignatura": "Area/asignatura",
    "docente_area": "Docente del area",
    "periodo": "Periodo",
    "descripcion_hechos": "Descripcion objetiva de hechos",
    "norma": "Norma o fuente institucional aplicable",
    "evidencias": "Evidencias o anexos",
    "actuaciones_previas": "Actuaciones previas",
    "version_estudiante": "Version libre del estudiante",
    "preguntas": "Preguntas orientadoras",
    "orientacion": "Orientacion pedagogica",
    "compromisos_estudiante": "Compromisos del estudiante",
    "compromisos_acudiente": "Compromisos del acudiente",
    "compromisos_institucion": "Compromisos institucionales",
    "remision": "Motivo de remision",
    "valoracion_orientacion": "Valoracion de orientacion",
    "medidas_proteccion": "Medidas de proteccion",
    "acciones_restaurativas": "Acciones restaurativas",
    "acuerdos": "Acuerdos",
    "seguimiento": "Plan de seguimiento",
    "decision": "Decision o resultado",
    "notificacion": "Constancia de notificacion",
    "recurso": "Recurso informado o interpuesto",
    "solicitud": "Solicitud concreta",
    "respuesta": "Respuesta institucional",
    "valoracion_reportada": "Valoracion reportada",
    "motivos_inconformidad": "Motivos de inconformidad",
    "pretension": "Pretension",
    "competencias": "Competencias o aprendizajes pendientes",
    "actividades": "Actividades",
    "criterios_evaluacion": "Criterios de evaluacion",
    "fecha_entrega": "Fecha de entrega o sustentacion",
    "resultado": "Resultado",
    "constancia": "Constancia",
    "observaciones": "Observaciones",
    "explicacion_proceso": "Analisis y Garantias del Debido Proceso",
}


COMMON_FIELDS = [
    ("fecha", "hora"),
    ("lugar", "sede"),
    ("jornada", "grado"),
    ("grupo", "estudiante"),
    ("documento_estudiante", "acudiente"),
    ("documento_acudiente", "telefono_acudiente"),
    ("responsable", "cargo"),
]


FORMATOS: dict[str, dict[str, Any]] = {
    "llamado-atencion": {
        "codigo": "SMJ-FDP-01",
        "titulo": "Formato de llamado de atencion",
        "fuente": "Manual de Convivencia, arts. 37, 39, 42 y 43.",
        "secciones": [
            ("Hecho observado", ["descripcion_hechos", "norma", "evidencias"]),
            ("Dialogo pedagogico", ["orientacion", "compromisos_estudiante", "seguimiento"]),
        ],
        "firmas": ["Estudiante", "Docente o directivo", "Director de grupo", "Testigo si aplica"],
    },
    "version-libre": {
        "codigo": "SMJ-FDP-02",
        "titulo": "Formato para version libre",
        "fuente": "Manual de Convivencia, arts. 37 y 43.",
        "secciones": [
            ("Informacion de apertura", ["descripcion_hechos", "norma", "evidencias"]),
            ("Version libre del estudiante", ["version_estudiante", "preguntas", "observaciones"]),
        ],
        "firmas": ["Estudiante", "Funcionario receptor", "Acudiente si aplica", "Personero o testigo"],
    },
    "citacion-acudiente": {
        "codigo": "SMJ-FDP-03",
        "titulo": "Citacion a padre de familia o acudiente",
        "fuente": "Manual de Convivencia, arts. 33, 34, 35 y 43; SIEE art. 13 cuando aplique.",
        "secciones": [
            ("Motivo de la citacion", ["descripcion_hechos", "norma", "solicitud"]),
            ("Datos de comparecencia", ["fecha_entrega", "lugar", "observaciones"]),
        ],
        "firmas": ["Responsable que cita", "Recibido por acudiente", "Estudiante si aplica"],
    },
    "remision-orientacion": {
        "codigo": "SMJ-FDP-04",
        "titulo": "Remision al Docente Orientador",
        "fuente": "Manual de Convivencia, arts. 37 y 47.",
        "secciones": [
            ("Motivo de remision", ["remision", "descripcion_hechos", "actuaciones_previas"]),
            ("Solicitud a orientacion", ["solicitud", "evidencias", "seguimiento"]),
        ],
        "firmas": ["Remitente", "Docente Orientador", "Coordinacion"],
    },
    "acta-compromiso": {
        "codigo": "SMJ-FDP-05",
        "titulo": "Acta de compromiso",
        "fuente": "Manual de Convivencia, arts. 37, 42 y 43; SIEE art. 9.",
        "secciones": [
            ("Contexto", ["descripcion_hechos", "norma", "actuaciones_previas"]),
            ("Compromisos", ["compromisos_estudiante", "compromisos_acudiente", "compromisos_institucion", "seguimiento"]),
        ],
        "firmas": ["Estudiante", "Acudiente", "Responsable institucional", "Testigo"],
    },
    "protocolo-tipo-i": {
        "codigo": "SMJ-FDP-06",
        "titulo": "Protocolo de atencion a situacion Tipo I",
        "fuente": "Manual de Convivencia, art. 33.",
        "secciones": [
            ("Situacion reportada", ["descripcion_hechos", "evidencias"]),
            ("Mediacion pedagogica", ["orientacion", "acuerdos", "seguimiento"]),
        ],
        "firmas": ["Partes involucradas", "Docente o directivo", "Acudiente si aplica"],
    },
    "protocolo-tipo-ii": {
        "codigo": "SMJ-FDP-07",
        "titulo": "Protocolo de atencion a situacion Tipo II",
        "fuente": "Manual de Convivencia, art. 34.",
        "secciones": [
            ("Situacion reportada", ["descripcion_hechos", "evidencias", "norma"]),
            ("Proteccion y atencion", ["medidas_proteccion", "notificacion", "acciones_restaurativas", "seguimiento"]),
            ("Reporte y comite", ["decision", "constancia", "observaciones"]),
        ],
        "firmas": ["Responsable", "Acudientes", "Comite/intervinientes", "Estudiante si aplica"],
    },
    "protocolo-tipo-iii": {
        "codigo": "SMJ-FDP-08",
        "titulo": "Protocolo de atencion a situacion Tipo III",
        "fuente": "Manual de Convivencia, art. 35.",
        "secciones": [
            ("Situacion reportada", ["descripcion_hechos", "evidencias", "norma"]),
            ("Atencion inmediata y autoridades", ["medidas_proteccion", "notificacion", "remision"]),
            ("Comite y seguimiento", ["decision", "seguimiento", "constancia"]),
        ],
        "firmas": ["Rectoria", "Comite de Convivencia", "Acudientes", "Intervinientes"],
    },
    "matricula-observacion": {
        "codigo": "SMJ-FDP-09",
        "titulo": "Formato de matricula en observacion",
        "fuente": "Manual de Convivencia, art. 42.",
        "secciones": [
            ("Antecedentes", ["descripcion_hechos", "actuaciones_previas", "norma"]),
            ("Condiciones y compromisos", ["compromisos_estudiante", "compromisos_acudiente", "compromisos_institucion", "seguimiento"]),
        ],
        "firmas": ["Rectoria o Coordinacion", "Estudiante", "Acudiente"],
    },
    "informe-coordinacion-rectoria": {
        "codigo": "SMJ-FDP-10",
        "titulo": "Informe de Coordinacion y Orientacion a Rectoria",
        "fuente": "Manual de Convivencia, documentos empleados en el debido proceso.",
        "secciones": [
            ("Resumen del caso", ["descripcion_hechos", "norma", "actuaciones_previas", "evidencias"]),
            ("Concepto y solicitud", ["valoracion_orientacion", "decision", "solicitud", "observaciones"]),
        ],
        "firmas": ["Coordinacion", "Docente Orientador", "Recibido Rectoria"],
    },
    "informe-explicativo-debido-proceso": {
        "codigo": "SMJ-FDP-INFO",
        "titulo": "Informe Explicativo del Debido Proceso (Garantias Legales)",
        "fuente": "Constitucion Nacional Art. 29, Ley 115 de 1994, Manual de Convivencia SMJ.",
        "secciones": [
            ("Descripcion del Caso", ["descripcion_hechos"]),
            ("Analisis de Garantias", ["explicacion_proceso"]),
            ("Cierre de Informe", ["notificacion", "recurso", "observaciones"]),
        ],
        "firmas": ["Coordinacion/Rectoria", "Estudiante", "Acudiente"],
    },
    "acta-restaurativa": {
        "codigo": "SMJ-FJR-01",
        "titulo": "Acta de mediacion o circulo restaurativo",
        "fuente": "Manual de Convivencia, arts. 45, 46 y 47.",
        "secciones": [
            ("Preparacion", ["descripcion_hechos", "actuaciones_previas", "valoracion_orientacion"]),
            ("Acuerdos restaurativos", ["acciones_restaurativas", "acuerdos", "compromisos_estudiante", "compromisos_institucion"]),
            ("Seguimiento", ["seguimiento", "fecha_entrega", "observaciones"]),
        ],
        "firmas": ["Facilitador", "Estudiante", "Victima/afectado si aplica", "Acudientes"],
    },
    "seguimiento-restaurativo": {
        "codigo": "SMJ-FJR-02",
        "titulo": "Seguimiento de acuerdos restaurativos",
        "fuente": "Manual de Convivencia, art. 47.",
        "secciones": [
            ("Acuerdos objeto de seguimiento", ["acuerdos", "fecha_entrega"]),
            ("Revision", ["resultado", "evidencias", "decision", "seguimiento"]),
        ],
        "firmas": ["Orientacion o Coordinacion", "Estudiante", "Acudiente", "Docente de aula si aplica"],
    },
    "acta-estudio-caso": {
        "codigo": "SMJ-FDP-11",
        "titulo": "Acta de estudio de caso",
        "fuente": "Manual de Convivencia, art. 43.",
        "secciones": [
            ("Apertura y asistentes", ["descripcion_hechos", "norma", "actuaciones_previas"]),
            ("Analisis", ["evidencias", "version_estudiante", "valoracion_orientacion"]),
            ("Conclusion", ["decision", "recurso", "seguimiento"]),
        ],
        "firmas": ["Coordinacion", "Rectoria si aplica", "Personero", "Estudiante", "Acudiente"],
    },
    "notificacion-decision": {
        "codigo": "SMJ-FDP-12",
        "titulo": "Notificacion de decision institucional",
        "fuente": "Manual de Convivencia, art. 43; SIEE art. 13 cuando aplique.",
        "secciones": [
            ("Decision", ["decision", "norma", "evidencias"]),
            ("Notificacion y recursos", ["notificacion", "recurso", "observaciones"]),
        ],
        "firmas": ["Responsable institucional", "Estudiante", "Acudiente", "Testigo si hay negativa a firmar"],
    },
    "reclamacion-academica": {
        "codigo": "SMJ-FAC-01",
        "titulo": "Reclamacion academica inicial",
        "fuente": "SIEE, art. 13.",
        "secciones": [
            ("Datos academicos", ["area_asignatura", "docente_area", "periodo", "valoracion_reportada"]),
            ("Inconformidad", ["motivos_inconformidad", "evidencias", "pretension"]),
        ],
        "firmas": ["Estudiante o acudiente", "Recibido por docente/director de grupo"],
    },
    "derecho-peticion-academico": {
        "codigo": "SMJ-FAC-02",
        "titulo": "Derecho de peticion academico",
        "fuente": "SIEE, art. 13, literal reclamaciones.",
        "secciones": [
            ("Solicitud", ["solicitud", "motivos_inconformidad", "evidencias"]),
            ("Pretension y notificacion", ["pretension", "notificacion", "observaciones"]),
        ],
        "firmas": ["Solicitante", "Recibido por instancia competente"],
    },
    "recurso-reposicion": {
        "codigo": "SMJ-FAC-03",
        "titulo": "Recurso de reposicion",
        "fuente": "Manual de Convivencia, art. 43; SIEE art. 13.",
        "secciones": [
            ("Decision recurrida", ["decision", "fecha", "notificacion"]),
            ("Sustentacion", ["motivos_inconformidad", "evidencias", "pretension"]),
        ],
        "firmas": ["Recurrente", "Recibido por instancia que decidio"],
    },
    "recurso-apelacion": {
        "codigo": "SMJ-FAC-04",
        "titulo": "Recurso de apelacion",
        "fuente": "Manual de Convivencia, art. 43; SIEE art. 13.",
        "secciones": [
            ("Decision recurrida", ["decision", "fecha", "notificacion"]),
            ("Sustentacion de apelacion", ["motivos_inconformidad", "evidencias", "pretension"]),
        ],
        "firmas": ["Recurrente", "Recibido por instancia superior"],
    },
    "plan-mejoramiento": {
        "codigo": "SMJ-FAC-05",
        "titulo": "Plan de mejoramiento",
        "fuente": "SIEE, art. 9.",
        "secciones": [
            ("Datos academicos", ["area_asignatura", "docente_area", "periodo", "competencias"]),
            ("Actividades y evaluacion", ["actividades", "criterios_evaluacion", "fecha_entrega", "resultado"]),
            ("Compromisos", ["compromisos_estudiante", "compromisos_acudiente", "observaciones"]),
        ],
        "firmas": ["Docente", "Estudiante", "Acudiente"],
    },
    "preinforme": {
        "codigo": "SMJ-FAC-06",
        "titulo": "Acta de entrega de preinforme",
        "fuente": "SIEE, art. 11.",
        "secciones": [
            ("Situacion academica", ["area_asignatura", "periodo", "descripcion_hechos", "evidencias"]),
            ("Compromisos de mejora", ["actividades", "compromisos_estudiante", "compromisos_acudiente", "seguimiento"]),
        ],
        "firmas": ["Director de grupo o docente", "Estudiante", "Acudiente"],
    },
    "solicitud-promocion-posterior": {
        "codigo": "SMJ-FAC-07",
        "titulo": "Solicitud de promocion posterior",
        "fuente": "SIEE, art. 3.",
        "secciones": [
            ("Solicitud", ["solicitud", "grado", "area_asignatura", "motivos_inconformidad"]),
            ("Actividades pendientes", ["actividades", "fecha_entrega", "observaciones"]),
        ],
        "firmas": ["Representante legal/acudiente", "Estudiante", "Recibido Coordinacion"],
    },
    "promocion-anticipada": {
        "codigo": "SMJ-FAC-08",
        "titulo": "Ruta de promocion anticipada",
        "fuente": "SIEE, art. 3, literal 10.",
        "secciones": [
            ("Apertura del proceso", ["solicitud", "actuaciones_previas", "valoracion_orientacion"]),
            ("Valoraciones y decision", ["area_asignatura", "resultado", "decision", "notificacion"]),
        ],
        "firmas": ["Coordinacion", "Acudiente", "Docentes", "Docente Orientador", "Consejo Academico"],
    },
}


PAQUETES = {
    "falta-leve": ["llamado-atencion", "acta-compromiso"],
    "falta-grave": [
        "citacion-acudiente",
        "version-libre",
        "acta-estudio-caso",
        "informe-explicativo-debido-proceso",
        "acta-compromiso",
        "acta-restaurativa",
        "seguimiento-restaurativo",
        "notificacion-decision",
        "recurso-reposicion",
        "recurso-apelacion",
    ],
    "falta-gravisima": [
        "citacion-acudiente",
        "version-libre",
        "protocolo-tipo-iii",
        "acta-estudio-caso",
        "informe-explicativo-debido-proceso",
        "informe-coordinacion-rectoria",
        "notificacion-decision",
        "recurso-reposicion",
        "recurso-apelacion",
    ],
    "situacion-tipo-i": ["protocolo-tipo-i", "acta-compromiso", "seguimiento-restaurativo"],
    "situacion-tipo-ii": [
        "protocolo-tipo-ii",
        "citacion-acudiente",
        "informe-explicativo-debido-proceso",
        "acta-restaurativa",
        "seguimiento-restaurativo",
        "notificacion-decision",
    ],
    "situacion-tipo-iii": [
        "protocolo-tipo-iii",
        "citacion-acudiente",
        "informe-explicativo-debido-proceso",
        "informe-coordinacion-rectoria",
        "acta-estudio-caso",
        "notificacion-decision",
    ],
    "justicia-restaurativa": [
        "remision-orientacion",
        "acta-restaurativa",
        "acta-compromiso",
        "seguimiento-restaurativo",
    ],
    "reclamacion-academica": [
        "reclamacion-academica",
        "derecho-peticion-academico",
        "recurso-reposicion",
        "recurso-apelacion",
    ],
    "promocion-posterior": [
        "solicitud-promocion-posterior",
        "plan-mejoramiento",
        "acta-compromiso",
        "notificacion-decision",
    ],
    "promocion-anticipada": [
        "promocion-anticipada",
        "citacion-acudiente",
        "acta-compromiso",
        "notificacion-decision",
    ],
}


def latex_escape(value: Any) -> str:
    text = "" if value is None else str(value)
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(ch, ch) for ch in text).replace("\n", r"\\ ")


def latex_path(path: Path) -> str:
    return r"\detokenize{" + path.expanduser().resolve().as_posix() + "}"


def slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def load_data(path: str | None) -> dict[str, Any]:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise SystemExit("El archivo JSON debe contener un objeto.")
    return data


def data_for_format(raw: dict[str, Any], tipo: str) -> dict[str, Any]:
    data: dict[str, Any] = {}
    general = raw.get("general", {})
    if isinstance(general, dict):
        data.update(general)
    for key, value in raw.items():
        if key not in {"general"} and key not in FORMATOS and not isinstance(value, dict):
            data[key] = value
    specific = raw.get(tipo, {})
    if isinstance(specific, dict):
        data.update(specific)
    return data


def field_value(data: dict[str, Any], key: str) -> str:
    value = data.get(key, "")
    if value is None or str(value).strip() == "":
        return r"\hrulefill"
    return latex_escape(value)


def block_value(data: dict[str, Any], key: str) -> str:
    value = data.get(key, "")
    if value is None or str(value).strip() == "":
        return r"\vspace{1.3cm}"
    return latex_escape(value)


def render_identification(data: dict[str, Any]) -> str:
    rows = []
    for left, right in COMMON_FIELDS:
        rows.append(
            "    "
            + latex_escape(LABELS[left])
            + " & "
            + field_value(data, left)
            + " & "
            + latex_escape(LABELS[right])
            + " & "
            + field_value(data, right)
            + r" \\ \hline"
        )
    return "\n".join(rows)


def render_sections(info: dict[str, Any], data: dict[str, Any]) -> str:
    chunks: list[str] = []
    for title, keys in info["secciones"]:
        chunks.append(r"\section*{" + latex_escape(title) + "}")
        chunks.append(r"\begin{longtable}{|p{0.28\linewidth}|p{0.66\linewidth}|}")
        chunks.append(r"\hline")
        for key in keys:
            label = LABELS.get(key, key.replace("_", " ").title())
            chunks.append(
                r"\textbf{"
                + latex_escape(label)
                + "} & "
                + block_value(data, key)
                + r" \\ \hline"
            )
        chunks.append(r"\end{longtable}")
    return "\n".join(chunks)


def render_signatures(info: dict[str, Any]) -> str:
    firmas = info.get("firmas", [])
    rows = []
    for i in range(0, len(firmas), 2):
        left = latex_escape(firmas[i])
        right = latex_escape(firmas[i + 1]) if i + 1 < len(firmas) else ""
        rows.append(r"\hrulefill & \hrulefill \\")
        rows.append(left + " & " + right + r" \\[2.2em]")
    return "\n".join(rows)


def render_tex(tipo: str, data: dict[str, Any], logo: Path) -> str:
    info = FORMATOS[tipo]
    today = data.get("fecha_generacion", date.today().isoformat())
    return rf"""\documentclass[letterpaper,11pt]{{article}}
\usepackage[utf8]{{inputenc}}
\usepackage[T1]{{fontenc}}
\usepackage[spanish]{{babel}}
\usepackage{{geometry}}
\usepackage{{graphicx}}
\usepackage{{xcolor}}
\usepackage{{array}}
\usepackage{{tabularx}}
\usepackage{{longtable}}
\usepackage{{enumitem}}
\usepackage{{fancyhdr}}
\usepackage{{lastpage}}
\geometry{{margin=1.7cm}}

\definecolor{{SMJBlue}}{{HTML}}{{1F4E79}}
\definecolor{{SMJGray}}{{HTML}}{{F2F4F7}}
\renewcommand{{\arraystretch}}{{1.25}}
\setlength{{\parindent}}{{0pt}}
\setlist[itemize]{{leftmargin=1.2em}}

\newcommand{{\CodigoFormato}}{{{latex_escape(info["codigo"])}}}
\newcommand{{\VersionFormato}}{{Version 1}}
\newcommand{{\FechaGeneracion}}{{{latex_escape(today)}}}

\pagestyle{{fancy}}
\fancyhf{{}}
\lhead{{\IfFileExists{{{latex_path(logo)}}}{{\includegraphics[height=1.25cm]{{{latex_path(logo)}}}}}{{}}}}
\chead{{\small\textbf{{INSTITUCION EDUCATIVA SOR MARIA JULIANA}}\\MORAL PEDESTAL DE LA SABIDURIA\\Calle 21 No 5-111 | iesormariajuliana@gmail.com\\Cartago - Valle del Cauca}}
\rhead{{\scriptsize \CodigoFormato\\\VersionFormato\\\FechaGeneracion\\Pagina \thepage\ de \pageref{{LastPage}}}}
\cfoot{{\scriptsize Documento reservado para uso institucional. Proteger datos personales de ninos, ninas y adolescentes.}}
\setlength{{\headheight}}{{60pt}}
\setlength{{\headsep}}{{20pt}}

\begin{{document}}

\begin{{center}}
{{\Large\bfseries\color{{SMJBlue}} {latex_escape(info["titulo"]).upper()}}}\\
{{\small {latex_escape(info["fuente"])}}}
\end{{center}}

\section*{{Datos de identificacion}}
\begin{{tabularx}}{{\linewidth}}{{|>{{\bfseries}}p{{0.22\linewidth}}|X|>{{\bfseries}}p{{0.20\linewidth}}|X|}}
\hline
{render_identification(data)}
\end{{tabularx}}

{render_sections(info, data)}

\section*{{Anexos y evidencias}}
\begin{{itemize}}
  \item Observador del estudiante o registro academico, si aplica.
  \item Evidencias aportadas por las partes.
  \item Citaciones, comunicaciones, constancias de notificacion o respuestas previas.
  \item Otros soportes: \hrulefill
\end{{itemize}}

\section*{{Firmas}}
\vspace{{0.8cm}}
\begin{{tabularx}}{{\linewidth}}{{X X}}
{render_signatures(info)}
\end{{tabularx}}

\vfill
{{\scriptsize Este formato es una plantilla de apoyo. Debe ser revisado por la instancia institucional competente antes de incorporarse al expediente.}}

\end{{document}}
"""


def write_format(tipo: str, output: Path, raw_data: dict[str, Any], logo: Path) -> Path:
    if tipo not in FORMATOS:
        raise SystemExit(f"Formato desconocido: {tipo}")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_tex(tipo, data_for_format(raw_data, tipo), logo), encoding="utf-8")
    return output


def print_listing() -> None:
    print("Formatos disponibles:")
    for key in sorted(FORMATOS):
        print(f"  - {key}: {FORMATOS[key]['titulo']} ({FORMATOS[key]['codigo']})")
    print("\nPaquetes disponibles:")
    for key, values in sorted(PAQUETES.items()):
        print(f"  - {key}: {', '.join(values)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera formatos LaTeX para debido proceso SMJ.")
    parser.add_argument("--listar", action="store_true", help="Muestra formatos y paquetes disponibles.")
    parser.add_argument("--tipo", choices=sorted(FORMATOS), help="Formato individual a generar.")
    parser.add_argument("--paquete", choices=sorted(PAQUETES), help="Paquete de formatos a generar.")
    parser.add_argument("--salida", help="Ruta de salida para --tipo. Por defecto: <tipo>.tex")
    parser.add_argument("--directorio", help="Directorio de salida para --paquete. Por defecto: paquete-<nombre>")
    parser.add_argument("--datos", help="JSON con datos generales y especificos por formato.")
    parser.add_argument("--logo", default=str(DEFAULT_LOGO), help="Ruta del logo institucional.")
    args = parser.parse_args()

    if args.listar:
        print_listing()
        return

    raw_data = load_data(args.datos)
    logo = Path(args.logo)

    if args.tipo:
        output = Path(args.salida or f"{args.tipo}.tex")
        path = write_format(args.tipo, output, raw_data, logo)
        print(path.resolve())
        return

    if args.paquete:
        directory = Path(args.directorio or f"paquete-{args.paquete}")
        written = []
        for index, tipo in enumerate(PAQUETES[args.paquete], start=1):
            filename = f"{index:02d}-{slug(tipo)}.tex"
            written.append(write_format(tipo, directory / filename, raw_data, logo))
        for path in written:
            print(path.resolve())
        return

    parser.error("Usa --listar, --tipo o --paquete.")


if __name__ == "__main__":
    main()
