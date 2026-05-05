import sys
import os
BASE_DIR = os.path.abspath(".")
sys.path.insert(0, os.path.join(BASE_DIR, "generated-skills", "smj-debido-proceso", "scripts"))
try:
    from generar_formato_latex import FORMATOS, PAQUETES, LABELS, COMMON_FIELDS
    print("Import successful")
except Exception as e:
    print(f"Import failed: {e}")
