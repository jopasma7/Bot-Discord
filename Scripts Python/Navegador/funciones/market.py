import streamlit as st
import utils.config
from datetime import datetime
from funciones.extra import color_texto
import pandas as pd

####################################################
##          MENÚ DE ANÁLISIS DE MERCADO           ##
####################################################
def market():
    st.header("📊 Menú de análisis de mercado")
    opciones = [
        "Análisis Global",
        "Análisis de Compra / Venta",
        "Análisis de Solicitudes",
        "Análisis de Balanceadores",
        "Análisis de Envíos Normales"
    ]
    opcion = st.radio("Selecciona una opción:", opciones)
    registro_global = utils.config.get_registro_global()

    if opcion == "Análisis Global":
        market_resumen_global(registro_global)
    elif opcion == "Análisis de Compra / Venta":
        market_exchanges(registro_global)
    elif opcion == "Análisis de Solicitudes":
        market_calls(registro_global)
    elif opcion == "Análisis de Balanceadores":
        market_map_sends(registro_global)
    elif opcion == "Análisis de Envíos Normales":
        market_sends(registro_global)

####################################################
###   FUNCIONES DE ANÁLISIS DE MERCADO GLOBAL    ###
####################################################
def market_resumen_global(registro):
    tipos = [
        ("exchanges (compra/venta)", {"exchange_confirm", "exchange_begin"}),
        ("solicitudes (call)", {"call"}),
        ("balanceadores (map_send)", {"map_send"}),
        ("envíos normales (send)", {"send"}),
    ]
    st.subheader("📊 Resumen Global de Mercado")
    resumen = []
    for nombre, acciones in tipos:
        registros = filtrar_registros_market(acciones, registro)
        jugadores = {}
        for partes in registros:
            jugador = partes[1]
            jugadores.setdefault(jugador, []).append(partes)
        total = sum(len(acciones) for acciones in jugadores.values())
        resumen.append({
            "Tipo": nombre.capitalize(),
            "Total registros": total,
            "Jugadores": len(jugadores)
        })
    df = pd.DataFrame(resumen)
    st.table(df)

def market_exchanges(registro):
    from collections import Counter, defaultdict

    registros = filtrar_registros_market({"exchange_confirm", "exchange_begin"}, registro)
    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:10]

    st.subheader("📋 Top 10 jugadores por exchanges (compra/venta)")
    jugadores_lista = [jugador for jugador, _ in jugadores_ordenados]
    jugador_sel = st.selectbox("Selecciona un jugador para ver patrones:", jugadores_lista)
    if jugador_sel:
        acciones = jugadores[jugador_sel]
        # Buscar patrones de exchange_begin seguido de exchange_confirm (1-5s después)
        patrones = []
        acciones_ordenadas = sorted(acciones, key=lambda x: datetime.strptime(x[0], "%d.%m.%y %H:%M:%S"), reverse=True)
        i = 0
        while i < len(acciones_ordenadas) - 1:
            actual = acciones_ordenadas[i]
            siguiente = acciones_ordenadas[i + 1]
            if (
                actual[2] == siguiente[2]
                and actual[6] == siguiente[6]
                and actual[4] != siguiente[4]
            ):
                if (
                    (actual[4] == "exchange_begin" and siguiente[4] == "exchange_confirm")
                    or (actual[4] == "exchange_confirm" and siguiente[4] == "exchange_begin")
                ):
                    t1 = datetime.strptime(actual[0], "%d.%m.%y %H:%M:%S")
                    t2 = datetime.strptime(siguiente[0], "%d.%m.%y %H:%M:%S")
                    diff = abs(int((t1 - t2).total_seconds()))
                    if 1 <= diff <= 5:
                        patrones.append((t1, t2, diff, actual[2], actual[6]))
                        i += 2
                        continue
            i += 1

        # Contar los tiempos 'x' (diferencia entre patrones consecutivos)
        tiempos_x = []
        patrones_ordenados = sorted(patrones, key=lambda x: x[0], reverse=True)
        for i in range(1, len(patrones_ordenados)):
            x = abs(int((patrones_ordenados[i-1][0] - patrones_ordenados[i][0]).total_seconds()))
            tiempos_x.append(x)
        resumen = []
        if tiempos_x:
            x_mas_comun, repeticiones = Counter(tiempos_x).most_common(1)[0]
            resumen.append({
                "Jugador": jugador_sel,
                "x más común (s)": x_mas_comun,
                "Repeticiones": repeticiones
            })
        st.markdown(f"#### 👤 Jugador: {jugador_sel} - {len(acciones)} exchanges")
        if resumen:
            st.table(pd.DataFrame(resumen))
        else:
            st.info("No se encontraron patrones de exchange_begin + exchange_confirm (1-5s) para este jugador.")

def market_calls(registro):
    registros = filtrar_registros_market({"call"}, registro)
    from collections import Counter

    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:20]
    jugadores_lista = [jugador for jugador, _ in jugadores_ordenados]
    st.subheader("📋 Top 20 jugadores por solicitudes (call)")
    jugador_sel = st.selectbox("Selecciona un jugador para ver bloques:", jugadores_lista)
    if jugador_sel:
        acciones = jugadores[jugador_sel]
        mostrar_bloques_call(jugador_sel, acciones)

