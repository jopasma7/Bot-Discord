from funciones.coincidencias import *
from funciones.bans import revisar_ban_en_todos_los_mundos, obtener_historial_baneos_jugador
from funciones.extra import color_texto

import utils.config
from funciones.market import *
from funciones.snob import *
from datetime import datetime
import re
import random


def resumen_market_jugador(nombre_jugador, registro, return_nobles=False):
    # Llama a tus funciones reales de análisis
    exchanges = contar_exchanges(nombre_jugador, registro)
    calls = contar_calls(nombre_jugador, registro)
    map_send = contar_map_send(nombre_jugador, registro)
    send = contar_send(nombre_jugador, registro)

    resumen_market = (
        f"• 1️⃣  (Exchanges) - {exchanges if exchanges else 'N/A'} Registros\n"
        f"• 2️⃣  (Calls) - {calls if calls else 'N/A'} Registros\n"
        f"• 3️⃣  (Map_Send) - {map_send if map_send else 'N/A'} Registros\n"
        f"• 4️⃣  (Send) - {send if send else 'N/A'} Registros\n"
    )

    if return_nobles:
        snob_coin = contar_snob_coin(nombre_jugador , registro)
        snob_train = contar_snob_train(nombre_jugador , registro)
        patron = "📋 Patrón" if detectar_patron_nobles(nombre_jugador , registro) else "Sin patrón"
        resumen_nobles = (
            f"• 🔍 {snob_coin if snob_coin else 'N/A'} Registros (Snob - Coin)\n"
            f"• 🔍 {snob_train if snob_train else 'N/A'} Registros (Snob - Train)\n"
            f"• {patron}\n"
        )
        return resumen_market, resumen_nobles

    return resumen_market

