from collections import defaultdict, Counter
from datetime import datetime
import utils.config
from funciones.extra import color_texto
from funciones.bans import cargar_bans_global, check_ban_jugador, check_ban_jugador_completo
from funciones.players import buscar_jugador_por_nombre

def analisis_acciones_especificas():
    archivo = utils.config.get_registro_global()
    datos = defaultdict(lambda: defaultdict(list))  # jugador -> pantalla -> [fechas]

    # 1. Leer y agrupar
    with open(archivo, "r", encoding="utf-8") as f:
        for linea in f:
            partes = linea.strip().split('\t')
            if len(partes) < 5:
                continue
            fecha_str, jugador, _, pantalla, *_ = partes
            try:
                fecha = datetime.strptime(fecha_str, "%d.%m.%y %H:%M:%S")
            except Exception:
                continue
            datos[jugador][pantalla].append(fecha)

    # 2. Buscar patrones y guardar resultados
    patrones_jugadores = []
    for jugador, pantallas in datos.items():
        patrones = []
        for pantalla, fechas in pantallas.items():
            if len(fechas) < 10:
                continue
            fechas.sort()
            difs = [(fechas[i+1] - fechas[i]).total_seconds() for i in range(len(fechas)-1)]
            if not difs:
                continue
            counter = Counter(difs)
            patron, repeticiones = counter.most_common(1)[0]
            if repeticiones > 10:
                patrones.append({
                    "pantalla": pantalla,
                    "registros": len(fechas),
                    "patron": int(patron),
                    "repeticiones": repeticiones
                })
        if patrones:
            total_repeticiones = sum(p["repeticiones"] for p in patrones)
            patrones_jugadores.append({
                "jugador": jugador,
                "num_patrones": len(patrones),
                "total_repeticiones": total_repeticiones,
                "patrones": patrones
            })

    # 3. Ordenar por más patrones y repeticiones
    patrones_jugadores.sort(key=lambda x: (x["num_patrones"], x["total_repeticiones"]), reverse=True)

    global_bans = cargar_bans_global()

    # 🚀 OPTIMIZACIÓN EXTREMA: Pre-procesar TODOS los estados de ban de una vez (súper rápido)
    print(color_texto("🔍 Verificando estados de ban...", "azul"))  # Indicador de progreso
    from funciones.bans import obtener_estados_ban_masivo
    jugadores_lista = [pj['jugador'] for pj in patrones_jugadores[:30]]  # Solo los top 30 que se van a mostrar
    estados_ban = obtener_estados_ban_masivo(jugadores_lista, global_bans)

    # 4. Mostrar tabla resumen (solo los 30 primeros, con más espacio entre columnas)
    print(color_texto("═" * 90, "azul"))
    print(color_texto("🔎 Tabla de patrones detectados (Top 30)", "azul"))
    print(color_texto("═" * 90, "azul"))
    print(f"{color_texto('Nº', 'amarillo'):>3}  {color_texto('Jugador', 'blanco'):30} {color_texto('Patrones', 'amarillo'):>10} {color_texto('Repeticiones', 'amarillo'):>15}")
    print(color_texto("─" * 80, "azul"))
    for idx, pj in enumerate(patrones_jugadores[:30], 1):
        # 🚀 OPTIMIZACIÓN: Usar datos ya procesados (instantáneo)
        ban_status, fecha_exp, mundo_ban, tiene_historial = estados_ban[pj['jugador']]
        
        # Estados de ban activos (PELIGRO)
        if ban_status == "permanente":
            jugador_str = color_texto(pj['jugador'], "rojo") + color_texto(" 🚨 BAN PERMANENTE ACTIVO", "rojo")
        elif ban_status == "temporal":
            jugador_str = color_texto(pj['jugador'], "amarillo") + color_texto(f" ⚠️ BAN TEMPORAL ACTIVO → {fecha_exp}", "amarillo")
        elif ban_status == "otro_mundo":
            jugador_str = color_texto(pj['jugador'], "magenta") + color_texto(f" 🌍 BAN ACTIVO EN {mundo_ban}", "magenta")
        # Solo historial previo (ALERTA) - PERO puede incluir baneos activos
        elif tiene_historial:
            from funciones.bans import generar_mensaje_historial_baneos, obtener_color_mensaje_ban
            mensaje_historial = generar_mensaje_historial_baneos(pj['jugador'], global_bans, utils.config.WORLD)
            color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
            
            # Determinar color del jugador según el tipo de ban
            if "🚨 BAN PERMANENTE ACTIVO" in mensaje_historial:
                color_jugador = "rojo"
            elif "⚠️ BAN TEMPORAL ACTIVO" in mensaje_historial:
                color_jugador = "amarillo"
            elif "🌍 BAN ACTIVO EN" in mensaje_historial:
                color_jugador = "magenta"
            else:
                color_jugador = "cyan"
            
            jugador_str = color_texto(pj['jugador'], color_jugador) + color_texto(f" {mensaje_historial}", color_mensaje)
        # Sin baneos
        else:
            jugador_str = color_texto(pj['jugador'], "blanco")
        print(f"{color_texto(str(idx), 'verde'):>3}  {jugador_str:30} {color_texto(str(pj['num_patrones']), 'amarillo'):>10} {color_texto(str(pj['total_repeticiones']), 'amarillo'):>15}")

    # 5. Permitir seleccionar un jugador para ver detalles o ir a su perfil
    while True:
        seleccion = input(color_texto("\nSelecciona un Nº de jugador para ver detalles, o 'p' para perfil (Ej: p12), Enter para salir: ", "amarillo")).strip().lower()
        if not seleccion:
            break
        if seleccion.startswith("p") and seleccion[1:].isdigit():
            idx = int(seleccion[1:]) - 1
            if 0 <= idx < min(30, len(patrones_jugadores)):
                jugador = patrones_jugadores[idx]['jugador']
                buscar_jugador_por_nombre(jugador, preguntar_si_vacio=False)
            else:
                print(color_texto("Opción no válida.", "rojo"))
            continue
        if not seleccion.isdigit() or int(seleccion) < 1 or int(seleccion) > min(30, len(patrones_jugadores)):
            print(color_texto("Opción no válida.", "rojo"))
            continue
        pj = patrones_jugadores[int(seleccion)-1]
        # 🚀 OPTIMIZACIÓN: Usar datos ya procesados (instantáneo)
        ban_status, fecha_exp, mundo_ban, tiene_historial = estados_ban[pj['jugador']]
        
        # Estados de ban activos (PELIGRO)
        if ban_status == "permanente":
            jugador_str = color_texto(pj['jugador'], "rojo") + color_texto(" 🚨 BAN PERMANENTE ACTIVO", "rojo")
        elif ban_status == "temporal":
            jugador_str = color_texto(pj['jugador'], "amarillo") + color_texto(f" ⚠️ BAN TEMPORAL ACTIVO → {fecha_exp}", "amarillo")
        elif ban_status == "otro_mundo":
            jugador_str = color_texto(pj['jugador'], "magenta") + color_texto(f" 🌍 BAN ACTIVO EN {mundo_ban}", "magenta")
        # Solo historial previo (ALERTA) - PERO puede incluir baneos activos
        elif tiene_historial:
            from funciones.bans import generar_mensaje_historial_baneos, obtener_color_mensaje_ban
            mensaje_historial = generar_mensaje_historial_baneos(pj['jugador'], global_bans, utils.config.WORLD)
            color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
            
            # Determinar color del jugador según el tipo de ban
            if "🚨 BAN PERMANENTE ACTIVO" in mensaje_historial:
                color_jugador = "rojo"
            elif "⚠️ BAN TEMPORAL ACTIVO" in mensaje_historial:
                color_jugador = "amarillo"
            elif "🌍 BAN ACTIVO EN" in mensaje_historial:
                color_jugador = "magenta"
            else:
                color_jugador = "cyan"
            
            jugador_str = color_texto(pj['jugador'], color_jugador) + color_texto(f" {mensaje_historial}", color_mensaje)
        # Sin baneos
        else:
            jugador_str = color_texto(pj['jugador'], "blanco")

        print(color_texto(f"\n👤 Detalle de patrones para {jugador_str}:", "verde"))
        print(color_texto("Pantalla".ljust(22) + "Registros".rjust(12) + "Patrón".rjust(14) + "Repeticiones".rjust(18), "azul"))
        print(color_texto("-" * 70, "azul"))
        for idx, p in enumerate(pj["patrones"], 1):
            print(
                f"{color_texto(str(idx)+'.', 'verde')} "
                f"{color_texto(p['pantalla'].ljust(20), 'blanco')}"
                f"{color_texto(str(p['registros']).rjust(10), 'amarillo')}"
                f"{color_texto((str(p['patron'])+'s').rjust(12), 'amarillo')}"
                f"{color_texto(str(p['repeticiones']).rjust(16), 'amarillo')}"
            )
        print(color_texto("-" * 70, "azul"))

        # Permitir seleccionar una pantalla para ver los registros o ir al perfil del jugador
        seleccion_pantalla = input(color_texto("\nSelecciona un Nº de pantalla para ver registros, o 'p' para perfil del jugador (Enter para volver): ", "cyan")).strip()
        if not seleccion_pantalla:
            continue
        if seleccion_pantalla.startswith("p") and seleccion_pantalla[1:].isdigit():
            idx = int(seleccion_pantalla[1:]) - 1
            if 0 <= idx < min(30, len(patrones_jugadores)):
                jugador = patrones_jugadores[idx]['jugador']
                buscar_jugador_por_nombre(jugador, preguntar_si_vacio=False)
            else:
                print(color_texto("Opción no válida.", "rojo"))
            continue
        if not seleccion_pantalla.isdigit() or int(seleccion_pantalla) < 1 or int(seleccion_pantalla) > len(pj["patrones"]):
            print(color_texto("Opción no válida.", "rojo"))
            continue
        pantalla_sel = pj["patrones"][int(seleccion_pantalla)-1]["pantalla"]
        patron_sel = pj["patrones"][int(seleccion_pantalla)-1]["patron"]

        print()
        print(color_texto(f"📋 Repeticiones del patrón {patron_sel}s en {pantalla_sel} para {pj['jugador']} (máx 20):", "azul"))
        print("-" * 120)
        print(
            f"{'Nº':<4}"
            f"{' Hora Inicio':<20}│"
            f"{'   Hora Fin':<20}│"
            f"{'  Patrón':<13}│"
            f"{'  Pantalla > Acción':<32}│"
            f"{'   CID':<18}"
        )
        print("-" * 120)

        # Leer todas las líneas de ese jugador y pantalla
        registros = []
        with open(archivo, "r", encoding="utf-8") as f:
            for linea in f:
                partes = linea.strip().split('\t')
                if len(partes) < 7:
                    continue
                fecha_str, jugador, _, pantalla, accion, _, cid = partes[:7]
                if jugador == pj['jugador'] and pantalla == pantalla_sel:
                    try:
                        fecha = datetime.strptime(fecha_str, "%d.%m.%y %H:%M:%S")
                    except Exception:
                        continue
                    registros.append((fecha, accion, cid, linea.strip()))

        # Buscar pares con la diferencia igual al patrón
        registros.sort()
        repeticiones = []
        for i in range(len(registros)-1):
            diff = (registros[i+1][0] - registros[i][0]).total_seconds()
            if int(diff) == patron_sel:
                repeticiones.append((registros[i], registros[i+1]))
            if len(repeticiones) >= 20:
                break

        if repeticiones:
            for idx, (reg1, reg2) in enumerate(repeticiones, 1):
                fecha1, accion1, cid1, _ = reg1
                fecha2, accion2, cid2, _ = reg2
                
                # Calcular tiempo REAL entre las dos acciones
                tiempo_real = int((fecha2 - fecha1).total_seconds())
                h = tiempo_real // 3600
                m = (tiempo_real % 3600) // 60
                s = tiempo_real % 60
                patron_str = f"{h}h {m}m {s}s"
                
                # Combinar CID sin espacios
                cid_combinado = f"{cid1}{cid2}"
                
                # Emoji por pantalla
                emoji = "🧹" if pantalla_sel.startswith("scavenge") else "🛒" if pantalla_sel.startswith("market") else "⚙️"
                print(
                    f"{str(idx)+':':<4}"
                    f"{fecha1.strftime('%d.%m.%y %H:%M:%S'):<20}│"
                    f"{fecha2.strftime('%d.%m.%y %H:%M:%S'):<20}│"
                    f"⏱️  {patron_str:<9}│"
                    f"{emoji} {pantalla_sel} > {accion2:<17}│"
                    f"🆔 {cid_combinado}"
                )
        else:
            print(color_texto("No se encontraron repeticiones exactas del patrón en los registros.", "rojo"))

        if len(repeticiones) == 20:
            print(color_texto(f"\n... y más repeticiones similares.", "gris"))

        # Leyenda explicativa
        print("\n" + color_texto("📖 " + "="*40 + " LEYENDA " + "="*40, "azul"))
        print(color_texto("Nº", "amarillo") + ": Número de la repetición encontrada.")
        print(color_texto("Hora", "amarillo") + ": Hora de inicio y fin de la acción repetida.")
        print(color_texto("Patrón", "amarillo") + ": Tiempo exacto (h/m/s) entre ambas acciones.")
        print(color_texto("Pantalla > Acción", "amarillo") + ": Tipo de pantalla y acción realizada (ej: scavenge_ > send_squads).")
        print(color_texto("CID", "amarillo") + ": Código identificador único del registro.")
        print(color_texto("="*110, "azul"))
        print(color_texto("Estas coincidencias muestran pares de acciones que se repiten con el mismo intervalo de tiempo,", "blanco"))
        print(color_texto("lo que puede indicar automatismos o rutinas sospechosas en la actividad del jugador.", "blanco"))
        print(color_texto("="*110 + "\n", "azul"))

        input(color_texto("Pulsa Enter para volver al detalle del jugador...", "cyan"))
    print(color_texto("\nAnálisis finalizado.", "azul"))

