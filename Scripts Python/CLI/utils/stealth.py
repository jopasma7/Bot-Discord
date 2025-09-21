# ========== CONFIGURACIÓN STEALTH ==========
import random
import time
import json
import os

# User agent consistente - se mantiene igual durante toda la sesión
# Se genera uno al inicio y se reutiliza para ser coherente
_session_user_agent = None
_session_headers_base = None

def get_consistent_user_agent():
    """
    Obtiene un User-Agent consistente para toda la sesión.
    Simula que siempre usas el mismo navegador desde el mismo PC.
    """
    global _session_user_agent
    
    if _session_user_agent is None:
        # Detectar el User-Agent real del sistema si es posible
        try:
            import platform
            system = platform.system()
            
            if system == "Windows":
                # User-Agents típicos de Windows 10/11
                windows_agents = [
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
                ]
                _session_user_agent = random.choice(windows_agents)
            else:
                # Fallback genérico
                _session_user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
        except:
            _session_user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    
    return _session_user_agent

def get_consistent_headers():
    """
    Genera headers consistentes que se mantienen iguales durante toda la sesión.
    Solo varían detalles menores como Accept-Language o algunos valores opcionales.
    """
    global _session_headers_base
    
    if _session_headers_base is None:
        _session_headers_base = {
            "User-Agent": get_consistent_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",  # Consistente con España
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
        }
    
    # Crear copia para esta petición
    headers = _session_headers_base.copy()
    
    # Variar solo detalles menores ocasionalmente (como haría un navegador real)
    if random.random() < 0.1:  # 10% de las veces
        headers["Cache-Control"] = random.choice(["max-age=0", "no-cache"])
    
    return headers

# Función legacy para compatibilidad - ahora usa headers consistentes
def get_random_headers():
    """Mantiene compatibilidad pero ahora usa headers consistentes"""
    return get_consistent_headers()

def human_delay(base_min=10, base_max=45, variation=0.3):
    """
    Genera delays más humanos e impredecibles
    - base_min/max: rango base en segundos
    - variation: variación adicional (0.3 = 30% extra de randomness)
    """
    base_delay = random.uniform(base_min, base_max)
    
    # Añadir variación humana (a veces paradas más largas)
    if random.random() < 0.15:  # 15% de chance de parada larga
        extra_delay = random.uniform(30, 120)  # 30s-2min extra
        print(f"⏸️  Pausa humana extendida: {extra_delay:.1f}s adicionales")
        base_delay += extra_delay
    
    # Micro-variaciones como humano
    micro_variation = base_delay * variation * random.uniform(-1, 1)
    final_delay = max(base_delay + micro_variation, 5)  # mínimo 5s
    
    return final_delay

def session_break_check(request_count, max_requests=50):
    """
    Simula descansos de sesión como humano real
    Cada cierto número de requests, pausa de 5-15 minutos
    """
    # Ajustar el rango según max_requests para evitar errores
    break_interval = min(15, max_requests // 2) if max_requests < 30 else random.randint(15, max_requests)
    
    if request_count > 0 and request_count % break_interval == 0:
        break_time = random.uniform(300, 900)  # 5-15 minutos
        print(f"☕ Descanso de sesión (como humano real): {break_time/60:.1f} minutos")
        print("💡 Esto es normal - los humanos no navegan 24/7 sin parar")
        time.sleep(break_time)
        return True
    return False

def add_mouse_simulation():
    """Simula tiempo de lectura/procesamiento humano"""
    read_time = random.uniform(2, 8)  # 2-8 segundos leyendo página
    time.sleep(read_time)

def should_skip_mundo(mundo, skip_probability=0.1):
    """
    A veces los humanos se saltan mundos o no los revisan todos
    """
    if random.random() < skip_probability:
        print(f"⏭️  Saltando mundo {mundo} (comportamiento humano ocasional)")
        return True
    return False

def show_session_info():
    """Muestra información sobre la sesión actual"""
    from funciones.extra import color_texto
    user_agent = get_consistent_user_agent()
    
    # Extraer nombre del navegador del User-Agent
    if "Chrome" in user_agent and "Edg" in user_agent:
        browser = "Microsoft Edge"
    elif "Chrome" in user_agent:
        browser = "Google Chrome"
    elif "Firefox" in user_agent:
        browser = "Mozilla Firefox"
    else:
        browser = "Navegador desconocido"
    
    print(color_texto(f"🌐 Sesión iniciada simulando: {browser}", "verde"))
    print(color_texto("💡 Se mantendrán headers consistentes durante toda la sesión", "gris"))

# Configuración mejorada para comportamiento más realista
STEALTH_CONFIG = {
    "min_delay": 15,      # Aumentado de 5
    "max_delay": 60,      # Aumentado de 15  
    "session_breaks": True,
    "random_skips": True,
    "consistent_headers": True,  # NUEVO: Headers consistentes por sesión
    "max_consecutive_requests": 40,  # Límite antes de descanso forzado
}
