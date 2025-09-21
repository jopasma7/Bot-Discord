from datetime import datetime
import os
import re
import utils.config
from funciones.extra import color_texto
from funciones.bans import cargar_bans_global, check_ban_jugador, check_ban_jugador_completo



def analizar_reco():
    analizar_por_bloques("scavenge_", "recolección", utils.config.get_registro_simple())

def analizar_farmeos():
    analizar_por_bloques("am_farm", "farmeos", utils.config.get_registro_simple())


def analizar_por_bloques(etiqueta, nombre, registro):
    print(f"\n🔍 Buscando bloques continuos de pantalla: {etiqueta}\n")

    patron_timestamp = re.compile(r"^\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}")
    registros = []

    with open(registro, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not patron_timestamp.match(linea):
                continue
            partes = re.split(r"\s+", linea)
            try:
                fecha = datetime.strptime(f"{partes[0]} {partes[1]}", "%d.%m.%y %H:%M:%S")
            except:
                continue
            if etiqueta not in partes:
                continue
            registros.append((fecha, linea))

    if not registros:
        print(f"❌ No se encontraron registros {etiqueta} válidos.")
        return

    registros.sort(key=lambda x: x[0])
    bloques = []
    bloque_actual = [registros[0]]

    for i in range(1, len(registros)):
        actual, _ = registros[i]
        anterior, _ = registros[i - 1]
        diferencia = (actual - anterior).total_seconds()

        if diferencia <= 60:
            bloque_actual.append(registros[i])
        else:
            bloques.append(bloque_actual)
            bloque_actual = [registros[i]]
    if bloque_actual:
        bloques.append(bloque_actual)

    tipo_resumen = "Granjeo" if etiqueta == "am_farm" else "Recolección" if etiqueta == "scavenge_" else nombre.capitalize()
    print(f"\n📊 Resumen de bloques ({tipo_resumen}):")
    print("─" * 118)
    print(f"{'Acciones':>8}\t{'Tiempo':>21}\t{'Duración':>15}\t{'Siguiente Bloque':>20}\t{'CID':>20}")
    print("─" * 118)
    ultimo_dia = None

    # --- Cálculo de bloques a colorear en verde para am_farm y scavenge_ ---
    indices_patron = set()
    patron_detectado = None
    max_repeticiones = 0
    mejor_pausa = None
    pausas = []
    if etiqueta in ("am_farm", "scavenge_") and len(bloques) > 1:
        for i in range(1, len(bloques)):
            fin_anterior = bloques[i - 1][-1][0]
            inicio_actual = bloques[i][0][0]
            pausa = int((inicio_actual - fin_anterior).total_seconds())
            pausas.append(pausa)
        tolerancia = 300  # 5 minutos en segundos
        for pausa in pausas:
            repeticiones = sum(1 for p in pausas if abs(p - pausa) <= tolerancia)
            if repeticiones > max_repeticiones:
                max_repeticiones = repeticiones
                mejor_pausa = pausa
        patron_detectado = mejor_pausa
        for i, p in enumerate(pausas):
            if abs(p - mejor_pausa) <= tolerancia:
                indices_patron.add(i+1)  # +1 porque la pausa es entre bloque i e i+1

    for idx, bloque in enumerate(bloques, 1):
        inicio = bloque[0][0]
        fin = bloque[-1][0]
        # Extraer todos los CID únicos del bloque
        try:
            cids = set(linea.strip().split()[-1] for _, linea in bloque)
            cid_str = ", ".join(sorted(cids))
        except Exception:
            cid_str = "?"

        # Separador de día
        if ultimo_dia is None or inicio.date() != ultimo_dia:
            if ultimo_dia is not None:
                print("-" * 118 + f"\n📅 Nuevo día: {inicio.strftime('%d.%m.%Y')}\n" + "-" * 118)
            else:
                print(f"📅 Día: {inicio.strftime('%d.%m.%Y')}")
            ultimo_dia = inicio.date()
        duracion = int((fin - inicio).total_seconds())
        horas_dur, resto = divmod(duracion, 3600)
        min_dur, seg_dur = divmod(resto, 60)
        if horas_dur > 0:
            duracion_str = f"{horas_dur}h {min_dur}m {seg_dur}s"
        else:
            duracion_str = f"{min_dur}m {seg_dur}s"

        # Calcular tiempo hasta el siguiente bloque
        if idx < len(bloques):
            siguiente = bloques[idx][0][0]
            pausa = int((siguiente - fin).total_seconds())
            horas_p, resto_p = divmod(pausa, 3600)
            min_p, seg_p = divmod(resto_p, 60)
            if horas_p > 0:
                pausa_str = f"{horas_p}h {min_p}m {seg_p}s"
            else:
                pausa_str = f"{min_p}m {seg_p}s"
        else:
            pausa_str = "—"

        tiempo_str = f"{inicio.strftime('%H:%M:%S')} - {fin.strftime('%H:%M:%S')}"

        # Colorear en verde solo los que están en el patrón
        if etiqueta in ("am_farm", "scavenge_") and idx in indices_patron:
            verde = "\033[92m"
            reset = "\033[0m"
            print(f"{verde}🧱 {len(bloque):>6}\t{tiempo_str:>21}\t{duracion_str:>15}\t{pausa_str:>20}\t{cid_str:>20}{reset}")
        else:
            print(f"🧱 {len(bloque):>6}\t{tiempo_str:>21}\t{duracion_str:>15}\t{pausa_str:>20}\t{cid_str:>20}")
    print("─" * 118)
    print(f"✅ Total: {len(bloques)} bloques.\n")

    # --- Resumen y leyenda ---
    if len(bloques) > 1:
        duraciones = [int((bloque[-1][0] - bloque[0][0]).total_seconds()) for bloque in bloques]
        pausas_calc = [int((bloques[i][0][0] - bloques[i-1][-1][0]).total_seconds()) for i in range(1, len(bloques))]
        media_duracion = int(sum(duraciones) / len(duraciones))
        media_pausa = int(sum(pausas_calc) / len(pausas_calc)) if pausas_calc else 0

        def format_time(seg):
            h, r = divmod(seg, 3600)
            m, s = divmod(r, 60)
            if h > 0:
                return f"{h}h {m}m {s}s"
            elif m > 0:
                return f"{m}m {s}s"
            else:
                return f"{s}s"

        print("📋 Resumen:")
        print(f"   • Media de duración de bloque: {format_time(media_duracion)}")
        print(f"   • Media de pausa entre bloques: {format_time(media_pausa)}")
        if patron_detectado is not None:
            print(f"   • Patrón detectado: {patron_detectado} segundos ({format_time(patron_detectado)}) con {max_repeticiones} repeticiones (±5 min)")
        if indices_patron:
            print("\n🟩 Leyenda: Los bloques resaltados en verde corresponden al patrón detectado de pausa entre bloques (±5 minutos).")
    print()

    # Explorar bloques individualmente
    while True:
        eleccion = input("🔍 Ingresa el número de bloque a revisar (o pulsa Enter para volver): ")
        if not eleccion.strip():
            break
        if not eleccion.isdigit():
            print("❌ Entrada inválida. Introduce un número válido.")
            continue
        idx = int(eleccion)
        if not (1 <= idx <= len(bloques)):
            print("❌ Número fuera de rango.")
            continue

        bloque = bloques[idx - 1]
        inicio = bloque[0][0]
        fin = bloque[-1][0]
        duracion = int((fin - inicio).total_seconds())
        min_dur, seg_dur = divmod(duracion, 60)

        print(f"\n🧱 Detalle del bloque {idx}: {len(bloque)} acciones")
        print(f"   ⏱️ {inicio.strftime('%d.%m.%y %H:%M:%S')} → {fin.strftime('%d.%m.%y %H:%M:%S')} ({min_dur} min {seg_dur} seg)")
        print("-" * 60)
        for _, linea in bloque:
            print(f"• {linea}")

        if idx < len(bloques):
            siguiente = bloques[idx][0][0]
            pausa = int((siguiente - fin).total_seconds())
            min_p, seg_p = divmod(pausa, 60)
            print(f"\n🕓 Tiempo hasta el siguiente bloque: {pausa} segundos  ({min_p} min {seg_p} seg)")
        input("\nPresiona Enter para volver al resumen...")

def analizar_unlock_reco(registro):
    print("\n🔍 Buscando desbloqueos de recolección...")

    patron_timestamp = re.compile(r"^\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}")
    registros = []

    with open(registro, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not patron_timestamp.match(linea):
                continue
            partes = re.split(r"\s+", linea)
            try:
                fecha = datetime.strptime(f"{partes[0]} {partes[1]}", "%d.%m.%y %H:%M:%S")
            except:
                continue
            if "start_unlock" not in partes:
                continue
            registros.append((fecha, linea))

    if not registros:
        print("❌ No se encontraron registros de desbloqueo de recolección válidos.")
        return

    registros.sort(key=lambda x: x[0])
    print("\n📊 Resumen de desbloqueos de recolección:")
    print("═" * 140)
    print(f"{'Nº':>3} │ {'Fecha':^12} │ {'Hora':^8} │ {'Detalles':<60}")
    print("─" * 140)

    for idx, (fecha, linea) in enumerate(registros, 1):
        fecha_str = fecha.strftime("%d.%m.%Y")
        hora_str = fecha.strftime("%H:%M:%S")
        # Resalta la línea con color si quieres (verde)
        verde = "\033[92m"
        reset = "\033[0m"
        print(f"{verde}{idx:>3}{reset} │ {fecha_str:^12} │ {hora_str:^8} │ {linea:<60}")

    print("═" * 140)
    print(f"✅ Total: {len(registros)} desbloqueos encontrados.\n")

def mostrar_menu_jugadores(registros, titulo, tipo, emoji_jugador, emoji_bloque, color_bloque, color_idx, global_bans):
    # Agrupar por jugador
    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)

    # Calcular bloques por jugador
    def contar_bloques(acciones):
        acciones_ordenadas = []
        for partes in acciones:
            try:
                fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
                acciones_ordenadas.append(fecha)
            except Exception:
                continue
        acciones_ordenadas.sort()
        bloques = 0
        if acciones_ordenadas:
            bloque_actual = [acciones_ordenadas[0]]
            for i in range(1, len(acciones_ordenadas)):
                actual = acciones_ordenadas[i]
                anterior = acciones_ordenadas[i - 1]
                diferencia = (actual - anterior).total_seconds()
                if diferencia <= 60:
                    bloque_actual.append(actual)
                else:
                    bloques += 1
                    bloque_actual = [actual]
            bloques += 1  # último bloque
        return bloques

    jugadores_bloques = [
        (jugador, acciones, contar_bloques(acciones))
        for jugador, acciones in jugadores.items()
    ]
    jugadores_ordenados = sorted(jugadores_bloques, key=lambda x: x[2], reverse=True)[:50]

    # 🚀 OPTIMIZACIÓN EXTREMA: Pre-procesar TODOS los estados de ban de una vez (súper rápido)
    print("🔍 Verificando estados de ban...")  # Indicador de progreso
    from funciones.bans import obtener_estados_ban_masivo
    jugadores_lista = [jugador for jugador, _, _ in jugadores_ordenados]
    estados_ban = obtener_estados_ban_masivo(jugadores_lista, global_bans)

    while True:
        print("═" * 60)
        print(f"{emoji_bloque} Menú de {titulo} por jugador (máx. 50)")
        print("═" * 60)
        for idx, (jugador, acciones, num_bloques) in enumerate(jugadores_ordenados, 1):
            # 🚀 OPTIMIZACIÓN: Usar datos ya procesados (instantáneo)
            ban_status, fecha_exp, mundo_ban, tiene_historial = estados_ban[jugador]
            
            # Estados de ban activos (PELIGRO)
            if ban_status == "permanente":
                idx_str = color_texto(f"{idx}.", "rojo")
                jugador_str = color_texto(f"{emoji_jugador} {jugador}", "blanco")
                bloques_str = color_texto(f"{emoji_bloque} {num_bloques} bloques de {tipo}", color_bloque)
                ban_str = color_texto(" 🚨 BAN PERMANENTE ACTIVO", "rojo")
                print(f"{idx_str} {jugador_str} {bloques_str}{ban_str}")
            elif ban_status == "temporal":
                idx_str = color_texto(f"{idx}.", "amarillo")
                jugador_str = color_texto(f"{emoji_jugador} {jugador}", "blanco")
                bloques_str = color_texto(f"{emoji_bloque} {num_bloques} bloques de {tipo}", color_bloque)
                ban_str = color_texto(f" ⚠️ BAN TEMPORAL ACTIVO → {fecha_exp}", "amarillo")
                print(f"{idx_str} {jugador_str} {bloques_str}{ban_str}")
            elif ban_status == "otro_mundo":
                idx_str = color_texto(f"{idx}.", "magenta")
                jugador_str = color_texto(f"{emoji_jugador} {jugador}", "blanco")
                bloques_str = color_texto(f"{emoji_bloque} {num_bloques} bloques de {tipo}", color_bloque)
                ban_str = color_texto(f" 🌍 BAN ACTIVO EN {mundo_ban}", "magenta")
                print(f"{idx_str} {jugador_str} {bloques_str}{ban_str}")
            # Solo historial previo (ALERTA) - PERO puede incluir baneos activos
            elif tiene_historial:
                from funciones.bans import generar_mensaje_historial_baneos, obtener_color_mensaje_ban, obtener_color_indice_ban
                mensaje_historial = generar_mensaje_historial_baneos(jugador, global_bans, utils.config.WORLD)
                
                # Determinar colores según el tipo de mensaje
                color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
                color_indice = obtener_color_indice_ban(mensaje_historial)
                
                idx_str = color_texto(f"{idx}.", color_indice)
                jugador_str = color_texto(f"{emoji_jugador} {jugador}", "blanco")
                bloques_str = color_texto(f"{emoji_bloque} {num_bloques} bloques de {tipo}", color_bloque)
                ban_str = color_texto(f" {mensaje_historial}", color_mensaje)
                print(f"{idx_str} {jugador_str} {bloques_str}{ban_str}")
            # Sin baneos
            else:
                idx_str = color_texto(f"{idx}.", color_idx)
                jugador_str = color_texto(f"{emoji_jugador} {jugador}", "blanco")
                bloques_str = color_texto(f"{emoji_bloque} {num_bloques} bloques de {tipo}", color_bloque)
                print(f"{idx_str} {jugador_str} {bloques_str}")
        print("0. Salir")
        print("═" * 60)
        opcion = input(f"Selecciona el número de un jugador para ver sus {tipo}: ")
        if not opcion.isdigit() or not (1 <= int(opcion) <= len(jugadores_ordenados)):
            break
        jugador, acciones, _ = jugadores_ordenados[int(opcion) - 1]
        mostrar_registros_jugador(jugador, acciones, tipo)

def mostrar_registros_jugador(jugador, acciones, tipo):
    from datetime import timedelta
    from funciones.players import buscar_jugador_por_nombre

    acciones_ordenadas = []
    errores = []
    for partes in acciones:
        try:
            fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
            acciones_ordenadas.append((fecha, partes))
        except Exception:
            errores.append(partes)
            continue
    acciones_ordenadas.sort(key=lambda x: x[0])

    # Agrupar en bloques de menos de 1 minuto de diferencia
    bloques = []
    if acciones_ordenadas:
        bloque_actual = [acciones_ordenadas[0]]
        for i in range(1, len(acciones_ordenadas)):
            actual, _ = acciones_ordenadas[i]
            anterior, _ = acciones_ordenadas[i - 1]
            diferencia = (actual - anterior).total_seconds()
            if diferencia <= 60:
                bloque_actual.append(acciones_ordenadas[i])
            else:
                bloques.append(bloque_actual)
                bloque_actual = [acciones_ordenadas[i]]
        if bloque_actual:
            bloques.append(bloque_actual)

    print("═" * 118)
    print(f"👤 Jugador: {jugador} - {len(acciones_ordenadas)} {tipo} en {len(bloques)} bloques")
    print("═" * 118)

    ultimo_dia = None
    for idx, bloque in enumerate(bloques, 1):
        inicio = bloque[0][0]
        fin = bloque[-1][0]
        fecha_str = inicio.strftime("%d.%m.%Y")
        tiempo_str = f"{inicio.strftime('%H:%M:%S')} - {fin.strftime('%H:%M:%S')}"
        duracion = int((fin - inicio).total_seconds())
        horas_dur, resto = divmod(duracion, 3600)
        min_dur, seg_dur = divmod(resto, 60)
        if horas_dur > 0:
            duracion_str = f"{horas_dur}h {min_dur}m {seg_dur}s"
        else:
            duracion_str = f"{min_dur}m {seg_dur}s"
        # Pausa hasta el siguiente bloque
        if idx < len(bloques):
            siguiente = bloques[idx][0][0]
            pausa = int((siguiente - fin).total_seconds())
            horas_p, resto_p = divmod(pausa, 3600)
            min_p, seg_p = divmod(resto_p, 60)
            if horas_p > 0:
                pausa_str = f"{horas_p}h {min_p}m {seg_p}s"
            else:
                pausa_str = f"{min_p}m {seg_p}s"
        else:
            pausa_str = "—"
        # CID único(s) del bloque
        cids = set(partes[6] if len(partes) > 6 else "-" for _, partes in bloque)
        cid_str = ", ".join(sorted(cids))
        # Separador de día
        if ultimo_dia is None or inicio.date() != ultimo_dia:
            if ultimo_dia is not None:
                print("-" * 118)
            print(f"{'-'*118}\n📅 Nuevo día: {fecha_str}\n{'-'*118}")
            ultimo_dia = inicio.date()
        print(f"🧱 {len(bloque):>6}\t{tiempo_str:>21}\t{duracion_str:>15}\t{pausa_str:>20}\t{cid_str:>20}")
    print("═" * 118)
    print(f"✅ Total: {len(bloques)} bloques.\n")
    if not acciones_ordenadas:
        print(f"❌ No se encontraron registros válidos para {jugador}.")
        if errores:
            print(f"ℹ️  {len(errores)} registros no se pudieron interpretar (posible error de formato).")
    print("Pulsa Enter para volver al menú o 'p' para ir al perfil del jugador...")
    opcion = input().strip().lower()
    if opcion == "p":
        buscar_jugador_por_nombre(jugador, preguntar_si_vacio=False)

def analizar_farmeos_global():
    print("\n🔍 Analizando farmeos, recolecciones y desbloqueos globales...\n")

    patron_timestamp = re.compile(r"^\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}")
    farm_global = []
    reco_global = []
    reco_unlock_global = []

    with open(utils.config.get_registro_global(), "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not patron_timestamp.match(linea):
                continue
            partes = linea.split("\t")
            if len(partes) < 6:
                continue
            pantalla = partes[3]
            accion = partes[4]
            if pantalla == "am_farm":
                farm_global.append(partes)
            if pantalla.startswith("scavenge_"):
                reco_global.append(partes)
                if accion == "start_unlock":
                    reco_unlock_global.append(partes)

    global_bans = cargar_bans_global()

    while True:
        print(color_texto("═" * 60, "azul"))
        print(color_texto("🌾 Menú global de farmeos y recolecciones", "azul"))
        print(color_texto("═" * 60, "azul"))
        print(f"{color_texto('1️⃣  Farmeos (am_farm):', 'verde')} {color_texto(str(len(farm_global)), 'blanco')} registros")
        print(f"{color_texto('2️⃣  Recolección (scavenge_):', 'amarillo')} {color_texto(str(len(reco_global)), 'blanco')} registros")
        print(f"{color_texto('3️⃣  Unlock Recolección:', 'cian')} {color_texto(str(len(reco_unlock_global)), 'blanco')} registros")
        print(color_texto("0️⃣  Salir", "rojo"))
        print(color_texto("═" * 60, "azul"))
        opcion = input(color_texto("👉 Selecciona una opción (Enter para continuar): ", "verde")).strip()
        if opcion == "0":
            break
        elif opcion == "1":
            mostrar_menu_jugadores(
                farm_global, "farmeo", "farmeos",
                emoji_jugador="👤", emoji_bloque="🧱",
                color_bloque="amarillo", color_idx="verde", global_bans=global_bans
            )
        elif opcion == "2":
            mostrar_menu_jugadores(
                reco_global, "recolección", "recolecciones",
                emoji_jugador="🌱", emoji_bloque="📦",
                color_bloque="verde", color_idx="verde", global_bans=global_bans
            )
        elif opcion == "3":
            mostrar_menu_jugadores(
                reco_unlock_global, "unlock recolección", "desbloqueos",
                emoji_jugador="🔑", emoji_bloque="🟪",
                color_bloque="magenta", color_idx="cian", global_bans=global_bans
            )
        elif opcion == "":
            break
        else:
            print(color_texto("❌ Opción inválida.", "rojo"))
            input(color_texto("Pulsa Enter para continuar...", "azul"))