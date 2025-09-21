import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
import re
import numpy as np
import os
import utils.config

# --- Configuración de Colores y Emojis para la Terminal ---
# Códigos ANSI para colores
COLOR_RESET = "\033[0m"
COLOR_BLUE = "\033[94m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_CYAN = "\033[96m"
COLOR_MAGENTA = "\033[95m"
COLOR_BOLD = "\033[1m"
COLOR_UNDERLINE = "\033[4m"

# Emojis
EMOJI_START = "🚀"
EMOJI_SUCCESS = "✅"
EMOJI_INFO = "💡"
EMOJI_WARNING = "⚠️"
EMOJI_ERROR = "❌"
EMOJI_STATS = "📊"
EMOJI_TIME = "⏰"
EMOJI_ACTIVITY = "📈"
EMOJI_SEQUENCE = "🔗"
EMOJI_CONSISTENCY = "🔍"
EMOJI_HUMAN = "👤"
EMOJI_BOT = "🤖"
EMOJI_PAUSE = "⏸️"
EMOJI_MENU = "📋"

# --- 1. Configuración y Carga de Datos ---

# Nombre del archivo de log principal
LOG_FILE = utils.config.get_registro_global() # Asegúrate de que este archivo esté en la misma carpeta o proporciona la ruta completa

def press_enter_to_continue():
    """Pausa la ejecución hasta que el usuario pulse INTRO."""
    print(f"\n{EMOJI_PAUSE}{COLOR_CYAN} Pulsa INTRO para continuar... {COLOR_RESET}")
    input()
    print("-" * 80) # Separador visual

def print_section_header(title, emoji, color):
    """Imprime un encabezado de sección con colores y emojis."""
    print(f"\n{COLOR_BOLD}{color}{emoji} {title} {emoji}{COLOR_RESET}")
    print(f"{COLOR_BOLD}{color}{'=' * len(title)}{COLOR_RESET}")

def load_and_parse_log(file_path):
    """
    Carga el archivo de log y parsea cada línea según el formato estándar del registro.
    Es robusto para nombres largos, espacios y valores 'None' en el pueblo.

    Args:
        file_path (str): Ruta al archivo de log.

    Returns:
        pandas.DataFrame: DataFrame con los datos parseados.
    """
    data = []
    print(f"{EMOJI_INFO}{COLOR_BLUE} Iniciando la carga y el parseo del archivo de log...{COLOR_RESET}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line: # Saltar líneas vacías
                    continue

                parts = line.split('\t')
                # El formato esperado es: timestamp, player, village_full, module, action, owner, session_id
                if len(parts) != 7:
                    print(f"{EMOJI_WARNING}{COLOR_YELLOW} Advertencia: Línea malformada (faltan o sobran campos) en la línea {line_num}: '{line}'{COLOR_RESET}")
                    continue

                timestamp_str, player, village_full, module, action, owner, session_id = parts

                # --- Parseo de Timestamp ---
                try:
                    timestamp = datetime.strptime(timestamp_str, '%d.%m.%y %H:%M:%S')
                except ValueError:
                    print(f"{EMOJI_WARNING}{COLOR_YELLOW} Advertencia: No se pudo parsear la fecha/hora en la línea {line_num}: '{timestamp_str}'{COLOR_RESET}")
                    continue

                # --- Parseo de village_full (nombre, coordenadas, ID de pueblo) ---
                coords = None
                village_id = None
                village_name = None

                if village_full.lower() == 'none':
                    village_name = None # Acciones móviles
                else:
                    # Intentar extraer coordenadas y ID de pueblo
                    # Regex: (.*?) -> nombre del pueblo (no-greedy)
                    # (?:\s+\((\d+\|\d+)\))? -> grupo opcional para (coords)
                    # \s*(?:C(\d+))? -> grupo opcional para C seguido de dígitos (ID de pueblo)
                    coords_id_match = re.search(r'^(.*?)(?:\s+\((\d+\|\d+)\))?\s*(?:C(\d+))?$', village_full)
                    if coords_id_match:
                        village_name = coords_id_match.group(1).strip()
                        coords = coords_id_match.group(2)
                        village_id = coords_id_match.group(3)
                    else:
                        # Fallback si no se encuentra el patrón de coordenadas/ID
                        # Podría ser solo el nombre del pueblo o nombre + ID sin 'C'
                        village_name = village_full.strip()
                        # Intentar extraer ID si es un número al final y no hay coords
                        parts_no_coords = village_full.rsplit(' ', 1)
                        if len(parts_no_coords) == 2 and parts_no_coords[1].isdigit():
                            village_name = parts_no_coords[0].strip()
                            village_id = parts_no_coords[1]

                data.append({
                    'timestamp': timestamp,
                    'player': player,
                    'village_name': village_name,
                    'coords': coords,
                    'village_id': village_id,
                    'module': module,
                    'action': action,
                    'owner': owner,
                    'session_id': session_id
                })
        
        df = pd.DataFrame(data)
        # Asegurarse de que el DataFrame esté ordenado por tiempo
        df = df.sort_values(by='timestamp').reset_index(drop=True)
        print(f"{EMOJI_SUCCESS}{COLOR_GREEN} Carga y parseo completados. Total de {len(df)} entradas de log.{COLOR_RESET}")
        return df
    except FileNotFoundError:
        print(f"{EMOJI_ERROR}{COLOR_RED} Error: El archivo '{file_path}' no fue encontrado. Asegúrate de que la ruta es correcta.{COLOR_RESET}")
        return pd.DataFrame()
    except Exception as e:
        print(f"{EMOJI_ERROR}{COLOR_RED} Error inesperado durante la carga del log: {e}{COLOR_RESET}")
        return pd.DataFrame()

# --- 2. Funciones de Análisis Detalladas ---

def analyze_frequency_and_rhythm(df_player):
    """Realiza análisis de frecuencia y ritmo para un jugador específico."""
    print_section_header("Análisis de Frecuencia y Ritmo", EMOJI_STATS, COLOR_BLUE)

    # --- Frecuencia de Acciones por Tipo ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 📊 Frecuencia de Acciones por Tipo:{COLOR_RESET}")
    action_counts = df_player['action'].value_counts()
    print(action_counts.to_string()) # to_string() para mostrar todas las filas

    plt.figure(figsize=(12, 7))
    sns.barplot(x=action_counts.index, y=action_counts.values, palette='viridis')
    plt.title(f'Frecuencia de Acciones por Tipo para {df_player["player"].iloc[0]}')
    plt.xlabel('Acción')
    plt.ylabel('Conteo')
    plt.xticks(rotation=60, ha='right')
    plt.tight_layout()
    plt.show()
    press_enter_to_continue()

    # --- Intervalos entre Acciones (General) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} ⏰ Intervalos entre Acciones (General):{COLOR_RESET}")
    df_player['time_diff'] = df_player['timestamp'].diff().dt.total_seconds().fillna(0)
    general_intervals = df_player[df_player['time_diff'] > 0]['time_diff'] # Excluir el primer 0

    if not general_intervals.empty:
        print(f"  - Tiempo promedio entre acciones: {general_intervals.mean():.2f} segundos")
        print(f"  - Tiempo mínimo entre acciones: {general_intervals.min():.2f} segundos")
        print(f"  - Tiempo máximo entre acciones: {general_intervals.max():.2f} segundos")
        print(f"  - Desviación estándar de intervalos: {general_intervals.std():.2f} segundos")
        print(f"  - Mediana de intervalos: {general_intervals.median():.2f} segundos")

        plt.figure(figsize=(12, 7))
        sns.histplot(general_intervals, bins=50, kde=True, log_scale=True, color='skyblue')
        plt.title(f'Distribución de Intervalos entre Acciones para {df_player["player"].iloc[0]} (Escala Logarítmica)')
        plt.xlabel('Intervalo (segundos)')
        plt.ylabel('Frecuencia')
        plt.tight_layout()
        plt.show()
    else:
        print(f"{EMOJI_WARNING}{COLOR_YELLOW} No hay suficientes acciones para calcular intervalos generales.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Intervalos entre Acciones Específicas: scavenge_ send_squads ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} ⚔️ Intervalos entre 'scavenge_ send_squads':{COLOR_RESET}")
    scavenge_df = df_player[(df_player['module'] == 'scavenge_') & (df_player['action'] == 'send_squads')].copy()
    
    if not scavenge_df.empty:
        scavenge_df['scavenge_time_diff'] = scavenge_df['timestamp'].diff().dt.total_seconds().fillna(0)
        scavenge_intervals = scavenge_df[scavenge_df['scavenge_time_diff'] > 0]['scavenge_time_diff']
        
        if not scavenge_intervals.empty:
            avg_scavenge = scavenge_intervals.mean()
            median_scavenge = scavenge_intervals.median()
            min_scavenge = scavenge_intervals.min()
            max_scavenge = scavenge_intervals.max()
            std_scavenge = scavenge_intervals.std()

            print(f"  - Promedio: {avg_scavenge:.2f} segundos ({avg_scavenge/60:.2f} minutos)")
            print(f"  - Mediana: {median_scavenge:.2f} segundos ({median_scavenge/60:.2f} minutos)")
            print(f"  - Mínimo: {min_scavenge:.2f} segundos ({min_scavenge/60:.2f} minutos)")
            print(f"  - Máximo: {max_scavenge:.2f} segundos ({max_scavenge/60:.2f} minutos)")
            print(f"  - Desviación estándar: {std_scavenge:.2f} segundos ({std_scavenge/60:.2f} minutos)")

            if std_scavenge < 60 and avg_scavenge > 600: # Baja desviación para un delay alto
                print(f"{EMOJI_BOT}{COLOR_RED} Posible indicador de bot: Muy baja variabilidad para un retraso largo.{COLOR_RESET}")
            if min_scavenge < 60: # Menos de 1 minuto
                 print(f"{EMOJI_WARNING}{COLOR_YELLOW} Advertencia: Intervalo mínimo de saqueo muy bajo ({min_scavenge:.2f}s), podría indicar automatización o reinicios rápidos.{COLOR_RESET}")

            plt.figure(figsize=(12, 7))
            sns.histplot(scavenge_intervals / 60, bins=25, kde=True, color='lightcoral') # En minutos
            plt.title(f'Distribución de Intervalos entre Saqueos para {df_player["player"].iloc[0]} (Minutos)')
            plt.xlabel('Intervalo (minutos)')
            plt.ylabel('Frecuencia')
            plt.tight_layout()
            plt.show()
        else:
            print(f"{EMOJI_WARNING}{COLOR_YELLOW} No hay suficientes acciones de saqueo para calcular intervalos.{COLOR_RESET}")
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron acciones de 'scavenge_ send_squads' para este jugador.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Acciones por Unidad de Tiempo ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🗓️ Acciones por Unidad de Tiempo:{COLOR_RESET}")
    df_player['hour'] = df_player['timestamp'].dt.hour
    df_player['day_of_week'] = df_player['timestamp'].dt.day_name()
    df_player['date'] = df_player['timestamp'].dt.date

    print("\n  - Acciones por Hora del Día:")
    hourly_activity = df_player['hour'].value_counts().sort_index()
    print(hourly_activity.to_string())
    plt.figure(figsize=(12, 7))
    sns.lineplot(x=hourly_activity.index, y=hourly_activity.values, marker='o', color='purple')
    plt.title(f'Número de Acciones por Hora del Día para {df_player["player"].iloc[0]}')
    plt.xlabel('Hora del Día')
    plt.ylabel('Número de Acciones')
    plt.xticks(range(24))
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.show()
    press_enter_to_continue()

    print("\n  - Acciones por Día de la Semana:")
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    daily_activity = df_player['day_of_week'].value_counts().reindex(day_order)
    print(daily_activity.to_string())
    plt.figure(figsize=(12, 7))
    sns.barplot(x=daily_activity.index, y=daily_activity.values, palette='coolwarm')
    plt.title(f'Número de Acciones por Día de la Semana para {df_player["player"].iloc[0]}')
    plt.xlabel('Día de la Semana')
    plt.ylabel('Número de Acciones')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.show()
    press_enter_to_continue()

    print("\n  - Actividad a lo largo del tiempo (por día):")
    daily_total_activity = df_player.groupby('date').size()
    print(daily_total_activity.to_string())
    plt.figure(figsize=(12, 7))
    sns.lineplot(x=daily_total_activity.index, y=daily_total_activity.values, marker='o', color='darkgreen')
    plt.title(f'Actividad Diaria Total para {df_player["player"].iloc[0]}')
    plt.xlabel('Fecha')
    plt.ylabel('Número de Acciones')
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.show()
    press_enter_to_continue()

    # --- Actividad Nocturna/Diurna ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🌙 Actividad Nocturna/Diurna:{COLOR_RESET}")
    # Definimos la noche como 22:00 a 06:00 (ajusta según la zona horaria del jugador si es necesario)
    df_player['is_night'] = df_player['hour'].apply(lambda h: 22 <= h or h < 6)
    night_activity_count = df_player[df_player['is_night']].shape[0]
    day_activity_count = df_player[~df_player['is_night']].shape[0]
    total_activity_count = df_player.shape[0]

    if total_activity_count > 0:
        night_percentage = (night_activity_count / total_activity_count) * 100
        print(f"  - Acciones durante la noche (22:00-06:00): {night_activity_count}")
        print(f"  - Acciones durante el día (06:00-22:00): {day_activity_count}")
        print(f"  - Porcentaje de actividad nocturna: {night_percentage:.2f}%")

        if night_percentage > 25: # Umbral ajustable
            print(f"{EMOJI_BOT}{COLOR_RED} Alerta de Bot: Más del 25% de la actividad ocurre durante la noche, lo cual es inusual para un jugador humano consistente.{COLOR_RESET}")
        
        plt.figure(figsize=(8, 8))
        labels = ['Noche (22:00-06:00)', 'Día (06:00-22:00)']
        sizes = [night_activity_count, day_activity_count]
        colors = ['#4CAF50', '#FFC107'] # Verde para noche (como si "durmiera"), Amarillo para día
        explode = (0.1, 0) if night_percentage > 0 else (0, 0)
        plt.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%', startangle=140, textprops={'fontsize': 12, 'color': 'black'})
        plt.title(f'Distribución de Actividad Diurna/Nocturna para {df_player["player"].iloc[0]}')
        plt.axis('equal') # Asegura que el círculo sea un círculo.
        plt.tight_layout()
        plt.show()
    else:
        print(f"{EMOJI_WARNING}{COLOR_YELLOW} No hay actividad registrada para analizar la distribución diurna/nocturna.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Patrones de Sesión ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} ⏳ Patrones de Sesión:{COLOR_RESET}")
    SESSION_INACTIVITY_THRESHOLD = timedelta(minutes=30) # Umbral para considerar una nueva sesión

    if not df_player.empty:
        df_player['time_diff_session'] = df_player['timestamp'].diff()
        # Una nueva sesión comienza si la diferencia de tiempo es mayor que el umbral
        df_player['session_start'] = (df_player['time_diff_session'] > SESSION_INACTIVITY_THRESHOLD).cumsum()
        df_player['session_id_calc'] = df_player['session_start'] # Renombrar para claridad

        session_durations = df_player.groupby('session_id_calc')['timestamp'].apply(lambda x: x.max() - x.min())
        session_durations_seconds = session_durations.dt.total_seconds()

        if not session_durations_seconds.empty:
            # Filtrar sesiones con duración 0 (una sola acción en la sesión)
            session_durations_seconds = session_durations_seconds[session_durations_seconds > 0]

            print(f"  - Número total de sesiones detectadas (umbral {SESSION_INACTIVITY_THRESHOLD.total_seconds()/60:.0f} min): {len(session_durations_seconds)}")
            if len(session_durations_seconds) > 0:
                print(f"  - Duración promedio de sesión: {session_durations_seconds.mean() / 60:.2f} minutos")
                print(f"  - Duración máxima de sesión: {session_durations_seconds.max() / 60:.2f} minutos")
                print(f"  - Duración mínima de sesión: {session_durations_seconds.min() / 60:.2f} minutos")
                print(f"  - Desviación estándar de duración de sesión: {session_durations_seconds.std() / 60:.2f} minutos")

                if session_durations_seconds.mean() < 10 * 60 and len(session_durations_seconds) > 50: # Promedio < 10min y muchas sesiones
                    print(f"{EMOJI_BOT}{COLOR_RED} Posible indicador de bot: Muchas sesiones muy cortas en promedio. {COLOR_RESET}")

                plt.figure(figsize=(12, 7))
                sns.histplot(session_durations_seconds / 60, bins=30, kde=True, color='teal')
                plt.title(f'Distribución de Duración de Sesiones para {df_player["player"].iloc[0]} (Minutos)')
                plt.xlabel('Duración de Sesión (minutos)')
                plt.ylabel('Frecuencia')
                plt.tight_layout()
                plt.show()
            else:
                print(f"{EMOJI_INFO}{COLOR_CYAN} Todas las sesiones detectadas tienen duración de 0 segundos (una única acción).{COLOR_RESET}")
        else:
            print(f"{EMOJI_WARNING}{COLOR_YELLOW} No hay suficientes datos para determinar patrones de sesión con este umbral.{COLOR_RESET}")
    else:
        print(f"{EMOJI_WARNING}{COLOR_YELLOW} No hay datos de jugador para analizar patrones de sesión.{COLOR_RESET}")
    press_enter_to_continue()


def analyze_sequence_and_behavior(df_player):
    """Realiza análisis de secuencia y comportamiento para un jugador específico."""
    print_section_header("Análisis de Secuencia y Comportamiento", EMOJI_SEQUENCE, COLOR_MAGENTA)

    # --- Secuencias de Acciones Comunes (Módulo -> Acción) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🔗 Secuencias de Acciones Comunes (Módulo -> Acción):{COLOR_RESET}")
    df_player['action_sequence'] = df_player['module'] + ' ' + df_player['action']

    # Secuencias de 2 acciones
    sequences_2 = df_player['action_sequence'].shift(1) + ' -> ' + df_player['action_sequence']
    top_sequences_2 = sequences_2.value_counts().head(15) # Top 15
    print("\n  - Top 15 Secuencias de 2 Acciones:")
    print(top_sequences_2.to_string())
    press_enter_to_continue()

    # Secuencias de 3 acciones (más detallado)
    if len(df_player) >= 3:
        sequences_3 = df_player['action_sequence'].shift(2) + ' -> ' + df_player['action_sequence'].shift(1) + ' -> ' + df_player['action_sequence']
        top_sequences_3 = sequences_3.value_counts().head(10) # Top 10
        print("\n  - Top 10 Secuencias de 3 Acciones:")
        print(top_sequences_3.to_string())
    else:
        print(f"{EMOJI_WARNING}{COLOR_YELLOW} No hay suficientes acciones para analizar secuencias de 3 acciones.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Comportamiento en el Mercado (market) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 💰 Comportamiento en el Mercado ('market'):{COLOR_RESET}")
    market_df = df_player[df_player['module'] == 'market'].copy()
    
    if not market_df.empty:
        # Calcular el tiempo entre begin y confirm (si están en secuencia)
        confirm_delays = []
        for i in range(len(market_df) - 1):
            if market_df.iloc[i]['action'] == 'exchange_begin' and \
               market_df.iloc[i+1]['action'] == 'exchange_confirm' and \
               (market_df.iloc[i+1]['timestamp'] - market_df.iloc[i]['timestamp']).total_seconds() >= 0: # Asegurar orden cronológico
                delay = (market_df.iloc[i+1]['timestamp'] - market_df.iloc[i]['timestamp']).total_seconds()
                confirm_delays.append(delay)
        
        if confirm_delays:
            avg_confirm_delay = np.mean(confirm_delays)
            min_confirm_delay = np.min(confirm_delays)
            max_confirm_delay = np.max(confirm_delays)
            std_confirm_delay = np.std(confirm_delays)

            print(f"  - Tiempo promedio entre 'exchange_begin' y 'exchange_confirm': {avg_confirm_delay:.2f} segundos")
            print(f"  - Tiempo mínimo: {min_confirm_delay:.2f} segundos")
            print(f"  - Tiempo máximo: {max_confirm_delay:.2f} segundos")
            print(f"  - Desviación estándar: {std_confirm_delay:.2f} segundos")

            if min_confirm_delay == 0.00:
                print(f"{EMOJI_BOT}{COLOR_RED} Alerta de Bot: Se detectaron confirmaciones de mercado instantáneas (0.00s). ¡Muy sospechoso de automatización!{COLOR_RESET}")
            if avg_confirm_delay < 2 and std_confirm_delay < 1:
                print(f"{EMOJI_BOT}{COLOR_RED} Alerta de Bot: Tiempos de confirmación de mercado extremadamente rápidos y consistentes. {COLOR_RESET}")
        else:
            print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron secuencias 'exchange_begin' -> 'exchange_confirm' válidas.{COLOR_RESET}")

        # Frecuencia de otros tipos de acciones de mercado
        market_other_actions = market_df[~market_df['action'].isin(['exchange_begin', 'exchange_confirm'])]['action'].value_counts()
        if not market_other_actions.empty:
            print("\n  - Otras acciones de mercado:")
            print(market_other_actions.to_string())
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron acciones del módulo 'market' para este jugador.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Interacciones con "Botcheck" ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🛡️ Interacciones con 'botcheck':{COLOR_RESET}")
    botcheck_df = df_player[df_player['module'] == 'botcheck'].copy()
    
    if not botcheck_df.empty:
        verify_delays = []
        for i in range(len(botcheck_df) - 1):
            if botcheck_df.iloc[i]['action'] == 'begin' and \
               botcheck_df.iloc[i+1]['action'] == 'verify' and \
               (botcheck_df.iloc[i+1]['timestamp'] - botcheck_df.iloc[i]['timestamp']).total_seconds() >= 0:
                delay = (botcheck_df.iloc[i+1]['timestamp'] - botcheck_df.iloc[i]['timestamp']).total_seconds()
                verify_delays.append(delay)
        
        if verify_delays:
            avg_verify_delay = np.mean(verify_delays)
            min_verify_delay = np.min(verify_delays)
            max_verify_delay = np.max(verify_delays)
            std_verify_delay = np.std(verify_delays)

            print(f"  - Tiempo promedio entre 'botcheck begin' y 'verify': {avg_verify_delay:.2f} segundos")
            print(f"  - Tiempo mínimo: {min_verify_delay:.2f} segundos")
            print(f"  - Tiempo máximo: {max_verify_delay:.2f} segundos")
            print(f"  - Desviación estándar: {std_verify_delay:.2f} segundos")

            if avg_verify_delay < 2 and std_verify_delay < 0.5:
                print(f"{EMOJI_BOT}{COLOR_RED} Alerta de Bot: Tiempos de verificación de botcheck extremadamente rápidos y consistentes. {COLOR_RESET}")
            elif avg_verify_delay > 5 and std_verify_delay > 1:
                print(f"{EMOJI_HUMAN}{COLOR_GREEN} Comportamiento Humano: Los tiempos de verificación de botcheck sugieren una respuesta humana normal.{COLOR_RESET}")
        else:
            print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron secuencias 'botcheck begin' -> 'verify' válidas.{COLOR_RESET}")
        
        botcheck_counts = botcheck_df['action'].value_counts()
        print("\n  - Frecuencia de acciones de botcheck:")
        print(botcheck_counts.to_string())
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron acciones del módulo 'botcheck' para este jugador.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Actividad de Construcción y Entrenamiento (main, barracks) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🏗️ Actividad de Construcción y Entrenamiento:{COLOR_RESET}")
    building_train_df = df_player[df_player['module'].isin(['main', 'barracks'])].copy()
    
    if not building_train_df.empty:
        print("  - Frecuencia de acciones de construcción y entrenamiento:")
        print(building_train_df['action'].value_counts().to_string())
        
        # Análisis de secuencias de construcción en el mismo pueblo
        upgrade_sequences = []
        upgrades_df = df_player[(df_player['module'] == 'main') & (df_player['action'] == 'upgrade_building')].copy()
        for i in range(len(upgrades_df) - 1):
            if upgrades_df.iloc[i]['village_id'] == upgrades_df.iloc[i+1]['village_id'] and \
               (upgrades_df.iloc[i+1]['timestamp'] - upgrades_df.iloc[i]['timestamp']).total_seconds() < 60: # Menos de 1 minuto entre upgrades en el mismo pueblo
                upgrade_sequences.append(f"Upgrade en {upgrades_df.iloc[i]['village_name']} -> Upgrade en {upgrades_df.iloc[i+1]['village_name']} (diff: {(upgrades_df.iloc[i+1]['timestamp'] - upgrades_df.iloc[i]['timestamp']).total_seconds():.0f}s)")
        
        if upgrade_sequences:
            print("\n  - Secuencias de mejoras de edificios rápidas en el mismo pueblo:")
            for seq in upgrade_sequences:
                print(f"    - {seq}")
            if len(upgrade_sequences) > 5: # Umbral ajustable
                print(f"{EMOJI_BOT}{COLOR_RED} Posible indicador de bot: Múltiples mejoras de edificios muy rápidas y consecutivas en el mismo pueblo.{COLOR_RESET}")
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron acciones de construcción o entrenamiento para este jugador.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Interacción con Eventos Diarios/Bonificaciones (daily_bon) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🎁 Interacción con Eventos Diarios/Bonificaciones ('daily_bon'):{COLOR_RESET}")
    daily_bon_df = df_player[df_player['module'] == 'daily_bon'].copy()
    
    if not daily_bon_df.empty:
        print("  - Frecuencia de acciones de bonificación diaria:")
        print(daily_bon_df['action'].value_counts().to_string())

        if 'open' in daily_bon_df['action'].values:
            open_times = daily_bon_df[daily_bon_df['action'] == 'open']['timestamp'].sort_values()
            if len(open_times) > 1:
                daily_open_intervals = open_times.diff().dt.total_seconds().dropna()
                print("\n  - Intervalos entre aperturas de bonificación diaria:")
                print(f"    - Promedio: {daily_open_intervals.mean()/3600:.2f} horas")
                print(f"    - Desviación estándar: {daily_open_intervals.std()/3600:.2f} horas")
                if daily_open_intervals.std() < 3600: # Menos de 1 hora de desviación
                    print(f"{EMOJI_BOT}{COLOR_RED} Posible indicador de bot: La bonificación diaria se abre con una precisión inusualmente alta (baja desviación estándar).{COLOR_RESET}")
            else:
                print(f"{EMOJI_INFO}{COLOR_CYAN} Solo una apertura de bonificación diaria registrada.{COLOR_RESET}")
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron acciones del módulo 'daily_bon' para este jugador.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Cambios de Configuración (settings push) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} ⚙️ Cambios de Configuración ('settings push'):{COLOR_RESET}")
    settings_push_df = df_player[(df_player['module'] == 'settings') & (df_player['action'] == 'push')].copy()
    
    if not settings_push_df.empty:
        print(f"  - Se detectaron {len(settings_push_df)} cambios de configuración.")
        if len(settings_push_df) > 1:
            settings_intervals = settings_push_df['timestamp'].diff().dt.total_seconds().dropna()
            print("  - Intervalos entre cambios de configuración (segundos):")
            print(f"    - Promedio: {settings_intervals.mean():.2f}")
            print(f"    - Mínimo: {settings_intervals.min():.2f}")
            print(f"    - Máximo: {settings_intervals.max():.2f}")
            print(f"    - Desviación estándar: {settings_intervals.std():.2f}")
            if settings_intervals.mean() < 300 and settings_intervals.std() < 60: # Muy frecuentes y consistentes
                print(f"{EMOJI_BOT}{COLOR_RED} Posible indicador de bot: Cambios de configuración muy frecuentes y regulares.{COLOR_RESET}")
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No se encontraron acciones de 'settings push' para este jugador.{COLOR_RESET}")
    press_enter_to_continue()


def analyze_consistency_and_anomalies(df_player):
    """Realiza análisis de consistencia y anomalías para un jugador específico."""
    print_section_header("Análisis de Consistencia y Anomalías", EMOJI_CONSISTENCY, COLOR_YELLOW)

    # --- Consistencia de Coordenadas/Pueblo ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🏠 Consistencia de Coordenadas/Pueblo:{COLOR_RESET}")
    unique_villages = df_player[['village_name', 'coords', 'village_id']].drop_duplicates().dropna(how='all')
    
    if not unique_villages.empty:
        if len(unique_villages) > 1:
            print(f"  - El jugador opera desde {len(unique_villages)} ubicaciones/pueblos diferentes:")
            print(unique_villages.to_string(index=False))
            # Distribución de acciones por pueblo
            village_activity = df_player.groupby(['village_name', 'coords', 'village_id']).size().sort_values(ascending=False)
            print("\n  - Distribución de acciones por pueblo/ubicación:")
            print(village_activity.to_string())
        else:
            print(f"  - El jugador opera consistentemente desde un único pueblo/ubicación:")
            print(unique_villages.to_string(index=False))
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No se pudo determinar la consistencia del pueblo/coordenadas (quizás solo acciones móviles).{COLOR_RESET}")
    press_enter_to_continue()

    # --- Consistencia de ID de Sesión ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🆔 Consistencia de ID de Sesión:{COLOR_RESET}")
    session_id_counts = df_player['session_id'].value_counts()
    print("  - Frecuencia de IDs de Sesión:")
    print(session_id_counts.to_string())
    
    if len(session_id_counts) > 1:
        print(f"{EMOJI_INFO}{COLOR_CYAN} Se observan múltiples IDs de sesión. Esto es normal para inicios/cierres de sesión o cambios de dispositivo.{COLOR_RESET}")
        # Puedes investigar si hay un ID dominante y otros esporádicos
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} Se observa un único ID de sesión en todo el log para este jugador.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Detección de "Spikes" o "Gaps" (usando intervalos generales) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 📉 Detección de 'Spikes' (picos) o 'Gaps' (huecos) de Actividad:{COLOR_RESET}")
    df_player['time_diff_gap'] = df_player['timestamp'].diff().dt.total_seconds().fillna(0)
    
    # Gaps (huecos largos de inactividad)
    LONG_INACTIVITY_THRESHOLD_HOURS = 2 # 2 horas de inactividad
    LONG_INACTIVITY_THRESHOLD_SECONDS = LONG_INACTIVITY_THRESHOLD_HOURS * 3600
    long_gaps = df_player[df_player['time_diff_gap'] > LONG_INACTIVITY_THRESHOLD_SECONDS]
    
    if not long_gaps.empty:
        print(f"  - Se detectaron {len(long_gaps)} huecos de inactividad mayores a {LONG_INACTIVITY_THRESHOLD_HOURS} horas:")
        for idx, row in long_gaps.iterrows():
            print(f"    - Inactividad de {row['time_diff_gap']/3600:.2f} horas antes de la acción en {row['timestamp']}")
        print(f"{EMOJI_HUMAN}{COLOR_GREEN} Comportamiento Humano: La presencia de huecos largos de inactividad sugiere pausas humanas (dormir, trabajar, etc.).{COLOR_RESET}")
    else:
        print(f"  - No se detectaron huecos de inactividad mayores a {LONG_INACTIVITY_THRESHOLD_HOURS} horas.")
        print(f"{EMOJI_BOT}{COLOR_RED} Posible indicador de bot: Actividad continua sin pausas prolongadas (más de {LONG_INACTIVITY_THRESHOLD_HOURS} horas).{COLOR_RESET}")
    press_enter_to_continue()

    # Spikes (picos de actividad - acciones muy rápidas en un corto período)
    # Esto es más complejo y requiere una ventana deslizante
    print("\n  - Detección de Picos de Actividad (acciones muy rápidas):")
    WINDOW_SIZE_SECONDS = 60 # Ventana de 60 segundos (1 minuto)
    MIN_ACTIONS_IN_WINDOW = 5 # Mínimo de 5 acciones en esa ventana para ser un pico
    
    if len(df_player) > 1:
        df_player = df_player.sort_values('timestamp').reset_index(drop=True)
        df_player = df_player.set_index('timestamp')
        df_player['rolling_actions'] = df_player['action'].rolling(f'{WINDOW_SIZE_SECONDS}s', closed='right').count().values
        df_player = df_player.reset_index()
        spikes = df_player[df_player['rolling_actions'] >= MIN_ACTIONS_IN_WINDOW]
        
        if not spikes.empty:
            print(f"    - Se detectaron picos de actividad (al menos {MIN_ACTIONS_IN_WINDOW} acciones en {WINDOW_SIZE_SECONDS} segundos):")
            for idx, row in spikes.drop_duplicates(subset=['timestamp']).iterrows(): # Mostrar solo el inicio del pico
                print(f"      - {row['rolling_actions']:.0f} acciones alrededor de {row['timestamp']} (ej. {row['module']} {row['action']})")
            print(f"{EMOJI_BOT}{COLOR_RED} Posible indicador de bot: Picos de actividad con muchas acciones en muy poco tiempo, lo cual es difícil para un humano.{COLOR_RESET}")
        else:
            print(f"    - No se detectaron picos de actividad significativos (menos de {MIN_ACTIONS_IN_WINDOW} acciones en {WINDOW_SIZE_SECONDS} segundos).")
    else:
        print(f"{EMOJI_INFO}{COLOR_CYAN} No hay suficientes datos para detectar picos de actividad.{COLOR_RESET}")
    press_enter_to_continue()

    # --- Errores o Fallos (si el log los registra) ---
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} 🐛 Detección de Errores o Fallos:{COLOR_RESET}")
    # En este log no hay una columna explícita de "errores".
    # Podríamos buscar acciones que impliquen un fallo o reintentos rápidos.
    # Por ejemplo, si un 'login' es seguido rápidamente por otro 'login' sin otras acciones,
    # o si hay muchas acciones de 'api' que podrían indicar un fallo.
    
    # Para este log, no hay una forma directa de detectar "fallos" sin más contexto del juego.
    # Si el juego registra "failed_action", "error_code", etc., se buscarían esas palabras clave.
    print(f"  - Este log no contiene una columna explícita de errores/fallos.")
    print(f"  - Para detectar fallos, necesitaríamos acciones como 'failed_login' o códigos de error en el log.")
    print(f"{EMOJI_INFO}{COLOR_CYAN} Si el log tuviera más detalles, aquí se analizarían patrones de reintentos o errores.{COLOR_RESET}")
    press_enter_to_continue()


