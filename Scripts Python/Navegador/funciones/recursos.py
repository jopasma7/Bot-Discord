import streamlit as st
from datetime import datetime, timedelta
import os
import re
import utils.config

def analizar_farmeos_global():
    st.header("🌾 Análisis global de farmeos y recolecciones")

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

    opciones = {
        "Farmeos (am_farm)": farm_global,
        "Recolección (scavenge_)": reco_global,
        "Unlock Recolección": reco_unlock_global
    }
    st.subheader("Selecciona el tipo de acción a analizar:")
    opcion = st.radio(
        "Tipo de acción",
        list(opciones.keys()),
        format_func=lambda x: f"{x} ({len(opciones[x])} registros)"
    )

    if opcion:
        mostrar_menu_por_jugador(opciones[opcion], opcion)

def mostrar_menu_por_jugador(registros, titulo, tipo=None):
    from datetime import datetime
    import pandas as pd

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

    # Solo los 50 primeros jugadores con más bloques
    jugadores_bloques = [
        (jugador, acciones, contar_bloques(acciones))
        for jugador, acciones in jugadores.items()
    ]
    jugadores_ordenados = sorted(jugadores_bloques, key=lambda x: x[2], reverse=True)[:50]
    jugadores_lista = [jugador for jugador, _, _ in jugadores_ordenados]

    st.markdown(f"### 📋 {titulo} por jugador (máx. 50)")
    jugador_sel = st.selectbox("Selecciona un jugador para ver sus bloques:", jugadores_lista)
    if jugador_sel:
        acciones = next(acciones for jugador, acciones, _ in jugadores_ordenados if jugador == jugador_sel)
        mostrar_registros_jugador(jugador_sel, acciones, tipo or titulo)

def mostrar_registros_jugador(jugador, acciones, tipo):
    from datetime import timedelta
    import pandas as pd

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

    st.markdown(f"#### 👤 Jugador: {jugador} - {len(acciones_ordenadas)} {tipo} en {len(bloques)} bloques")

    # Mostrar resumen de bloques en tabla
    data = []
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
        data.append({
            "Bloque": idx,
            "Fecha": fecha_str,
            "Tiempo": tiempo_str,
            "Duración": duracion_str,
            "Pausa hasta sig.": pausa_str,
            "CID(s)": cid_str,
            "Acciones": len(bloque)
        })
    df = pd.DataFrame(data)
    st.dataframe(df)

    st.info(f"✅ Total: {len(bloques)} bloques.")
    if not acciones_ordenadas:
        st.warning(f"❌ No se encontraron registros válidos para {jugador}.")
        if errores:
            st.info(f"ℹ️  {len(errores)} registros no se pudieron interpretar (posible error de formato).")

def analizar_por_bloques(etiqueta, nombre, registro):
    st.header(f"🔍 Bloques continuos de pantalla: {etiqueta}")

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
        st.warning(f"❌ No se encontraron registros {etiqueta} válidos.")
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
    st.markdown(f"### 📊 Resumen de bloques ({tipo_resumen})")
    data = []
    for idx, bloque in enumerate(bloques, 1):
        inicio = bloque[0][0]
        fin = bloque[-1][0]
        duracion = int((fin - inicio).total_seconds())
        horas_dur, resto = divmod(duracion, 3600)
        min_dur, seg_dur = divmod(resto, 60)
        if horas_dur > 0:
            duracion_str = f"{horas_dur}h {min_dur}m {seg_dur}s"
        else:
            duracion_str = f"{min_dur}m {seg_dur}s"
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
        data.append({
            "Bloque": idx,
            "Fecha": inicio.strftime('%d.%m.%Y'),
            "Tiempo": tiempo_str,
            "Duración": duracion_str,
            "Pausa hasta sig.": pausa_str,
            "Acciones": len(bloque)
        })
    import pandas as pd
    df = pd.DataFrame(data)
    st.dataframe(df)
    st.info(f"✅ Total: {len(bloques)} bloques.")

def analizar_unlock_reco(registro):
    st.header("🔍 Desbloqueos de recolección")

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
        st.warning("❌ No se encontraron registros de desbloqueo de recolección válidos.")
        return

    registros.sort(key=lambda x: x[0])
    data = []
    for idx, (fecha, linea) in enumerate(registros, 1):
        fecha_str = fecha.strftime("%d.%m.%Y")
        hora_str = fecha.strftime("%H:%M:%S")
        data.append({
            "Nº": idx,
            "Fecha": fecha_str,
            "Hora": hora_str,
            "Detalles": linea
        })
    import pandas as pd
    df = pd.DataFrame(data)
    st.dataframe(df)
    st.info(f"✅ Total: {len(registros)} desbloqueos encontrados.")