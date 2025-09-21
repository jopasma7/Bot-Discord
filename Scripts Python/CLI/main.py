import os
from funciones.registro import *
from funciones.coincidencias import *
from funciones.players import *
from funciones.market import *
from funciones.especificas import *
from funciones.bans import fetch_and_save_bans_background
from funciones.extra import obtener_mundos_disponibles
import utils.config


def mostrar_menu():
    while True:
        print("\n" + "="*85)
        print(color_texto("🔍 Bienvenido al Analizador de Registros de Guerras Tribales", "azul"))
        print(color_texto(
            "Este asistente te permite analizar registros globales, buscar incidencias por jugador,\n"
            "detectar patrones automáticos, revisar conexiones compartidas y mucho más.\n"
            "Selecciona una de las opciones para comenzar tu análisis.", "blanco"))
        print("="*85)
        print("\n🔎 ¿Qué analizamos?")
        print("  1️⃣  Análisis de Registros Global")
        print("  2️⃣  Análisis por Jugador")
        print("  3️⃣  Análisis de Conexiones Compartidas")
        print("  4️⃣  Análisis de Cookies")
        print("  5️⃣  Bot Detection")
        print("  0️⃣  Salir")
        opcion = input(color_texto("👉 Selecciona una opción (1-5): ", "verde")).strip()
        if opcion == "1":
            if os.path.exists(utils.config.get_registro_global()):
                print(color_texto("\n📄 Se ha encontrado el archivo 'WorldLog.txt'.", "amarillo"))
                print("¿Qué quieres hacer con los datos?")
                print("  1️⃣  📥  Agregar todos los datos nuevos al archivo existente")
                print("  2️⃣  🗑️  Eliminar archivo y agregar datos nuevos...")
                print("  3️⃣  📊  Conservar el archivo y pasar directamente al análisis")
                subopcion = input(color_texto("👉 Elige una opción (1, 2 o 3): ", "verde")).strip()
                if subopcion == "1":
                    print(color_texto("➕ Añadiendo nuevos datos al archivo existente...\n", "amarillo"))
                    guardar_registros_archivo(utils.config.WORLD)
                    #descargar_registros_todos_los_mundos(preguntar_paginas=False)
                elif subopcion == "2":
                    print(color_texto("🗑️ Eliminando archivo y agregando datos nuevos...\n", "amarillo"))
                    os.remove(utils.config.get_registro_global())
                    guardar_registros_archivo(utils.config.WORLD)
                elif subopcion == "3":
                    print("📊 Conservando 'WorldLog.txt'. Pasando directamente al análisis.\n")
                else:
                    print(color_texto("⚠️  Opción no válida. Volviendo al menú principal.", "rojo"))
                    continue
            else:
                print(color_texto("📂 No existe 'WorldLog.txt'. Vamos a crearlo...\n", "amarillo"))
                guardar_registros_archivo(utils.config.WORLD)

            # Menú de análisis tras cargar datos
            while True:
                print("════════════════════════════════════════════════════════════")
                print(color_texto("📊 Menú de análisis global", "azul"))
                print("════════════════════════════════════════════════════════════")
                print("  1️⃣  Coincidencias")
                print("  2️⃣  Farms")
                print("  3️⃣  Market")
                print("  4️⃣  Snob")
                print("  5️⃣  Patrones Globales")
                print("  6️⃣  Análisis Completo")
                print("  0️⃣  Salir al menú principal")
                eleccion = input(color_texto("\n👉 Selecciona un análisis (1-6, 0 para salir): ", "verde")).strip()
                if eleccion == "1":
                    analizar_coincidencias_global(utils.config.get_registro_global())
                elif eleccion == "2":
                    analizar_farmeos_global()
                elif eleccion == "3":
                    market()
                elif eleccion == "4":
                    analisis_snob(utils.config.get_registro_global())
                elif eleccion == "5":
                    otros_analisis()
                elif eleccion == "6":
                    from funciones.all_analisis import main_analysis_flow
                    main_analysis_flow()
                elif eleccion == "0" or eleccion == "":
                    break
                else:
                    print(color_texto("⚠️  Opción no válida. Intenta de nuevo.", "rojo"))
        elif opcion == "2":
            buscar_jugador_por_nombre("rabagalan73", preguntar_si_vacio=True)
            #print(color_texto("\n🔧 Análisis por Jugador aún no implementado. ¡Próximamente!", "amarillo"))
        elif opcion == "3":
            print(color_texto("\n🔧 Análisis de Conexiones Compartidas aún no implementado. ¡Próximamente!", "amarillo"))
        elif opcion == "4":
            print(color_texto("\n🔧 Análisis de Cookies aún no implementado. ¡Próximamente!", "amarillo"))
        elif opcion == "5":
            print(color_texto("\n🤖 Bot Detection aún no implementado. ¡Próximamente!", "amarillo"))
        elif opcion == "0":
            print(color_texto("\n👋 ¡Hasta la próxima, Alejandro! Que tengas un gran día.", "verde"))
            break
        else:
            print(color_texto("⚠️  Opción no válida. Intenta de nuevo.", "rojo"))


##############################################
##            INICIO DEL PROGRAMA           ##
##############################################

