import utils.config
from datetime import datetime
from funciones.extra import color_texto

####################################################
##          MENÚ DE ANÁLISIS DE MERCADO           ##
####################################################
def market():
    from funciones.extra import color_texto
    while True:
        print(color_texto("═" * 70, "azul"))
        print(color_texto("📊 Menú de análisis de mercado", "azul"))
        print(color_texto("═" * 70, "azul"))
        print(color_texto("1️⃣  Análisis Global.", "verde"))
        print(color_texto("2️⃣  Análisis de Compra / Venta.", "amarillo"))
        print(color_texto("3️⃣  Análisis de Solicitudes.", "cian"))
        print(color_texto("4️⃣  Análisis de Balanceadores.", "magenta"))
        print(color_texto("5️⃣  Análisis de Envíos Normales.", "blanco"))
        print(color_texto("0️⃣  Salir", "rojo"))
        print(color_texto("═" * 70, "azul"))
        opcion = input(color_texto("👉 Selecciona una opción (Enter para continuar): ", "verde")).strip()
        registro_simple = utils.config.get_registro_simple()
        registro_global = utils.config.get_registro_global()
        if opcion == "0" or opcion == "":
            break
        elif opcion == "1":
            market_resumen_global(registro_global)
        elif opcion == "2":
            market_exchanges(registro_global)
        elif opcion == "3":
            market_calls(registro_global)
        elif opcion == "4":
            market_map_sends(registro_global)
        elif opcion == "5":
            market_sends(registro_global)
        else:
            print(color_texto("❌ Opción inválida.", "rojo"))
            input(color_texto("Pulsa Enter para continuar...", "azul"))

####################################################
###   FUNCIONES DE ANÁLISIS DE MERCADO GLOBAL    ###
####################################################
# Función para mostrar un resumen global de los registros del mercado
def market_resumen_global(registro):
    # Resumen de todos los tipos
    tipos = [
        ("exchanges (compra/venta)", {"exchange_confirm", "exchange_begin"}),
        ("solicitudes (call)", {"call"}),
        ("balanceadores (map_send)", {"map_send"}),
        ("envíos normales (send)", {"send"}),
    ]
    print("═" * 70)
    print("📊 Resumen Global de Mercado")
    print("═" * 70)
    for nombre, acciones in tipos:
        registros = filtrar_registros_market(acciones, registro)
        jugadores = {}
        for partes in registros:
            jugador = partes[1]
            jugadores.setdefault(jugador, []).append(partes)
        total = sum(len(acciones) for acciones in jugadores.values())
        print(f"{nombre.capitalize():<30}: {total} registros, {len(jugadores)} jugadores")
    print("═" * 70)
    input("Pulsa Enter para volver al menú...")
    
