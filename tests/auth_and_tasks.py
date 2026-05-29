import os
import sys
from playwright.sync_api import sync_playwright

def main():
    print("=== Initializing E2E Integration Verification Suite ===")
    
    # Path to store screenshot artifact
    artifacts_dir = r"C:\Users\mekat\.gemini\antigravity-ide\brain\d9bb749e-a3ef-4ffe-8121-ea30ff3a5c68"
    os.makedirs(artifacts_dir, exist_ok=True)
    screenshot_path = os.path.join(artifacts_dir, "login_page_screenshot.png")
    
    with sync_playwright() as p:
        print("Launching Chromium in Headless Sandbox...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Test Case 1: Route Protection & Redirect Validation
        print("Navigating to secured route: http://localhost:5173/planner/daily ...")
        page.goto("http://localhost:5173/planner/daily")
        
        print("Waiting for network transitions to settle...")
        page.wait_for_load_state("networkidle")
        
        # Wait up to 5 seconds for the redirect to trigger
        page.wait_for_url("**/auth/login", timeout=5000)
        current_url = page.url
        print(f"Current Location resolved to: {current_url}")
        
        if "/auth/login" in current_url:
            print("ROUTE PROTECTION STATUS: SUCCESS! Unauthorized request correctly redirected to login page.")
        else:
            print("ROUTE PROTECTION STATUS: FAILED! Unauthorized request did not redirect.")
            browser.close()
            sys.exit(1)
            
        # Test Case 2: Render Authenticator Layout Validation
        print("Inspecting login page structure...")
        page.wait_for_selector("text=Identity Access", timeout=5000)
        page.wait_for_selector("input[name='email']", timeout=5000)
        page.wait_for_selector("input[name='password']", timeout=5000)
        page.wait_for_selector("button:has-text('Google Auth Protocol')", timeout=5000)
        
        print("AUTHENTICATION LAYOUT STATUS: SUCCESS! All crucial form fields and indicators are active.")
        
        # Capture Premium Visual Design
        print(f"Capturing visual screenshot to: {screenshot_path}")
        page.screenshot(path=screenshot_path, full_page=True)
        print("SCREENSHOT SECURED SUCCESSFULLY!")
        
        browser.close()
        print("All test vectors resolved optimally with 100% success rate.")
        sys.exit(0)

if __name__ == "__main__":
    main()
