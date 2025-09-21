from funciones.market import *
from datetime import datetime
import utils.config
from funciones.bans import cargar_bans_global, check_ban_jugador, check_ban_jugador_completo

def analisis_snob(registro):
    from funciones.extra import color_texto
    """
    Muestra un menú con los 20 jugadores con más registros en la pantalla 'snob'.
    Permite ver el detalle de registros de cada jugador.
    """ 
    # Agrupar registros por jugador
    jugadores = {}
    with open(registro, "r", encoding="utf-8") as f:
        for linea in f:
            partes = linea.strip().split("\t")
            if len(partes) < 6:
                continue
            if partes[3] == "snob":
                jugador = partes[1]
                jugadores.setdefault(jugador, []).append(partes)

    # Ordenar por número de registros y limitar a 20
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:20]
    global_bans = cargar_bans_global()

    # 🚀 OPTIMIZACIÓN EXTREMA: Pre-procesar TODOS los estados de ban de una vez (súper rápido)
    print(color_texto("🔍 Verificando estados de ban...", "azul"))  # Indicador de progreso
    from funciones.bans import obtener_estados_ban_masivo
    jugadores_lista = [jugador for jugador, _ in jugadores_ordenados]
    estados_ban = obtener_estados_ban_masivo(jugadores_lista, global_bans)

    while True:
        print(color_texto("═" * 70, "azul"))
        print(color_texto("👑 Menú de registros SNOB por jugador (Top 20)", "azul"))
        print(color_texto("═" * 70, "azul"))
        for idx, (jugador, registros) in enumerate(jugadores_ordenados, 1):
            # 🚀 OPTIMIZACIÓN: Usar datos ya procesados (instantáneo)
            ban_status, fecha_exp, mundo_ban, tiene_historial = estados_ban[jugador]
            
            # Estados de ban activos (PELIGRO)
            if ban_status == "permanente":
                idx_str = color_texto(str(idx), "rojo")
                jugador_str = color_texto(jugador, "blanco")
                ban_str = color_texto(" 🚨 BAN PERMANENTE ACTIVO", "rojo")
                print(f"{idx_str}. 👤 {jugador_str} tiene {color_texto(str(len(registros)), 'amarillo')} registros SNOB.{ban_str}")
            elif ban_status == "temporal":
                idx_str = color_texto(str(idx), "amarillo")
                jugador_str = color_texto(jugador, "blanco")
                ban_str = color_texto(f" ⚠️ BAN TEMPORAL ACTIVO → {fecha_exp}", "amarillo")
                print(f"{idx_str}. 👤 {jugador_str} tiene {color_texto(str(len(registros)), 'amarillo')} registros SNOB.{ban_str}")
            elif ban_status == "otro_mundo":
                idx_str = color_texto(str(idx), "magenta")
                jugador_str = color_texto(jugador, "blanco")
                ban_str = color_texto(f" 🌍 BAN ACTIVO EN {mundo_ban}", "magenta")
                print(f"{idx_str}. 👤 {jugador_str} tiene {color_texto(str(len(registros)), 'amarillo')} registros SNOB.{ban_str}")
            # Solo historial previo (ALERTA) - PERO puede incluir baneos activos
            elif tiene_historial:
                from funciones.bans import generar_mensaje_historial_baneos, obtener_color_mensaje_ban, obtener_color_indice_ban
                mensaje_historial = generar_mensaje_historial_baneos(jugador, global_bans, utils.config.WORLD)
                
                # Determinar colores según el tipo de mensaje
                color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
                color_indice = obtener_color_indice_ban(mensaje_historial)
                
                idx_str = color_texto(str(idx), color_indice)
                jugador_str = color_texto(jugador, "blanco")
                ban_str = color_texto(f" {mensaje_historial}", color_mensaje)
                print(f"{idx_str}. 👤 {jugador_str} tiene {color_texto(str(len(registros)), 'amarillo')} registros SNOB.{ban_str}")
            # Sin baneos
            else:
                idx_str = color_texto(str(idx), "verde")
                jugador_str = color_texto(jugador, "blanco")
                print(f"{idx_str}. 👤 {jugador_str} tiene {color_texto(str(len(registros)), 'amarillo')} registros SNOB.")
        print(color_texto("0. Salir", "rojo"))
        print(color_texto("═" * 70, "azul"))
        opcion = input(color_texto("👉 Selecciona el número de un jugador (Enter para continuar): ", "verde")).strip()
        if not opcion.isdigit() or not (1 <= int(opcion) <= len(jugadores_ordenados)):
            break
        jugador, registros = jugadores_ordenados[int(opcion) - 1]
        mostrar_registros_snob_coin_con_perfil(registro, jugador_filtrado=jugador)

