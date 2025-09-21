import json
import os
import utils.config



# ========== SELENIUM LOGIN Y GUARDADO DE COOKIES ==========
def selenium_login_and_save_cookies():
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    import time

    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # Descomenta para headless

    driver = webdriver.Chrome(options=chrome_options)
    driver.get(utils.config.LOGIN_URL)
    time.sleep(2)

    driver.find_element(By.NAME, "username").send_keys(utils.config.USERNAME)
    driver.find_element(By.NAME, "password").send_keys(utils.config.PASSWORD)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(2)

    # Si pide 2FA
    try:
        code_input = driver.find_element(By.NAME, "code")
        if code_input.is_displayed():
            code = input("Introduce el código 2FA: ")
            code_input.send_keys(code)
            driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            time.sleep(2)
    except Exception:
        pass

    # Ahora navega al panel de Guerras Tribales
    driver.get("https://es93.guerrastribales.es/admintool/")
    time.sleep(2)

    # Pulsa el botón "Log in" si aparece
    try:
        login_btn = driver.find_element(By.CSS_SELECTOR, "button.login-button")
        if login_btn.is_displayed():
            login_btn.click()
            time.sleep(3)
    except Exception:
        pass

    # Verifica login
    if "Logout" in driver.page_source or "logout" in driver.page_source:
        print("✅ Login correcto con Selenium.")
        cookies = driver.get_cookies()
        # Guarda solo las cookies relevantes para guerrastribales.es
        cookies_dict = {c['name']: c['value'] for c in cookies if 'guerrastribales.es' in c['domain']}
        with open(utils.config.COOKIES_FILE, "w") as f:
            json.dump(cookies_dict, f)
        print(f"Cookies guardadas en {utils.config.COOKIES_FILE}")
    else:
        print("❌ Login fallido. Revisa usuario/contraseña o 2FA.")
        driver.quit()
        exit()

    driver.quit()


# ========== CARGA Y VERIFICACIÓN DE COOKIES ==========
def load_cookies():
    if not os.path.exists(utils.config.COOKIES_FILE):
        return None
    with open(utils.config.COOKIES_FILE, "r") as f:
        return json.load(f)

def verify_cookies(session, headers):
    verif_response = session.get(utils.config.get_admint_url(), headers=headers)
    return ("Logout" in verif_response.text or utils.config.USERNAME in verif_response.text)


def verificar_cookie_y_sesion():
    """
    Verifica y devuelve una sesión autenticada con cookies válidas.
    """
    import requests
    session = requests.Session()
    HEADERS = {"User-Agent": "Mozilla/5.0"}

    # Intenta cargar cookies guardadas
    cookies_dict = load_cookies()
    if cookies_dict:
        session.cookies.update(cookies_dict)
        if not verify_cookies(session, HEADERS):
            print("❌ Cookie caducada o inválida. Iniciando login con Selenium...")
            selenium_login_and_save_cookies()
            cookies_dict = load_cookies()
            session.cookies.update(cookies_dict)
            if verify_cookies(session, HEADERS):
                print("✅ Cookie válida tras login Selenium.")
            else:
                print("❌ No se pudo autenticar. Saliendo.")
                exit()
    else:
        print("No hay cookies guardadas. Iniciando login con Selenium...")
        selenium_login_and_save_cookies()
        cookies_dict = load_cookies()
        session.cookies.update(cookies_dict)
        if verify_cookies(session, HEADERS):
            print("✅ Cookie válida tras login Selenium.")
        else:
            print("❌ No se pudo autenticar. Saliendo.")
            exit()
    return session
