import streamlit as st
from utils.selenium import *
from utils.config import COOKIES_FILE
from funciones.extra import *
from funciones.coincidencias import analizar_coincidencias_simple
from funciones.registro import *
from funciones.resumen import *
from funciones.recursos import *
import requests
import pandas as pd

headers = {"User-Agent": "Mozilla/5.0"}

def iniciar_sesion():
    session = requests.Session()
    headers = {"User-Agent": "Mozilla/5.0"}
    if COOKIES_FILE:
        try:
            cookies_dict = load_cookies()
            if cookies_dict:
                session.cookies.update(cookies_dict)
                if verify_cookies(session, headers):
                    return session
                else:
                    st.warning("❌ Cookie caducada o inválida. Iniciando login con Selenium...")
                    selenium_login_and_save_cookies()
                    cookies_dict = load_cookies()
                    session.cookies.update(cookies_dict)
                    if verify_cookies(session, headers):
                        st.success("✅ Cookie válida tras login Selenium.")
                        return session
                    else:
                        st.error("❌ No se pudo autenticar. Saliendo.")
                        return None
            else:
                st.warning("No hay cookies guardadas. Iniciando login con Selenium...")
                selenium_login_and_save_cookies()
                cookies_dict = load_cookies()
                session.cookies.update(cookies_dict)
                if verify_cookies(session, headers):
                    st.success("✅ Cookie válida tras login Selenium.")
                    return session
                else:
                    st.error("❌ No se pudo autenticar. Saliendo.")
                    return None
        except ImportError:
            st.warning("No se encontró el módulo para gestionar cookies. Se usará sesión sin cookies.")
    else:
        st.warning("Las cookies no están disponibles.")
    return session

def buscar_jugador_por_nombre(player_name=None, preguntar_si_vacio=True):
    if preguntar_si_vacio and not player_name:
        player_name = st.text_input("Introduce el nombre del jugador a buscar:")
        if not player_name:
            st.warning("No se introdujo ningún nombre.")
            return
    headers = {"User-Agent": "Mozilla/5.0"}
    payload = {
        "multi_name": player_name,
        "action": "search_user_by_name"
    }
    session = iniciar_sesion()
    if not session:
        st.error("No se pudo iniciar sesión.")
        return
    response = session.get(utils.config.get_top_1000_url(), params=payload, headers=headers)
    if response.status_code == 200:
        st.success(f"🔍 Búsqueda realizada para el jugador '{player_name}'.")
        mostrar_info_jugador(response.text)
        menu_player_streamlit(player_name)
    else:
        st.error("❌ Error al buscar el jugador. La página no se encontró o no se pudo acceder.")
        return None

def mostrar_info_jugador(html):
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    tabla = soup.find("table", class_="vis player_info")
    if not tabla:
        st.warning("No se encontró la tabla de información del jugador.")
        return

    # Extraer nombre e ID y otros campos relevantes
    nombre = None
    player_id = None
    info = {}
    campos_mostrar = ["VIP", "E-Mail", "Language", "Start date", "Tribe"]
    for th in tabla.find_all("th"):
        span = th.find("span", style=True)
        if span:
            nombre = span.text.strip()
    for tr in tabla.find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) == 2:
            clave = tds[0].get_text(strip=True).replace(":", "")
            valor = tds[1].get_text(strip=True)
            if clave == "ID":
                player_id = valor
            if clave in campos_mostrar:
                info[clave] = valor

    st.markdown("### 👤 Información del jugador")
    st.write(f"**Jugador:** {nombre if nombre else 'Desconocido'}")
    st.write(f"**ID:** {player_id if player_id else 'N/A'}")
    for campo in campos_mostrar:
        emoji = {
            "VIP": "💎",
            "E-Mail": "📧",
            "Language": "🌐",
            "Start date": "📅",
            "Tribe": "🛡️"
        }.get(campo, "")
        st.write(f"{emoji} **{campo}:** {info.get(campo, '')}")

    # Buscar la tabla de cookies (la tabla interna con encabezado "Cookie")
    tabla_cookies = None
    for t in tabla.find_all("table", class_="vis"):
        encabezados = [th.get_text(strip=True) for th in t.find_all("th")]
        if "Cookie" in encabezados:
            tabla_cookies = t
            break

    if tabla_cookies:
        st.markdown("#### 🍪 Cookies asociadas:")
        headers = [th.get_text(strip=True) for th in tabla_cookies.find_all("th")]
        filas = []
        for tr in tabla_cookies.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if tds:
                fila = [td.get_text(" ", strip=True) for td in tds]
                filas.append(fila)
        df = pd.DataFrame(filas, columns=headers)
        st.dataframe(df)
        guardar_registros_archivo(utils.config.get_registro_simple(), player_id, False)
    else:
        st.warning("No se encontró la tabla de cookies para este jugador.")

def menu_player_streamlit(player_name=None):
    st.markdown(f"## 🔎 Menú de análisis para el jugador: **{player_name}**")
    opciones = [
        "Ver Análisis Global de Incidencias",
        "Incidencias por Coincidencias de Acciones",
        "Incidencias por Granjeo",
        "Incidencias por Recolección",
        "Incidencias por Desbloqueo de Recolección",
        "Próximamente...",
        "Detección de Bots"
    ]
    opcion = st.radio("Selecciona una opción:", opciones, index=0)
    if opcion == "Ver Análisis Global de Incidencias":
        analisis_completo(utils.config.get_registro_simple())
    elif opcion == "Incidencias por Coincidencias de Acciones":
        analizar_coincidencias_simple(utils.config.get_registro_simple())
    elif opcion == "Incidencias por Granjeo":
        st.info("🤖 Análisis aún no implementado. ¡Próximamente!")
        #analizar_farmeos()
    elif opcion == "Incidencias por Recolección":
        st.info("🤖 Análisis aún no implementado. ¡Próximamente!")
        #analizar_reco()
    elif opcion == "Incidencias por Desbloqueo de Recolección":
        analizar_unlock_reco(utils.config.get_registro_simple())
    elif opcion == "Próximamente...":
        st.info("🤖 Análisis aún no implementado. ¡Próximamente!")
    elif opcion == "Detección de Bots":
        st.info("🤖 Análisis aún no implementado. ¡Próximamente!")

