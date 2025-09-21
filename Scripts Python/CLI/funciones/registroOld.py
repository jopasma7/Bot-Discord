from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from utils.selenium import *
from utils.config import HEADERS, EXPECTED_HEADERS
from funciones.extra import *
import utils.config
import os
import time
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import queue

MAX_WORKERS = 3
REQUEST_DELAY = 0.5

def descargar_pagina(session, url, headers, es_post=False, post_data=None):
    if es_post and post_data:
        resp = session.post(url, headers=headers, data=post_data)
    else:
        resp = session.get(url, headers=headers)
    time.sleep(REQUEST_DELAY)
    return resp

def obtener_detalles_tabla(html_content):
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Buscar usando los headers esperados (la función profesional)
        tablas = soup.find_all('table')
        tabla_correcta = get_table_with_headers(tablas, EXPECTED_HEADERS)
        
        if tabla_correcta:
            tabla = tabla_correcta
        else:
            # Fallback: buscar tabla 'vis' con más registros
            tablas_vis = soup.find_all('table', class_='vis')
            if tablas_vis:
                # Usar la tabla vis con más filas (probablemente la de registros)
                tabla = max(tablas_vis, key=lambda t: len(t.find_all('tr')))
            else:
                return [], 0
        
        if not tabla:
            return [], 0

        filas = tabla.find_all('tr')
        if len(filas) <= 1:
            return [], 0
            
        # Excluir encabezados
        filas_datos = filas[1:]
        datos = []
        
        # Extraer datos normalmente (múltiples celdas por fila)
        for fila in filas_datos:
            celdas = fila.find_all(['td', 'th'])
            if len(celdas) >= 7:  # Esperamos 7 columnas según EXPECTED_HEADERS
                fila_datos = [celda.get_text(strip=True) for celda in celdas]
                if any(celda.strip() for celda in fila_datos):
                    datos.append(fila_datos)
            elif len(celdas) >= 4:  # Mínimo aceptable
                fila_datos = [celda.get_text(strip=True) for celda in celdas]
                if any(celda.strip() for celda in fila_datos):
                    datos.append(fila_datos)
        
        return datos, len(datos)
    except Exception as e:
        print(color_texto(f"❌ Error al procesar la tabla: {e}", "rojo"))
        return [], 0

