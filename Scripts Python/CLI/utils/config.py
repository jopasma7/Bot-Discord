# ========== CONFIGURACIÓN ==========
COOKIES_FILE = "utils/cookies_gt.json"

LOGIN_URL = "https://login.innogames.de/login/login?"
INDEX_URL = "https://www.guerrastribales.es/admintool/index.php"

HEADERS = {"User-Agent": "Mozilla/5.0"}
WORLD = "es94"

# ========== CONFIGURACIÓN DE ACCESO ==========
# IMPORTANTE: Las credenciales se cargan desde variables de entorno por seguridad
import os

USERNAME = os.getenv("GT_USERNAME", "")  # Establecer con: set GT_USERNAME=tu_usuario
PASSWORD = os.getenv("GT_PASSWORD", "")  # Establecer con: set GT_PASSWORD=tu_contraseña

# Verificar que las credenciales estén configuradas
if not USERNAME or not PASSWORD:
    print("⚠️ ATENCIÓN: Configura las variables de entorno GT_USERNAME y GT_PASSWORD")
    print("Windows: set GT_USERNAME=tu_usuario && set GT_PASSWORD=tu_contraseña")
    print("Linux/Mac: export GT_USERNAME=tu_usuario && export GT_PASSWORD=tu_contraseña")

# ========== RUTAS Y URLS ==========
EXPECTED_HEADERS = ["Date", "Player", "Village", "Screen", "Action", "Session type", "CID"]
def get_bans_file():
    return f"logs/global/bans.yml"

def get_registro_simple(mundo=None):
    if mundo is None:
        mundo = WORLD
    return f"logs/{mundo}/PlayerLog.txt"

def get_registro_global(mundo=None):
    if mundo is None:
        mundo = WORLD
    return f"logs/{mundo}/WorldLog.txt"

def get_bans_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/multi.php?mode=list_banned"

def get_admint_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/"

def get_action_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/action_log.php?action=search"

def get_action_url_for_mundo(mundo):
    return f"https://{mundo}.guerrastribales.es/admintool/action_log.php?action=search"

def get_next_page_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/action_log.php?action=search&page="

def get_next_page_url_for_mundo(mundo):
    return f"https://{mundo}.guerrastribales.es/admintool/action_log.php?action=search&page="

def get_player_profile_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/multi.php?multi_name=&action=search_user_by_name"

def get_top_1000_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/multi.php?mode=trade_list"

def get_bot_detection_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/bot.php"

def get_shared_connections_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/shared_connections"

def get_cookie_url():
    return f"https://{WORLD}.guerrastribales.es/admintool/multi.php?mode=cid_list"