def conceptual_comparative_analysis():
    """Describe el análisis comparativo, ya que no tenemos otros logs."""
    print_section_header("Análisis Comparativo (Conceptual)", EMOJI_HUMAN, COLOR_GREEN)
    print(f"{EMOJI_INFO}{COLOR_CYAN} Este análisis es fundamental para una conclusión definitiva sobre el comportamiento.{COLOR_RESET}")
    print("Para un análisis comparativo efectivo, necesitarías logs de:")
    print(f"  - {EMOJI_HUMAN} Jugadores humanos 'normales' (para establecer una línea base de comportamiento esperable).")
    print(f"  - {EMOJI_BOT} Bots conocidos (si es posible, para identificar patrones de bot).")
    print("\nCon estos datos, podrías:")
    print("  - Comparar las distribuciones de frecuencia e intervalos de acciones (¿son los intervalos del jugador analizado más 'cuadrados' o 'picudos' que los humanos?).")
    print("  - Identificar si las 'rutinas' del jugador analizado son más rígidas y repetitivas que las de un humano (ej. siempre la misma secuencia de 5 acciones).")
    print("  - Ver si los horarios de actividad (ej. actividad 24/7 sin pausas prolongadas) se alinean con bots o humanos.")
    print("  - Cuantificar las diferencias en la rapidez de respuesta a eventos (ej. botcheck, ¿el bot es siempre instantáneo mientras el humano tarda?).")
    print("  - Analizar la diversidad de acciones: ¿un bot se limita a unas pocas acciones clave mientras un humano explora más el juego?")
    print("\n{COLOR_BOLD}{COLOR_CYAN} Sin datos comparativos, cualquier conclusión es una inferencia basada en patrones generales de bots.{COLOR_RESET}")
    press_enter_to_continue()