def market_map_sends(registro):
    registros = filtrar_registros_market({"map_send"}, registro)
    mostrar_top_jugadores(registros, 20, "balanceadores (map_send)")

def market_sends(registro):
    registros = filtrar_registros_market({"send"}, registro)
    mostrar_top_jugadores(registros, 20, "envíos normales (send)")

###########################################################
###                 FUNCIONES INTERNAS                  ###
###########################################################
def mostrar_top_jugadores(registros, top=20, titulo="registros"):
    from collections import Counter

    jugadores = {}
    for partes in registros:
        jugador = partes[1]
        jugadores.setdefault(jugador, []).append(partes)
    jugadores_ordenados = sorted(jugadores.items(), key=lambda x: len(x[1]), reverse=True)[:top]
    jugadores_lista = [jugador for jugador, _ in jugadores_ordenados]
    st.subheader(f"📋 Top {top} jugadores por {titulo}")
    jugador_sel = st.selectbox(f"Selecciona un jugador para ver detalles ({titulo}):", jugadores_lista)
    if jugador_sel:
        acciones = jugadores[jugador_sel]
        mostrar_resumen_jugador_market(jugador_sel, acciones, titulo)

def mostrar_resumen_jugador_market(jugador, acciones, titulo):
    from collections import Counter
    st.markdown(f"#### 👤 Jugador: {jugador} - {len(acciones)} {titulo}")
    fechas = [a[0] for a in acciones]
    pueblos = [a[2] for a in acciones if len(a) > 2]
    acciones_tipo = [a[4] for a in acciones if len(a) > 4]
    resumen = {
        "Primer registro": fechas[-1] if fechas else '-',
        "Último registro": fechas[0] if fechas else '-',
        "Pueblos distintos": len(set(pueblos)),
        "Acciones distintas": ', '.join(set(acciones_tipo)),
        "Pueblo más frecuente": Counter(pueblos).most_common(1)[0][0] if pueblos else '-',
        "Acción más frecuente": Counter(acciones_tipo).most_common(1)[0][0] if acciones_tipo else '-'
    }
    st.table(pd.DataFrame([resumen]))
    data = []
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
        data.append({
            "Nº": idx,
            "Fecha": fecha_str,
            "Hora": hora_str,
            "Pueblo": pueblo,
            "Acción": accion,
            "CID": cid
        })
    st.dataframe(pd.DataFrame(data))

def mostrar_bloques_call(jugador, acciones):
    from collections import defaultdict

    acciones_ordenadas = sorted(acciones, key=lambda x: parse_fecha(x[0]))
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

    # Precalcular todos los "Hasta sig. bloque" en segundos de TODOS los bloques de TODOS los días
    bloques_info = []
    for dia, bloques in sorted(bloques_por_dia.items()):
        for idx, bloque in enumerate(bloques):
            dt_fin = parse_fecha(bloque[-1][0])
            if idx < len(bloques) - 1:
                dt_next = parse_fecha(bloques[idx+1][0][0])
                hasta_sig = (dt_next - dt_fin).total_seconds()
            else:
                hasta_sig = None
            bloques_info.append((dia, idx, hasta_sig, bloque))

    hasta_sig_global = [b[2] for b in bloques_info if b[2] is not None]
    coincidencias_dict = {}
    for i, t in enumerate(hasta_sig_global):
        coincidencias = sum(
            1 for j, t2 in enumerate(hasta_sig_global)
            if i != j and abs(t2 - t) <= 300
        )
        coincidencias_dict[t] = coincidencias

    patrones_frecuentes = set()
    for t, coincidencias in coincidencias_dict.items():
        if coincidencias >= 10:
            patrones_frecuentes.add(t)

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

    # Mostrar tablas por día
    st.markdown(f"#### 👤 Jugador: {jugador} - {len(acciones)} solicitudes (call) agrupadas por días y bloques")
    for dia, bloques in sorted(bloques_por_dia.items()):
        st.markdown(f"**📅 Día: {dia.strftime('%d.%m.%Y')}**")
        data = []
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
            color = ""
            if hasta_sig_seg is not None and hasta_sig_seg in patrones_frecuentes:
                color = "🟨"
            data.append({
                "Bloque": idx+1,
                "Inicio": bloque[0][0],
                "Fin": bloque[-1][0],
                "Registros": len(bloque),
                "Hasta sig. bloque": hasta_sig_str,
                "CID(s)": cids_str,
                "Patrón": color
            })
        st.dataframe(pd.DataFrame(data))

    if leyenda_datos:
        coincidencias, base_valor_str, media_valor_str = leyenda_datos
        st.markdown("**📊 Leyenda de colores:**")
        st.markdown(
            f"🟨 {coincidencias} coincidencias encontradas para el valor base {base_valor_str} (±5 minutos)<br>"
            f"📈 Media de los valores resaltados: {media_valor_str}",
            unsafe_allow_html=True
        )

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
def parse_fecha(fecha_str):
    for fmt in ("%d.%m.%y %H:%M:%S.%f", "%d.%m.%y %H:%M:%S"):
        try:
            return datetime.strptime(fecha_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Formato de fecha no reconocido: {fecha_str}")

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