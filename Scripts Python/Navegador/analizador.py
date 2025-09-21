import os
import streamlit as st
import utils.config
from funciones.registro import *
from funciones.coincidencias import *
from funciones.players import *
from funciones.market import *
from funciones.especificas import *
from funciones.bans import fetch_and_save_bans_background
import time

# --- ESTILOS PERSONALIZADOS (coloca todos los style aquí, sin duplicados) ---
st.markdown("""
<style>
/* Fondo general de la app */
.stApp {
    background-color: #e4eadd !important;
}
/* Fondo y color del sidebar */
section[data-testid="stSidebar"] {
    position: relative;
    background-image:
        linear-gradient(rgba(35,57,77,0.85), rgba(35,57,77,0.85)),
        url('https://media.innogamescdn.com/TribalWars/wallpapers/desktop/TribalWarsWallpaper_4_1920x1200.jpg');
    background-repeat: no-repeat;
    background-position: left center;
    background-size: cover;
    background-attachment: fixed;
    color: #fff !important;
    padding-top: 0rem !important;
}
section[data-testid="stSidebar"] * {
    color: #fff !important;
}
section[data-testid="stSidebar"] > div:first-child {
    padding-top: 0rem !important;
}
/* Reduce espacio arriba en el contenido principal */
.block-container {
    padding-top: 1.5rem !important;
}
/* Oculta header y footer */
header {visibility: hidden;}
footer {visibility: hidden;}
/* Estilo para los labels de los radios */
label[for^="radio-mundo_radio"], label[for^="radio-opcion"] {
    font-weight: bold !important;
    text-shadow: 2px 2px 8px #000 !important;
}
/* Estilo para los títulos de los radios en la sidebar */
div[data-testid="stSidebar"] label {
    font-weight: bold !important;
    text-shadow: 2px 2px 8px #000 !important;
    font-size: 1.15rem !important;
}
</style>
""", unsafe_allow_html=True)

# --- INICIALIZACIÓN DEL ESTADO DE CANCELACIÓN ---
if "cancelar_actualizacion" not in st.session_state:
    st.session_state.cancelar_actualizacion = False

if "bans_background_started" not in st.session_state:
    fetch_and_save_bans_background()
    st.session_state["bans_background_started"] = True

st.set_page_config(page_title="Analizador de Guerras Tribales", layout="wide")

# Título principal (solo uno, no duplicar)
st.markdown("""
<div style='
    background: linear-gradient(rgba(35,57,77,0.95), rgba(35,57,77,0.95));
    border-radius: 18px;
    padding: 1.2rem 0.5rem 1.2rem 0.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 24px 0 rgba(0,0,0,0.25);
    text-align: center;
'>
    <span style="font-size:2.7rem; color:#fff; text-shadow: 2px 2px 8px #000;">
        🔍 <span style="color:#e53935;">Analizador</span> de Registros de <span style="color:#e53935;">Guerras Tribales</span>
    </span>
</div>
""", unsafe_allow_html=True)

st.markdown("""
<h2 style="
    background-image: url('https://www.gamesjobsdirect.com/assets/employer-images/e62e11e672bb4d929a6af5fcf760fc41.jpg');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center center;
    color: white;
    width: 1200px;
    height: 300px;
    border-radius: 18px;
    text-shadow: 2px 2px 8px #000;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    box-shadow: 0 4px 24px 0 rgba(0,0,0,0.25);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.7rem;
    font-weight: bold;
    margin-left: auto;
    margin-right: auto;
">
</h2>
""", unsafe_allow_html=True)

st.markdown("""
Este asistente te permite analizar registros globales, buscar incidencias por jugador, detectar patrones automáticos, revisar conexiones compartidas y mucho más.
Esta herramienta te permite analizar y explorar los registros de Guerras Tribales de forma avanzada y visual.
Usa el menú lateral para acceder a cada función.
""")

# Selección de mundo en la sidebar con título personalizado
st.sidebar.markdown("""
<div style='text-align:center; margin-bottom: 0.5rem;'>
    <span style="font-size:2.2rem; font-weight:bold; letter-spacing:1px; text-shadow: 2px 2px 8px #000;">
        <span style="color:#e53935;">Guerras</span>
        <span style="color:#2196f3;">Tribales</span>
    </span>
</div>
""", unsafe_allow_html=True)

# Selección de mundo en la sidebar con radio
mundos_disponibles = ["es94", "es93", "es92", "esp15", "esc3", "esp14", "esp13", "ess1"]

mundo_seleccionado = st.sidebar.radio(
    "🌍 Selecciona el mundo a analizar:",
    mundos_disponibles,
    index=0,
    key="mundo_radio"
)
utils.config.WORLD = mundo_seleccionado
st.sidebar.success(f"🌍 Analizando el mundo {utils.config.WORLD}")

# Menú principal
opcion = st.sidebar.radio(
    "¿Qué analizamos?",
    [
        "Inicio",
        "Análisis de Registros Global",
        "Análisis por Jugador",
        "Análisis de Conexiones Compartidas",
        "Análisis de Cookies",
        "Bot Detection",
        "Baneos",
        "Salir"
    ]
)

