import streamlit as st
from funciones.market import *
from datetime import datetime
import utils.config

def analisis_snob(registro):
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
    jugadores_lista = [jugador for jugador, _ in jugadores_ordenados]

    st.markdown("### 👑 Top 20 jugadores con más registros SNOB")
    if not jugadores_lista:
        st.info("No hay registros SNOB en el archivo.")
        return

    jugador_sel = st.selectbox("Selecciona un jugador para ver el detalle:", jugadores_lista)
    if jugador_sel:
        mostrar_registros_snob_coin(registro, jugador_filtrado=jugador_sel)

def tabla_snob_action(jugador, registros):
    import pandas as pd
    data = []
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
        data.append({
            "Nº": idx,
            "Fecha": fecha_str,
            "Hora": hora_str,
            "Pueblo": pueblo,
            "Acción": accion,
            "CID": cid
        })
    st.markdown(f"#### 👤 Jugador: {jugador} - {len(registros)} registros SNOB")
    st.dataframe(pd.DataFrame(data))

def mostrar_registros_snob_coin(registro, jugador_filtrado=None):
    from datetime import datetime, timedelta
    import collections
    import pandas as pd

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

    # Contar todas las diferencias exactas
    counter = collections.Counter(t for t in tiempos_hasta_sig if t is not None)
    top_times = counter.most_common()
    rojo_time, rojo_count = top_times[0] if top_times and top_times[0][1] > 20 else (None, 0)
    amarillo_time, amarillo_count = (top_times[1] if len(top_times) > 1 and top_times[1][1] > 20 else (None, 0))

    indices_rojo = {i for i, t in enumerate(tiempos_hasta_sig) if t == rojo_time}
    indices_amarillo = {i for i, t in enumerate(tiempos_hasta_sig) if t == amarillo_time}
    indices_verde = {i for i, t in enumerate(tiempos_hasta_sig) if t is not None and abs(t - patron) <= tolerancia}

    # Tabla visual en pandas
    data = []
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
        color = ""
        if rojo_time is not None and (idx - 1) in indices_rojo:
            color = "🟥"
        elif amarillo_time is not None and (idx - 1) in indices_amarillo:
            color = "🟨"
        elif (idx - 1) in indices_verde:
            color = "🟩"
        data.append({
            "Nº": idx,
            "Fecha": fecha_str,
            "Hora": hora_str,
            "Pueblo": pueblo,
            "Time Hasta el Sig": t_sig_str,
            "Acción": accion,
            "CID": cid,
            "Patrón": color
        })
    df = pd.DataFrame(data)
    st.markdown(f"#### 👤 Registros SNOB para {jugador_filtrado}")
    st.dataframe(df)

    # Leyenda y resumen
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

        st.markdown("**📊 Leyenda de colores:**")
        leyenda = []
        if rojo_time is not None:
            leyenda.append(f"🟥  {rojo_count} coincidencias exactas para el valor base {rojo_str} (mayor frecuencia, >20)")
        if amarillo_time is not None:
            leyenda.append(f"🟨  {amarillo_count} coincidencias exactas para el valor base {amarillo_str} (segunda frecuencia, >20)")
        leyenda.append(f"🟩  {len(indices_verde)} coincidencias resaltadas para el valor base {patron_str} (±1 minuto)")
        leyenda.append(f"📈  Media de los valores resaltados: {media_str}")
        st.markdown("<br>".join(leyenda))
    input("Pulsa Enter para continuar...")



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