# Función para analizar las ventas y compras en el mercado (exchanges)
def market_exchanges(registro):
    from collections import Counter, defaultdict

    registros = filtrar_registros_market({"exchange_confirm", "exchange_begin"}, registro)
    # Agrupar por jugador
    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:10]

    print("═" * 70)
    print(f"📋 Top 10 jugadores por exchanges (compra/venta)")
    print("═" * 70)
    for idx, (jugador, acciones) in enumerate(jugadores_ordenados, 1):
        print(f"{idx}. 👤 {jugador} tiene {len(acciones)} exchanges.")
    print("═" * 70)

    # Buscar patrones de exchange_begin seguido de exchange_confirm (1-5s después) para cada jugador
    print("\n🔎 Buscando patrones de exchange_begin + exchange_confirm (1-5s)...\n")
    patrones_por_jugador = defaultdict(list)
    for jugador, acciones in jugadores.items():
        # Ordenar por fecha descendente (más reciente primero)
        acciones_ordenadas = sorted(acciones, key=lambda x: datetime.strptime(x[0], "%d.%m.%y %H:%M:%S"), reverse=True)
        i = 0
        while i < len(acciones_ordenadas) - 1:
            actual = acciones_ordenadas[i]
            siguiente = acciones_ordenadas[i + 1]
            # Coinciden jugador, pueblo y CID
            if (
                actual[2] == siguiente[2]
                and actual[6] == siguiente[6]
                and actual[4] != siguiente[4]
            ):
                # Buscar begin -> confirm (en cualquier orden)
                if (
                    (actual[4] == "exchange_begin" and siguiente[4] == "exchange_confirm")
                    or (actual[4] == "exchange_confirm" and siguiente[4] == "exchange_begin")
                ):
                    t1 = datetime.strptime(actual[0], "%d.%m.%y %H:%M:%S")
                    t2 = datetime.strptime(siguiente[0], "%d.%m.%y %H:%M:%S")
                    diff = abs(int((t1 - t2).total_seconds()))
                    if 1 <= diff <= 5:
                        patrones_por_jugador[jugador].append((t1, t2, diff, actual[2], actual[6]))
                        i += 2
                        continue
            i += 1

    # Contar los tiempos 'x' (diferencia entre patrones consecutivos) por jugador
    top_x_por_jugador = []
    for jugador, patrones in patrones_por_jugador.items():
        if len(patrones) < 2:
            continue
        tiempos_x = []
        patrones_ordenados = sorted(patrones, key=lambda x: x[0], reverse=True)
        for i in range(1, len(patrones_ordenados)):
            x = abs(int((patrones_ordenados[i-1][0] - patrones_ordenados[i][0]).total_seconds()))
            tiempos_x.append(x)
        if tiempos_x:
            # Contar el tiempo x más frecuente
            x_mas_comun, repeticiones = Counter(tiempos_x).most_common(1)[0]
            top_x_por_jugador.append((jugador, x_mas_comun, repeticiones))

    # Mostrar el TOP 10 por coincidencias de tiempo x
    print("═" * 70)
    print("🔝 Top 10 jugadores por coincidencias de tiempo 'x' entre patrones:")
    print("═" * 70)
    top_x_por_jugador = sorted(top_x_por_jugador, key=lambda x: x[2], reverse=True)[:10]
    for idx, (jugador, x, rep) in enumerate(top_x_por_jugador, 1):
        print(f"{idx}. 👤 {jugador}: {rep} coincidencias con x = {x}s")
    print("═" * 70)
    input("Pulsa Enter para volver al menú...")
   
# Función para analizar las solicitudes (calls) en el mercado
def market_calls(registro):
    registros = filtrar_registros_market({"call"}, registro)
    from collections import Counter

    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:20]

    while True:
        print("═" * 70)
        print(f"📋 Top 20 jugadores por solicitudes (call)")
        print("═" * 70)
        for idx, (jugador, acciones) in enumerate(jugadores_ordenados, 1):
            print(f"{idx}. 👤 {jugador} tiene {len(acciones)} solicitudes (call).")
        print("0. Volver")
        print("═" * 70)
        opcion = input("Selecciona el número de un jugador para ver su análisis: ").strip()
        if opcion == "0" or opcion == "":
            break
        if not opcion.isdigit() or not (1 <= int(opcion) <= len(jugadores_ordenados)):
            print("❌ Opción inválida.")
            input("Pulsa Enter para continuar...")
            continue
        jugador, acciones = jugadores_ordenados[int(opcion) - 1]
        mostrar_bloques_call(jugador, acciones)

# Función para filtrar registros del mercado para los balanceadores (map_send)
def market_map_sends(registro):
    registros = filtrar_registros_market({"map_send"}, registro)
    # Agrupa por jugador y muestra el top 20
    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:20]

    while True:
        print("═" * 70)
        print(f"📋 Top 20 jugadores por balanceadores (map_send)")
        print("═" * 70)
        for idx, (jugador, acciones) in enumerate(jugadores_ordenados, 1):
            print(f"{idx}. 👤 {jugador} tiene {len(acciones)} balanceadores (map_send).")
        print("0. Volver")
        print("═" * 70)
        opcion = input("Selecciona el número de un jugador para ver su análisis: ").strip()
        if opcion == "0" or opcion == "":
            break
        if not opcion.isdigit() or not (1 <= int(opcion) <= len(jugadores_ordenados)):
            print("❌ Opción inválida.")
            input("Pulsa Enter para continuar...")
            continue
        jugador, acciones = jugadores_ordenados[int(opcion) - 1]
        analizar_bloques_balanceadores(jugador, acciones)
