import re, os
import utils.config
from collections import defaultdict
from funciones.extra import color_texto
from funciones.bans import obtener_historial_baneos_jugador, check_ban_jugador, cargar_bans_global, check_ban_jugador_completo

# Al principio del archivo (zona global)
cache_estado_ban = {}

def obtener_coincidencias(archivo_registro=None):
    """
    Devuelve un diccionario {jugador: [(timestamp, acciones)]} con coincidencias entre pantallas en el mismo segundo.
    """
    patron_timestamp = re.compile(r"^\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}")
    ocurrencias = defaultdict(list)

    with open(archivo_registro, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if patron_timestamp.match(linea):
                partes = linea.split("\t")
                if len(partes) >= 5:
                    timestamp = f"{partes[0]} {partes[1]}"
                    jugador = partes[1]
                    pantalla = partes[3]
                    accion = partes[4]
                    if pantalla in ("crm", "daily_bon", "tracking", "settings", "forum_api", "api", "botcheck"):
                        continue
                    if accion in ("change_name", "edit_own_comment", "quests_complete", "add_target", "dockVillagelist", "toggle_reserve_village", "delete_one", "del_one", "set_page_size"):
                        continue
                    ocurrencias[(timestamp, jugador)].append((pantalla, accion, linea))

    coincidencias_por_jugador = defaultdict(list)
    for (timestamp, jugador), acciones in ocurrencias.items():
        pantallas = set(p for p, _, _ in acciones)
        if len(acciones) > 1 and len(pantallas) > 1:
            coincidencias_por_jugador[jugador].append((timestamp, acciones))
    return coincidencias_por_jugador

# Módulo : coincidencias entre pantallas en el mismo segundo
def analizar_coincidencias_simple(archivo_registro):
    coincidencias_por_jugador = obtener_coincidencias(archivo_registro)

    if not coincidencias_por_jugador:
        print(color_texto("\n✅ No se encontraron coincidencias con pantallas distintas en el mismo segundo.\n", "verde"))
        return

    jugadores = sorted(coincidencias_por_jugador.keys())
    
    # 🚀 OPTIMIZACIÓN: Cargar baneos y verificar estados de forma masiva
    global_bans = cargar_bans_global()
    from funciones.bans import obtener_estados_ban_masivo
    estado_ban_jugadores = obtener_estados_ban_masivo(jugadores, global_bans)
    
    while True:
        os.system("cls" if os.name == "nt" else "clear")
        print(color_texto("═" * 60, "azul"))
        print(color_texto("📋 Menú de coincidencias por jugador", "azul"))
        print(color_texto("═" * 60, "azul"))
        for idx, jugador in enumerate(jugadores, 1):
            n = len(coincidencias_por_jugador[jugador])
            ban_status, fecha_exp, mundo_ban, tiene_historial = estado_ban_jugadores.get(jugador, (None, None, None, False))
            
            # Estados de ban activos (PELIGRO)
            if ban_status == "permanente":
                idx_str = color_texto(str(idx), "rojo")
                jugador_str = color_texto(f"👤 {jugador}", "blanco")
                coincidencias_str = color_texto(str(n), 'amarillo')
                ban_str = color_texto(" 🚨 BAN PERMANENTE ACTIVO", "rojo")
                print(f"{idx_str}. {jugador_str} tiene {coincidencias_str} coincidencia{'s' if n != 1 else ''}{ban_str}")
            elif ban_status == "temporal":
                idx_str = color_texto(str(idx), "amarillo")
                jugador_str = color_texto(f"👤 {jugador}", "blanco")
                coincidencias_str = color_texto(str(n), 'amarillo')
                ban_str = color_texto(f" ⚠️ BAN TEMPORAL ACTIVO → {fecha_exp}", "amarillo")
                print(f"{idx_str}. {jugador_str} tiene {coincidencias_str} coincidencia{'s' if n != 1 else ''}{ban_str}")
            elif ban_status == "otro_mundo":
                idx_str = color_texto(str(idx), "magenta")
                jugador_str = color_texto(f"👤 {jugador}", "blanco")
                coincidencias_str = color_texto(str(n), 'amarillo')
                ban_str = color_texto(f" 🌍 BAN ACTIVO EN {mundo_ban}", "magenta")
                print(f"{idx_str}. {jugador_str} tiene {coincidencias_str} coincidencia{'s' if n != 1 else ''}{ban_str}")
            # Solo historial previo (ALERTA) - PERO puede incluir baneos activos
            elif tiene_historial:
                from funciones.bans import generar_mensaje_historial_baneos, obtener_color_mensaje_ban, obtener_color_indice_ban
                mensaje_historial = generar_mensaje_historial_baneos(jugador, global_bans, utils.config.WORLD)
                color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
                color_indice = obtener_color_indice_ban(mensaje_historial)
                
                idx_str = color_texto(str(idx), color_indice)
                jugador_str = color_texto(f"👤 {jugador}", "blanco")
                coincidencias_str = color_texto(str(n), 'amarillo')
                ban_str = color_texto(f" {mensaje_historial}", color_mensaje)
                print(f"{idx_str}. {jugador_str} tiene {coincidencias_str} coincidencia{'s' if n != 1 else ''}{ban_str}")
            # Sin baneos
            else:
                idx_str = color_texto(str(idx), "verde")
                jugador_str = color_texto(f"👤 {jugador}", "blanco")
                coincidencias_str = color_texto(str(n), 'amarillo')
                print(f"{idx_str}. {jugador_str} tiene {coincidencias_str} coincidencia{'s' if n != 1 else ''}")
        print(color_texto("0. Salir", "rojo"))
        print(color_texto("═" * 60, "azul"))
        try:
            opcion = input(color_texto("👉 Selecciona el número de un jugador para ver sus coincidencias: ", "verde"))
            if opcion.strip() == "0":
                print(color_texto("\n👋 ¡Gracias por usar el analizador de coincidencias! Hasta la próxima.", "amarillo"))
                input(color_texto("Pulsa Enter para salir...", "azul"))
                break
            opcion = int(opcion)
            if 1 <= opcion <= len(jugadores):
                jugador = jugadores[opcion - 1]
                coincidencias = coincidencias_por_jugador[jugador]
                mostrar_coincidencias_jugador(jugador, coincidencias, archivo_registro)
            else:
                print(color_texto("Opción inválida.", "rojo"))
                input(color_texto("Pulsa Enter para continuar...", "azul"))
        except (ValueError, KeyboardInterrupt):
            print(color_texto("\n👋 ¡Gracias por usar el analizador de coincidencias! Hasta la próxima.", "amarillo"))
            input(color_texto("Pulsa Enter para salir...", "azul"))
            break




################################################################################################

"""
    Busca coincidencias de todos los jugadores en un registro global donde un mismo jugador
    tenga varias acciones en el mismo segundo pero en diferentes pantallas.
    Muestra un menú por jugador para explorar sus coincidencias.
"""
################################################################################################
def analizar_coincidencias_global(archivo_registro=None):
    patron = re.compile(r"^(\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2})\t([^\t]+)\t.*?\t([^\t]+)\t([^\t]+)\t")
    registros = defaultdict(list)

    try:
        with open(archivo_registro, "r", encoding="utf-8") as f:
            for linea in f:
                linea = linea.strip()
                m = patron.match(linea)
                if not m:
                    continue
                timestamp = m.group(1)
                jugador = m.group(2)
                pantalla = m.group(3)
                accion = m.group(4)
                if pantalla in ("crm", "daily_bon", "tracking", "settings", "forum_api", "api", "botcheck"):
                    continue
                if accion in ("change_name", "edit_own_comment", "quests_complete", "add_target", "dockVillagelist", "toggle_reserve_village", "delete_one" ,"del_one" ,"set_page_size"):
                    continue
                registros[(timestamp, jugador)].append((pantalla, accion, linea))
    except FileNotFoundError:
        print(f"No se encontró el archivo {archivo_registro}.")
        return

    # Agrupar coincidencias por jugador
    coincidencias_por_jugador = defaultdict(list)
    for (timestamp, jugador), acciones in registros.items():
        pantallas = set(p for p, _, _ in acciones)
        if len(acciones) > 1 and len(pantallas) > 1:
            coincidencias_por_jugador[jugador].append((timestamp, acciones))

    if not coincidencias_por_jugador:
        print(color_texto("✅ No se encontraron coincidencias de mismo jugador, mismo segundo y pantallas distintas.", "verde"))
        print(color_texto("\n👋 ¡Gracias por usar el analizador de coincidencias!", "amarillo"))
        input(color_texto("Pulsa Enter para volver...", "azul"))
        return

    global_bans = cargar_bans_global()
    jugadores = sorted(coincidencias_por_jugador.keys())

    # 🚀 OPTIMIZACIÓN: Verificar estados de ban de forma masiva
    from funciones.bans import obtener_estados_ban_masivo
    estado_ban_jugadores = obtener_estados_ban_masivo(jugadores, global_bans)

    while True:
        os.system("cls" if os.name == "nt" else "clear")
        print(color_texto("═" * 60, "azul"))
        print(color_texto("📋 Menú de coincidencias por jugador (Global)", "azul"))
        print(color_texto("═" * 60, "azul"))
        for idx, jugador in enumerate(jugadores, 1):
            n = len(coincidencias_por_jugador[jugador])
            ban_status, fecha_exp, mundo_ban, tiene_historial = estado_ban_jugadores.get(jugador, (None, None, None, False))
            
            # Estados de ban activos (PELIGRO)
            if ban_status == "permanente":
                print(f"{color_texto(str(idx), 'rojo')}. 👤 {color_texto(jugador, 'blanco')} tiene {color_texto(str(n), 'amarillo')} coincidencia{'s' if n != 1 else ''} {color_texto('🚨 BAN PERMANENTE ACTIVO', 'rojo')}")
            elif ban_status == "temporal":
                print(f"{color_texto(str(idx), 'amarillo')}. 👤 {color_texto(jugador, 'blanco')} tiene {color_texto(str(n), 'amarillo')} coincidencia{'s' if n != 1 else ''} {color_texto(f'⚠️ BAN TEMPORAL ACTIVO → {fecha_exp}', 'amarillo')}")
            elif ban_status == "otro_mundo":
                print(f"{color_texto(str(idx), 'magenta')}. 👤 {color_texto(jugador, 'blanco')} tiene {color_texto(str(n), 'amarillo')} coincidencia{'s' if n != 1 else ''} {color_texto(f'🌍 BAN ACTIVO EN {mundo_ban}', 'magenta')}")
            # Solo historial previo (ALERTA) - PERO puede incluir baneos activos
            elif tiene_historial:
                from funciones.bans import generar_mensaje_historial_baneos, obtener_color_mensaje_ban, obtener_color_indice_ban
                mensaje_historial = generar_mensaje_historial_baneos(jugador, global_bans, utils.config.WORLD)
                color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
                color_indice = obtener_color_indice_ban(mensaje_historial)
                
                print(f"{color_texto(str(idx), color_indice)}. 👤 {color_texto(jugador, 'blanco')} tiene {color_texto(str(n), 'amarillo')} coincidencia{'s' if n != 1 else ''} {color_texto(mensaje_historial, color_mensaje)}")
            # Sin baneos
            else:
                print(f"{color_texto(str(idx), 'verde')}. 👤 {color_texto(jugador, 'blanco')} tiene {color_texto(str(n), 'amarillo')} coincidencia{'s' if n != 1 else ''}")
        print(color_texto("0. Siguiente análisis", "rojo"))
        print(color_texto("═" * 60, "azul"))
        try:
            opcion = input(color_texto("👉 Selecciona el número de un jugador para ver sus coincidencias (Enter para seguir): ", "verde"))
            if opcion.strip() == "0":
                break
            opcion = int(opcion)
            if 1 <= opcion <= len(jugadores):
                jugador = jugadores[opcion - 1]
                coincidencias = coincidencias_por_jugador[jugador]
                mostrar_coincidencias_jugador(jugador, coincidencias, archivo_registro)
            else:
                print(color_texto("Opción inválida.", "rojo"))
                input(color_texto("Pulsa Enter para continuar...", "azul"))
        except (ValueError, KeyboardInterrupt):
            break

def mostrar_coincidencias_jugador(jugador, coincidencias, archivo_registro=None):
    import os
    from datetime import datetime, timedelta

    colores = ["\033[94m", "\033[92m", "\033[93m", "\033[91m","\033[95m", "\033[96m", "\033[90m"]
    reset = "\033[0m"

    # Cargar todas las acciones del jugador para búsqueda detallada
    # Busca en el registro global para tener todas las acciones
    acciones_jugador = []
    try:
        with open(archivo_registro, "r", encoding="utf-8") as f:
            for linea in f:
                partes = linea.strip().split('\t')
                if len(partes) >= 2 and partes[1] == jugador:
                    acciones_jugador.append(partes)
    except Exception:
        acciones_jugador = []

    for idx, (timestamp, acciones) in enumerate(coincidencias, 1):
        os.system("cls" if os.name == "nt" else "clear")
        print("═" * 70)
        print(f"👤 Jugador: {jugador}")
        print(f"📅 {timestamp}")
        pantallas_unicas = list(sorted(set(p for p, _, _ in acciones)))
        print(f"🎯 Pantallas implicadas: {', '.join(pantallas_unicas)}")
        print("═" * 70)
        color_map = {pantalla: colores[i % len(colores)] for i, pantalla in enumerate(pantallas_unicas)}
        for pantalla, accion, linea in acciones:
            color = color_map.get(pantalla, "")
            partes = linea.strip().split('\t')
            if len(partes) >= 8:
                linea_coloreada = (
                    f"{color}• {partes[1]}\t{partes[2]}\t{partes[3]}\t{partes[4]}\t{partes[5]}\t{partes[6]}\t{partes[7]}{reset}"
                )
            else:
                linea_coloreada = f"{color}• {linea}{reset}"
            print(linea_coloreada)
        print("─" * 70)
        print("Leyenda de colores:")
        for pantalla in pantallas_unicas:
            color = color_map[pantalla]
            print(f"{color}[{pantalla}]{reset}", end="  ")
        print("\n")
        print(f"({idx}/{len(coincidencias)}) Pulsa Enter para ver la siguiente coincidencia...")
        print("    o pulsa 'd' para ver con más detalle ±5 segundos de acciones de este jugador.")
        print("    o pulsa 'p' para ir al menú completo del jugador.")
        opcion = input().strip().lower()
        if opcion == "d":
            try:
                # Buscar el índice de la acción principal en acciones_jugador
                indices_coincidencia = []
                for i, partes in enumerate(acciones_jugador):
                    if partes[0] == timestamp and partes[1] == jugador:
                        indices_coincidencia.append(i)
                if not indices_coincidencia:
                    print("No se encontraron acciones para mostrar el detalle.")
                    input("Pulsa Enter para volver a la coincidencia...")
                    continue

                idx_ref = indices_coincidencia[0]
                ini = max(0, idx_ref - 10)
                fin = min(len(acciones_jugador), idx_ref + 11)

                print("\n🔎 Acciones del jugador (10 anteriores y 10 siguientes):\n")
                for i in range(ini, fin):
                    partes = acciones_jugador[i]
                    es_coincidencia = any(
                        partes[0] == timestamp and partes[3] == pantalla and partes[4] == accion
                        for pantalla, accion, _ in acciones
                    )
                    if es_coincidencia:
                        color = color_map.get(partes[3], "")
                        reset = "\033[0m"
                        print(f"{color}• " + "\t".join(partes) + f"{reset}")
                    else:
                        print("• " + "\t".join(partes))
                print("\n" + "─" * 70)
                input("Pulsa Enter para volver a la coincidencia...")
            except Exception as e:
                print(f"Error mostrando detalle: {e}")
                input("Pulsa Enter para continuar...")
        elif opcion == "p":
            from funciones.players import buscar_jugador_por_nombre
            buscar_jugador_por_nombre(jugador, preguntar_si_vacio=False)
            break