def analisis_completo(archivo_registro):
    print("\n📋 Ejecutando análisis del jugador completo...")
    start_time = datetime.now()

    patron_timestamp = re.compile(r"^\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}")
    nombre_jugador = None
    with open(archivo_registro, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if patron_timestamp.match(linea):
                partes = linea.split('\t')
                if len(partes) >= 2:
                    nombre_jugador = partes[1]
                    break

    # 1. Coincidencias entre pantallas
    coincidencias_por_jugador = obtener_coincidencias(archivo_registro)
    coincidencias = coincidencias_por_jugador.get(nombre_jugador, [])
    coincidencias_encontradas = bool(coincidencias)

    # 2. Analizar farmeos en bloques continuos (am_farm)
    registros_farmeo = []
    with open(archivo_registro, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not patron_timestamp.match(linea):
                continue
            partes = linea.split('\t')
            if len(partes) < 4:
                continue
            try:
                fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
            except:
                continue
            if partes[3] != "am_farm":
                continue
            registros_farmeo.append((fecha, linea))
    registros_farmeo.sort(key=lambda x: x[0])
    bloques_farmeo = []
    if registros_farmeo:
        bloque_actual = [registros_farmeo[0]]
        for i in range(1, len(registros_farmeo)):
            actual, _ = registros_farmeo[i]
            anterior, _ = registros_farmeo[i - 1]
            diferencia = (actual - anterior).total_seconds()
            if diferencia <= 60:
                bloque_actual.append(registros_farmeo[i])
            else:
                bloques_farmeo.append(bloque_actual)
                bloque_actual = [registros_farmeo[i]]
        if bloque_actual:
            bloques_farmeo.append(bloque_actual)
    pausas_farmeo = []
    if len(bloques_farmeo) > 1:
        for i in range(1, len(bloques_farmeo)):
            fin_anterior = bloques_farmeo[i - 1][-1][0]
            inicio_actual = bloques_farmeo[i][0][0]
            pausa = int((inicio_actual - fin_anterior).total_seconds())
            pausas_farmeo.append(pausa)
    # Delay farmeo: buscar la pausa (en minutos) que más veces aparece (>4)
    delay_farmeo = "N/A"
    farmeo_positivo = False
    if pausas_farmeo:
        tolerancia = 600  # 10 minutos en segundos
        max_repeticiones = 0
        mejor_pausa = None
        for pausa in pausas_farmeo:
            repeticiones = sum(1 for p in pausas_farmeo if abs(p - pausa) <= tolerancia)
            if repeticiones > max_repeticiones:
                max_repeticiones = repeticiones
                mejor_pausa = pausa
        if max_repeticiones > 10:
            farmeo_positivo = True
            min_p, seg_p = divmod(int(mejor_pausa), 60)
            delay_farmeo = f"≈{min_p} min ({max_repeticiones} repeticiones)"
        else:
            delay_farmeo = "Sin patrón claro"

    # 3. Analizar recolectas en bloques continuos (scavenge_)
    registros_recolecta = []
    with open(archivo_registro, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not patron_timestamp.match(linea):
                continue
            partes = linea.split('\t')
            if len(partes) < 4:
                continue
            try:
                fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
            except:
                continue
            if not partes[3].startswith("scavenge_"):
                continue
            registros_recolecta.append((fecha, linea))
    registros_recolecta.sort(key=lambda x: x[0])
    bloques_recolecta = []
    if registros_recolecta:
        bloque_actual = [registros_recolecta[0]]
        for i in range(1, len(registros_recolecta)):
            actual, _ = registros_recolecta[i]
            anterior, _ = registros_recolecta[i - 1]
            diferencia = (actual - anterior).total_seconds()
            if diferencia <= 60:
                bloque_actual.append(registros_recolecta[i]
                )
            else:
                bloques_recolecta.append(bloque_actual)
                bloque_actual = [registros_recolecta[i]]
        if bloque_actual:
            bloques_recolecta.append(bloque_actual)
    pausas_recolecta = []
    if len(bloques_recolecta) > 1:
        for i in range(1, len(bloques_recolecta)):
            fin_anterior = bloques_recolecta[i - 1][-1][0]
            inicio_actual = bloques_recolecta[i][0][0]
            pausa = int((inicio_actual - fin_anterior).total_seconds())
            pausas_recolecta.append(pausa)
    # Delay recolecta: buscar la pausa (en minutos) que más veces aparece (>4)
    delay_recolecta = "N/A"
    recolecta_positivo = False
    if pausas_recolecta:
        tolerancia = 600  # 10 minutos en segundos
        max_repeticiones = 0
        mejor_pausa = None
        for pausa in pausas_recolecta:
            repeticiones = sum(1 for p in pausas_recolecta if abs(p - pausa) <= tolerancia)
            if repeticiones > max_repeticiones:
                max_repeticiones = repeticiones
                mejor_pausa = pausa
        if max_repeticiones > 10:
            recolecta_positivo = True
            min_p, seg_p = divmod(int(mejor_pausa), 60)
            delay_recolecta = f"≈{min_p} min ({max_repeticiones} repeticiones)"
        else:
            delay_recolecta = "Sin patrón claro"

    # --- Acciones según resultados ---
    acciones = []
    if coincidencias_encontradas:
        acciones.append("Comandos en Background")
    if farmeo_positivo:
        acciones.append("Bot de Granjeo")
    if recolecta_positivo:
        acciones.append("Bot de Recolección")
    acciones_str = ", ".join(acciones) if acciones else "Ninguna"

    # --- Checks y delays ---
    checks_str = ""
    if farmeo_positivo:
        checks_str += f"✅ Farmeo: {delay_farmeo}\n"
    else:
        checks_str += f"❌ Farmeo: N/A\n"
    if recolecta_positivo:
        checks_str += f"✅ Recolección: {delay_recolecta}\n"
    else:
        checks_str += f"❌ Recolección: N/A\n"
    if coincidencias_encontradas:
        checks_str += f"✅ Coincidencias: {len(coincidencias)} Encontradas.\n"
        for ts, acciones in coincidencias:
            pantallas = ", ".join(sorted(set(p for p, _, _ in acciones)))
            checks_str += f"• 📅 {ts} 🎯 {pantallas}\n"
    else:
        checks_str += f"❌ Coincidencias: N/A.\n"

    # --- Market y Nobles ---
    market_resumen, nobles_resumen = resumen_market_jugador(nombre_jugador, archivo_registro, return_nobles=True)
    exchanges = contar_exchanges(nombre_jugador, archivo_registro)
    calls = contar_calls(nombre_jugador, archivo_registro)
    map_send = contar_map_send(nombre_jugador, archivo_registro)
    send = contar_send(nombre_jugador, archivo_registro)

    hay_market = any([
        isinstance(exchanges, int) and exchanges > 0,
        isinstance(calls, int) and calls > 0,
        isinstance(map_send, int) and map_send > 0,
        isinstance(send, int) and send > 0,
    ])

    snob_coin = contar_snob_coin(nombre_jugador, archivo_registro)
    snob_train = contar_snob_train(nombre_jugador, archivo_registro)
    hay_nobles = any([
        isinstance(snob_coin, int) and snob_coin > 0,
        isinstance(snob_train, int) and snob_train > 0,
    ])

    market_str = f"{'✅' if hay_market else '❌'} Mercado (Auto Market):\n{market_resumen}\n" if market_resumen else "❌ Mercado (Auto Market):\nN/A\n"
    nobles_str = f"{'✅' if hay_nobles else '❌'} Nobles (Auto Mint):\n{nobles_resumen}\n" if nobles_resumen else "❌ Nobles (Auto Mint):\nN/A\n"

    # --- Comentario automático variado ---
    comentarios_positivos = [
        "Se han detectado patrones claros de automatización en las acciones del jugador.",
        "El análisis revela comportamientos automáticos en varias áreas del juego.",
        "Patrones repetitivos y automatizados han sido identificados en los registros.",
        "La actividad del jugador muestra indicios consistentes de uso de automatismos.",
        "El jugador presenta secuencias de acciones que sugieren automatización activa.",
        "Se observa una operativa sistemática que apunta a la utilización de bots.",
        "El análisis evidencia rutinas automatizadas en la actividad registrada.",
        "Las acciones del jugador reflejan una posible intervención de herramientas automáticas.",
        "Se han encontrado coincidencias y patrones que no corresponden a un juego manual.",
        "El comportamiento registrado es altamente compatible con procesos automáticos."
    ]
    comentarios_negativos = [
        "No se han detectado patrones claros de automatización en los registros.",
        "La actividad del jugador no muestra indicios de automatismos.",
        "No se han encontrado secuencias repetitivas que sugieran automatización.",
        "El análisis no evidencia comportamientos automáticos relevantes.",
        "No se observan rutinas que apunten a la utilización de bots.",
        "No hay coincidencias ni patrones que indiquen uso de herramientas automáticas.",
        "El comportamiento registrado parece corresponder a un juego manual.",
        "No se han encontrado pruebas de procesos automáticos en la actividad.",
        "La operativa del jugador no presenta signos de automatización.",
        "No se han hallado patrones sospechosos en los registros analizados."
    ]

    comentario = ""
    if any([coincidencias_encontradas, farmeo_positivo, recolecta_positivo, hay_market, hay_nobles]):
        comentario = random.choice(comentarios_positivos)
        detalles = []
        if coincidencias_encontradas:
            detalles.append("coincidencias entre pantallas")
        if farmeo_positivo:
            detalles.append("patrón de farmeo automatizado")
        if recolecta_positivo:
            detalles.append("patrón de recolección automatizada")
        if hay_market:
            detalles.append("actividad de mercado automatizada")
        if hay_nobles:
            detalles.append("actividad de nobles automatizada")
        if detalles:
            comentario += " Áreas detectadas: " + ", ".join(detalles) + "."
    else:
        comentario = random.choice(comentarios_negativos)
    # --- Reporte final ---
    end_time = datetime.now()
    tiempo_revision = str(end_time - start_time).split('.')[0]  # HH:MM:SS

    # Busca el primer y último registro del jugador
    primer_registro = None
    ultimo_registro = None
    with open(archivo_registro, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if patron_timestamp.match(linea):
                partes = linea.split('\t')
                if len(partes) >= 2 and partes[1] == nombre_jugador:
                    try:
                        fecha = datetime.strptime(partes[0], "%d.%m.%y %H:%M:%S")
                    except:
                        continue
                    if primer_registro is None or fecha < primer_registro:
                        primer_registro = fecha
                    if ultimo_registro is None or fecha > ultimo_registro:
                        ultimo_registro = fecha

    if primer_registro and ultimo_registro:
        diferencia = ultimo_registro - primer_registro
        total_min = int(diferencia.total_seconds() // 60)
        horas = total_min // 60
        minutos = total_min % 60
        tiempo_revision = f"{horas}h {minutos}min"
    else:
        tiempo_revision = "N/A"

    # --- AVISO DE HISTORIAL DE BANEOS (SOLO TEXTO PARA TERMINAL, CON COLORES) ---
    historial_bans = obtener_historial_baneos_jugador(nombre_jugador)
    aviso_bans = ""
    if historial_bans:
        aviso_bans = (
            "\n"
            + color_texto("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "rojo") + "\n"
            + color_texto("🟥🟥🟥  ¡¡ ALERTA DE BANEOS !!  🟥🟥🟥", "rojo") + "\n"
            + color_texto("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "rojo") + "\n"
            + color_texto(f"🚨 ¡ATENCIÓN! El jugador '{nombre_jugador}' ha sido baneado en los siguientes mundos:", "rojo") + "\n"
        )
        for ban in historial_bans:
            aviso_bans += (
                color_texto(
                    f"   • 🌍 Mundo: {ban['Mundo']} | Nº: {ban['Nº']} | Fecha: {ban['date']} | "
                    f"Unban: {ban.get('unban_date','')} | Tipo: {ban.get('bantype','')} | Motivo: {ban.get('reason','')}",
                    "amarillo"
                ) + "\n"
            )
        aviso_bans += color_texto("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "rojo") + "\n\n"

    # Construir solo los apartados con registros (✅)
    resumen_partes = []

    # Añade solo los apartados positivos de checks_str
    for linea in checks_str.splitlines():
        if linea.startswith("✅"):
            resumen_partes.append(linea)
        # Añade también los detalles de coincidencias si hay coincidencias
        if linea.startswith("✅ Coincidencias"):
            resumen_partes.append(linea)
            for detalle in checks_str.splitlines():
                if detalle.startswith("•"):
                    resumen_partes.append(detalle)

    # Añade el resumen de mercado si hay registros positivos
    if hay_market and market_resumen:
        resumen_partes.append("✅ Mercado (Auto Market):")
        resumen_partes.extend([l for l in market_resumen.splitlines() if "N/A" not in l])

    # Añade el resumen de nobles si hay registros positivos
    if hay_nobles and nobles_resumen:
        resumen_partes.append("✅ Nobles (Auto Mint):")
        resumen_partes.extend([l for l in nobles_resumen.splitlines() if "N/A" not in l])

    # Elimina duplicados y líneas vacías
    resumen_final = "\n".join([l for i, l in enumerate(resumen_partes) if l and l not in resumen_partes[:i]])

    # Contar baneos para el resumen
    total_baneos = len(historial_bans) if historial_bans else 0
    resumen_baneos = f"🔸 Baneos Previos:   {total_baneos} baneos." if total_baneos > 0 else "🔸 Baneos Previos:   Sin historial de baneos."

    # Mostrar aviso de baneos primero (solo visual)
    if aviso_bans:
        print(aviso_bans)

    reporte_final = f"""
📊 Reporte de Actividad del Jugador

🔹 Nombre:          {nombre_jugador}
🔹 Mundo:           {utils.config.WORLD}
🔹 Motivo:          Automatismos.
🔹 Tiempo Revisión: {tiempo_revision}
🔹 Prioridad:       Alta
🔹 Fecha Revisión:  {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
{resumen_baneos}

🔸 Análisis Global:
{resumen_final}
🔸 {comentario}
"""

    print(reporte_final)
    try:
        import pyperclip
        pyperclip.copy(reporte_final)
        print("✅ Reporte copiado al portapapeles (con emojis).")
    except Exception as e:
        print(f"❌ No se pudo copiar al portapapeles: {e}")
