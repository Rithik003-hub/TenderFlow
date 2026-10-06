import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def capture():
    os.makedirs(r"c:\Vibe Coding\screenshots", exist_ok=True)
    
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1200")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    try:
        print("Navigating to http://localhost:8080...")
        driver.get("http://localhost:8080")
        time.sleep(3)

        # Trigger Smart Auto-Match button
        auto_btn = driver.find_element(By.ID, "autoMatchBtn")
        auto_btn.click()
        time.sleep(1.5)

        # Click Generate Package button in browser
        gen_btn = driver.find_element(By.ID, "generatePackageBtn")
        driver.execute_script("arguments[0].scrollIntoView();", gen_btn)
        time.sleep(0.5)
        gen_btn.click()
        time.sleep(3.5) # wait for pdf-lib to assemble and update UI

        # Screenshot 5: Package Generation and Download Ready
        shot5 = r"c:\Vibe Coding\screenshots\05_package_generated_and_download_ready.png"
        driver.save_screenshot(shot5)
        print("Saved:", shot5)

    finally:
        driver.quit()

if __name__ == "__main__":
    capture()