def otros_analisis():
    archivo = utils.config.get_registro_global()
    pantalla_registros = defaultdict(int)
    registros_por_pantalla = defaultdict(list)
    global_bans = cargar_bans_global()

    # 1. Leer y agrupar por pantalla
    with open(archivo, "r", encoding="utf-8") as f:
        for linea in f:
            partes = linea.strip().split('\t')
            if len(partes) < 5:
                continue
            fecha_str, jugador, _, pantalla, *_ = partes
            try:
                fecha = datetime.strptime(fecha_str, "%d.%m.%y %H:%M:%S")
            except Exception:
                continue
            pantalla_registros[pantalla] += 1
            registros_por_pantalla[pantalla].append((fecha, jugador, linea.strip()))

    # 2. Mostrar tabla resumen de pantallas con patrones detectados
    while True:
        pantallas_ordenadas = []
        pantalla_emojis = ["1️⃣ ", "2️⃣ ", "3️⃣ ", "4️⃣ ", "5️⃣ ", "6️⃣ ", "7️⃣ ", "8️⃣ ", "9️⃣ "]
        # Buscar patrones para cada pantalla y contar casos
        casos_por_pantalla = {}
        for pantalla, registros in registros_por_pantalla.items():
            registros_por_jugador = defaultdict(list)
            for fecha, jugador, linea in registros:
                registros_por_jugador[jugador].append((fecha, linea))
            casos = 0
            for jugador, lista in registros_por_jugador.items():
                if len(lista) < 20:
                    continue
                lista.sort()
                difs = []
                for i in range(len(lista)-1):
                    diff = (lista[i+1][0] - lista[i][0]).total_seconds()
                    difs.append((diff, i))
                counter = Counter(int(round(diff/10.0)*10) for diff, _ in difs)
                if not counter:
                    continue
                patron, repeticiones = counter.most_common(1)[0]
                if patron < 20 or repeticiones < 10:
                    continue
                casos += 1
            if casos > 0:
                pantallas_ordenadas.append((pantalla, casos))
        # Ordenar por casos descendente y mostrar solo top 9
        pantallas_ordenadas = sorted(pantallas_ordenadas, key=lambda x: x[1], reverse=True)[:9]

        print(color_texto("\n" + "═" * 56, "azul"))
        print(color_texto("📊 Menú de pantallas más activas", "azul"))
        print(color_texto("═" * 56, "azul"))
        print(
            f"{'Nº':<4}"
            f"{'Pantalla':<22}"
            f"{'🧩 Casos con Patrón':>22}"
        )
        print(color_texto("─" * 50, "azul"))
        for idx, (pantalla, casos) in enumerate(pantallas_ordenadas, 1):
            num_emoji = pantalla_emojis[idx-1] if idx <= 9 else str(idx)
            print(f"{num_emoji:<3} {pantalla:<22} {str(casos):>18}")
        print(color_texto("─" * 50, "azul"))

        # 3. Seleccionar pantalla para analizar patrones
        seleccion = input(color_texto("\nSelecciona un Nº de pantalla para analizar patrones (Enter para salir): ", "amarillo")).strip()
        if not seleccion:
            break
        if not seleccion.isdigit() or int(seleccion) < 1 or int(seleccion) > len(pantallas_ordenadas):
            print(color_texto("Opción no válida.", "rojo"))
            continue
        pantalla_sel = pantallas_ordenadas[int(seleccion)-1][0]
        registros = registros_por_pantalla[pantalla_sel]
        if len(registros) < 30:
            print(color_texto("No hay suficientes registros para analizar patrones en esta pantalla.", "rojo"))
            continue

        # 4. Buscar patrones por jugador en la pantalla seleccionada
        print(color_texto(f"\n🔎 Analizando patrones en '{pantalla_sel}'...", "azul"))
        patrones_encontrados = []
        registros_por_jugador = defaultdict(list)
        for fecha, jugador, linea in registros:
            registros_por_jugador[jugador].append((fecha, linea))

        for jugador, lista in registros_por_jugador.items():
            if len(lista) < 20:
                continue
            lista.sort()
            difs = []
            for i in range(len(lista)-1):
                diff = (lista[i+1][0] - lista[i][0]).total_seconds()
                difs.append((diff, i))
            counter = Counter(int(round(diff/10.0)*10) for diff, _ in difs)
            if not counter:
                continue
            patron, repeticiones = counter.most_common(1)[0]
            if patron < 20 or repeticiones < 10:
                continue
            pares = []
            for diff, idx_dif in difs:
                if abs(diff - patron) <= 10:
                    pares.append((lista[idx_dif], lista[idx_dif+1]))
                if len(pares) >= 20:
                    break
            patrones_encontrados.append((jugador, patron, repeticiones, pares))

        if not patrones_encontrados:
            print(color_texto("No se encontraron patrones significativos en esta pantalla.", "rojo"))
            continue

        # 🚀 OPTIMIZACIÓN EXTREMA: Pre-procesar estados de ban para esta pantalla (súper rápido)
        print(color_texto("🔍 Verificando estados de ban...", "azul"))
        from funciones.bans import obtener_estados_ban_masivo
        jugadores_pantalla = [jugador for jugador, _, _, _ in patrones_encontrados]
        estados_ban_pantalla = obtener_estados_ban_masivo(jugadores_pantalla, global_bans)

        # Menú de jugadores con patrones
        while True:
            patrones_encontrados.sort(key=lambda x: x[2], reverse=True)
            print(color_texto("\n" + "═" * 60, "azul"))
            print(color_texto(f"📋 Menú de patrones detectados en '{pantalla_sel}'", "azul"))
            print(color_texto("═" * 60, "azul"))
            for idx, (jugador, patron_sel, repeticiones, pares) in enumerate(patrones_encontrados, 1):
                # 🚀 OPTIMIZACIÓN: Usar datos ya procesados (instantáneo)
                ban_status, fecha_exp, mundo_ban, tiene_historial = estados_ban_pantalla[jugador]
                
                # Estados de ban activos (PELIGRO)
                if ban_status == "permanente":
                    idx_str = color_texto(f"{idx}.", "rojo")
                    jugador_str = color_texto(f"👤 {jugador}", "rojo")
                    patron_str = color_texto(f"⏱️  {int(patron_sel)}s", "rojo")
                    rep_str = color_texto(f"{repeticiones} repeticiones", "rojo")
                    ban_str = color_texto(" 🚨 BAN PERMANENTE ACTIVO", "rojo")
                    print(f"{idx_str} {jugador_str} tiene {rep_str} con patrón de {patron_str}{ban_str}")
                elif ban_status == "temporal":
                    idx_str = color_texto(f"{idx}.", "amarillo")
                    jugador_str = color_texto(f"👤 {jugador}", "amarillo")
                    patron_str = color_texto(f"⏱️  {int(patron_sel)}s", "amarillo")
                    rep_str = color_texto(f"{repeticiones} repeticiones", "amarillo")
                    ban_str = color_texto(f" ⚠️ BAN TEMPORAL ACTIVO → {fecha_exp}", "amarillo")
                    print(f"{idx_str} {jugador_str} tiene {rep_str} con patrón de {patron_str}{ban_str}")
                elif ban_status == "otro_mundo":
                    idx_str = color_texto(f"{idx}.", "magenta")
                    jugador_str = color_texto(f"👤 {jugador}", "magenta")
                    patron_str = color_texto(f"⏱️  {int(patron_sel)}s", "magenta")
                    rep_str = color_texto(f"{repeticiones} repeticiones", "magenta")
                    ban_str = color_texto(f" 🌍 BAN ACTIVO EN {mundo_ban}", "magenta")
                    print(f"{idx_str} {jugador_str} tiene {rep_str} con patrón de {patron_str}{ban_str}")
                # Solo historial previo (ALERTA) - PERO puede incluir baneos activos
                elif tiene_historial:
                    from funciones.bans import generar_mensaje_historial_baneos, obtener_color_mensaje_ban, obtener_color_indice_ban
                    mensaje_historial = generar_mensaje_historial_baneos(jugador, global_bans, utils.config.WORLD)
                    color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
                    color_indice = obtener_color_indice_ban(mensaje_historial)
                    
                    # Determinar color según el tipo de ban
                    if "🚨 BAN PERMANENTE ACTIVO" in mensaje_historial:
                        color_elementos = "rojo"
                    elif "⚠️ BAN TEMPORAL ACTIVO" in mensaje_historial:
                        color_elementos = "amarillo"
                    elif "🌍 BAN ACTIVO EN" in mensaje_historial:
                        color_elementos = "magenta"
                    else:
                        color_elementos = "cyan"
                    
                    idx_str = color_texto(f"{idx}.", color_indice)
                    jugador_str = color_texto(f"👤 {jugador}", color_elementos)
                    patron_str = color_texto(f"⏱️  {int(patron_sel)}s", color_elementos)
                    rep_str = color_texto(f"{repeticiones} repeticiones", color_elementos)
                    ban_str = color_texto(f" {mensaje_historial}", color_mensaje)
                    print(f"{idx_str} {jugador_str} tiene {rep_str} con patrón de {patron_str}{ban_str}")
                # Sin baneos
                else:
                    idx_str = color_texto(f"{idx}.", "verde")
                    jugador_str = color_texto(f"👤 {jugador}", "blanco")
                    patron_str = color_texto(f"⏱️  {int(patron_sel)}s", "cian")
                    rep_str = color_texto(f"{repeticiones} repeticiones", "azul")
                    print(f"{idx_str} {jugador_str} tiene {rep_str} con patrón de {patron_str}")
            print(color_texto("═" * 60, "azul"))

            seleccion_jugador = input(color_texto("\nSelecciona un Nº de jugador para ver repeticiones (o 'p' para perfil, Enter para volver): ", "amarillo")).strip().lower()
            if not seleccion_jugador:
                break
            if seleccion_jugador.startswith("p") and seleccion_jugador[1:].isdigit():
                idx = int(seleccion_jugador[1:]) - 1
                if 0 <= idx < len(patrones_encontrados):
                    jugador, _, _, _ = patrones_encontrados[idx]
                    buscar_jugador_por_nombre(jugador, preguntar_si_vacio=False)
                else:
                    print(color_texto("Opción no válida.", "rojo"))
                continue
            if not seleccion_jugador.isdigit() or int(seleccion_jugador) < 1 or int(seleccion_jugador) > len(patrones_encontrados):
                print(color_texto("Opción no válida.", "rojo"))
                continue
            jugador, patron_sel, repeticiones, pares = patrones_encontrados[int(seleccion_jugador)-1]

            print()
            print(color_texto(f"📋 Repeticiones del patrón {int(patron_sel)}s en {pantalla_sel} para {jugador} (máx 20):", "azul"))
            print("-" * 120)
            print(
                f"{'Nº':<4}"
                f"{'Hora Inicio':<20}│"
                f"{'Hora Fin':<20}│"
                f"{'Patrón':<13}│"
                f"{'Pantalla > Acción':<28}│"
                f"{'CID':<18}"
            )
            print("-" * 120)
            for idx, (reg1, reg2) in enumerate(pares, 1):
                fecha1, linea1 = reg1
                fecha2, linea2 = reg2
                partes2 = linea2.split('\t')
                accion2 = partes2[4] if len(partes2) > 4 else ""
                cid2 = partes2[6] if len(partes2) > 6 else ""
                
                # Obtener CID1 de la primera línea
                partes1 = linea1.split('\t')
                cid1 = partes1[6] if len(partes1) > 6 else ""
                
                # Calcular tiempo REAL entre las dos acciones
                tiempo_real = int((fecha2 - fecha1).total_seconds())
                h = tiempo_real // 3600
                m = (tiempo_real % 3600) // 60
                s = tiempo_real % 60
                patron_str = f"{h}h {m}m {s}s"
                
                # Combinar CID sin espacios
                cid_combinado = f"{cid1}{cid2}"
                
                emoji = "🧹" if pantalla_sel.startswith("scavenge") else "🛒" if pantalla_sel.startswith("market") else "⚙️"
                print(
                    f"{str(idx)+':':<4}"
                    f"{fecha1.strftime('%d.%m.%y %H:%M:%S'):<20}│"
                    f"{fecha2.strftime('%d.%m.%y %H:%M:%S'):<20}│"
                    f"⏱️  {patron_str:<9}│"
                    f"{emoji} {pantalla_sel} > {accion2:<17}│"
                    f"🆔 {cid_combinado}"
                )
            if len(pares) == 20:
                print(color_texto(f"\n... y más repeticiones similares.", "gris"))

            # Leyenda explicativa
            print("\n" + color_texto("📖 " + "="*40 + " LEYENDA " + "="*40, "azul"))
            print(color_texto("Nº", "amarillo") + ": Número de la repetición encontrada.")
            print(color_texto("Hora Inicio", "amarillo") + " / " + color_texto("Hora Fin", "amarillo") + ": Hora de inicio y fin de la acción repetida.")
            print(color_texto("⏱️  Patrón", "amarillo") + ": Tiempo exacto (h/m/s) entre ambas acciones.")
            print(color_texto("🧹/🛒/⚙️  Pantalla > Acción", "amarillo") + ": Tipo de pantalla y acción realizada (ej: scavenge_ > send_squads).")
            print(color_texto("🆔CID", "amarillo") + ": Código identificador único del registro.")
            print(color_texto("="*110, "azul"))
            print(color_texto("Estas coincidencias muestran pares de acciones que se repiten con el mismo intervalo de tiempo,", "blanco"))
            print(color_texto("lo que puede indicar automatismos o rutinas sospechosas en la actividad del jugador.", "blanco"))
            print(color_texto("="*110 + "\n", "azul"))
            print(color_texto("Pulsa Enter para volver al menú de jugadores o 'p' para ir al perfil del jugador...", "cyan"))
            op = input().strip().lower()
            if op == "p":
                buscar_jugador_por_nombre(jugador, preguntar_si_vacio=False)
        # Fin de patrones_encontrados

