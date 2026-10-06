import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def capture():
    os.makedirs(r"c:\Vibe Coding\screenshots", exist_ok=True)
    
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1100")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    try:
        print("Navigating to http://localhost:8080...")
        driver.get("http://localhost:8080")
        time.sleep(3) # wait for sample pack auto-load and duplicate hashes

        # Screenshot 1: Initial state showing uploaded files, duplicate detected, blocking issues
        shot1 = r"c:\Vibe Coding\screenshots\01_initial_state_and_duplicates.png"
        driver.save_screenshot(shot1)
        print("Saved:", shot1)

        # Trigger Smart Auto-Match button
        auto_btn = driver.find_element(By.ID, "autoMatchBtn")
        auto_btn.click()
        time.sleep(1.5)

        # Screenshot 2: All documents matched with OK status, ready banner, and compliance score
        shot2 = r"c:\Vibe Coding\screenshots\02_document_statuses_verified_ok.png"
        driver.save_screenshot(shot2)
        print("Saved:", shot2)

        # Switch to Bangla
        bangla_btn = driver.find_element(By.ID, "langBtnBn")
        bangla_btn.click()
        time.sleep(1)

        # Screenshot 3: Bangla bilingual UI
        shot3 = r"c:\Vibe Coding\screenshots\03_bangla_bilingual_ui.png"
        driver.save_screenshot(shot3)
        print("Saved:", shot3)

        # Open AI Assistant Modal
        ai_btn = driver.find_element(By.ID, "aiAssistantBtn")
        ai_btn.click()
        time.sleep(1.5)

        # Screenshot 4: AI Compliance Assistant Audit
        shot4 = r"c:\Vibe Coding\screenshots\04_ai_compliance_audit.png"
        driver.save_screenshot(shot4)
        print("Saved:", shot4)

    finally:
        driver.quit()

if __name__ == "__main__":
    capture()