# Función para filtrar registros del mercado para los envíos normales (send)
def market_sends(registro):
    registros = filtrar_registros_market({"send"}, registro)
    mostrar_top_jugadores(registros, 20, "envíos normales (send)")  
    

###########################################################
###                 FUNCIONES INTERNAS                  ###  
###########################################################
## Función para mostrar el top de jugadores y sus registros
def mostrar_top_jugadores(registros, top=20, titulo="registros"):
    from collections import Counter

    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:top]

    while True:
        print("═" * 70)
        print(f"📋 Top {top} jugadores por {titulo}")
        print("═" * 70)
        for idx, (jugador, acciones) in enumerate(jugadores_ordenados, 1):
            print(f"{idx}. 👤 {jugador} tiene {len(acciones)} {titulo}.")
        print("0. Volver")
        print("═" * 70)
        opcion = input("Selecciona el número de un jugador para ver su análisis: ").strip()
        if opcion == "0" or opcion == "":
            break
        if not opcion.isdigit() or not (1 <= int(opcion) <= len(jugadores_ordenados)):
            print("❌ Opción inválida.")
            input("Pulsa Enter para continuar...")
            continue
        jugador, acciones = jugadores_ordenados[int(opcion) - 1]
        mostrar_resumen_jugador_market(jugador, acciones, titulo)

# Función para mostrar un resumen de las acciones de un jugador en el mercado
def mostrar_resumen_jugador_market(jugador, acciones, titulo):
    from collections import Counter
    print("═" * 100)
    print(f"👤 Jugador: {jugador} - {len(acciones)} {titulo}")
    print("═" * 100)
    fechas = [a[0] for a in acciones]
    pueblos = [a[2] for a in acciones if len(a) > 2]
    acciones_tipo = [a[4] for a in acciones if len(a) > 4]
    print(f"Primer registro: {fechas[-1] if fechas else '-'}")
    print(f"Último registro: {fechas[0] if fechas else '-'}")
    print(f"Pueblos distintos: {len(set(pueblos))}")
    print(f"Acciones distintas: {', '.join(set(acciones_tipo))}")
    print(f"Pueblo más frecuente: {Counter(pueblos).most_common(1)[0][0] if pueblos else '-'}")
    print(f"Acción más frecuente: {Counter(acciones_tipo).most_common(1)[0][0] if acciones_tipo else '-'}")
    print("─" * 100)
    print(f"{'Nº':>3} │ {'Fecha':^12} │ {'Hora':^8} │ {'Pueblo':<30} │ {'Acción':<15} │ {'CID':<12}")
    print("─" * 100)
    for idx, partes in enumerate(acciones, 1):
        try:
            fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
            fecha_str = fecha.strftime("%d.%m.%Y")
            hora_str = fecha.strftime("%H:%M:%S")
        except Exception:
            fecha_str = partes[0]
            hora_str = ""
        pueblo = partes[2] if len(partes) > 2 else "-"
        accion = partes[4] if len(partes) > 4 else "-"
        cid = partes[6] if len(partes) > 6 else "-"
        print(f"{idx:>3} │ {fecha_str:^12} │ {hora_str:^8} │ {pueblo:<30} │ {accion:<15} │ {cid:<12}")
    print("═" * 100)
    input("Pulsa Enter para volver al menú...")

