from utils.selenium import *
from utils.config import COOKIES_FILE
import utils.config
from funciones.extra import *
from funciones.coincidencias import analizar_coincidencias_simple
from funciones.registro import *
from funciones.resumen import *
from funciones.recursos import *
from funciones.bans import cargar_bans_global, generar_mensaje_historial_baneos, obtener_color_mensaje_ban
from utils.stealth import get_random_headers, human_delay, add_mouse_simulation
import requests
import os
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import time

# Parámetros de búsqueda mejorados
def get_session_headers():
    return get_random_headers()

def iniciar_sesion():
    """
    Inicia sesión en la página especificada y devuelve una sesión autenticada.
    Si se proporciona cookies_file, intenta cargar cookies desde ahí.
    """
    session = requests.Session()
    headers = {"User-Agent": "Mozilla/5.0"}

    # Si tienes una función para cargar cookies, úsala aquí
    if COOKIES_FILE:
        try:
            cookies_dict = load_cookies()
            if cookies_dict:
                session.cookies.update(cookies_dict)
                if verify_cookies(session, headers): # Verifica si las cookies son válidas
                    return session
                else:
                    print("❌ Cookie caducada o inválida. Iniciando login con Selenium...")
                    selenium_login_and_save_cookies()
                    cookies_dict = load_cookies()
                    session.cookies.update(cookies_dict)
                    if verify_cookies(session, headers):
                        print("✅ Cookie válida tras login Selenium.")
                        return session
                    else:
                        print("❌ No se pudo autenticar. Saliendo.")
                        exit()
            else:
                print("No hay cookies guardadas. Iniciando login con Selenium...")
                selenium_login_and_save_cookies()
                cookies_dict = load_cookies()
                session.cookies.update(cookies_dict)
                if verify_cookies(session, headers):
                    print("✅ Cookie válida tras login Selenium.")
                    return session
                else:
                    print("❌ No se pudo autenticar. Saliendo.")
                    exit()
        except ImportError:
            print("No se encontró el módulo para gestionar cookies. Se usará sesión sin cookies.")
    else:
        print("La cookies no están disponibles.")

    # Si no hay cookies, puedes implementar aquí un login manual si lo necesitas
    # session.post(url_login, data=payload, headers=headers)
    return session

def buscar_jugador_por_nombre(player_name=None, preguntar_si_vacio=True):
    from funciones.extra import color_texto
    # Si player_name viene de coincidencias, no preguntar
    if preguntar_si_vacio:
        player_name = input(color_texto("Introduce el nombre del jugador a buscar: ", "verde")).strip()
        if not player_name:
            print(color_texto("No se introdujo ningún nombre.", "rojo"))
            return
    
    # Simular comportamiento humano antes de buscar
    print(color_texto(f"🔍 Preparando búsqueda del jugador '{player_name}'...", "azul"))
    add_mouse_simulation()  # Simula tiempo de preparación
    
    headers = get_session_headers()  # Headers dinámicos
    
    payload = {
        "multi_name": player_name,
        "action": "search_user_by_name"
    }
    
    # Pausa antes de hacer la petición
    delay = human_delay(base_min=3, base_max=8)
    print(color_texto(f"⏳ Iniciando búsqueda en {delay:.1f}s...", "gris"))
    time.sleep(delay)
    
    response = iniciar_sesion().get(utils.config.get_top_1000_url(), params=payload, headers=headers)
    if response.status_code == 200:
        print(f"\n🔍 Búsqueda realizada para el jugador '{player_name}'.")
        mostrar_info_jugador(response.text)
        menu_player(player_name)
    else:
        print("❌ Error al buscar el jugador. La página no se encontró o no se pudo acceder.")
        return None