def guardar_registros_archivo(mundo, detalles="", stop_event=None, player_id=None):
    try:
        # Crear un stop_event local si no se proporciona
        if stop_event is None:
            stop_event = threading.Event()
        
        # Configurar el mundo actual en config
        utils.config.WORLD = mundo
        
        session = verificar_cookie_y_sesion()
        if not session:
            print(color_texto("❌ No se pudo obtener una sesión válida", "rojo"))
            return False, 0

        # Determinar el archivo de destino según si es un jugador específico o registros globales
        if player_id:
            archivo_registro = utils.config.get_registro_simple()
            print(color_texto(f"🔍 Descargando registros específicos del jugador ID: {player_id}", "azul"))
            
            # Eliminar archivo existente para empezar limpio con el nuevo jugador
            if os.path.exists(archivo_registro):
                os.remove(archivo_registro)
                print(color_texto(f"🗑️ Archivo anterior eliminado para registros limpios del jugador", "amarillo"))
        else:
            archivo_registro = utils.config.get_registro_global()
            print(color_texto("📋 Descargando registros globales", "azul"))
            
        os.makedirs(os.path.dirname(archivo_registro), exist_ok=True)

        if stop_event.is_set():
            print(color_texto("⚠️ Descarga cancelada por el usuario", "amarillo"))
            return False, 0

        # EXACTAMENTE COMO EN NAVEGADOR
        hoy = datetime.now()
        hace_7 = hoy - timedelta(days=7)  # VOLVER A 7 días como navegador
        start_date = hace_7.strftime("%Y-%m-%d")
        end_date = hoy.strftime("%Y-%m-%d")

        print(color_texto(f"📅 Consultando registros desde {start_date} hasta {end_date} (7 días)", "azul"))

        r = session.get(f"https://{mundo}.guerrastribales.es/admintool/action_log.php?action=search", headers=HEADERS)
        soup = BeautifulSoup(r.text, "html.parser")

        csrf_meta = soup.find("meta", {"name": "csrf-token"})
        if not csrf_meta:
            print(color_texto("❌ No se encontró el token CSRF en la página", "rojo"))
            return False, 0
        h_value = csrf_meta["content"]

        payload = {
            "start_date": start_date,
            "start_Hour": "00",
            "start_Minute": "00",
            "end_date": end_date,
            "end_Hour": "23",
            "end_Minute": "59",
            "player": player_id if player_id else "",  # Incluir player_id si se proporciona
            "village_id": "",
            "cookie_id": "",
            "screen": "all",
            "action": "all",
            "h": h_value
        }

        # ====== Detectar número de páginas ======
        response = session.post(f"https://{mundo}.guerrastribales.es/admintool/action_log.php?action=search", data=payload, headers=HEADERS)
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

        inicio, fin = 1, total_paginas
        if player_id:
            print(color_texto(f"🔍 Se detectaron {total_paginas} páginas disponibles para el jugador {player_id}", "verde"))
            print(color_texto(f"📄 Se descargarán registros específicos del jugador (páginas 1 a {total_paginas}).", "amarillo"))
        else:
            print(color_texto(f"🔍 Se detectaron {total_paginas} páginas disponibles", "verde"))
            print(color_texto(f"📄 Se descargarán TODAS las páginas del registro (1 a {total_paginas}).", "amarillo"))
        print(color_texto(f"🚀 Procesamiento en paralelo: {MAX_WORKERS} hilos con {REQUEST_DELAY}s de delay", "cian"))
        print(color_texto("💡 Presiona ENTER para cancelar la descarga en cualquier momento", "azul"))

        lock = threading.Lock()

        # Leer todas las líneas actuales del archivo (si existe) - solo para registros globales
        lineas_existentes = set()
        if not player_id and os.path.exists(archivo_registro):
            with open(archivo_registro, "r", encoding="utf-8") as f:
                lineas_existentes = set(linea.strip() for linea in f if linea.strip())
        elif player_id:
            print(color_texto("🆕 Descarga limpia: se guardarán todos los registros del jugador", "cian"))

        # Configurar cancelación con hilo separado
        def verificar_cancelacion_individual():
            while not stop_event.is_set():
                try:
                    # Usar msvcrt para Windows ya que select no funciona con stdin en Windows
                    import msvcrt
                    if msvcrt.kbhit():
                        key = msvcrt.getch()
                        if key == b'\r':  # Enter en Windows
                            print(color_texto("\n⚠️ Cancelación solicitada. Guardando registros descargados...", "amarillo"))
                            stop_event.set()
                            break
                    time.sleep(0.1)
                except ImportError:
                    # Fallback para sistemas no Windows
                    try:
                        import select
                        import sys
                        if sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
                            entrada = input()
                            if entrada.strip() == "":
                                print(color_texto("\n⚠️ Cancelación solicitada. Guardando registros descargados...", "amarillo"))
                                stop_event.set()
                                break
                    except:
                        time.sleep(0.1)
                except:
                    time.sleep(0.1)
        
        # Solo iniciar hilo de cancelación si no existe ya uno global
        if not hasattr(stop_event, '_cancelacion_activa'):
            hilo_cancelacion = threading.Thread(target=verificar_cancelacion_individual, daemon=True)
            hilo_cancelacion.start()
            stop_event._cancelacion_activa = True

        def descargar_procesar_guardar(idx, url):
            nonlocal paginas_completadas, total_registros_nuevos
            
            if stop_event.is_set():
                return 0
            
            try:
                if idx == 0:
                    html = response.text  # Usar la respuesta del POST inicial
                else:
                    resp = descargar_pagina(session, url, HEADERS)
                    html = resp.text
                
                if stop_event.is_set():
                    return 0

                soup_actual = BeautifulSoup(html, "html.parser")
                tables = soup_actual.find_all("table", class_="vis")
                if len(tables) < 2:
                    print(color_texto(f"⚠️ No se encontró la tabla de registros esperada en página {idx+1}. ¿Sesión caducada?", "amarillo"))
                    return 0
                result_table = get_table_with_headers(tables, EXPECTED_HEADERS)
                if result_table is None:
                    print(color_texto(f"❌ No se encontró la tabla con encabezados esperados en página {idx+1}", "rojo"))
                    return 0
                
                lineas = []
                for tr in result_table.find_all("tr")[1:]:
                    if stop_event.is_set():
                        return 0
                    tds = tr.find_all("td")
                    if not tds:
                        continue
                    fila = []
                    for td in tds:
                        a = td.find("a")
                        fila.append(a.get_text(strip=True) if a else td.get_text(strip=True))
                    registro_linea = '\t'.join(fila)
                    lineas.append(registro_linea.strip())
                
                # Verifica si TODOS los registros de la página ya están en el archivo (solo para registros globales)
                if not player_id and lineas and all(linea in lineas_existentes for linea in lineas):
                    with lock:
                        paginas_completadas += 1
                        # Solo mostrar mensaje de omisión ocasionalmente para evitar spam
                        if paginas_completadas % (mostrar_cada_n_paginas * 3) == 0:
                            porcentaje = (paginas_completadas / len(urls)) * 100
                            barra_longitud = 30
                            progreso_barra = int((paginas_completadas / len(urls)) * barra_longitud)
                            barra = "█" * progreso_barra + "░" * (barra_longitud - progreso_barra)
                            print(color_texto(f"⏭️  [{barra}] {porcentaje:5.1f}% │ {paginas_completadas:3d}/{len(urls)} páginas │ Omitiendo duplicados...", "cian"))
                    return 0
                
                # Guarda los registros (todos si es jugador específico, solo nuevos si es global)
                if player_id:
                    # Para jugadores específicos, guardar todos los registros
                    registros_a_guardar = [linea + "\n" for linea in lineas]
                else:
                    # Para registros globales, guardar solo los que no estén
                    registros_a_guardar = [linea + "\n" for linea in lineas if linea not in lineas_existentes]
                
                if registros_a_guardar:
                    # --- CREA EL DIRECTORIO SI NO EXISTE ---
                    os.makedirs(os.path.dirname(archivo_registro), exist_ok=True)
                    with lock:
                        with open(archivo_registro, "a", encoding="utf-8") as f:
                            f.writelines(registros_a_guardar)
                        total_registros_nuevos += len(registros_a_guardar)
                        paginas_completadas += 1
                        
                        # Mostrar progreso de forma más limpia y profesional
                        porcentaje = (paginas_completadas / len(urls)) * 100
                        
                        # Crear barra de progreso visual
                        barra_longitud = 30
                        progreso_barra = int((paginas_completadas / len(urls)) * barra_longitud)
                        barra = "█" * progreso_barra + "░" * (barra_longitud - progreso_barra)
                        
                        # Mostrar mensaje detallado solo cada N páginas o en páginas importantes
                        if (paginas_completadas % mostrar_cada_n_paginas == 0 or 
                            paginas_completadas == len(urls) or 
                            paginas_completadas <= 3):
                            
                            if player_id:
                                print(color_texto(f"� [{barra}] {porcentaje:5.1f}% │ {paginas_completadas:3d}/{len(urls)} páginas │ {total_registros_nuevos:,} registros del jugador", "verde"))
                            else:
                                print(color_texto(f"� [{barra}] {porcentaje:5.1f}% │ {paginas_completadas:3d}/{len(urls)} páginas │ {total_registros_nuevos:,} registros nuevos", "verde"))
                        else:
                            # Para el resto, solo actualizar una línea (sin print múltiples)
                            pass
                            
                    return len(registros_a_guardar)
                else:
                    with lock:
                        paginas_completadas += 1
                        # Solo mostrar mensaje de páginas vacías si es significativo
                        if paginas_completadas % (mostrar_cada_n_paginas * 2) == 0:
                            porcentaje = (paginas_completadas / len(urls)) * 100
                            barra_longitud = 30
                            progreso_barra = int((paginas_completadas / len(urls)) * barra_longitud)
                            barra = "█" * progreso_barra + "░" * (barra_longitud - progreso_barra)
                            
                            if player_id:
                                print(color_texto(f"📊 [{barra}] {porcentaje:5.1f}% │ {paginas_completadas:3d}/{len(urls)} páginas │ {total_registros_nuevos:,} registros del jugador", "azul"))
                            else:
                                print(color_texto(f"📊 [{barra}] {porcentaje:5.1f}% │ {paginas_completadas:3d}/{len(urls)} páginas │ {total_registros_nuevos:,} registros nuevos", "azul"))
                    return 0
                    
            except Exception as e:
                print(color_texto(f"❌ Error procesando página {idx+1}: {e}", "rojo"))
                return 0

        # Prepara las URLs de todas las páginas a descargar - EXACTO NAVEGADOR
        urls = []
        for pagina in range(inicio - 1, fin):
            if pagina == 0:
                urls.append(None)  # La primera ya la tienes en soup/response
            else:
                urls.append(f"https://{mundo}.guerrastribales.es/admintool/action_log.php?page={pagina}")

        print(color_texto(f"\n⏳ Iniciando descarga en paralelo de {len(urls)} páginas...", "amarillo"))

        # Contador de progreso
        paginas_completadas = 0
        total_registros_nuevos = 0
        
        # Configuración para mostrar progreso más limpio
        mostrar_cada_n_paginas = max(1, len(urls) // 20)  # Mostrar cada 5% del progreso
        if len(urls) > 50:
            mostrar_cada_n_paginas = max(5, len(urls) // 10)  # Para muchas páginas, mostrar cada 10%

        # Usar ThreadPoolExecutor para paralelismo controlado
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Enviar las tareas al pool de hilos
            future_to_idx = {executor.submit(descargar_procesar_guardar, idx, url): idx for idx, url in enumerate(urls)}
            
            # Procesar los resultados conforme van completándose
            for future in as_completed(future_to_idx):
                if stop_event.is_set():
                    print(color_texto("⚠️ Descarga cancelada por el usuario", "amarillo"))
                    break

        # Mostrar progreso final
        if total_registros_nuevos > 0:
            barra_final = "█" * 30
            print(color_texto(f"\n🎯 [{barra_final}] 100.0% │ {paginas_completadas}/{len(urls)} páginas │ ¡Descarga completada!", "verde"))

        if stop_event.is_set():
            if player_id:
                print(color_texto(f"⚠️ Descarga de registros del jugador {player_id} interrumpida. Se guardaron {total_registros_nuevos:,} registros antes de la cancelación.", "amarillo"))
            else:
                print(color_texto(f"⚠️ Descarga interrumpida. Se guardaron {total_registros_nuevos:,} registros antes de la cancelación.", "amarillo"))
        else:
            if player_id:
                print(color_texto(f"🎉 Descarga de registros del jugador {player_id} completada exitosamente. Total: {total_registros_nuevos:,} registros", "verde"))
            else:
                print(color_texto(f"🎉 Descarga completada exitosamente. Total de registros nuevos: {total_registros_nuevos:,}", "verde"))

        # Ordenar el archivo por timestamp si se descargó algo
        if total_registros_nuevos > 0 or os.path.exists(archivo_registro):
            print(color_texto("\n🔄 Reordenando archivo por timestamp (más recientes primero)...", "amarillo"))
            ordenar_registro_por_timestamp(archivo_registro)
            print(color_texto("✅ Archivo reordenado correctamente", "verde"))

        print(color_texto(f"\n{'═'*70}", "blanco"))
        print(color_texto("📊 RESUMEN DE DESCARGA", "azul"))
        print(color_texto(f"{'═'*70}", "blanco"))
        print(color_texto(f"� Archivo: {os.path.basename(archivo_registro)}", "azul"))
        print(color_texto(f"📍 Ubicación: {os.path.dirname(archivo_registro)}", "gris"))
        if player_id:
            print(color_texto(f"� Jugador ID: {player_id}", "azul"))
            print(color_texto(f"📊 Registros del jugador: {total_registros_nuevos:,}", "verde"))
        else:
            print(color_texto(f"📊 Registros nuevos agregados: {total_registros_nuevos:,}", "verde"))
        print(color_texto(f"📈 Páginas procesadas: {paginas_completadas}/{len(urls)}", "azul"))
        print(color_texto(f"{'═'*70}", "blanco"))

        return True, total_registros_nuevos

    except Exception as e:
        print(color_texto(f"❌ Error general en descarga de {mundo}: {e}", "rojo"))
        return False, 0

def ordenar_registro_por_timestamp(archivo_registro):
    try:
        if not os.path.exists(archivo_registro):
            print(color_texto("⚠️ No se encontró el archivo para reordenar", "amarillo"))
            return

        print(color_texto("📖 Leyendo archivo de registros...", "azul"))
        with open(archivo_registro, 'r', encoding='utf-8') as archivo:
            lineas = archivo.readlines()

        print(color_texto(f"📊 Procesando {len(lineas)} líneas...", "azul"))
        
        # Filtrar líneas válidas y extraer timestamp
        registros_con_timestamp = []
        lineas_unicas = set()
        duplicados_eliminados = 0
        
        for linea in lineas:
            linea = linea.strip()
            if not linea:
                continue
                
            # Evitar duplicados
            if linea in lineas_unicas:
                duplicados_eliminados += 1
                continue
            lineas_unicas.add(linea)
            
            partes = linea.split('\t')
            if len(partes) >= 1:
                try:
                    # El timestamp está en la primera columna
                    timestamp_str = partes[0]
                    # Convertir el formato "DD.MM.AA HH:MM:SS" a datetime
                    timestamp = datetime.strptime(timestamp_str, "%d.%m.%y %H:%M:%S")
                    registros_con_timestamp.append((timestamp, linea))
                except ValueError:
                    # Si no se puede parsear, mantener la línea pero con timestamp mínimo
                    registros_con_timestamp.append((datetime.min, linea))

        if duplicados_eliminados > 0:
            print(color_texto(f"🧹 Eliminados {duplicados_eliminados} registros duplicados", "verde"))

        print(color_texto("🔄 Ordenando registros por timestamp (más recientes primero)...", "azul"))
        # Ordenar por timestamp (más reciente primero)
        registros_con_timestamp.sort(key=lambda x: x[0], reverse=True)

        print(color_texto("💾 Guardando archivo reordenado...", "azul"))
        # Guardar archivo ordenado
        with open(archivo_registro, 'w', encoding='utf-8') as archivo:
            for _, linea in registros_con_timestamp:
                archivo.write(linea + '\n')

        print(color_texto(f"✅ Archivo reordenado: {len(registros_con_timestamp)} registros únicos guardados", "verde"))

    except Exception as e:
        print(color_texto(f"❌ Error al ordenar archivo: {e}", "rojo"))

def descargar_registros_todos_los_mundos(mundos):
    if not mundos:
        print(color_texto("❌ No se proporcionaron mundos para descargar", "rojo"))
        return

    print(color_texto(f"\n🌍 Iniciando descarga de registros para {len(mundos)} mundo(s)", "amarillo"))
    print(color_texto(f"🚀 Procesamiento mejorado con formato profesional", "cian"))
    
    # Evento para cancelación global
    stop_event = threading.Event()
    
    def verificar_cancelacion():
        while not stop_event.is_set():
            try:
                entrada = input()
                if entrada.strip() == "":
                    print(color_texto("\n⚠️ Cancelación solicitada. Deteniendo descarga...", "amarillo"))
                    stop_event.set()
                    break
            except (EOFError, KeyboardInterrupt):
                print(color_texto("\n⚠️ Cancelación solicitada. Deteniendo descarga...", "amarillo"))
                stop_event.set()
                break
    
    # Iniciar hilo de verificación de cancelación
    hilo_cancelacion = threading.Thread(target=verificar_cancelacion, daemon=True)
    hilo_cancelacion.start()
    
    print(color_texto("💡 Presiona ENTER para cancelar la descarga en cualquier momento\n", "cian"))
    
    total_exitosos = 0
    total_registros = 0
    
    for i, mundo in enumerate(mundos, 1):
        if stop_event.is_set():
            print(color_texto("⚠️ Descarga cancelada antes de procesar todos los mundos", "amarillo"))
            break
            
        # Mostrar progreso entre mundos con formato mejorado
        porcentaje_mundos = ((i-1) / len(mundos)) * 100
        barra_mundos_longitud = 30
        progreso_mundos_barra = int(((i-1) / len(mundos)) * barra_mundos_longitud)
        barra_mundos = "█" * progreso_mundos_barra + "░" * (barra_mundos_longitud - progreso_mundos_barra)
        
        print(color_texto(f"\n{'═'*70}", "blanco"))
        print(color_texto(f"🌍 [{barra_mundos}] {porcentaje_mundos:5.1f}% │ Procesando mundo {i}/{len(mundos)}: {mundo}", "amarillo"))
        print(color_texto(f"{'═'*70}", "blanco"))
        
        exito, registros_nuevos = guardar_registros_archivo(mundo, stop_event=stop_event)
        
        if exito:
            total_exitosos += 1
            total_registros += registros_nuevos
            print(color_texto(f"✅ {mundo} completado: {registros_nuevos:,} registros nuevos", "verde"))
        else:
            print(color_texto(f"❌ Falló la descarga para {mundo}", "rojo"))
    
    # Mostrar progreso final de mundos
    if total_exitosos > 0:
        barra_final_mundos = "█" * 30
        print(color_texto(f"\n🎯 [{barra_final_mundos}] 100.0% │ {total_exitosos}/{len(mundos)} mundos │ ¡Descarga de todos los mundos completada!", "verde"))
    
    # Resumen final mejorado
    print(color_texto(f"\n{'═'*70}", "blanco"))
    print(color_texto("📊 RESUMEN FINAL DE DESCARGA MÚLTIPLE", "azul"))
    print(color_texto(f"{'═'*70}", "blanco"))
    print(color_texto(f"🌍 Mundos procesados exitosamente: {total_exitosos}/{len(mundos)}", "verde"))
    print(color_texto(f"📊 Total de registros nuevos descargados: {total_registros:,}", "verde"))
    print(color_texto(f"📈 Tasa de éxito: {(total_exitosos/len(mundos)*100):5.1f}%", "azul"))
    if total_exitosos != len(mundos):
        mundos_fallidos = len(mundos) - total_exitosos
        print(color_texto(f"⚠️ Mundos con errores: {mundos_fallidos}", "rojo"))
    print(color_texto(f"{'═'*70}", "blanco"))

def guardar_registros_archivo_multiples_mundos(mundos, detalles=""):
    descargar_registros_todos_los_mundos(mundos)