# Función para mostrar bloques de solicitudes (calls) agrupadas por día
def mostrar_bloques_call(jugador, acciones):
    from collections import defaultdict

    # Ordenar por fecha ascendente
    acciones_ordenadas = sorted(acciones, key=lambda x: parse_fecha(x[0]))

    # Agrupar por día
    bloques_por_dia = defaultdict(list)
    bloque_actual = [acciones_ordenadas[0]]
    dia_actual = parse_fecha(acciones_ordenadas[0][0]).date()

    for i in range(1, len(acciones_ordenadas)):
        dt1 = parse_fecha(acciones_ordenadas[i-1][0])
        dt2 = parse_fecha(acciones_ordenadas[i][0])
        diff = abs((dt2 - dt1).total_seconds())
        dia2 = dt2.date()
        if dia2 != dia_actual or diff > 30:
            bloques_por_dia[dia_actual].append(bloque_actual)
            bloque_actual = [acciones_ordenadas[i]]
            dia_actual = dia2
        else:
            bloque_actual.append(acciones_ordenadas[i])
    if bloque_actual:
        bloques_por_dia[dia_actual].append(bloque_actual)

    # 1. Precalcular todos los "Hasta sig. bloque" en segundos de TODOS los bloques de TODOS los días
    bloques_info = []  # [(dia, idx, hasta_sig, bloque, ...)]
    for dia, bloques in sorted(bloques_por_dia.items()):
        for idx, bloque in enumerate(bloques):
            dt_fin = parse_fecha(bloque[-1][0])
            if idx < len(bloques) - 1:
                dt_next = parse_fecha(bloques[idx+1][0][0])
                hasta_sig = (dt_next - dt_fin).total_seconds()
            else:
                hasta_sig = None
            bloques_info.append((dia, idx, hasta_sig, bloque))

    # Lista global de todos los hasta_sig (solo los que no son None)
    hasta_sig_global = [b[2] for b in bloques_info if b[2] is not None]

    # 2. Buscar patrones globales: para cada tiempo, contar cuántos otros están a ±5 minutos
    coincidencias_dict = {}
    for i, t in enumerate(hasta_sig_global):
        coincidencias = sum(
            1 for j, t2 in enumerate(hasta_sig_global)
            if i != j and abs(t2 - t) <= 300
        )
        coincidencias_dict[t] = coincidencias

    # 3. Detectar patrones frecuentes globales (por valor de hasta_sig)
    patrones_frecuentes = set()
    for t, coincidencias in coincidencias_dict.items():
        if coincidencias >= 10:  # Al menos 10 coincidencias
            patrones_frecuentes.add(t)

    # 4. Leyenda global
    leyenda_datos = None
    if patrones_frecuentes:
        # Tomar el valor con más coincidencias
        base_valor = max(patrones_frecuentes, key=lambda t: coincidencias_dict[t])
        coincidencias = coincidencias_dict[base_valor]
        valores_patron = list(patrones_frecuentes)
        if valores_patron:
            media_valor = sum(valores_patron) / len(valores_patron)
            horas = int(media_valor // 3600)
            minutos = int((media_valor % 3600) // 60)
            segundos = int(media_valor % 60)
            media_valor_str = f"{horas}:{minutos:02}:{segundos:02}"
        else:
            media_valor_str = "-"
        if base_valor is not None:
            horas = int(base_valor // 3600)
            minutos = int((base_valor % 3600) // 60)
            segundos = int(base_valor % 60)
            base_valor_str = f"{horas}:{minutos:02}:{segundos:02}"
        else:
            base_valor_str = "-"
        leyenda_datos = (coincidencias, base_valor_str, media_valor_str)

    # 5. Mostrar tablas por día, coloreando según patrón global
    print("═" * 110)
    print(f"👤 Jugador: {jugador} - {len(acciones)} solicitudes (call) agrupadas por días y bloques")
    print("═" * 110)
    for dia, bloques in sorted(bloques_por_dia.items()):
        print(f"\n📅 Día: {dia.strftime('%d.%m.%Y')}")
        print(f"{'Bloque':>6} │ {'Inicio':^23} │ {'Fin':^23} │ {'Registros':^10} │ {'Hasta sig. bloque':^20} │ {'CID(s)':<15}")
        print("─" * 110)
        for idx, bloque in enumerate(bloques):
            dt_inicio = parse_fecha(bloque[0][0])
            dt_fin = parse_fecha(bloque[-1][0])
            if idx < len(bloques) - 1:
                dt_next = parse_fecha(bloques[idx+1][0][0])
                hasta_sig = (dt_next - dt_fin)
                hasta_sig_seg = hasta_sig.total_seconds()
                hasta_sig_str = str(hasta_sig)
            else:
                hasta_sig_seg = None
                hasta_sig_str = "-"
            cids = set(partes[6] if len(partes) > 6 else "-" for partes in bloque)
            cids_str = ", ".join(sorted(cids))
            fila = f"{idx+1:>6} │ {bloque[0][0]:^23} │ {bloque[-1][0]:^23} │ {len(bloque):^10} │ {hasta_sig_str:^20} │ {cids_str:<15}"
            if hasta_sig_seg is not None and hasta_sig_seg in patrones_frecuentes:
                print(color_texto(fila, "amarillo"))
            else:
                print(fila)
        print("─" * 110)
    # Mostrar la leyenda al final, si hay datos
    if leyenda_datos:
        coincidencias, base_valor_str, media_valor_str = leyenda_datos
        print("\n" + "═" * 60)
        print("📊 Leyenda de colores:")
        print(
            f"  🟨 {color_texto(str(coincidencias), 'amarillo')} coincidencias encontradas para el valor base "
            f"{color_texto(base_valor_str, 'amarillo')} (±5 minutos)"
        )
        print(
            f"  📈 Media de los valores resaltados: {color_texto(media_valor_str, 'amarillo')}"
        )
        print("═" * 60)
    input("\nPulsa Enter para volver al menú...")


####################################################
###     FUNCIONES DE CONTEO PARA EL RESUMEN      ###
####################################################
def contar_exchanges(nombre_jugador, registro):
    registros = filtrar_registros_market({"exchange_confirm", "exchange_begin"}, registro)
    contador = sum(1 for partes in registros if partes[1] == nombre_jugador)
    return contador

def contar_calls(nombre_jugador, registro):
    registros = filtrar_registros_market({"call"}, registro)
    contador = sum(1 for partes in registros if partes[1] == nombre_jugador)
    return contador

def contar_map_send(nombre_jugador, registro):
    registros = filtrar_registros_market({"map_send"}, registro)
    contador = sum(1 for partes in registros if partes[1] == nombre_jugador)
    return contador

def contar_send(nombre_jugador, registro):
    registros = filtrar_registros_market({"send"}, registro)
    contador = sum(1 for partes in registros if partes[1] == nombre_jugador)
    return contador

####################################################
###       FUNCIONES AUXILIARES DEL MERCADO       ###
####################################################
## Función para parsear fechas en los registros del mercado
def parse_fecha(fecha_str):
    for fmt in ("%d.%m.%y %H:%M:%S.%f", "%d.%m.%y %H:%M:%S"):
        try:
            return datetime.strptime(fecha_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Formato de fecha no reconocido: {fecha_str}")

## Función para filtrar registros del mercado por acciones específicas
def filtrar_registros_market(acciones, registro):
    registros = []
    with open(registro, "r", encoding="utf-8") as f:
        for linea in f:
            partes = linea.strip().split("\t")
            if len(partes) < 6:
                continue
            if partes[3] == "market" and partes[4] in acciones:
                registros.append(partes)
    return registros

def analizar_bloques_balanceadores(jugador, acciones):
    from collections import defaultdict, Counter

    # 1. Ordenar acciones por fecha
    acciones_ordenadas = sorted(acciones, key=lambda x: parse_fecha(x[0]))

    # 2. Agrupar por día
    bloques_por_dia = defaultdict(list)
    bloque_actual = [acciones_ordenadas[0]]
    dia_actual = parse_fecha(acciones_ordenadas[0][0]).date()
    UMBRAL_SEGUNDOS = 55  # Puedes ajustar el umbral para definir "simultáneo"

    for i in range(1, len(acciones_ordenadas)):
        dt1 = parse_fecha(acciones_ordenadas[i-1][0])
        dt2 = parse_fecha(acciones_ordenadas[i][0])
        diff = abs((dt2 - dt1).total_seconds())
        dia2 = dt2.date()
        if dia2 != dia_actual or diff > UMBRAL_SEGUNDOS:
            bloques_por_dia[dia_actual].append(bloque_actual)
            bloque_actual = [acciones_ordenadas[i]]
            dia_actual = dia2
        else:
            bloque_actual.append(acciones_ordenadas[i])
    if bloque_actual:
        bloques_por_dia[dia_actual].append(bloque_actual)

    # 3. Precalcular todos los "Hasta sig. bloque" en segundos de TODOS los bloques de TODOS los días
    bloques_info = []  # [(dia, idx, hasta_sig, bloque, ...)]
    for dia, bloques in sorted(bloques_por_dia.items()):
        for idx, bloque in enumerate(bloques):
            dt_fin = parse_fecha(bloque[-1][0])
            if idx < len(bloques) - 1:
                dt_next = parse_fecha(bloques[idx+1][0][0])
                hasta_sig = (dt_next - dt_fin).total_seconds()
            else:
                hasta_sig = None
            bloques_info.append((dia, idx, hasta_sig, bloque))

    # Lista global de todos los hasta_sig (solo los que no son None)
    hasta_sig_global = [b[2] for b in bloques_info if b[2] is not None]

    # 4. Buscar patrones globales: para cada tiempo, contar cuántos otros están a ±5 minutos
    coincidencias_dict = {}
    for i, t in enumerate(hasta_sig_global):
        coincidencias = sum(
            1 for j, t2 in enumerate(hasta_sig_global)
            if i != j and abs(t2 - t) <= 300
        )
        coincidencias_dict[t] = coincidencias

    # 5. Detectar patrones frecuentes globales (por valor de hasta_sig)
    patrones_frecuentes = set()
    for t, coincidencias in coincidencias_dict.items():
        if coincidencias >= 5:  # Al menos 5 coincidencias
            patrones_frecuentes.add(t)

    # 6. Leyenda global
    leyenda_datos = None
    if patrones_frecuentes:
        base_valor = max(patrones_frecuentes, key=lambda t: coincidencias_dict[t])
        coincidencias = coincidencias_dict[base_valor]
        valores_patron = list(patrones_frecuentes)
        if valores_patron:
            media_valor = sum(valores_patron) / len(valores_patron)
            horas = int(media_valor // 3600)
            minutos = int((media_valor % 3600) // 60)
            segundos = int(media_valor % 60)
            media_valor_str = f"{horas}:{minutos:02}:{segundos:02}"
        else:
            media_valor_str = "-"
        if base_valor is not None:
            horas = int(base_valor // 3600)
            minutos = int((base_valor % 3600) // 60)
            segundos = int(base_valor % 60)
            base_valor_str = f"{horas}:{minutos:02}:{segundos:02}"
        else:
            base_valor_str = "-"
        leyenda_datos = (coincidencias, base_valor_str, media_valor_str)

    # 7. Mostrar tablas por día, coloreando según patrón global
    print("═" * 120)
    print(f"👤 Jugador: {jugador} - {len(acciones)} registros de balanceadores agrupados por días y bloques")
    print("═" * 120)
    for dia, bloques in sorted(bloques_por_dia.items()):
        print(f"\n📅 Día: {dia.strftime('%d.%m.%Y')}")
        print(f"{'Bloque':>6} │ {'Inicio':^19} │ {'Fin':^19} │ {'Registros':^10} │ {'Duración':^10} │ {'Hasta sig. bloque':^20} │ {'Acciones':<15} │ {'CID(s)':<15}")
        print("─" * 120)
        for idx, bloque in enumerate(bloques):
            dt_inicio = parse_fecha(bloque[0][0])
            dt_fin = parse_fecha(bloque[-1][0])
            duracion = dt_fin - dt_inicio
            duracion_str = str(duracion)
            if idx < len(bloques) - 1:
                dt_next = parse_fecha(bloques[idx+1][0][0])
                hasta_sig = (dt_next - dt_fin)
                hasta_sig_seg = hasta_sig.total_seconds()
                hasta_sig_str = str(hasta_sig)
            else:
                hasta_sig_seg = None
                hasta_sig_str = "-"
            acciones_tipo = set(partes[4] for partes in bloque if len(partes) > 4)
            cids = set(partes[6] if len(partes) > 6 else "-" for partes in bloque)
            cids_str = ", ".join(sorted(cids))
            fila = f"{idx+1:>6} │ {dt_inicio.strftime('%d.%m.%Y %H:%M:%S'):^19} │ {dt_fin.strftime('%d.%m.%Y %H:%M:%S'):^19} │ {len(bloque):^10} │ {duracion_str:^10} │ {hasta_sig_str:^20} │ {', '.join(acciones_tipo):<15} │ {cids_str:<15}"
            if hasta_sig_seg is not None and any(abs(hasta_sig_seg - t) <= 300 for t in patrones_frecuentes):
                print(color_texto(fila, "verde"))
            else:
                print(fila)
        print("─" * 120)
    # Mostrar la leyenda al final, si hay datos
    print("\n" + "═" * 60)
    print("📊 Leyenda de colores:")
    print("  🟩 Los bloques resaltados en verde tienen un tiempo hasta el siguiente bloque que coincide con un patrón frecuente (±5 minutos).")
    print("  Un patrón frecuente indica posible automatización si se repite muchas veces el mismo intervalo entre bloques.")
    if leyenda_datos:
        coincidencias, base_valor_str, media_valor_str = leyenda_datos
        print(
            f"  🟩 {color_texto(str(coincidencias), 'verde')} coincidencias encontradas para el valor base "
            f"{color_texto(base_valor_str, 'verde')} (±5 minutos)"
        )
        print(
            f"  📈 Media de los valores resaltados: {color_texto(media_valor_str, 'verde')}"
        )
    print("═" * 60)
    print("\nPuedes introducir el número de bloque para ver los registros detallados de ese bloque, o pulsa Enter para volver.")
    # 8. Permitir ver detalles de un bloque
    while True:
        opcion = input("Número de bloque a ver en detalle (o Enter para salir): ").strip()
        if opcion == "" or opcion == "0":
            break
        if not opcion.isdigit():
            print("❌ Opción inválida.")
            continue
        num_bloque = int(opcion)
        bloques_flat = []
        for dia, bloques in sorted(bloques_por_dia.items()):
            for bloque in bloques:
                bloques_flat.append((dia, bloque))
        if 1 <= num_bloque <= len(bloques_flat):
            dia, bloque = bloques_flat[num_bloque - 1]
            print(f"\n📦 Detalle del bloque {num_bloque} del día {dia.strftime('%d.%m.%Y')}:")
            print(f"{'Nº':>3} │ {'Fecha':^12} │ {'Hora':^8} │ {'Pueblo':<30} │ {'Acción':<15} │ {'CID':<12}")
            print("─" * 100)
            for idx, partes in enumerate(bloque, 1):
                try:
                    fecha = parse_fecha(partes[0])
                    fecha_str = fecha.strftime("%d.%m.%Y")
                    hora_str = fecha.strftime("%H:%M:%S")
                except Exception:
                    fecha_str = partes[0]
                    hora_str = ""
                pueblo = partes[2] if len(partes) > 2 else "-"
                accion = partes[4] if len(partes) > 4 else "-"
                cid = partes[6] if len(partes) > 6 else "-"
                print(f"{idx:>3} │ {fecha_str:^12} │ {hora_str:^8} │ {pueblo:<30} │ {accion:<15} │ {cid:<12}")
            print("─" * 100)
            input("Pulsa Enter para volver a la tabla de bloques...")
        else:
            print("❌ Opción fuera de rango.")