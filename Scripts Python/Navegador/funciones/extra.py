import streamlit as st
import sys
import requests
from bs4 import BeautifulSoup
import yaml
import os


# Función para verificar si el archivo CSV tiene los encabezados correctos
def get_table_with_headers(tables, expected_headers):
    for table in tables:
        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        if headers == expected_headers:
            return table
    return None


# Ya NO se usa pedir_rango_paginas en Streamlit, así que puedes dejarla solo para CLI o eliminarla.
# Si quieres dejarla para compatibilidad CLI, puedes dejarla así, pero no la uses en la app web.

def color_texto(texto, color):
    # Esta función solo tiene sentido en terminal, no en Streamlit.
    # Si quieres colorear texto en Streamlit, usa st.markdown con HTML o emojis.
    return texto

def obtener_estado_ban(player_name):
    """
    Devuelve (ban_status, fecha_expiracion) para el jugador.
    ban_status: None, "permanente", "temporal"
    fecha_expiracion: string o None
    """
    try:
        from utils import config
        bans_file = config.get_bans_file()
        if not os.path.exists(bans_file):
            return None, None

        with open(bans_file, "r", encoding="utf-8") as f:
            bans_dict = yaml.safe_load(f) or {}

        ban_info = bans_dict.get(player_name)
        if not ban_info:
            return None, None

        unban_date = ban_info.get("unban_date", "").strip().lower()
        deadline = ban_info.get("deadline", "").strip()

        if "perm" in unban_date:
            return "permanente", None
        elif unban_date:
            return "temporal", deadline
        else:
            return None, None

    except Exception:
        return None, None