def mostrar_info_jugador(html):
    """
    Extrae y muestra por consola la información principal del jugador y la tabla de cookies.
    Además, copia la ID del jugador al portapapeles.
    """
    from bs4 import BeautifulSoup
    import pyperclip

    soup = BeautifulSoup(html, "html.parser")
    tabla = soup.find("table", class_="vis player_info")
    if not tabla:
        print("No se encontró la tabla de información del jugador.")
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

    print("═" * 55)
    print(f"  👤 Jugador: {nombre if nombre else 'Desconocido'}")
    print(f"  🆔 ID: {player_id if player_id else 'N/A'}")
    for campo in campos_mostrar:
        emoji = {
            "VIP": "💎",
            "E-Mail": "📧",
            "Language": "🌐",
            "Start date": "📅",
            "Tribe": "🛡️"
        }.get(campo, "")
        print(f"  {emoji} {campo}: {info.get(campo, '')}")
    
    # 🚫 INFORMACIÓN DE BANEOS
    if nombre:
        try:
            from funciones.bans import obtener_historial_baneos_jugador
            global_bans = cargar_bans_global()
            
            # Obtener historial completo de baneos
            historial_baneos = obtener_historial_baneos_jugador(nombre, solo_activos=False, incluir_mundo_en_datos=True, global_bans=global_bans)
            
            if historial_baneos:
                print(f"  🚫 Baneos: {color_texto(f'{len(historial_baneos)} baneos encontrados', 'rojo')}")
                print("     " + color_texto("📋 HISTORIAL DE BANEOS DETALLADO:", "rojo"))
                for i, ban in enumerate(historial_baneos[:5], 1):  # Mostrar máximo 5 baneos
                    mundo = ban.get('Mundo', 'N/A')
                    fecha = ban.get('date', 'N/A')
                    unban = ban.get('unban_date', 'N/A')
                    tipo = ban.get('bantype', 'N/A')
                    motivo = ban.get('reason', 'N/A')
                    admin = ban.get('admin', 'N/A')
                    estado = ban.get('estado', 'N/A')
                    
                    color_estado = "rojo" if estado == "activo" else "amarillo"
                    print(f"     {i}. {color_texto(f'[{mundo}]', 'cian')} {color_texto(estado.upper(), color_estado)} - {fecha}")
                    print(f"        Tipo: {tipo} | Motivo: {motivo}")
                    if admin != 'N/A':
                        print(f"        Admin: {admin}")
                    if unban != 'N/A':
                        print(f"        Unban: {unban}")
                    print()
                
                if len(historial_baneos) > 5:
                    print(f"     {color_texto(f'... y {len(historial_baneos) - 5} baneos más', 'gris')}")
            else:
                mensaje_historial = generar_mensaje_historial_baneos(nombre, global_bans, utils.config.WORLD)
                color_mensaje = obtener_color_mensaje_ban(mensaje_historial)
                print(f"  🚫 Baneos: {color_texto(mensaje_historial, color_mensaje)}")
        except Exception as e:
            print(f"  🚫 Baneos: {color_texto('Error al verificar baneos', 'gris')}")
    
    print("═" * 55)

    # Copiar la ID al portapapeles si existe
    if player_id:
        try:
            pyperclip.copy(player_id)
            print(f"\n📋 La ID del jugador {nombre if nombre else ''} ({player_id}) se ha copiado al portapapeles.")
        except Exception:
            print("⚠️  No se pudo copiar la ID al portapapeles (¿falta pyperclip?).")

    # Buscar la tabla de cookies (la tabla interna con encabezado "Cookie")
    tabla_cookies = None
    for t in tabla.find_all("table", class_="vis"):
        encabezados = [th.get_text(strip=True) for th in t.find_all("th")]
        if "Cookie" in encabezados:
            tabla_cookies = t
            break

    if tabla_cookies:
        print("\n🍪 Cookies asociadas:")
        headers = [th.get_text(strip=True) for th in tabla_cookies.find_all("th")]
        ancho_col = [max(len(h), 12) for h in headers]
        filas = []
        cookies_compartidas = []
        
        for tr in tabla_cookies.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if tds:
                fila = [td.get_text(" ", strip=True) for td in tds]
                filas.append(fila)
                
                # Verificar si hay cookies compartidas (Players with cookie > 1)
                if len(fila) >= 3:  # Asumiendo: Cookie | Logins | Players with cookie | ...
                    try:
                        players_con_cookie = int(fila[2])
                        if players_con_cookie > 1:
                            cookies_compartidas.append((fila[0], players_con_cookie))
                    except (ValueError, IndexError):
                        pass
                
                for i, valor in enumerate(fila):
                    if i < len(ancho_col):
                        ancho_col[i] = max(ancho_col[i], len(valor))
        
        # Mostrar alerta si hay cookies compartidas
        if cookies_compartidas:
            print()
            print(color_texto("🚨" * 20, "rojo"))
            print(color_texto("⚠️  ¡ALERTA DE COOKIES COMPARTIDAS!", "rojo"))
            print(color_texto("🚨" * 20, "rojo"))
            print(color_texto("🔍 Se detectaron cookies usadas por múltiples jugadores:", "amarillo"))
            for cookie_id, num_players in cookies_compartidas:
                print(color_texto(f"   🍪 Cookie {cookie_id}: {num_players} jugadores diferentes", "rojo"))
            print(color_texto("💡 Esto puede indicar cuentas múltiples o uso compartido", "amarillo"))
            print(color_texto("🔴 Revisar estas cookies cuidadosamente", "rojo"))
            print()
        
        # Imprimir tabla de cookies
        encabezado = " | ".join(h.ljust(ancho_col[i]) for i, h in enumerate(headers))
        print("─" * len(encabezado))
        print(encabezado)
        print("─" * len(encabezado))
        
        # Imprimir filas con colores para cookies compartidas
        for fila in filas:
            cookie_id = fila[0] if len(fila) > 0 else ""
            es_compartida = any(cookie_id == shared_cookie for shared_cookie, _ in cookies_compartidas)
            
            if es_compartida:
                # Resaltar en rojo las cookies compartidas
                linea = " | ".join(color_texto(fila[i].ljust(ancho_col[i]), "rojo") for i in range(len(fila)))
                print(linea)
            else:
                linea = " | ".join(fila[i].ljust(ancho_col[i]) for i in range(len(fila)))
                print(linea)
        
        print("─" * len(encabezado))
        print("\n🔍 Puedes usar esta información para buscar incidencias específicas del jugador.")
        print(" Si necesitas más detalles, usa el ID del jugador para buscar en el registro global.")
        print(" Estamos guardando los datos del jugador en memoria para analizarlos. Notificaremos cuando se complete el proceso.")
        
        # Crear archivo PlayerLog.txt específico para este jugador
        archivo_player = utils.config.get_registro_simple()
        os.makedirs(os.path.dirname(archivo_player), exist_ok=True)
        
        # Usar la función correcta para la versión CLI
        # Descargar registros específicos del jugador usando la función unificada
        
        try:
            # Usar la función modificada que ahora acepta player_id
            exito, total_registros = guardar_registros_archivo(utils.config.WORLD, player_id=player_id)
            
            if exito and total_registros > 0:
                print(color_texto(f"✅ Se descargaron {total_registros} registros del jugador", "verde"))
                print(color_texto(f"📄 Archivo guardado en: {archivo_player}", "azul"))
            elif exito and total_registros == 0:
                print(color_texto("⚠️ No se encontraron registros nuevos para este jugador", "amarillo"))
            else:
                print(color_texto("❌ Error al descargar registros del jugador", "rojo"))
                
        except Exception as e:
            print(color_texto(f"❌ Error en la descarga: {e}", "rojo"))

    else:
        print("No se encontró la tabla de cookies para este jugador.")
        
        
