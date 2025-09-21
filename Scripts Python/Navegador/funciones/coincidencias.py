import re, os
import utils.config
from collections import defaultdict
from funciones.extra import color_texto
import streamlit as st

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
                    if pantalla in ("crm", "tracking", "settings", "forum_api", "api", "botcheck"):
                        continue
                    if accion in ("quests_complete", "add_target", "dockVillagelist", "toggle_reserve_village", "delete_one", "del_one", "set_page_size"):
                        continue
                    ocurrencias[(timestamp, jugador)].append((pantalla, accion, linea))

    coincidencias_por_jugador = defaultdict(list)
    for (timestamp, jugador), acciones in ocurrencias.items():
        pantallas = set(p for p, _, _ in acciones)
        if len(acciones) > 1 and len(pantallas) > 1:
            coincidencias_por_jugador[jugador].append((timestamp, acciones))
    return coincidencias_por_jugador

def analizar_coincidencias_simple(archivo_registro):
    coincidencias_por_jugador = obtener_coincidencias(archivo_registro)

    if not coincidencias_por_jugador:
        st.success("✅ No se encontraron coincidencias con pantallas distintas en el mismo segundo.")
        return

    jugadores = sorted(coincidencias_por_jugador.keys())
    jugador_sel = st.selectbox("Selecciona un jugador para ver coincidencias:", jugadores)
    if jugador_sel:
        coincidencias = coincidencias_por_jugador[jugador_sel]
        for ts, acciones in coincidencias:
            st.markdown(f"**{ts}**")
            for pantalla, accion, linea in acciones:
                st.code(linea)

def analizar_coincidencias_global(archivo_registro=None):
    # Solo recalcula si no está en session_state o si el archivo ha cambiado
    if "coincidencias_por_jugador" not in st.session_state or st.session_state.get("archivo_registro") != archivo_registro:
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
                    if pantalla in ("crm", "tracking", "settings" , "forum_api", "api", "botcheck"):
                        continue
                    if accion in ("quests_complete", "add_target", "dockVillagelist", "toggle_reserve_village", "delete_one" ,"del_one" ,"set_page_size"):
                        continue
                    registros[(timestamp, jugador)].append((pantalla, accion, linea))
        except FileNotFoundError:
            st.error(f"No se encontró el archivo {archivo_registro}.")
            return

        # Agrupar coincidencias por jugador
        coincidencias_por_jugador = defaultdict(list)
        for (timestamp, jugador), acciones in registros.items():
            pantallas = set(p for p, _, _ in acciones)
            if len(acciones) > 1 and len(pantallas) > 1:
                coincidencias_por_jugador[jugador].append((timestamp, acciones))

        jugadores = sorted(coincidencias_por_jugador.keys())

        st.session_state["coincidencias_por_jugador"] = coincidencias_por_jugador
        st.session_state["jugadores"] = jugadores
        st.session_state["archivo_registro"] = archivo_registro
    coincidencias_por_jugador = st.session_state["coincidencias_por_jugador"]
    jugadores = st.session_state["jugadores"]

    if not coincidencias_por_jugador:
        st.success("✅ No se encontraron coincidencias de mismo jugador, mismo segundo y pantallas distintas.")
        return

    jugadores = sorted(coincidencias_por_jugador.keys())

    # --- NUEVO: Obtener estado de ban de cada jugador ---
    global cache_estado_ban
    estado_ban_jugadores = {}
    with st.spinner("⏳ Consultando estado de BAN de los jugadores, espera unos segundos..."):
        from funciones.players import obtener_estado_ban
        for jugador in jugadores:
            if jugador in cache_estado_ban:
                ban_status, fecha_exp = cache_estado_ban[jugador]
            else:
                ban_status, fecha_exp = obtener_estado_ban(jugador)
                cache_estado_ban[jugador] = (ban_status, fecha_exp)
            estado_ban_jugadores[jugador] = (ban_status, fecha_exp)

    # Mostrar menú de jugadores con estado de ban
    jugadores_labels = []
    for jugador in jugadores:
        n = len(coincidencias_por_jugador[jugador])
        ban_status, fecha_exp = estado_ban_jugadores.get(jugador, (None, None))
        if ban_status == "permanente":
            label = f"🛑 {jugador} ({n} coincidencias) [BAN PERMANENTE]"
        elif ban_status == "temporal":
            label = f"⏳ {jugador} ({n} coincidencias) [BAN TEMPORAL → {fecha_exp}]"
        else:
            label = f"{jugador} ({n} coincidencias)"
        jugadores_labels.append(label)

    # Solo un selectbox, usando los labels bonitos
    if "jugador_sel" not in st.session_state:
        st.session_state["jugador_sel"] = jugadores_labels[0]

    # Crear un mapeo de label a nombre real
    label_to_jugador = {label: jugador for label, jugador in zip(jugadores_labels, jugadores)}

    jugador_label = st.selectbox(
        "Selecciona un jugador para ver coincidencias:",
        jugadores_labels,
        key="jugador_sel"
    )

    jugador_real = label_to_jugador[jugador_label]
    coincidencias = coincidencias_por_jugador[jugador_real]
    for ts, acciones in coincidencias:
        st.markdown(f"**{ts}**")
        pantallas_unicas = list(sorted(set(p for p, _, _ in acciones)))
        st.markdown(f"🎯 Pantallas implicadas: {', '.join(pantallas_unicas)}")
        for pantalla, accion, linea in acciones:
            st.code(linea)