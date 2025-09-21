import requests
import utils.config
from funciones.extra import obtener_mundos_disponibles, color_texto
from utils.stealth import get_random_headers, human_delay, session_break_check, should_skip_mundo
from bs4 import BeautifulSoup
from utils.selenium import verificar_cookie_y_sesion
import yaml
import os
from datetime import datetime
import time

# Contador para requests de baneos
_ban_request_count = 0

def obtener_mundos_cached():
    """
    Devuelve los mundos disponibles.
    Como ahora la función es estática, no necesita cache.
    """
    return obtener_mundos_disponibles()

# Al principio del menú, carga el archivo UNA VEZ:
def cargar_bans_global():
    """
    Función pública para cargar baneos globales.
    Utiliza la función interna optimizada.
    """
    return _cargar_baneos_globales()

def fetch_and_save_bans_background():
    """
    Descarga y parsea la tabla de baneos para todos los mundos,
    guardando los datos en logs/global/bans.yml bajo la clave del mundo.
    Cada jugador tendrá una lista de baneos (historial) en cada mundo.
    Muestra un resumen final por consola solo si hay nuevos baneos o errores,
    y una sola línea final con los mundos procesados.
    """
    print("⏳ Iniciando actualización de usuarios baneados para todos los mundos...")
    session = verificar_cookie_y_sesion()
    global_bans_path = "logs/global/bans.yml"
    os.makedirs(os.path.dirname(global_bans_path), exist_ok=True)
    if os.path.exists(global_bans_path):
        with open(global_bans_path, "r", encoding="utf-8") as f:
            global_bans = yaml.safe_load(f) or {}
    else:
        global_bans = {}

    resumen_mensajes = []
    mundos_actualizados = []
    mundos_errores = []
    estados_actualizados = {}  # Para trackear cambios de estado

    mundos_disponibles = obtener_mundos_disponibles()
    
    # APLICAR LÍMITES DE SEGURIDAD
    from utils.safe_mode import SAFE_MODE_CONFIG, check_session_limits
    import time
    
    max_mundos = SAFE_MODE_CONFIG["max_worlds_per_session"]
    if len(mundos_disponibles) > max_mundos:
        print(f"⚠️ Limitando a {max_mundos} mundos por seguridad (de {len(mundos_disponibles)} disponibles)")
        mundos_disponibles = mundos_disponibles[:max_mundos]
    
    print(f"🌍 Procesando {len(mundos_disponibles)} mundos con comportamiento humano...")
    session_start = time.time()

    for i, mundo in enumerate(mundos_disponibles):
        global _ban_request_count
        _ban_request_count += 1
        
        # Verificar límites de sesión
        if check_session_limits(_ban_request_count, session_start, i):
            print(color_texto("🛑 Límites de seguridad alcanzados. Deteniendo actualización de baneos.", "amarillo"))
            break
        
        # Ocasionalmente saltar mundos (comportamiento humano)
        if should_skip_mundo(mundo, skip_probability=0.05):  # 5% chance
            continue
            
        # Pausa humana entre mundos
        if i > 0:  # No delay en el primer mundo
            delay = human_delay(base_min=8, base_max=25)
            print(color_texto(f"⏳ Pausa entre mundos: {delay:.1f}s", "gris"))
            time.sleep(delay)
        
        # Descanso de sesión cada ciertos requests
        session_break_check(_ban_request_count, max_requests=15)
        
        url = f"https://{mundo}.guerrastribales.es/admintool/multi.php?mode=list_banned"
        try:
            # Headers dinámicos y humanos
            headers = get_random_headers()
            response = session.get(url, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            tables = soup.find_all("table", class_="vis")
            target_table = None
            for t in tables:
                ths = t.find_all("th")
                for th in ths:
                    th_text = th.get_text(strip=True).lower()
                    if th_text in ("name", "nombre", "date", "deadline", "admin", "reason", "remark", "punishment", "restart", "bantype"):
                        target_table = t
                        break
                if target_table:
                    break

            if not target_table:
                mundos_errores.append(mundo)
                continue

            rows = target_table.find_all("tr")[1:]  # Saltar cabecera
            nuevos = 0
            nuevos_nombres = []
            for row in rows:
                cols = row.find_all("td")
                if len(cols) < 13:
                    continue
                nombre = cols[0].find("a").text.strip() if cols[0].find("a") else ""
                date = cols[4].text.strip()
                deadline = cols[5].text.strip()
                unban_date = cols[6].text.strip()
                admin = cols[7].text.strip()
                reason = cols[8].text.strip()
                remark = cols[9].text.strip()
                punishment = cols[10].text.strip()
                restart = cols[11].text.strip()
                bantype = cols[12].text.strip()
                nuevo_ban = {
                    "date": date,
                    "deadline": deadline,
                    "unban_date": unban_date,
                    "admin": admin,
                    "reason": reason,
                    "remark": remark,
                    "punishment": punishment,
                    "restart": restart,
                    "bantype": bantype,
                    "estado": "activo"  # Nuevo campo: activo por defecto al detectarse
                }

                if mundo not in global_bans:
                    global_bans[mundo] = {}
                if nombre not in global_bans[mundo]:
                    global_bans[mundo][nombre] = []

                # Verificar si ya existe este ban exacto (misma fecha de inicio Y fin)
                ban_existente = None
                ban_entry_existente = None
                for ban_entry in global_bans[mundo][nombre]:
                    for num, ban_info in ban_entry.items():
                        # Comparación exacta: debe coincidir fecha de inicio Y fecha de fin
                        if ban_info["date"] == date and ban_info["unban_date"] == unban_date:
                            ban_existente = ban_info
                            ban_entry_existente = ban_entry
                            break
                    if ban_existente:
                        break
                
                if ban_existente:
                    # Ban con fechas exactas ya existe en la base de datos
                    estado_anterior = ban_existente.get("estado", "expirado")
                    if estado_anterior == "expirado":
                        # REACTIVACIÓN: El mismo ban exacto vuelve a aparecer en la web
                        ban_existente["estado"] = "activo"
                        nuevos += 1
                        nuevos_nombres.append(f"{nombre} (reactivado: {date} → {unban_date}) por {admin}")
                    elif estado_anterior == "activo":
                        # Ya estaba activo, no hacer nada (evitar spam en reportes)
                        pass
                else:
                    # Ban completamente nuevo (fechas no coinciden con ninguno existente)
                    numero_ban = len(global_bans[mundo][nombre]) + 1
                    global_bans[mundo][nombre].append({numero_ban: nuevo_ban})
                    nuevos += 1
                    nuevos_nombres.append(f"{nombre} (nuevo: {date} → {unban_date}) por {admin}")

            # Actualizar estados de baneos existentes
            baneos_actuales_web = set()
            for row in rows:
                cols = row.find_all("td")
                if len(cols) >= 13:
                    nombre = cols[0].find("a").text.strip() if cols[0].find("a") else ""
                    date = cols[4].text.strip()
                    unban_date = cols[6].text.strip()
                    baneos_actuales_web.add((nombre, date, unban_date))
            
            # Revisar baneos guardados y actualizar estados
            expirados_detectados = 0
            if mundo in global_bans:
                for nombre_jugador in global_bans[mundo]:
                    for ban_entry in global_bans[mundo][nombre_jugador]:
                        for num_ban, ban_info in ban_entry.items():
                            ban_tuple = (nombre_jugador, ban_info["date"], ban_info["unban_date"])
                            estado_anterior = ban_info.get("estado", "expirado")  # Por defecto expirado
                            
                            # Determinar nuevo estado
                            if ban_tuple in baneos_actuales_web:
                                ban_info["estado"] = "activo"
                            else:
                                # El ban ya no está en la web, marcar como expirado
                                if estado_anterior == "activo":
                                    ban_info["estado"] = "expirado"
                                    expirados_detectados += 1
                                    if mundo not in estados_actualizados:
                                        estados_actualizados[mundo] = []
                                    estados_actualizados[mundo].append(f"{nombre_jugador} (Ban #{num_ban})")
                                elif estado_anterior != "expirado":
                                    ban_info["estado"] = "expirado"

            if nuevos > 0:
                # Separar nuevos de reactivados en el reporte
                nuevos_reales = [n for n in nuevos_nombres if not "(reactivado:" in n]
                reactivados = [n for n in nuevos_nombres if "(reactivado:" in n]
                
                if nuevos_reales:
                    resumen_mensajes.append(f"✨🛡️  [{mundo}] Nuevos baneos detectados:")
                    for nombre in nuevos_reales:
                        resumen_mensajes.append(f"   • 🚫 {nombre}")
                    resumen_mensajes.append(f"Total nuevos: {len(nuevos_reales)}")
                
                if reactivados:
                    resumen_mensajes.append(f"🔄🛡️  [{mundo}] Baneos reactivados (mismo ban exacto):")
                    for nombre in reactivados:
                        resumen_mensajes.append(f"   • � {nombre}")
                    resumen_mensajes.append(f"Total reactivados: {len(reactivados)}")
            
            if expirados_detectados > 0:
                resumen_mensajes.append(f"⏰ [{mundo}] Baneos marcados como expirados: {expirados_detectados}")
            
            mundos_actualizados.append(mundo)

        except Exception as e:
            mundos_errores.append(mundo)

    with open(global_bans_path, "w", encoding="utf-8") as f:
        yaml.dump(global_bans, f, allow_unicode=True, sort_keys=False)

    # Mostrar resumen final bonito y compacto
    if resumen_mensajes:
        print("\n".join(resumen_mensajes))
    if estados_actualizados:
        print("\n🔄 Cambios de estado detectados:")
        for mundo, jugadores in estados_actualizados.items():
            print(f"  [{mundo}] Baneos expirados:")
            for jugador in jugadores:
                print(f"    • ⏰ {jugador}")
    if mundos_actualizados:
        print(f"🎉 Finalizada la actualización de usuarios baneados para los mundos: {', '.join(mundos_actualizados)}.")
    if mundos_errores:
        print(f"⚠️  No se pudo obtener la tabla de baneos para: {', '.join(mundos_errores)}.")

def _cargar_baneos_globales():
    """
    Función interna para cargar el archivo de baneos globales.
    Evita duplicar código en múltiples funciones.
    """
    global_bans_path = "logs/global/bans.yml"
    if not os.path.exists(global_bans_path):
        return {}
    
    with open(global_bans_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def obtener_historial_baneos_jugador(nombre_jugador, solo_activos=False, incluir_mundo_en_datos=True, global_bans=None):
    """
    Función unificada para obtener baneos de un jugador.
    
    Args:
        nombre_jugador: Nombre del jugador
        solo_activos: Si True, solo devuelve baneos con estado "activo"
        incluir_mundo_en_datos: Si True, añade el campo "Mundo" a cada ban
        global_bans: Datos de baneos ya cargados (para evitar recargar archivo)
    
    Returns:
        Lista de baneos con la información solicitada
    """
    # Usar datos ya cargados o cargar si no se proporcionan
    if global_bans is None:
        global_bans = _cargar_baneos_globales()
    
    if not global_bans:
        return []

    historial_total = []
    for mundo in obtener_mundos_cached():  # 🚀 OPTIMIZACIÓN: Usar cache en lugar de petición HTTP
        mundo_bans = global_bans.get(mundo, {})
        historial = mundo_bans.get(nombre_jugador, [])
        
        for ban_dict in historial:
            for num, ban in ban_dict.items():
                # Asegurar compatibilidad con datos antiguos
                estado = ban.get("estado", "expirado")
                
                # Filtrar por estado si se solicita
                if solo_activos and estado != "activo":
                    continue
                
                ban_con_info = dict(ban)
                ban_con_info["Nº"] = num
                
                if incluir_mundo_en_datos:
                    ban_con_info["Mundo"] = mundo
                
                historial_total.append(ban_con_info)

    return historial_total

def revisar_ban_en_todos_los_mundos(nombre_jugador):
    """
    Devuelve un diccionario {mundo: [ban_dict, ...]} solo para los mundos donde el jugador tiene baneos.
    """
    global_bans = _cargar_baneos_globales()
    if not global_bans:
        return {}

    mundos_baneados = {}
    for mundo in obtener_mundos_cached():  # 🚀 OPTIMIZACIÓN: Usar cache en lugar de petición HTTP
        mundo_bans = global_bans.get(mundo, {})
        historial = mundo_bans.get(nombre_jugador, [])
        
        if historial:
            lista_bans = []
            for ban_dict in historial:
                for num, ban in ban_dict.items():
                    ban_con_info = dict(ban)
                    ban_con_info["Nº"] = num
                    # Asegurar compatibilidad con datos antiguos
                    if "estado" not in ban_con_info:
                        ban_con_info["estado"] = "expirado"
                    lista_bans.append(ban_con_info)
            mundos_baneados[mundo] = lista_bans
    
    return mundos_baneados

def obtener_baneos_activos_jugador(nombre_jugador, global_bans=None):
    """
    Devuelve una lista con solo los baneos activos del jugador en todos los mundos.
    Utiliza la función unificada con filtro de activos.
    """
    return obtener_historial_baneos_jugador(nombre_jugador, solo_activos=True, incluir_mundo_en_datos=True, global_bans=global_bans)

def check_ban_jugador(nombre_jugador, global_bans, mundo_actual=None):
    """
    Versión simplificada que solo verifica baneos activos.
    
    Returns:
        (estado, fecha_exp, mundo_ban) donde:
        - estado: "permanente", "temporal", "otro_mundo" o None
        - fecha_exp: fecha de expiración o None  
        - mundo_ban: mundo donde está baneado o None
    """
    # Buscar baneos activos usando la nueva función unificada (¡con global_bans!)
    baneos_activos = obtener_historial_baneos_jugador(nombre_jugador, solo_activos=True, incluir_mundo_en_datos=True, global_bans=global_bans)
    
    # Priorizar baneos en el mundo actual
    if mundo_actual:
        for ban in baneos_activos:
            if ban.get("Mundo") == mundo_actual:
                unban = ban.get("unban_date", "").lower()
                if "perm" in unban:
                    return "permanente", ban.get("unban_date"), mundo_actual
                elif unban:
                    return "temporal", ban.get("unban_date"), mundo_actual
    
    # Si no hay baneos en el mundo actual, buscar en otros mundos
    for ban in baneos_activos:
        mundo_ban = ban.get("Mundo")
        unban = ban.get("unban_date", "").lower()
        if "perm" in unban or unban:
            return "otro_mundo", ban.get("unban_date"), mundo_ban
    
    return None, None, None

def obtener_estados_ban_masivo(lista_jugadores, global_bans=None):
    """
    OPTIMIZACIÓN EXTREMA: Verifica los baneos de múltiples jugadores de una sola vez.
    Es muchísimo más eficiente que llamar check_ban_jugador_completo() individualmente.
    
    Args:
        lista_jugadores: Lista de nombres de jugadores a verificar
        global_bans: Datos de baneos ya cargados (opcional)
    
    Returns:
        dict: {jugador: resultado_completo, ...}
    """
    if global_bans is None:
        global_bans = _cargar_baneos_globales()
    
    if not global_bans:
        return {jugador: (None, None, None, False) for jugador in lista_jugadores}
    
    resultados = {}
    mundos_cached = obtener_mundos_cached()  # Una sola llamada para todos
    
    for jugador in lista_jugadores:
        # Buscar baneos activos en todos los mundos
        baneos_activos = []
        tiene_historial = False
        
        for mundo in mundos_cached:
            mundo_bans = global_bans.get(mundo, {})
            historial = mundo_bans.get(jugador, [])
            
            if historial:
                tiene_historial = True
                for ban_dict in historial:
                    for num, ban in ban_dict.items():
                        estado = ban.get("estado", "expirado")
                        if estado == "activo":
                            tipo_ban = ban.get("Tipo", "Temp.")
                            baneos_activos.append((mundo, tipo_ban, num))
        
        # Determinar resultado final
        if baneos_activos:
            # Hay baneos activos
            mundo, tipo_ban, num = baneos_activos[0]  # Primer ban activo
            if len(baneos_activos) > 1:
                # Múltiples baneos activos
                if any(tipo == "Perm." for _, tipo, _ in baneos_activos):
                    resultados[jugador] = ("multiples_mundos", "Perm.", "varios", True)
                else:
                    resultados[jugador] = ("multiples_mundos", "Temp.", "varios", True)
            else:
                resultados[jugador] = (mundo, tipo_ban, mundo, True)
        elif tiene_historial:
            # Solo historial, no baneos activos
            resultados[jugador] = (None, None, None, True)  # ✅ CORREGIDO: True cuando hay historial
        else:
            # Sin baneos
            resultados[jugador] = (None, None, None, False)
    
    return resultados

def generar_mensaje_historial_baneos(nombre_jugador, global_bans=None, mundo_actual=None):
    """
    Genera un mensaje informativo detallado sobre el historial de baneos de un jugador.
    IMPORTANTE: Distingue entre ban activo en mundo actual vs historial.
    
    Args:
        nombre_jugador: Nombre del jugador
        global_bans: Datos de baneos ya cargados (opcional)
        mundo_actual: Mundo actual para verificar baneos activos (opcional, usa config.WORLD)
    
    Returns:
        str: Mensaje detallado del historial o estado de ban actual
    """
    if global_bans is None:
        global_bans = _cargar_baneos_globales()
    
    if mundo_actual is None:
        import utils.config
        mundo_actual = utils.config.WORLD
    
    if not global_bans:
        return "📋 HISTORIAL DE BANEOS"
    
    # Obtener todos los baneos (activos y expirados) separados por mundo
    baneos_por_mundo = {}
    mundos_cached = obtener_mundos_cached()
    
    for mundo in mundos_cached:
        mundo_bans = global_bans.get(mundo, {})
        historial = mundo_bans.get(nombre_jugador, [])
        
        if historial:
            baneos_mundo = []
            for ban_dict in historial:
                for num, ban in ban_dict.items():
                    # Extraer motivo con prioridad: Automatismos > Multi-cuenta > otros
                    motivo_especifico = extraer_motivo_ban(ban)
                    
                    baneos_mundo.append({
                        'mundo': mundo,
                        'fecha': ban.get('date', 'Sin fecha'),
                        'tipo': 'Perm.' if ban.get('unban_date') == 'Perm.' else 'Temp.',
                        'razon': motivo_especifico,
                        'admin': ban.get('admin', 'admin desconocido'),
                        'estado': ban.get('estado', 'expirado'),
                        'num': num,
                        'prioridad': obtener_prioridad_motivo(motivo_especifico)
                    })
            
            if baneos_mundo:
                baneos_por_mundo[mundo] = baneos_mundo
    
    if not baneos_por_mundo:
        return "📋 HISTORIAL DE BANEOS"
    
    # 1. VERIFICAR BAN ACTIVO EN MUNDO ACTUAL
    if mundo_actual in baneos_por_mundo:
        baneos_mundo_actual = baneos_por_mundo[mundo_actual]
        baneos_activos_actual = [b for b in baneos_mundo_actual if b['estado'] == 'activo']
        
        if baneos_activos_actual:
            # Elegir el ban más grave (mayor prioridad)
            ban_mas_grave = max(baneos_activos_actual, key=lambda x: x['prioridad'])
            
            if ban_mas_grave['tipo'] == 'Perm.':
                return f"🚨 BAN PERMANENTE ACTIVO ({ban_mas_grave['razon']}) por {ban_mas_grave['admin']}"
            else:
                # Extraer fecha de expiración
                try:
                    fecha_exp = ban_mas_grave['fecha'].split(' ')[0] if ban_mas_grave['fecha'] != 'Sin fecha' else 'fecha inválida'
                except:
                    fecha_exp = 'fecha inválida'
                return f"⚠️ BAN TEMPORAL ACTIVO → {fecha_exp} ({ban_mas_grave['razon']}) por {ban_mas_grave['admin']}"
    
    # 2. VERIFICAR BAN ACTIVO EN OTROS MUNDOS
    baneos_otros_mundos = []
    for mundo, baneos in baneos_por_mundo.items():
        if mundo != mundo_actual:
            baneos_activos = [b for b in baneos if b['estado'] == 'activo']
            if baneos_activos:
                baneos_otros_mundos.extend([(mundo, b) for b in baneos_activos])
    
    if baneos_otros_mundos:
        # Elegir el más grave de otros mundos
        mundo_ban, ban_grave = max(baneos_otros_mundos, key=lambda x: x[1]['prioridad'])
        return f"🌍 BAN ACTIVO EN {mundo_ban.upper()} ({ban_grave['razon']}) por {ban_grave['admin']}"
    
    # 3. SOLO HISTORIAL (todos los baneos están expirados)
    todos_baneos = []
    for baneos in baneos_por_mundo.values():
        todos_baneos.extend(baneos)
    
    # Elegir el más grave del historial para mostrar
    ban_mas_grave_historial = max(todos_baneos, key=lambda x: x['prioridad'])
    
    total_baneos = len(todos_baneos)
    if total_baneos == 1:
        return f"📋 HISTORIAL (1 baneo: {ban_mas_grave_historial['razon']} por {ban_mas_grave_historial['admin']})"
    else:
        # Contar tipos
        tipos_count = {}
        for ban in todos_baneos:
            tipos_count[ban['tipo']] = tipos_count.get(ban['tipo'], 0) + 1
        
        if len(tipos_count) == 1:
            tipo_unico = list(tipos_count.keys())[0]
            return f"📋 HISTORIAL ({total_baneos} baneos {tipo_unico} | Más grave: {ban_mas_grave_historial['razon']} por {ban_mas_grave_historial['admin']})"
        else:
            tipos_str = ", ".join([f"{count} {tipo}" for tipo, count in tipos_count.items()])
            return f"📋 HISTORIAL ({total_baneos} baneos: {tipos_str} | Más grave: {ban_mas_grave_historial['razon']} por {ban_mas_grave_historial['admin']})"

def extraer_motivo_ban(ban):
    """
    Extrae el motivo específico de un ban con lógica mejorada.
    """
    motivo_especifico = ""
    
    # Buscar en remark primero (más específico)
    if 'remark' in ban and ban['remark']:
        remark = ban['remark']
        if "🔹 Motivo:" in remark:
            lineas = remark.split('\n')
            for linea in lineas:
                if "🔹 Motivo:" in linea:
                    motivo_especifico = linea.split("🔹 Motivo:")[1].strip()
                    # Limpiar punto final si existe
                    if motivo_especifico.endswith('.'):
                        motivo_especifico = motivo_especifico[:-1]
                    break
    
    # Si no hay motivo específico, usar reason clasificado
    if not motivo_especifico and 'reason' in ban and ban['reason']:
        reason = ban['reason']
        if "§6) Bots & Scripts" in reason:
            motivo_especifico = "Automatismos"
        elif "§4) Cuentas" in reason:
            motivo_especifico = "Multi-cuenta"
        elif "§3) Pushing" in reason:
            motivo_especifico = "Push"
        elif "§5) Comercio" in reason:
            motivo_especifico = "Comercio ilegal"
        elif "§2) Conducta" in reason:
            motivo_especifico = "Conducta"
        elif "§1) Nombres" in reason:
            motivo_especifico = "Nombre inapropiado"
        else:
            primera_linea = reason.split('\n')[0]
            if len(primera_linea) > 30:
                motivo_especifico = primera_linea[:27] + "..."
            else:
                motivo_especifico = primera_linea
    
    return motivo_especifico if motivo_especifico else "motivo no especificado"

def obtener_color_mensaje_ban(mensaje):
    """
    Determina el color apropiado según el tipo de mensaje de ban.
    
    Args:
        mensaje: Mensaje generado por generar_mensaje_historial_baneos()
    
    Returns:
        str: Color apropiado para el mensaje
    """
    if "🚨 BAN PERMANENTE ACTIVO" in mensaje:
        return "rojo"
    elif "⚠️ BAN TEMPORAL ACTIVO" in mensaje:
        return "amarillo"
    elif "🌍 BAN ACTIVO EN" in mensaje:
        return "magenta"
    elif "📋 HISTORIAL" in mensaje:
        return "cyan"
    else:
        return "blanco"  # Color por defecto

def obtener_color_indice_ban(mensaje):
    """
    Determina el color del índice según el tipo de mensaje de ban.
    
    Args:
        mensaje: Mensaje generado por generar_mensaje_historial_baneos()
    
    Returns:
        str: Color apropiado para el índice
    """
    if "🚨 BAN PERMANENTE ACTIVO" in mensaje:
        return "rojo"
    elif "⚠️ BAN TEMPORAL ACTIVO" in mensaje:
        return "amarillo"
    elif "🌍 BAN ACTIVO EN" in mensaje:
        return "magenta"
    elif "📋 HISTORIAL" in mensaje:
        return "cyan"
    else:
        return "verde"  # Color por defecto

def obtener_prioridad_motivo(motivo):
    """
    Asigna prioridad a los motivos de ban (mayor número = más grave).
    """
    prioridades = {
        "Automatismos": 100,
        "Multi-cuenta": 80,
        "Push": 60,
        "Comercio ilegal": 40,
        "Conducta": 30,
        "Nombre inapropiado": 20
    }
    
    for clave, prioridad in prioridades.items():
        if clave.lower() in motivo.lower():
            return prioridad
    
    return 10  # Prioridad por defecto para motivos no clasificados
    """
    Asigna prioridad a los motivos de ban (mayor número = más grave).
    """
    prioridades = {
        "Automatismos": 100,
        "Multi-cuenta": 80,
        "Push": 60,
        "Comercio ilegal": 40,
        "Conducta": 30,
        "Nombre inapropiado": 20
    }
    
    for clave, prioridad in prioridades.items():
        if clave.lower() in motivo.lower():
            return prioridad
    
    return 10  # Prioridad por defecto para motivos no clasificados

def check_ban_jugador_completo(nombre_jugador, global_bans, mundo_actual=None):
    """
    Versión completa que verifica baneos activos + historial.
    
    Returns:
        (estado_activo, fecha_exp, mundo_ban, tiene_historial_previo)
    """
    # Obtener estado de baneos activos (¡usando global_bans ya cargado!)
    estado_activo, fecha_exp, mundo_ban = check_ban_jugador(nombre_jugador, global_bans, mundo_actual)
    
    # Verificar si tiene historial de baneos expirados (¡usando global_bans ya cargado!)
    historial_completo = obtener_historial_baneos_jugador(nombre_jugador, solo_activos=False, incluir_mundo_en_datos=False, global_bans=global_bans)
    tiene_historial_previo = any(ban.get("estado") == "expirado" for ban in historial_completo)
    
    return estado_activo, fecha_exp, mundo_ban, tiene_historial_previo

def migrar_datos_antiguos():
    """
    Añade el campo 'estado' con valor 'expirado' a todos los baneos existentes 
    que no tengan este campo. Útil para migrar datos anteriores a esta actualización.
    """
    global_bans_path = "logs/global/bans.yml"
    if not os.path.exists(global_bans_path):
        print("📄 No existe archivo de baneos para migrar.")
        return

    with open(global_bans_path, "r", encoding="utf-8") as f:
        global_bans = yaml.safe_load(f) or {}

    cambios_realizados = 0
    for mundo in global_bans:
        for jugador in global_bans[mundo]:
            for ban_entry in global_bans[mundo][jugador]:
                for num_ban, ban_info in ban_entry.items():
                    if "estado" not in ban_info:
                        ban_info["estado"] = "expirado"  # Cambio: ahora por defecto "expirado"
                        cambios_realizados += 1

    if cambios_realizados > 0:
        with open(global_bans_path, "w", encoding="utf-8") as f:
            yaml.dump(global_bans, f, allow_unicode=True, sort_keys=False)
        print(f"🔄 Migración completada: {cambios_realizados} baneos actualizados con estado 'expirado'.")
    else:
        print("✅ No se necesita migración, todos los baneos ya tienen el campo 'estado'.")