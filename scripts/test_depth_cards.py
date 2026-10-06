import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

def test_depth_cards():
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
        time.sleep(3)

        ac = ActionChains(driver)

        # 1. Hover over Readiness Meter Card
        meter = driver.find_element(By.CLASS_NAME, "readiness-meter-box")
        ac.move_to_element_with_offset(meter, 30, 20).perform()
        time.sleep(0.6)
        shot1 = r"c:\Vibe Coding\screenshots\05_depth_card_readiness_meter_hover.png"
        driver.save_screenshot(shot1)
        print("Captured:", shot1, "Transform:", meter.value_of_css_property("transform"))

        # 2. Hover over a File Card in the uploads list
        file_cards = driver.find_elements(By.CLASS_NAME, "file-card")
        if file_cards:
            fc = file_cards[0]
            ac.move_to_element_with_offset(fc, 60, 15).perform()
            time.sleep(0.6)
            shot2 = r"c:\Vibe Coding\screenshots\06_depth_card_file_card_hover.png"
            driver.save_screenshot(shot2)
            print("Captured:", shot2, "Transform:", fc.value_of_css_property("transform"))

        # 3. Hover over Package Configuration Options Group
        options_card = driver.find_element(By.CLASS_NAME, "options-group")
        ac.move_to_element_with_offset(options_card, 40, 30).perform()
        time.sleep(0.6)
        shot3 = r"c:\Vibe Coding\screenshots\07_depth_card_options_group_hover.png"
        driver.save_screenshot(shot3)
        print("Captured:", shot3, "Transform:", options_card.value_of_css_property("transform"))

        # 4. Overall view with full auto-match and verified status
        auto_btn = driver.find_element(By.ID, "autoMatchBtn")
        auto_btn.click()
        time.sleep(1.5)

        # Hover over Requirements Panel Card
        req_panel = driver.find_elements(By.CLASS_NAME, "panel-card")[0]
        ac.move_to_element_with_offset(req_panel, 80, 50).perform()
        time.sleep(0.6)
        shot4 = r"c:\Vibe Coding\screenshots\08_depth_card_req_panel_tilt.png"
        driver.save_screenshot(shot4)
        print("Captured:", shot4, "Transform:", req_panel.value_of_css_property("transform"))

    finally:
        driver.quit()

if __name__ == "__main__":
    test_depth_cards()
