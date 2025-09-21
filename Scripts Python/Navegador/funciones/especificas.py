from collections import defaultdict, Counter
from datetime import datetime
import utils.config
import streamlit as st
import pandas as pd

def analisis_acciones_especificas():
    archivo = utils.config.get_registro_global()
    datos = defaultdict(lambda: defaultdict(list))  # jugador -> pantalla -> [fechas]

    # 1. Leer y agrupar
    with open(archivo, "r", encoding="utf-8") as f:
        for linea in f:
            partes = linea.strip().split('\t')
            if len(partes) < 5:
                continue
            fecha_str, jugador, _, pantalla, *_ = partes
            try:
                fecha = datetime.strptime(fecha_str, "%d.%m.%y %H:%M:%S")
            except Exception:
                continue
            datos[jugador][pantalla].append(fecha)

    # 2. Buscar patrones y guardar resultados
    patrones_jugadores = []
    for jugador, pantallas in datos.items():
        patrones = []
        for pantalla, fechas in pantallas.items():
            if len(fechas) < 10:
                continue
            fechas.sort()
            difs = [(fechas[i+1] - fechas[i]).total_seconds() for i in range(len(fechas)-1)]
            if not difs:
                continue
            counter = Counter(difs)
            patron, repeticiones = counter.most_common(1)[0]
            if repeticiones > 10:
                patrones.append({
                    "pantalla": pantalla,
                    "registros": len(fechas),
                    "patron": int(patron),
                    "repeticiones": repeticiones
                })
        if patrones:
            total_repeticiones = sum(p["repeticiones"] for p in patrones)
            patrones_jugadores.append({
                "jugador": jugador,
                "num_patrones": len(patrones),
                "total_repeticiones": total_repeticiones,
                "patrones": patrones
            })

    # 3. Ordenar por más patrones y repeticiones
    patrones_jugadores.sort(key=lambda x: (x["num_patrones"], x["total_repeticiones"]), reverse=True)

    # 4. Mostrar tabla resumen (solo los 30 primeros)
    st.markdown("### 🔎 Tabla de patrones detectados (Top 30 jugadores)")
    resumen = []
    for idx, pj in enumerate(patrones_jugadores[:30], 1):
        resumen.append({
            "Nº": idx,
            "Jugador": pj['jugador'],
            "Patrones": pj['num_patrones'],
            "Repeticiones": pj['total_repeticiones']
        })
    df = pd.DataFrame(resumen)
    st.dataframe(df)

    # 5. Seleccionar un jugador para ver detalles
    jugadores_lista = [pj['jugador'] for pj in patrones_jugadores[:30]]
    jugador_sel = st.selectbox("Selecciona un jugador para ver detalles:", jugadores_lista)
    if jugador_sel:
        pj = next(p for p in patrones_jugadores if p['jugador'] == jugador_sel)
        st.markdown(f"#### 👤 Detalle de patrones para {pj['jugador']}:")
        detalle = []
        for idx, p in enumerate(pj["patrones"], 1):
            h = int(p['patron'] // 3600)
            m = int((p['patron'] % 3600) // 60)
            s = int(p['patron'] % 60)
            patron_str = f"{h}h {m}m {s}s" if h > 0 else (f"{m}m {s}s" if m > 0 else f"{s}s")
            detalle.append({
                "Nº": idx,
                "Pantalla": p['pantalla'],
                "Registros": p['registros'],
                "Patrón": patron_str,
                "Repeticiones": p['repeticiones']
            })
        st.dataframe(pd.DataFrame(detalle))

        # Seleccionar una pantalla para ver repeticiones
        pantallas_lista = [p['pantalla'] for p in pj["patrones"]]
        if pantallas_lista:
            pantalla_sel = st.selectbox("Selecciona una pantalla para ver repeticiones:", pantallas_lista)
            if pantalla_sel:
                patron_sel = next(p['patron'] for p in pj["patrones"] if p['pantalla'] == pantalla_sel)
                # Leer todas las líneas de ese jugador y pantalla
                registros = []
                with open(archivo, "r", encoding="utf-8") as f:
                    for linea in f:
                        partes = linea.strip().split('\t')
                        if len(partes) < 7:
                            continue
                        fecha_str, jugador, _, pantalla, accion, _, cid = partes[:7]
                        if jugador == pj['jugador'] and pantalla == pantalla_sel:
                            try:
                                fecha = datetime.strptime(fecha_str, "%d.%m.%y %H:%M:%S")
                            except Exception:
                                continue
                            registros.append((fecha, accion, cid, linea.strip()))
                # Buscar pares con la diferencia igual al patrón
                registros.sort()
                repeticiones = []
                for i in range(len(registros)-1):
                    diff = (registros[i+1][0] - registros[i][0]).total_seconds()
                    if int(diff) == patron_sel:
                        repeticiones.append((registros[i], registros[i+1]))
                    if len(repeticiones) >= 20:
                        break
                if repeticiones:
                    rep_data = []
                    for idx, (reg1, reg2) in enumerate(repeticiones, 1):
                        fecha1, accion1, cid1, _ = reg1
                        fecha2, accion2, cid2, _ = reg2
                        h = int(patron_sel // 3600)
                        m = int((patron_sel % 3600) // 60)
                        s = int(patron_sel % 60)
                        patron_str = f"{h}h {m}m {s}s" if h > 0 else (f"{m}m {s}s" if m > 0 else f"{s}s")
                        emoji = "🧹" if pantalla_sel.startswith("scavenge") else "🛒" if pantalla_sel.startswith("market") else "⚙️"
                        rep_data.append({
                            "Nº": idx,
                            "Hora Inicio": fecha1.strftime('%d.%m.%y %H:%M:%S'),
                            "Hora Fin": fecha2.strftime('%d.%m.%y %H:%M:%S'),
                            "Patrón": patron_str,
                            "Pantalla > Acción": f"{emoji} {pantalla_sel} > {accion2}",
                            "CID": cid2
                        })
                    st.markdown(f"##### 📋 Repeticiones del patrón en {pantalla_sel} para {pj['jugador']} (máx 20):")
                    st.dataframe(pd.DataFrame(rep_data))
                else:
                    st.warning("No se encontraron repeticiones exactas del patrón en los registros.")

def otros_analisis():
    archivo = utils.config.get_registro_global()
    pantalla_registros = defaultdict(int)
    registros_por_pantalla = defaultdict(list)

    # 1. Leer y agrupar por pantalla
    with open(archivo, "r", encoding="utf-8") as f:
        for linea in f:
            partes = linea.strip().split('\t')
            if len(partes) < 5:
                continue
            fecha_str, jugador, _, pantalla, *_ = partes
            try:
                fecha = datetime.strptime(fecha_str, "%d.%m.%y %H:%M:%S")
            except Exception:
                continue
            pantalla_registros[pantalla] += 1
            registros_por_pantalla[pantalla].append((fecha, jugador, linea.strip()))

    # 2. Mostrar tabla resumen de pantallas con patrones detectados
    pantallas_ordenadas = []
    pantalla_emojis = ["1️⃣ ", "2️⃣ ", "3️⃣ ", "4️⃣ ", "5️⃣ ", "6️⃣ ", "7️⃣ ", "8️⃣ ", "9️⃣ "]
    for pantalla, registros in registros_por_pantalla.items():
        registros_por_jugador = defaultdict(list)
        for fecha, jugador, linea in registros:
            registros_por_jugador[jugador].append((fecha, linea))
        casos = 0
        for jugador, lista in registros_por_jugador.items():
            if len(lista) < 20:
                continue
            lista.sort()
            difs = []
            for i in range(len(lista)-1):
                diff = (lista[i+1][0] - lista[i][0]).total_seconds()
                difs.append((diff, i))
            counter = Counter(int(round(diff/10.0)*10) for diff, _ in difs)
            if not counter:
                continue
            patron, repeticiones = counter.most_common(1)[0]
            if patron < 20 or repeticiones < 10:
                continue
            casos += 1
        if casos > 0:
            pantallas_ordenadas.append((pantalla, casos))
    pantallas_ordenadas = sorted(pantallas_ordenadas, key=lambda x: x[1], reverse=True)[:9]

    st.markdown("### 📊 Menú de pantallas más activas")
    resumen = []
    for idx, (pantalla, casos) in enumerate(pantallas_ordenadas, 1):
        num_emoji = pantalla_emojis[idx-1] if idx <= 9 else str(idx)
        resumen.append({
            "Nº": num_emoji,
            "Pantalla": pantalla,
            "🧩 Casos con Patrón": casos
        })
    st.dataframe(pd.DataFrame(resumen))

    # Seleccionar pantalla para analizar patrones
    pantallas_lista = [pantalla for pantalla, _ in pantallas_ordenadas]
    pantalla_sel = st.selectbox("Selecciona una pantalla para analizar patrones:", pantallas_lista)
    if pantalla_sel:
        registros = registros_por_pantalla[pantalla_sel]
        if len(registros) < 30:
            st.warning("No hay suficientes registros para analizar patrones en esta pantalla.")
            return

        # Buscar patrones por jugador en la pantalla seleccionada
        patrones_encontrados = []
        registros_por_jugador = defaultdict(list)
        for fecha, jugador, linea in registros:
            registros_por_jugador[jugador].append((fecha, linea))

        for jugador, lista in registros_por_jugador.items():
            if len(lista) < 20:
                continue
            lista.sort()
            difs = []
            for i in range(len(lista)-1):
                diff = (lista[i+1][0] - lista[i][0]).total_seconds()
                difs.append((diff, i))
            counter = Counter(int(round(diff/10.0)*10) for diff, _ in difs)
            if not counter:
                continue
            patron, repeticiones = counter.most_common(1)[0]
            if patron < 20 or repeticiones < 10:
                continue
            pares = []
            for diff, idx_dif in difs:
                if abs(diff - patron) <= 10:
                    pares.append((lista[idx_dif], lista[idx_dif+1]))
                if len(pares) >= 20:
                    break
            patrones_encontrados.append((jugador, patron, repeticiones, pares))

        if not patrones_encontrados:
            st.warning("No se encontraron patrones significativos en esta pantalla.")
            return

        # Menú de jugadores con patrones
        jugadores_patron = [jugador for jugador, _, _, _ in patrones_encontrados]
        jugador_sel = st.selectbox("Selecciona un jugador para ver repeticiones:", jugadores_patron)
        if jugador_sel:
            jugador, patron_sel, repeticiones, pares = next(t for t in patrones_encontrados if t[0] == jugador_sel)
            rep_data = []
            for idx, (reg1, reg2) in enumerate(pares, 1):
                fecha1, linea1 = reg1
                fecha2, linea2 = reg2
                partes2 = linea2.split('\t')
                accion2 = partes2[4] if len(partes2) > 4 else ""
                cid2 = partes2[6] if len(partes2) > 6 else ""
                h = int(patron_sel // 3600)
                m = int((patron_sel % 3600) // 60)
                s = int(patron_sel % 60)
                patron_str = f"{h}h {m}m {s}s" if h > 0 else (f"{m}m {s}s" if m > 0 else f"{s}s")
                emoji = "🧹" if pantalla_sel.startswith("scavenge") else "🛒" if pantalla_sel.startswith("market") else "⚙️"
                rep_data.append({
                    "Nº": idx,
                    "Hora Inicio": fecha1.strftime('%d.%m.%y %H:%M:%S'),
                    "Hora Fin": fecha2.strftime('%d.%m.%y %H:%M:%S'),
                    "Patrón": patron_str,
                    "Pantalla > Acción": f"{emoji} {pantalla_sel} > {accion2}",
                    "CID": cid2
                })
            st.markdown(f"##### 📋 Repeticiones del patrón en {pantalla_sel} para {jugador} (máx 20):")
            st.dataframe(pd.DataFrame(rep_data))

