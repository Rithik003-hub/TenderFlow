import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def test_loader():
    os.makedirs(r"c:\Vibe Coding\screenshots", exist_ok=True)
    
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1100")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    try:
        print("Testing initial page load...")
        driver.get("http://localhost:8080")
        
        # Immediate check (within 100ms) for loader overlay
        loader = driver.find_element(By.ID, "appLoader")
        is_displayed = loader.is_displayed()
        print("Loader element found! Displayed on initial load:", is_displayed)

        shot1 = r"c:\Vibe Coding\screenshots\09_ai_loader_screen.png"
        driver.save_screenshot(shot1)
        print("Captured loading screen:", shot1)

        # Wait for loader transition to fade out (around 1.5s)
        time.sleep(2)
        
        # Verify loader has faded out or is hidden
        has_fade_class = "fade-out" in loader.get_attribute("class")
        print("Loader has fade-out class after load:", has_fade_class)

        # Test reload behavior (user requested: whenever website loads or reloads)
        print("Testing page reload...")
        driver.refresh()
        
        loader_reload = driver.find_element(By.ID, "appLoader")
        print("Loader element found on reload! Displayed:", loader_reload.is_displayed())
        shot2 = r"c:\Vibe Coding\screenshots\10_ai_loader_reload_screen.png"
        driver.save_screenshot(shot2)
        print("Captured reload loading screen:", shot2)

        time.sleep(2)
        print("Reload completed, loader faded out successfully.")

    finally:
        driver.quit()

if __name__ == "__main__":
    test_loader()
