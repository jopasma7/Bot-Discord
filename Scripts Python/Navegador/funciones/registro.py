from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from utils.selenium import *
from utils.config import HEADERS, EXPECTED_HEADERS
from funciones.extra import *
import threading
import time
import concurrent.futures
import os
import streamlit as st
import requests

MAX_WORKERS = 3
REQUEST_DELAY = 0.5

def descargar_pagina(session, url, headers):
    resp = session.get(url, headers=headers)
    time.sleep(REQUEST_DELAY)
    return resp.text

def descargar_pagina_threadsafe(url, headers, cookies):
    with requests.Session() as s:
        s.headers.update(headers)
        s.cookies.update(cookies)
        resp = s.get(url)
        time.sleep(REQUEST_DELAY)
        return resp.text

def guardar_registros_archivo(archivo_registro, player_id=None, preguntar_paginas=True, pagina_inicial=None, pagina_final=None, cancelar_flag=None):
    descarga_terminada = threading.Event()
    # ...tu código...
    session = verificar_cookie_y_sesion()

    hoy = datetime.now()
    hace_7 = hoy - timedelta(days=7)
    start_date = hace_7.strftime("%Y-%m-%d")
    end_date = hoy.strftime("%Y-%m-%d")

    r = session.get(utils.config.get_action_url(), headers=HEADERS)
    soup = BeautifulSoup(r.text, "html.parser")

    csrf_meta = soup.find("meta", {"name": "csrf-token"})
    if not csrf_meta:
        st.error("No se encontró el token CSRF en la página.")
        st.stop()
    h_value = csrf_meta["content"]

    payload = {
        "start_date": start_date,
        "start_Hour": "00",
        "start_Minute": "00",
        "end_date": end_date,
        "end_Hour": "23",
        "end_Minute": "59",
        "player": player_id,
        "village_id": "",
        "cookie_id": "",
        "screen": "all",
        "action": "all",
        "h": h_value
    }

    # ====== Detectar número de páginas ======
    response = session.post(utils.config.get_action_url(), data=payload, headers=HEADERS)
    soup = BeautifulSoup(response.text, "html.parser")

    paginas = []
    for a in soup.find_all("a", class_="paged-nav-item", href=True):
        if "page=" in a["href"]:
            try:
                num = int(a.text.strip(" []"))
                paginas.append(num)
            except ValueError:
                continue
    total_paginas = max(paginas) if paginas else 1

    # --- NUEVO: Comportamiento según preguntar_paginas ---
    if preguntar_paginas and pagina_inicial is not None and pagina_final is not None:
        inicio, fin = int(pagina_inicial), int(pagina_final)
        # st.info(f"🔍 Se seleccionarán las páginas desde la {inicio} hasta la {fin} para la búsqueda.")
    else:
        inicio, fin = 1, total_paginas
        # st.info(f"🔍 Se descargarán TODAS las páginas del registro (1 a {total_paginas}).")

    lock = threading.Lock()

    # Si es PlayerLog.txt, borra el archivo previo antes de continuar
    if archivo_registro.endswith("PlayerLog.txt") and os.path.exists(archivo_registro):
        os.remove(archivo_registro)
        print("="*80)
        print(f"🗑️  Existe un fichero de registro antiguo. Vamos a empezar de nuevo.")
        print("="*80)

    # Leer todas las líneas actuales del archivo (si existe)
    lineas_existentes = set()
    if os.path.exists(archivo_registro):
        with open(archivo_registro, "r", encoding="utf-8") as f:
            lineas_existentes = set(linea.strip() for linea in f if linea.strip())

    def descargar_procesar_guardar(idx, url):
        if cancelar_flag and cancelar_flag():
            return
        if idx == 0:
            html = str(soup)
        else:
            html = descargar_pagina(session, url, HEADERS)
        if cancelar_flag and cancelar_flag():
            return

        soup_actual = BeautifulSoup(html, "html.parser")
        tables = soup_actual.find_all("table", class_="vis")
        print(f"Tablas encontradas: {len(tables)}")
        if len(tables) < 2:
            print("No se encontró la tabla de registros esperada. ¿Sesión caducada o HTML inesperado?")
            return
        result_table = get_table_with_headers(tables, EXPECTED_HEADERS)
        if result_table is None:
            print("No se encontró la tabla con los encabezados esperados.")
            return
        lineas = []
        for tr in result_table.find_all("tr")[1:]:
            if cancelar_flag and cancelar_flag():
                return
            tds = tr.find_all("td")
            if not tds:
                continue
            fila = []
            for td in tds:
                a = td.find("a")
                fila.append(a.get_text(strip=True) if a else td.get_text(strip=True))
            registro_linea = '\t'.join(fila)
            lineas.append(registro_linea.strip())
        # Verifica si TODOS los registros de la página ya están en el archivo
        if lineas and all(linea in lineas_existentes for linea in lineas):
            print(f"🔄 Todos los registros de la página {idx+1} ya estaban almacenados, pasamos al siguiente.")
            return
        # Guarda solo los que no estén
        nuevos = [linea + "\n" for linea in lineas if linea not in lineas_existentes]
        if nuevos:
            # --- CREA EL DIRECTORIO SI NO EXISTE ---
            os.makedirs(os.path.dirname(archivo_registro), exist_ok=True)
            with lock:
                with open(archivo_registro, "a", encoding="utf-8") as f:
                    f.writelines(nuevos)
        print(f"✅ Página {idx+1} descargada y guardada ({len(nuevos)} registros nuevos)")
        if idx != 0:
            print(f"URL descargada: {url}")
            print(f"Primeros 200 caracteres del HTML:\n{html[:200]}")

    # Prepara las URLs de todas las páginas a descargar
    urls = []
    for pagina in range(inicio - 1, fin):
        if pagina == 0:
            urls.append(None)  # La primera ya la tienes en soup/response
        else:
            urls.append(f"{utils.config.get_next_page_url()}{pagina}")

    # Guarda las cookies y headers para los hilos
    cookies = session.cookies.get_dict()
    headers = HEADERS.copy()

    print(f"\n⏳ Iniciando descarga en paralelo de {len(urls)} páginas...")
    print(f"ℹ️  Usando {MAX_WORKERS} hilos y {REQUEST_DELAY}s de retardo entre peticiones para evitar lag en el servidor.")

    cancelar_valor = st.session_state.cancelar_actualizacion if hasattr(st.session_state, "cancelar_actualizacion") else False

    def descargar_procesar_guardar(idx, url, cancelar_valor):
        if cancelar_valor:
            return
        if idx == 0:
            html = str(soup)
        else:
            html = descargar_pagina_threadsafe(url, headers, cookies)
        if cancelar_valor:
            return

        soup_actual = BeautifulSoup(html, "html.parser")
        tables = soup_actual.find_all("table", class_="vis")
        if len(tables) < 2:
            print("No se encontró la tabla de registros esperada. ¿Sesión caducada o HTML inesperado?")
            return
        result_table = get_table_with_headers(tables, EXPECTED_HEADERS)
        if result_table is None:
            print("No se encontró la tabla con los encabezados esperados.")
            return
        lineas = []
        for tr in result_table.find_all("tr")[1:]:
            if cancelar_valor:
                return
            tds = tr.find_all("td")
            if not tds:
                continue
            fila = []
            for td in tds:
                a = td.find("a")
                fila.append(a.get_text(strip=True) if a else td.get_text(strip=True))
            registro_linea = '\t'.join(fila)
            lineas.append(registro_linea.strip())
        if lineas and all(linea in lineas_existentes for linea in lineas):
            print(f"🔄 Todos los registros de la página {idx+1} ya estaban almacenados, pasamos al siguiente.")
            return
        nuevos = [linea + "\n" for linea in lineas if linea not in lineas_existentes]
        if nuevos:
            os.makedirs(os.path.dirname(archivo_registro), exist_ok=True)
            with lock:
                with open(archivo_registro, "a", encoding="utf-8") as f:
                    f.writelines(nuevos)
        print(f"✅ Página {idx+1} descargada y guardada ({len(nuevos)} registros nuevos)")

    # Antes de lanzar los hilos
    progress_bar = st.progress(0, text="Descargando páginas...")
    paginas_descargadas = 0
    paginas_total = len(urls)
    progress_lock = threading.Lock()

    # Descarga y guardado en paralelo (seguro)
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_idx = {
            executor.submit(descargar_procesar_guardar, idx, url, cancelar_valor): idx
            for idx, url in enumerate(urls)
        }
        try:
            for future in concurrent.futures.as_completed(future_to_idx):
                try:
                    future.result()
                except Exception as e:
                    print(f"❌ Error en hilo: {e}")
                with progress_lock:
                    paginas_descargadas += 1
                    progress_bar.progress(
                        paginas_descargadas / paginas_total,
                        text=f"Descargando páginas... ({paginas_descargadas}/{paginas_total})"
                    )
                if cancelar_flag and cancelar_flag():
                    print("\n⏹️  Descarga cancelada por el usuario.")
                    break
        except KeyboardInterrupt:
            print("\n⏹️  Descarga cancelada por el usuario (KeyboardInterrupt).")

    # Al finalizar, muestra el mensaje y oculta la barra tras 5 segundos
    progress_bar.progress(1.0, text="✅ Descarga finalizada")
    time.sleep(15)
    progress_bar.empty()

    print("ℹ️  Descarga finalizada. Continuando ejecución...\n")

    # Ordenar el archivo por timestamp
    print("\n⚠️  Se va a reordenar el archivo... Por favor, espera un momento.")
    ordenar_registro_por_timestamp(archivo_registro)

    print("\n======================================================================")
    print(f"✅ Se han guardado los registros seleccionados en {archivo_registro}")
    print("======================================================================\n")


def ordenar_registro_por_timestamp(archivo_registro):
    with open(archivo_registro, "r", encoding="utf-8") as f:
        lineas = f.readlines()
    # Eliminar duplicados exactos
    lineas_unicas = list(set(lineas))
    # Ordenar por la columna de fecha/hora (partes[0])
    lineas_ordenadas = sorted(
        lineas_unicas,
        key=lambda linea: datetime.strptime(linea.split("\t")[0], "%d.%m.%y %H:%M:%S"),
        reverse=True  # <--- Esto invierte el orden: más recientes primero
    )
    with open(archivo_registro, "w", encoding="utf-8") as f:
        for linea in lineas_ordenadas:
            f.write(linea)