def tabla_snob_action(jugador, registros):
    from datetime import datetime
    print("═" * 110)
    print(f"👤 Jugador: {jugador} - {len(registros)} registros SNOB")
    print("═" * 110)
    print(f"{'Nº':>3} │ {'Fecha':^12} │ {'Hora':^8} │ {'Pueblo':<30} │ {'Acción':<12} │ {'CID':<12}")
    print("─" * 110)
    for idx, partes in enumerate(registros, 1):
        try:
            fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
            fecha_str = fecha.strftime("%d.%m.%Y")
            hora_str = fecha.strftime("%H:%M:%S")
        except Exception:
            fecha_str = partes[0]
            hora_str = ""
        pueblo = partes[2]
        accion = partes[4]
        cid = partes[6] if len(partes) > 6 else "-"
        print(f"{idx:>3} │ {fecha_str:^12} │ {hora_str:^8} │ {pueblo:<30} │ {accion:<12} │ {cid:<12}")
    print("═" * 110)
    input("Pulsa Enter para volver al menú...")

def mostrar_registros_snob_coin_con_perfil(registro, jugador_filtrado=None):
    from datetime import datetime, timedelta
    import collections
    from funciones.players import buscar_jugador_por_nombre  # Import aquí, dentro de la función

    registros = []
    with open(registro, "r", encoding="utf-8") as f:
        for linea in f:
            partes = linea.strip().split("\t")
            if len(partes) < 6:
                continue
            if partes[3] == "snob" and partes[4] in ("coin", "coin_multi"):
                if jugador_filtrado is None or partes[1] == jugador_filtrado:
                    registros.append(partes)

    # Ordenar por fecha descendente (más reciente primero)
    registros.sort(key=lambda x: datetime.strptime(x[0], "%d.%m.%y %H:%M:%S"), reverse=True)

    # Calcular tiempos hasta el siguiente registro
    tiempos_hasta_sig = []
    fechas = [datetime.strptime(p[0], "%d.%m.%y %H:%M:%S") for p in registros]
    for i in range(len(fechas) - 1):
        diff = int((fechas[i] - fechas[i + 1]).total_seconds())
        tiempos_hasta_sig.append(diff)
    tiempos_hasta_sig.append(None)  # El último no tiene siguiente

    # Buscar patrón dominante (±1 minutos)
    tolerancia = 60  # 1 minuto en segundos
    counter = collections.Counter()
    for t in tiempos_hasta_sig:
        if t is not None:
            counter[t] += 1
    if counter:
        patron, repeticiones = counter.most_common(1)[0]
        indices_patron = {i for i, t in enumerate(tiempos_hasta_sig) if t is not None and abs(t - patron) <= tolerancia}
    else:
        patron = None
        indices_patron = set()

    # Tabla visual (igual que antes)
    print("═" * 150)
    print(f"{'Nº':>3} │ {'Fecha':^12} │ {'Hora':^8} │ {'Pueblo':<45} │ {'Time Hasta el Sig':^17} │ {'Acción':<12} │ {'CID':<12}")
    print("─" * 150)
    verde = "\033[92m"
    amarillo = "\033[93m"
    rojo = "\033[91m"
    reset = "\033[0m"

    counter = collections.Counter(t for t in tiempos_hasta_sig if t is not None)
    top_times = counter.most_common()
    rojo_time, rojo_count = top_times[0] if top_times and top_times[0][1] > 20 else (None, 0)
    amarillo_time, amarillo_count = (top_times[1] if len(top_times) > 1 and top_times[1][1] > 20 else (None, 0))

    indices_rojo = {i for i, t in enumerate(tiempos_hasta_sig) if t == rojo_time}
    indices_amarillo = {i for i, t in enumerate(tiempos_hasta_sig) if t == amarillo_time}
    indices_verde = {i for i, t in enumerate(tiempos_hasta_sig) if t is not None and abs(t - patron) <= tolerancia}

    for idx, partes in enumerate(registros, 1):
        try:
            fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
            fecha_str = fecha.strftime("%d.%m.%Y")
            hora_str = fecha.strftime("%H:%M:%S")
        except Exception:
            fecha_str = partes[0]
            hora_str = ""
        pueblo = partes[2]
        accion = partes[4]
        cid = partes[6] if len(partes) > 6 else "-"
        t_sig = tiempos_hasta_sig[idx - 1]
        if t_sig is not None:
            horas, resto = divmod(t_sig, 3600)
            minutos, segundos = divmod(resto, 60)
            if horas > 0:
                t_sig_str = f"{horas}h {minutos}m {segundos}s"
            elif minutos > 0:
                t_sig_str = f"{minutos}m {segundos}s"
            else:
                t_sig_str = f"{segundos}s"
        else:
            t_sig_str = "-"
        fila = f"{idx:>3} │ {fecha_str:^12} │ {hora_str:^8} │ {pueblo:<45} │ {t_sig_str:^17} │ {accion:<12} │ {cid:<12}"
        if rojo_time is not None and (idx - 1) in indices_rojo:
            print(f"{rojo}{fila}{reset}")
        elif amarillo_time is not None and (idx - 1) in indices_amarillo:
            print(f"{amarillo}{fila}{reset}")
        elif (idx - 1) in indices_verde:
            print(f"{verde}{fila}{reset}")
        else:
            print(fila)
    print("═" * 150)
    if patron is not None:
        def format_time(seg):
            h, r = divmod(seg, 3600)
            m, s = divmod(r, 60)
            if h > 0:
                return f"{h}h {m}m {s}s"
            elif m > 0:
                return f"{m}m {s}s"
            else:
                return f"{s}s"
        patron_str = format_time(patron)
        rojo_str = format_time(rojo_time) if rojo_time is not None else "-"
        amarillo_str = format_time(amarillo_time) if amarillo_time is not None else "-"

        valores_resaltados = [tiempos_hasta_sig[i] for i in indices_verde]
        if valores_resaltados:
            media = int(sum(valores_resaltados) / len(valores_resaltados))
            media_str = format_time(media)
        else:
            media_str = "-"

        jugador_str = f"👤 Jugador: {jugador_filtrado}" if jugador_filtrado else "👥 Todos los jugadores"

        print("══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════")
        print("📊 Leyenda de colores:")
        if rojo_time is not None:
            print(f"  🟥  {rojo_count} coincidencias exactas para el valor base {rojo_str} (mayor frecuencia, >20)")
        if amarillo_time is not None:
            print(f"  🟨  {amarillo_count} coincidencias exactas para el valor base {amarillo_str} (segunda frecuencia, >20)")
        print(f"  🟩  {len(indices_verde)} coincidencias resaltadas para el valor base {patron_str} (±1 minuto)")
        print(f"  📈  Media de los valores resaltados: {media_str}")
        print(f"  {jugador_str}")
        print("══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════")
    print("Pulsa Enter para volver al menú o 'p' para ir al perfil del jugador...")
    op = input().strip().lower()
    if op == "p" and jugador_filtrado:
        buscar_jugador_por_nombre(jugador_filtrado, preguntar_si_vacio=False)



####################################################
###     FUNCIONES DE CONTEO PARA EL RESUMEN      ###
####################################################
def contar_snob_coin(nombre_jugador, registro):
    registros = filtrar_registros_market({"snob_coin"}, registro)
    contador = sum(1 for partes in registros if partes[1] == nombre_jugador)
    return contador

def contar_snob_train(nombre_jugador, registro):
    registros = filtrar_registros_market({"snob_train"}, registro)
    contador = sum(1 for partes in registros if partes[1] == nombre_jugador)
    return contador

def detectar_patron_nobles(nombre_jugador, registro):
    registros = filtrar_registros_market({"snob_coin", "snob_train"}, registro)
    patrones = []
    for partes in registros:
        if partes[1] == nombre_jugador:
            patrones.append(partes)
    return patrones