if opcion == "Inicio":
    st.markdown("""
    <div style='
        background: rgba(35,57,77,0.90);
        border-radius: 16px;
        padding: 1.5rem 1.5rem 1.5rem 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18);
        color: #fff;
        font-size: 1.12rem;
    '>
    <p>
        
    </p>
    <ul style="line-height:1.8;">
        <li>
            <b style="color:#4caf50;">Análisis de Registros Global</b>:<br>
            Descarga, actualiza y analiza todos los registros globales del mundo seleccionado. Puedes filtrar por páginas, cancelar la descarga y realizar análisis automáticos como:
            <ul>
                <li><b>Coincidencias</b>: Busca patrones sospechosos y coincidencias entre jugadores.</li>
                <li><b>Farms</b>: Analiza actividades de farmeo y posibles bots.</li>
                <li><b>Market</b>: Revisa movimientos y patrones en el mercado.</li>
                <li><b>Snob</b>: Estudia el uso de nobles y conquistas.</li>
                <li><b>Patrones Globales</b>: Detecta comportamientos anómalos a gran escala.</li>
            </ul>
        </li>
        <li>
            <b style="color:#4caf50;">Análisis por Jugador</b>:<br>
            Introduce el nombre de un jugador para ver todos sus registros, actividades, conexiones y posibles incidencias detectadas.
        </li>
        <li>
            <b style="color:#4caf50;">Análisis de Conexiones Compartidas</b>:<br>
            (Próximamente) Descubre jugadores que comparten IP o dispositivos, útil para detectar multicuentas.
        </li>
        <li>
            <b style="color:#4caf50;">Análisis de Cookies</b>:<br>
            (Próximamente) Analiza cookies para identificar sesiones compartidas o sospechosas.
        </li>
        <li>
            <b style="color:#4caf50;">Bot Detection</b>:<br>
            (Próximamente) Herramienta para detectar patrones automáticos y posibles bots en el juego.
        </li>
        <li>
            <b style="color:#e53935;">Salir</b>:<br>
            Cierra el asistente de análisis.
        </li>
    </ul>
    <p style="margin-top:2rem; text-align:center; color:#b7e0a5;">
        ¡Selecciona una opción en el menú lateral para comenzar a explorar y analizar!
    </p>
    </div>
    """, unsafe_allow_html=True)

elif opcion == "Análisis de Registros Global":
    st.header("📄 Análisis de Registros Global")

    with st.container():
        col1, col2, col3, col4 = st.columns([2, 2, 2, 5])
        with col1:
            actualizar = st.button("🔄 Actualizar registros", use_container_width=True)
        with col2:
            cancelar = st.button("❌ Cancelar actualización", use_container_width=True)
        with col3:
            todas_las_paginas = st.checkbox("Todas las páginas", value=False)
        with col4:
            col_pag1, col_pag2 = st.columns([1, 1], gap="small")
            with col_pag1:
                pagina_inicial = st.number_input(
                    "Página inicial", min_value=1, value=1, step=1,
                    disabled=todas_las_paginas, label_visibility="visible"
                )
            with col_pag2:
                pagina_final = st.number_input(
                    "Página final", min_value=1, value=20, step=1,
                    disabled=todas_las_paginas, label_visibility="visible"
                )

    # Si se pulsa cancelar, activa el flag
    if cancelar:
        st.session_state.cancelar_actualizacion = True
        st.warning("⏹️ Actualización cancelada por el usuario.")

    # Solo ejecuta si no está cancelado
    if actualizar and not st.session_state.cancelar_actualizacion:
        if todas_las_paginas:
            guardar_registros_archivo(
                utils.config.get_registro_global()
            )
        else:
            guardar_registros_archivo(
                utils.config.get_registro_global()
            )
        # Mensaje temporal
        success_placeholder = st.empty()
        success_placeholder.success("Registros globales actualizados.")
        time.sleep(5)
        success_placeholder.empty()
        st.session_state.cancelar_actualizacion = False  # Resetea el flag tras terminar

    st.subheader("Selecciona un análisis global:")
    analisis = st.radio(
        "Tipo de análisis",
        ["Coincidencias", "Farms", "Market", "Snob", "Patrones Globales"]
    )
    if st.button("OK"):
        st.session_state["analisis_global_activo"] = analisis

    # Mostrar el análisis seleccionado si está activo
    if st.session_state.get("analisis_global_activo") == "Coincidencias":
        analizar_coincidencias_global(utils.config.get_registro_global())

    elif st.session_state.get("analisis_global_activo") == "Farms":
        analizar_farmeos_global()
        if st.button("Volver al menú global"):
            st.session_state["analisis_global_activo"] = None
    elif st.session_state.get("analisis_global_activo") == "Market":
        market()
        if st.button("Volver al menú global"):
            st.session_state["analisis_global_activo"] = None
    elif st.session_state.get("analisis_global_activo") == "Snob":
        analisis_snob(utils.config.get_registro_global())
        if st.button("Volver al menú global"):
            st.session_state["analisis_global_activo"] = None
    elif st.session_state.get("analisis_global_activo") == "Patrones Globales":
        otros_analisis()
        if st.button("Volver al menú global"):
            st.session_state["analisis_global_activo"] = None

elif opcion == "Análisis por Jugador":
    st.header("🔎 Análisis por Jugador")
    nombre = st.text_input("Introduce el nombre del jugador:")
    if nombre:
        buscar_jugador_por_nombre(nombre, preguntar_si_vacio=False)

elif opcion == "Análisis de Conexiones Compartidas":
    st.info("🔧 Análisis de Conexiones Compartidas aún no implementado. ¡Próximamente!")

elif opcion == "Análisis de Cookies":
    st.info("🔧 Análisis de Cookies aún no implementado. ¡Próximamente!")

elif opcion == "Bot Detection":
    st.info("🤖 Bot Detection aún no implementado. ¡Próximamente!")

elif opcion == "Baneos":
    st.header("🚫 Baneos")
    st.info("🔧 Análisis de baneos aún no implementado. ¡Próximamente!")

elif opcion == "Salir":
    st.stop()


