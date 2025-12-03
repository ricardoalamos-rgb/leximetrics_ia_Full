import asyncio
from playwright.async_api import async_playwright

class PjudScraper:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        # URL proporcionada por el usuario como punto de entrada correcto
        self.base_url = "https://oficinajudicialvirtual.pjud.cl/home/index.php"

    async def start_browser(self, headless=True):
        """Inicia el navegador Playwright."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=headless)
        self.context = await self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        self.page = await self.context.new_page()

    async def close_browser(self):
        """Cierra el navegador."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def __aenter__(self):
        await self.start_browser()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close_browser()

    async def login_clave_unica(self, rut, password):
        """
        Realiza el login usando Clave Única desde el nuevo portal.
        """
        try:
            print(f"Navegando a {self.base_url}...")
            # Aumentar timeout y usar domcontentloaded para ser más tolerante
            await self.page.goto(self.base_url, timeout=60000, wait_until='domcontentloaded')
            # await self.page.wait_for_load_state('networkidle', timeout=60000) # A veces networkidle nunca llega por analytics
            
            # Manejar posibles modales iniciales del portal (ej: Aviso)
            try:
                # Intentar cerrar modal específico que bloquea (Aviso)
                # Buscamos por clase .in (Bootstrap 3/4 open) y botón de cierre
                aviso_modal_btn = self.page.locator(".modal.in button[data-dismiss='modal'], .modal.show button[data-dismiss='modal'], #close-modal")
                if await aviso_modal_btn.count() > 0:
                    print("Cerrando aviso inicial del portal...")
                    # Iterar por si hay múltiples botones visibles
                    count = await aviso_modal_btn.count()
                    for i in range(count):
                        if await aviso_modal_btn.nth(i).is_visible():
                            await aviso_modal_btn.nth(i).click()
                            await asyncio.sleep(0.5)
                
                await asyncio.sleep(1)
            except Exception as e:
                print(f"Nota cerrando modal: {e}")

            # 1. Clic en "Todos los servicios"
            print("Buscando botón 'Todos los servicios'...")
            todos_servicios_btn = self.page.locator("button:has-text('Todos los servicios')").first
            await todos_servicios_btn.wait_for(state="visible", timeout=10000)
            await todos_servicios_btn.click()
            await asyncio.sleep(1)

            # 2. Clic en "Clave Única" dentro del dropdown
            print("Clic en 'Clave Única'...")
            # Buscamos el enlace que contiene la imagen o el texto de Clave Única
            clave_unica_link = self.page.locator("a[onclick*='AutenticaCUnica']").first
            await clave_unica_link.wait_for(state="visible", timeout=5000)
            
            # Esperar navegación tras clic
            async with self.page.expect_navigation(timeout=20000):
                await clave_unica_link.click()
            
            print("Redirección a Clave Única iniciada...")
            await self.page.wait_for_load_state('networkidle')

            # 3. Llenar formulario Clave Única
            print("Llenando credenciales Clave Única...")
            await self.page.fill('input[name="run"]', rut)
            await self.page.fill('input[name="password"]', password)
            
            # Forzar habilitación del botón si es necesario (común en CU)
            await self.page.evaluate("document.getElementById('login-submit').disabled = false")
            
            print("Click en INGRESA...")
            await self.page.screenshot(path="pre_login_click.png")
            async with self.page.expect_navigation(timeout=60000):
                await self.page.click('#login-submit')
            
            print("Esperando redirección post-login...")
            await self.page.wait_for_load_state('networkidle')
            
            # 4. Verificar carga del dashboard y seleccionar perfil si es necesario
            print("Verificando carga del dashboard...")
            
            # Manejar posibles modales de bienvenida o roles post-login
            try:
                # Esperar un poco a que aparezca el modal o el dashboard
                await asyncio.sleep(3)
                
                # Modal de Bienvenida
                welcome_modal_btn = self.page.locator("#modalInfoBienvenida button[data-dismiss='modal'], #btnEntendidoBienvenida")
                if await welcome_modal_btn.count() > 0 and await welcome_modal_btn.first.is_visible():
                    print("Cerrando modal de Bienvenida...")
                    await welcome_modal_btn.first.click()
                    await asyncio.sleep(1)

                # Modal de Roles (si aplica)
                if await self.page.locator("#roles-modal-cambiar").is_visible():
                    print("Seleccionando perfil Abogado...")
                    abogado_card = self.page.locator("div.card-body:has-text('Abogado')").first
                    if await abogado_card.is_visible():
                        await abogado_card.click()
                        print("Perfil Abogado seleccionado.")
                        await asyncio.sleep(2)
                    else:
                        print("No se encontró tarjeta de Abogado. Intentando cerrar modal...")
                        await self.page.click("#roles-modal-cambiar button.close")
            except Exception as e:
                print(f"Error manejando perfil/bienvenida: {e}")

            # Verificar dashboard
            dashboard_ready = False
            for i in range(15): # 15 intentos (30 seg)
                try:
                    # Verificar si el sidebar es visible (ID actualizado a #sidebar)
                    sidebar = self.page.locator("#sidebar")
                    if await sidebar.is_visible():
                        sidebar_text = await sidebar.inner_text()
                        if any(item in sidebar_text for item in ["Mis Causas", "Ingresar Demanda", "Trámite Fácil", "Bandeja"]):
                            print("Dashboard cargado exitosamente.")
                            print(f"Items del sidebar detectados: {sidebar_text[:100]}...") 
                            dashboard_ready = True
                            break
                    
                    await asyncio.sleep(2)
                except Exception as e:
                    pass
            
            if not dashboard_ready:
                print("No se detectó dashboard (timeout).")
                await self.page.screenshot(path="dashboard_load_error.png")
                with open("dashboard_load_error.html", "w", encoding="utf-8") as f:
                    f.write(await self.page.content())
                return False

            return True


        except Exception as e:
            print(f"Error en login Clave Única: {e}")
            await self.page.screenshot(path="login_error.png")
            return False

    async def handle_popups(self):
        """
        Cierra cualquier popup o modal que esté bloqueando la interfaz.
        """
        try:
            print("Verificando popups bloqueantes...")
            # Lista de selectores de modales conocidos
            modals = [
                "#roles-modal.show",
                ".modal.show",
                "#aviso-modal.show"
            ]
            
            for selector in modals:
                try:
                    if await self.page.locator(selector).is_visible():
                        print(f"Cerrando popup detectado: {selector}")
                        close_btn = self.page.locator(f"{selector} .close, {selector} [data-dismiss='modal'], {selector} .btn-secondary")
                        if await close_btn.count() > 0:
                            await close_btn.first.click()
                        else:
                            await self.page.evaluate(f"$('#{selector.replace('#','').replace('.show','')}').modal('hide')")
                        await asyncio.sleep(1)
                except Exception:
                    pass
        except Exception as e:
            print(f"Error manejando popups: {e}")

    async def navigate_to_mis_causas(self):
        """
        Navega a la sección 'Mis Causas'.
        """
        try:
            print("Navegando a Mis Causas...")
            await self.handle_popups()

            # 1. Verificar si ya está visible en el sidebar
            try:
                await self.page.wait_for_selector("#sidebar a", timeout=5000)
                sidebar_text = await self.page.locator("#sidebar").inner_text()
                
                if "Mis Causas" in sidebar_text:
                    print("'Mis Causas' ya es visible en el sidebar.")
                else:
                    print("'Mis Causas' no visible. Intentando forzar carga...")
                    # En el nuevo portal, Mis Causas debería estar siempre ahí.
                    # Si no, tal vez hay que expandir algo?
                    pass

            except Exception as e:
                print(f"Error verificando sidebar: {e}")
            
            # 2. Intentar clickear "Mis Causas"
            # En el nuevo HTML: <a href="#" onclick="misCausas();">... Mis Causas</a>
            mis_causas_link = self.page.locator("#sidebar a").filter(has_text="Mis Causas")
            
            if await mis_causas_link.count() > 0 and await mis_causas_link.first.is_visible():
                print("Click en 'Mis Causas'...")
                await mis_causas_link.first.click()
                await self.page.wait_for_load_state('networkidle')
                await asyncio.sleep(2)
                return True
            else:
                print("No se encontró el enlace 'Mis Causas'.")
                return False

        except Exception as e:
            print(f"Error navegando a Mis Causas: {e}")
            await self.page.screenshot(path="mis_causas_nav_error.png")
            return False

    async def navigate_to_ingreso_demandas(self):
        """
        Navega a 'Ingreso de Demandas'.
        Maneja la apertura de nueva pestaña/ventana.
        """
        try:
            print("Navegando a Ingreso de Demandas...")
            await self.handle_popups()
            
            # Esperar a que el sidebar sea visible
            await self.page.wait_for_selector("#sidebar a", state="visible", timeout=15000)
            
            # Preparar captura de popup
            async with self.page.expect_popup() as popup_info:
                # Intentar JS directo primero
                print("Ejecutando ingresoDemanYEscritos() para abrir popup...")
                # Verificamos si existe, si no clickeamos
                js_check = await self.page.evaluate("typeof ingresoDemanYEscritos")
                if js_check == 'function':
                    await self.page.evaluate("ingresoDemanYEscritos();")
                else:
                    print("JS no encontrado, intentando click...")
                    link = self.page.locator("#sidebar a").filter(has_text="Ing. Demandas y Escritos")
                    if await link.count() > 0:
                        await link.first.click()
                    else:
                        print("No se encontró enlace ni función.")
                        return False
            
            # Obtener la nueva página
            new_page = await popup_info.value
            await new_page.wait_for_load_state('networkidle')
            
            print("Popup detectado y cargado.")
            
            # Actualizar self.page para que los siguientes métodos usen la nueva pestaña
            self.page = new_page
            
            # Verificar si aparece el modal de selección de perfil nuevamente
            try:
                print("Verificando modal de perfil en popup...")
                # Esperar un poco por si el modal aparece
                try:
                    await self.page.wait_for_selector("#roles-modal", state="visible", timeout=5000)
                    print("Modal de perfil detectado en popup.")
                    
                    # Seleccionar Abogado
                    # Buscamos la tarjeta que tenga "Abogado"
                    # El HTML muestra: <p class="card-text ...">Abogado</p>
                    # Y el click es en .pg_card_td_content
                    
                    abogado_card = self.page.locator(".card-body").filter(has_text="Abogado").first
                    if await abogado_card.count() > 0:
                        print("Seleccionando perfil Abogado en popup...")
                        await abogado_card.click()
                        await asyncio.sleep(2)
                    else:
                        print("No se encontró tarjeta de Abogado en el modal del popup.")
                        # Fallback: click en la primera tarjeta
                        first_card = self.page.locator(".pg_card_td_content").first
                        if await first_card.count() > 0:
                            print("Seleccionando primer perfil disponible...")
                            await first_card.click()
                            await asyncio.sleep(2)
                except:
                    print("No apareció modal de perfil en popup (o timeout).")

            except Exception as e:
                print(f"Error manejando perfil en popup: {e}")

            # Verificar carga correcta en la nueva página
            try:
                await self.page.wait_for_selector(".pg_competencia", timeout=15000)
                print("Página de Ingreso de Demandas cargada correctamente (en nueva pestaña).")
                return True
            except:
                print("No se detectó .pg_competencia en la nueva pestaña.")
                await self.page.screenshot(path="ingreso_popup_error.png")
                with open("ingreso_popup_error.html", "w", encoding="utf-8") as f:
                    f.write(await self.page.content())
                return False

        except Exception as e:
            print(f"Error navegando a Ingreso de Demandas: {e}")
            return False

    async def search_mis_causas(self, rit, anio):
        """
        Busca una causa en la sección 'Mis Causas'.
        """
        try:
            print(f"Buscando causa RIT: {rit}, Año: {anio} en Mis Causas...")
            
            # 1. Asegurar que estamos en la pestaña correcta (ej: Suprema, Civil, etc)
            # Por defecto parece cargar Suprema (#tab1).
            
            # 2. Verificar si el filtro está desplegado
            # Debug estado filtro
            filter_container = self.page.locator("#collFiltrosSup")
            is_visible = await filter_container.is_visible()
            classes = await filter_container.get_attribute("class")
            print(f"Estado filtro: visible={is_visible}, classes={classes}")
            
            if not is_visible:
                print("Filtros ocultos. Desplegando...")
                # Click en el label del toggle
                toggle_label = self.page.locator("label[for='filtroMisCauSup']")
                if await toggle_label.count() > 0:
                    await toggle_label.click()
                    await asyncio.sleep(2)
                    
                    # Re-check
                    is_visible_after = await filter_container.is_visible()
                    classes_after = await filter_container.get_attribute("class")
                    print(f"Estado filtro post-click: visible={is_visible_after}, classes={classes_after}")
            
            # Intentar llenar año
            anio_input = self.page.locator("#anhoMisCauSup").first
            
            if await anio_input.count() > 0:
                 await anio_input.wait_for(state="visible", timeout=5000)
                 # Force visibility hack ALWAYS
                 print("Forzando visibilidad de input año...")
                 await anio_input.evaluate("el => { el.style.display = 'block'; el.style.visibility = 'visible'; }")
                 await asyncio.sleep(0.5)
                 
                 await anio_input.fill(str(anio))
            else:
                 print("No se encontró input para Año (Suprema)")

            # Intentar llenar RIT (Rol)
            rit_input = self.page.locator("#rolMisCauSup").first
            if await rit_input.count() > 0:
                 # Force visibility hack ALWAYS
                 await rit_input.evaluate("el => { el.style.display = 'block'; el.style.visibility = 'visible'; }")
                 await rit_input.fill(rit)
            else:
                 print("No se encontró input para Rol (Suprema)")

            # Click en Buscar
            buscar_btn = self.page.locator("#btnConsultaMisCauSup").first
            if await buscar_btn.count() > 0:
                 # Force visibility hack ALWAYS
                 await buscar_btn.evaluate("el => { el.style.display = 'block'; el.style.visibility = 'visible'; }")
                 await buscar_btn.click()
                 await self.page.wait_for_load_state('networkidle')
                 return True
            
            return False

        except Exception as e:
            print(f"Error en search_mis_causas: {e}")
            await self.page.screenshot(path="search_mis_causas_error.png")
            with open("search_mis_causas_error.html", "w", encoding="utf-8") as f:
                f.write(await self.page.content())
            return False

    async def ingreso_demanda(self, file_path=None, data=None):
        """
        Realiza el flujo de ingreso de demanda.
        """
        try:
            print("Iniciando flujo de Ingreso de Demanda...")
            
            # 1. Seleccionar Competencia (Civil, Laboral, etc)
            # Esperar a que aparezcan las tarjetas de competencia
            print("Esperando tarjetas de competencia...")
            await self.page.wait_for_selector(".pg_competencia", timeout=10000)
            
            # Seleccionar la primera o una específica (ej: Civil)
            # Por ahora seleccionamos la primera visible
            competencia_card = self.page.locator(".pg_competencia").first
            await competencia_card.click()
            
            # 2. Esperar a que ocurra algo: Modal o Formulario
            print("Esperando respuesta tras selección (Modal o Formulario)...")
            try:
                # Esperamos cualquiera de los dos
                # Usamos un loop corto para verificar cuál aparece
                modal_visible = False
                form_visible = False
                
                for _ in range(10): # 5 segundos
                    if await self.page.locator("#modalLeerMas").is_visible():
                        modal_visible = True
                        break
                    if await self.page.locator("select").count() > 0:
                        form_visible = True
                        break
                    await asyncio.sleep(0.5)
                
                if modal_visible:
                    print("Modal detectado. Click en Ingresar...")
                    ingresar_btn = self.page.locator("#modalLeerMas button:has-text('Ingresar')")
                    await ingresar_btn.click()
                    await self.page.wait_for_load_state('networkidle')
                elif form_visible:
                    print("Formulario detectado directamente (sin modal).")
                else:
                    print("Advertencia: No se detectó ni modal ni formulario tras click.")
                    
            except Exception as e:
                print(f"Excepción esperando navegación: {e}")

            await asyncio.sleep(2)

            # 3. Llenar formulario (simplificado)
            print("Verificando carga del formulario...")
            if await self.page.locator("select").count() > 0 or await self.page.locator("input").count() > 0:
                print("Formulario cargado correctamente.")
                with open("ingreso_form_success.html", "w", encoding="utf-8") as f:
                    f.write(await self.page.content())
                return True
            else:
                print("No se detectó formulario de ingreso.")
                await self.page.screenshot(path="ingreso_demanda_form_error.png")
                with open("ingreso_form_debug.html", "w", encoding="utf-8") as f:
                    f.write(await self.page.content())
                return False

        except Exception as e:
            print(f"Error en flujo de ingreso de demanda: {e}")
            await self.page.screenshot(path="ingreso_demanda_error.png")
            with open("ingreso_demanda_error.html", "w", encoding="utf-8") as f:
                f.write(await self.page.content())
            return False
            await ingreso_link.wait_for(state="visible", timeout=10000)
            await ingreso_link.click()
            
            # Esperar a que cargue algo relevante
            await self.page.wait_for_load_state('networkidle')
            print("Navegación a Ingreso de Demandas exitosa")
            return True
        except Exception as e:
            print(f"Error navegando a Ingreso de Demandas: {e}")
            await self.page.screenshot(path="ingreso_nav_error.png")
            return False

    async def search_mis_causas(self, rit: str, anio: str, tribunal_id: str = None):
        """
        Busca una causa en 'Mis Causas' usando RIT y Año.
        """
        try:
            print(f"Buscando causa RIT: {rit}, Año: {anio} en Mis Causas...")
            
            # Intentar selectores comunes para RIT y Año
            # RIT suele ser input[name='RIT'] o similar
            rit_input = self.page.locator("input[name='RIT'], input[id*='rit'], input[placeholder*='RIT']")
            anio_input = self.page.locator("input[name='ERA'], input[name='ANIO'], input[id*='era'], input[placeholder*='Año']")
            
            if await rit_input.count() > 0:
                await rit_input.first.fill(rit)
            else:
                print("No se encontró input para RIT")
                
            if await anio_input.count() > 0:
                await anio_input.first.fill(anio)
            else:
                print("No se encontró input para Año")

            # Click en Buscar
            buscar_btn = self.page.locator("button:has-text('Buscar'), input[type='submit'][value='Buscar'], a:has-text('Buscar')")
            if await buscar_btn.count() > 0:
                await buscar_btn.first.click()
                await self.page.wait_for_load_state('networkidle')
                print("Click en Buscar realizado")
                return True
            else:
                print("No se encontró botón Buscar")
                return False

        except Exception as e:
            print(f"Error en search_mis_causas: {e}")
            await self.page.screenshot(path="search_error.png")
            return False



    async def scrape_causas(self, rut: str, password: str):
        """
        Flujo principal para 'Consulta de Causas'.
        """
        if not await self.login_clave_unica(rut, password):
            return []
        
        if not await self.navigate_to_mis_causas():
            return []

        # Prueba de búsqueda
        await self.search_mis_causas("123", "2024")

        # TODO: Implementar extracción real de la tabla
        return [
            {"rol": "C-123-2024", "caratula": "MOCK vs MOCK", "tribunal": "1º Juzgado Civil"}
        ]

async def scrape_case_detail(rut: str, password: str, rit: str, tribunal: str):
    async with PjudScraper() as scraper:
        try:
            # The original logic for scrape_case_detail is largely replaced by the new class methods.
            # This function now acts as an entry point that uses the scraper class.
            # For demonstration, let's assume it performs a login and then a mock scrape.

            if not await scraper.login_clave_unica(rut, password):
                print("Login failed, cannot proceed with case detail scraping.")
                return None

            # Example of using other methods if needed for case detail
            # await scraper.navigate_to_mis_causas()
            # await scraper.navigate_to_ingreso_demandas() # This is for a different flow

            # Mocking delay for verification
            await asyncio.sleep(2)

            # 7. Extract data (Mocked for now, until search flow is verified)
            return {
                "causa": {
                    "rol": rit,
                    "tribunal": tribunal,
                    "caratula": "CARATULA REAL (PENDING)",
                    "estado": "TRAMITACION",
                },
                "gestiones": [],
                "remates": []
            }

        except Exception as e:
            print(f"Error during scraping: {e}")
            # Take screenshot on error for debugging
            await page.screenshot(path="error_screenshot.png")
            raise e
        finally:
            await browser.close()
