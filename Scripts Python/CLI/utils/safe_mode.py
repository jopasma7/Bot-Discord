# ========== CONFIGURACIÓN MODO SEGURO ==========
# Este archivo contiene configuraciones específicas para evitar detección automática

# Límites conservadores para evitar sobrecargar el servidor
SAFE_MODE_CONFIG = {
    # Límites de requests por sesión
    "max_requests_per_session": 30,  # Máximo 30 requests antes de parar automáticamente
    "max_worlds_per_session": 5,     # Máximo 5 mundos por sesión
    "session_duration_limit": 1800,  # 30 minutos máximo por sesión
    
    # Delays más largos y humanos
    "min_delay_between_requests": 20,  # Mínimo 20 segundos entre requests
    "max_delay_between_requests": 90,  # Máximo 90 segundos entre requests
    "delay_between_worlds": (60, 180), # 1-3 minutos entre mundos
    
    # Descansos obligatorios
    "mandatory_break_after_requests": 15,  # Descanso cada 15 requests
    "mandatory_break_duration": (300, 600), # 5-10 minutos de descanso
    
    # Simulación humana
    "simulate_reading_time": True,     # Simular tiempo de lectura
    "random_world_skipping": True,     # Saltar mundos ocasionalmente
    "consistent_browser": True,        # Usar mismo navegador/headers por sesión
    
    # Protecciones adicionales
    "respect_server_errors": True,     # Parar si hay errores del servidor
    "detect_rate_limiting": True,      # Detectar si nos están limitando
    "auto_stop_on_suspicion": True,    # Parar automáticamente si algo parece sospechoso
}

def print_safe_mode_warning():
    """Muestra advertencia sobre el modo seguro"""
    from funciones.extra import color_texto
    print("=" * 70)
    print(color_texto("🔒 MODO SEGURO ACTIVADO", "amarillo"))
    print(color_texto("Para evitar detección automática, se aplicarán las siguientes restricciones:", "blanco"))
    print(color_texto(f"• Máximo {SAFE_MODE_CONFIG['max_requests_per_session']} requests por sesión", "azul"))
    print(color_texto(f"• Máximo {SAFE_MODE_CONFIG['max_worlds_per_session']} mundos por sesión", "azul"))
    print(color_texto(f"• Delays de {SAFE_MODE_CONFIG['min_delay_between_requests']}-{SAFE_MODE_CONFIG['max_delay_between_requests']} segundos entre requests", "azul"))
    print(color_texto("• Descansos obligatorios cada 15 requests (5-10 minutos)", "azul"))
    print(color_texto("• Headers consistentes (mismo navegador por sesión)", "azul"))
    print(color_texto("• Simulación de comportamiento humano realista", "azul"))
    print("=" * 70)

def check_session_limits(request_count, start_time, worlds_processed):
    """Verifica si se han alcanzado los límites de sesión"""
    from funciones.extra import color_texto
    import time
    
    current_time = time.time()
    session_duration = current_time - start_time
    
    # Verificar límites
    if request_count >= SAFE_MODE_CONFIG["max_requests_per_session"]:
        print(color_texto(f"⚠️ LÍMITE ALCANZADO: {request_count} requests realizados.", "rojo"))
        print(color_texto("Por seguridad, la sesión se detendrá automáticamente.", "amarillo"))
        return True
        
    if worlds_processed >= SAFE_MODE_CONFIG["max_worlds_per_session"]:
        print(color_texto(f"⚠️ LÍMITE ALCANZADO: {worlds_processed} mundos procesados.", "rojo"))
        print(color_texto("Por seguridad, la sesión se detendrá automáticamente.", "amarillo"))
        return True
        
    if session_duration >= SAFE_MODE_CONFIG["session_duration_limit"]:
        print(color_texto(f"⚠️ LÍMITE ALCANZADO: {session_duration/60:.1f} minutos de sesión.", "rojo"))
        print(color_texto("Por seguridad, la sesión se detendrá automáticamente.", "amarillo"))
        return True
    
    return False

def get_conservative_delay():
    """Genera delays más conservadores para el modo seguro"""
    import random
    min_delay = SAFE_MODE_CONFIG["min_delay_between_requests"]
    max_delay = SAFE_MODE_CONFIG["max_delay_between_requests"]
    
    # Usar delays más largos en modo seguro
    return random.uniform(min_delay, max_delay)

def should_take_mandatory_break(request_count):
    """Verifica si es momento de tomar un descanso obligatorio"""
    return request_count > 0 and request_count % SAFE_MODE_CONFIG["mandatory_break_after_requests"] == 0

def take_mandatory_break():
    """Toma un descanso obligatorio"""
    import random
    import time
    from funciones.extra import color_texto
    
    min_break, max_break = SAFE_MODE_CONFIG["mandatory_break_duration"]
    break_time = random.uniform(min_break, max_break)
    
    print(color_texto(f"☕ DESCANSO OBLIGATORIO: {break_time/60:.1f} minutos", "amarillo"))
    print(color_texto("Esto es necesario para evitar ser detectado como bot.", "blanco"))
    print(color_texto("Puedes usar este tiempo para hacer otras cosas...", "gris"))
    
    # Mostrar countdown cada minuto
    remaining = break_time
    while remaining > 0:
        if remaining > 60:
            print(color_texto(f"⏰ Tiempo restante: {remaining/60:.1f} minutos", "gris"))
            time.sleep(60)
            remaining -= 60
        else:
            time.sleep(remaining)
            remaining = 0
    
    print(color_texto("✅ Descanso completado. Continuando...", "verde"))
