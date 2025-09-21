import threading
import requests
import utils.config
from bs4 import BeautifulSoup
from utils.selenium import verificar_cookie_y_sesion
import yaml
import os

def fetch_and_save_bans_background():
    """
    Descarga y parsea la tabla de baneos en segundo plano, guardando los datos en el archivo especificado.
    """
    def worker():
        print("⏳ Iniciando actualización de usuarios baneados en segundo plano...")
        url = utils.config.get_bans_url()
        file_path = utils.config.get_bans_file()
        try:
            session = verificar_cookie_y_sesion()
            response = session.get(url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            tables = soup.find_all("table", class_="vis")
            target_table = None
            for t in tables:
                ths = t.find_all("th")
                for th in ths:
                    th_text = th.get_text(strip=True).lower()
                    if th_text in ("name", "nombre", "date", "deadline", "admin", "reason", "remark", "punishment", "restart", "bantype"):
                        target_table = t
                        break
                if target_table:
                    break

            if not target_table:
                print("⚠️ No se encontró la tabla de baneos.")
                return

            rows = target_table.find_all("tr")[1:]  # Saltar cabecera
            bans = []
            for row in rows:
                cols = row.find_all("td")
                if len(cols) < 13:
                    continue
                nombre = cols[0].find("a").text.strip() if cols[0].find("a") else ""
                date = cols[4].text.strip()
                deadline = cols[5].text.strip()
                unban_date = cols[6].text.strip()
                admin = cols[7].text.strip()
                reason = cols[8].text.strip()
                remark = cols[9].text.strip()
                punishment = cols[10].text.strip()
                restart = cols[11].text.strip()
                bantype = cols[12].text.strip()
                bans.append({
                    "nombre": nombre,
                    "date": date,
                    "deadline": deadline,
                    "unban_date": unban_date,
                    "admin": admin,
                    "reason": reason,
                    "remark": remark,
                    "punishment": punishment,
                    "restart": restart,
                    "bantype": bantype
                })

            # Cargar baneos ya guardados (si existe el archivo)
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    bans_dict = yaml.safe_load(f) or {}
            else:
                bans_dict = {}

            nuevos = 0
            nuevos_nombres = []
            for ban in bans:
                key = ban['nombre']
                if key not in bans_dict:
                    bans_dict[key] = {
                        "date": ban['date'],
                        "deadline": ban['deadline'],
                        "unban_date": ban['unban_date'],
                        "admin": ban['admin'],
                        "reason": ban['reason'],
                        "remark": ban['remark'],
                        "punishment": ban['punishment'],
                        "restart": ban['restart'],
                        "bantype": ban['bantype']
                    }
                    nuevos += 1
                    nuevos_nombres.append(key)

            with open(file_path, "w", encoding="utf-8") as f:
                yaml.dump(bans_dict, f, allow_unicode=True, sort_keys=False)

            if nuevos > 0:
                print("✨🛡️  Se han añadido nuevos baneos:")
                for nombre in nuevos_nombres:
                    print(f"   • 🚫 {nombre}")
                print(f"Total añadidos: {nuevos}\n")
            print("🎉 Finalizada la actualización de usuarios baneados.")

        except Exception as e:
            print(f"⚠️ Error al obtener o guardar los baneos: {e}")

    hilo = threading.Thread(target=worker, daemon=True)
    hilo.start()