def main():
    print("="*60)
    print(color_texto("👋 ¡Bienvenido, Alejandro! 😊", "verde"))
    print("Este script te ayudará a analizar los registros de Guerras Tribales.")
    print("="*60)
    
    # Mostrar advertencia de modo seguro
    from utils.safe_mode import print_safe_mode_warning
    from utils.stealth import show_session_info
    print_safe_mode_warning()
    
    print(color_texto("\n⚠️  IMPORTANTE: Para evitar problemas con la administración del juego,", "amarillo"))
    print(color_texto("este programa ahora opera con límites conservadores y comportamiento humano.", "amarillo"))
    print(color_texto("Mantiene headers consistentes (mismo navegador) durante toda la sesión.", "blanco"))
    input(color_texto("\nPresiona Enter para continuar y aceptar estas condiciones...", "verde"))
    
    # Mostrar información de la sesión
    show_session_info()

    # Preguntar si quiere analizar baneos
    print(color_texto("\n� Análisis de usuarios baneados", "azul"))
    print("¿Deseas actualizar la base de datos de usuarios baneados?")
    print("(Esto puede tomar varios minutos y consume requests)")
    actualizar_bans = input(color_texto("¿Actualizar baneos? (s/N): ", "amarillo")).strip().lower()
    
    if actualizar_bans in ['s', 'si', 'sí', 'y', 'yes']:
        print(color_texto("🔄 Actualizando usuarios baneados...", "amarillo"))
        fetch_and_save_bans_background()
        print(color_texto("✅ Actualización de baneos completada", "verde"))
    else:
        print(color_texto("⏭️  Omitiendo actualización de baneos", "blanco"))

    # Obtiene mundos disponibles dinámicamente
    mundos_disponibles = obtener_mundos_disponibles()
    utils.config.mundos_disponibles = mundos_disponibles  # Actualiza la variable global

    print("\n🌍 Mundos disponibles:")
    for idx, mundo in enumerate(mundos_disponibles, 1):
        print(f"  {idx}. {mundo}")
    print("\n 0️⃣  Descargar Registros de Varios Mundos\n")  # Separación y opción especial

    seleccion = input(color_texto("Selecciona el número de un mundo, escribe el nombre, o pulsa 0 para varios mundos: ", "amarillo")).strip()
    if seleccion == "0":
        # Solicitar al usuario qué mundos desea descargar
        print(color_texto("\n🌍 Selección de múltiples mundos:", "azul"))
        print("Opciones:")
        print("  1️⃣  Todos los mundos disponibles")
        print("  2️⃣  Seleccionar mundos específicos")
        
        opcion_mundos = input(color_texto("👉 Elige una opción (1 o 2): ", "verde")).strip()
        
        if opcion_mundos == "1":
            # Usar todos los mundos disponibles
            mundos_a_descargar = mundos_disponibles
            print(color_texto(f"📋 Se descargarán registros de todos los mundos: {', '.join(mundos_a_descargar)}", "azul"))
        elif opcion_mundos == "2":
            # Permitir selección manual
            print(color_texto("\n📝 Introduce los mundos que deseas descargar:", "azul"))
            print("Puedes escribir números separados por comas (ej: 1,3,5) o nombres (ej: es91,es92)")
            for idx, mundo in enumerate(mundos_disponibles, 1):
                print(f"  {idx}. {mundo}")
            
            entrada_mundos = input(color_texto("👉 Tu selección: ", "verde")).strip()
            mundos_a_descargar = []
            
            # Procesar la entrada del usuario
            if entrada_mundos:
                elementos = [elem.strip() for elem in entrada_mundos.split(',')]
                for elem in elementos:
                    if elem.isdigit():
                        idx = int(elem) - 1
                        if 0 <= idx < len(mundos_disponibles):
                            mundos_a_descargar.append(mundos_disponibles[idx])
                    elif elem in mundos_disponibles:
                        mundos_a_descargar.append(elem)
                
                if not mundos_a_descargar:
                    print(color_texto("⚠️ No se seleccionaron mundos válidos. Usando todos los mundos disponibles.", "amarillo"))
                    mundos_a_descargar = mundos_disponibles
                else:
                    print(color_texto(f"📋 Mundos seleccionados: {', '.join(mundos_a_descargar)}", "azul"))
            else:
                print(color_texto("⚠️ No se seleccionaron mundos. Usando todos los mundos disponibles.", "amarillo"))
                mundos_a_descargar = mundos_disponibles
        else:
            print(color_texto("⚠️ Opción no válida. Usando todos los mundos disponibles.", "amarillo"))
            mundos_a_descargar = mundos_disponibles
        
        # Llamar a la función con los mundos seleccionados
        descargar_registros_todos_los_mundos(mundos_a_descargar)
        return
    elif seleccion.isdigit() and 1 <= int(seleccion) <= len(mundos_disponibles):
        mundo_seleccionado = mundos_disponibles[int(seleccion) - 1]
    elif seleccion in mundos_disponibles:
        mundo_seleccionado = seleccion
    else:
        print(color_texto("⚠️  Valor no válido. Se usará el mundo por defecto (es94).\n", "rojo"))
        mundo_seleccionado = "es94"
    utils.config.WORLD = mundo_seleccionado
    print(color_texto(f"🌍 Analizando el mundo {utils.config.WORLD}", "amarillo"))
    mostrar_menu()

if __name__ == "__main__":
    main()