def menu_player(player_name=None):
    from funciones.extra import color_texto
    while True:
        print(color_texto("═" * 55, "azul"))
        print(
            color_texto("🔎 Menú de análisis para el jugador: ", "azul")
            + color_texto(f"{player_name}", "verde")
        )
        print(color_texto("═" * 55, "azul"))
        print("  1️⃣  Ver Análisis Global de Incidencias")
        print("  2️⃣  Incidencias por Coincidencias de Acciones")
        print("  3️⃣  Incidencias por Granjeo")
        print("  4️⃣  Incidencias por Recolección")
        print("  5️⃣  Análisis avanzado (All Analysis)")
        print("  6️⃣  Incidencias por Desbloqueo de Recolección")
        print("  7️⃣  Próximamente...")
        print("  8️⃣  Detección de Bots")
        print("  0️⃣  Salir al Menú Principal")
        print(color_texto("═" * 55, "azul"))
        opcion = input(color_texto("\n👉 Selecciona una opción 1-8 (Enter para salir): ", "verde")).strip()
        if opcion == "" or opcion == "0":
            print(color_texto("👉 Saliendo del menú del jugador... Entrando en Menú Principal.", "amarillo"))
            break
        elif opcion == "1":
            analisis_completo(utils.config.get_registro_simple())  
            input(color_texto("🔚 Análisis completo finalizado. Pulsa Enter para continuar...", "azul"))
        elif opcion == "2":
            analizar_coincidencias_simple(utils.config.get_registro_simple())
        elif opcion == "3":
            analizar_farmeos()
            input(color_texto("🔚 Análisis de granjeos finalizado. Pulsa Enter para continuar...", "azul"))
        elif opcion == "4":
            analizar_reco()
            input(color_texto("🔚 Análisis de recolecciones finalizado. Pulsa Enter para continuar...", "azul"))
        elif opcion == "5":
            
            input(color_texto("🔚 Análisis avanzado finalizado. Pulsa Enter para continuar...", "azul"))
        elif opcion == "6":
            analizar_unlock_reco(utils.config.get_registro_simple())
            input(color_texto("🔚 Análisis de desbloqueo de recolecciones finalizado. Pulsa Enter para continuar...", "azul"))
        elif opcion == "7":
            print(color_texto("\n🤖 Análisis aún no implementado. ¡Próximamente!", "amarillo"))
            input(color_texto("Pulsa Enter para continuar...", "azul"))
        elif opcion == "8":
            print(color_texto("\n🤖 Análisis aún no implementado. ¡Próximamente!", "amarillo"))
            input(color_texto("Pulsa Enter para continuar...", "azul"))
        else:
            print(color_texto("⚠️  Opción no válida. Intenta de nuevo.", "rojo"))
            input(color_texto("Pulsa Enter para continuar...", "azul"))