def main_analysis_flow():
    """Flujo principal para cargar datos, seleccionar jugador y ejecutar análisis."""
    print(f"{EMOJI_START}{COLOR_BOLD}{COLOR_MAGENTA} ¡Bienvenido al Analizador de Registros de Jugadores de Tribal Wars! {EMOJI_START}{COLOR_RESET}")
    print(f"{EMOJI_INFO}{COLOR_CYAN} Este script te ayudará a desentrañar los patrones de actividad de tus jugadores.{COLOR_RESET}")
    press_enter_to_continue()

    df_full = load_and_parse_log(LOG_FILE)

    if df_full.empty:
        print(f"{EMOJI_ERROR}{COLOR_RED} No se pudieron cargar datos del log. Saliendo del programa.{COLOR_RESET}")
        return

    # Mostrar los 30 jugadores con más acciones
    player_counts = df_full['player'].value_counts().head(30)
    print_section_header("Top 30 jugadores con más acciones", EMOJI_MENU, COLOR_BLUE)
    print(f"{EMOJI_INFO}{COLOR_CYAN} Los 30 jugadores con más acciones en el log:{COLOR_RESET}")
    for i, (player, count) in enumerate(player_counts.items(), 1):
        print(f"  {i}. {COLOR_BOLD}{player}{COLOR_RESET} ({count} acciones)")
    print(f"\n{EMOJI_INFO}{COLOR_CYAN} Escribe el nombre exacto del jugador que deseas analizar, o 's' para salir:{COLOR_RESET}")

    while True:
        choice = input(f"{COLOR_BOLD}{COLOR_YELLOW}Jugador a analizar: {COLOR_RESET}").strip()
        if choice.lower() == 's':
            print(f"{EMOJI_SUCCESS}{COLOR_GREEN} Saliendo del analizador. ¡Hasta pronto! 👋{COLOR_RESET}")
            break

        selected_player = choice
        df_player = df_full[df_full['player'] == selected_player].copy()

        if df_player.empty:
            print(f"{EMOJI_WARNING}{COLOR_YELLOW} No hay entradas de log para el jugador '{selected_player}'. Por favor, escribe otro nombre o 's' para salir.{COLOR_RESET}")
            continue

        print(f"{EMOJI_SUCCESS}{COLOR_GREEN} Analizando el comportamiento de: {COLOR_BOLD}{selected_player}{COLOR_RESET}")
        print(f"{EMOJI_INFO}{COLOR_CYAN} Resumen de las primeras y últimas entradas para {selected_player}:{COLOR_RESET}")
        print("\nPrimeras 5 entradas:")
        print(df_player.head().to_string())
        print("\nÚltimas 5 entradas:")
        print(df_player.tail().to_string())
        press_enter_to_continue()

        # --- Ejecutar todos los análisis para el jugador seleccionado ---
        analyze_frequency_and_rhythm(df_player)
        analyze_sequence_and_behavior(df_player)
        analyze_consistency_and_anomalies(df_player)
        conceptual_comparative_analysis()

        print(f"\n{EMOJI_SUCCESS}{COLOR_GREEN} Análisis completo para {COLOR_BOLD}{selected_player}{COLOR_RESET}.{COLOR_RESET}")
        print(f"{EMOJI_INFO}{COLOR_CYAN} Puedes analizar otro jugador o pulsa 's' para salir.{COLOR_RESET}")
