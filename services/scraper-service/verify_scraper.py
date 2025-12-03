import asyncio
import os
import sys

# Add app path to sys.path so we can import the scraper module
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(current_dir, 'app')
sys.path.append(app_dir)

from scraper.pjud import PjudScraper
import inspect
import sys
print(f"Loaded PjudScraper from: {inspect.getfile(PjudScraper)}")
print(f"sys.path: {sys.path}")

async def main():
    print("Starting Scraper Verification...")
    scraper = PjudScraper()
    async with scraper:
        # Credentials provided by user
        rut = "16360219-9"
        password = "Messi.Cagon8"
        
        print("\n--- 1. Testing Login with Clave Única ---")
        # This method includes logic to close the "Aviso" modal
        success = await scraper.login_clave_unica(rut, password)
        if not success:
            print("❌ Login failed! Aborting.")
            return
        print("✅ Login successful.")

        print("\n--- 2. Testing Navigation to 'Mis Causas' ---")
        if await scraper.navigate_to_mis_causas():
            print("✅ Navigated to Mis Causas.")
            
            print("\n--- 3. Testing Search Form in 'Mis Causas' ---")
            # Using mock data to test selector interaction
            await scraper.search_mis_causas("C-123-2024", "2024")
        else:
            print("❌ Failed to navigate to Mis Causas.")

        print("\n--- 4. Testing Navigation to 'Ingreso de Demandas' ---")
        if await scraper.navigate_to_ingreso_demandas():
            print("✅ Navigated to Ingreso de Demandas.")
            
            print("\n--- 5. Testing Form Filling in 'Ingreso de Demandas' ---")
            # Debug: Inspect method signature
            import inspect
            print(f"Method signature: {inspect.signature(scraper.ingreso_demanda)}")
            
            # Testing dropdown selection and file upload (mock path)
            await scraper.ingreso_demanda(file_path="mock_document.pdf")
        else:
            print("❌ Failed to navigate to Ingreso de Demandas.")

    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(main())
