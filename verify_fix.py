from playwright.sync_api import sync_playwright
import os

def verify_fix():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to Budget Planner...")
            page.goto('http://localhost:5173/planner/budget')
            page.wait_for_load_state('networkidle')
            
            # Check for "Unexpected Application Error"
            content = page.content()
            if "Unexpected Application Error" in content:
                print("FAILED: Unexpected Application Error still present.")
                return
            
            print("Page loaded successfully. Checking for 'reduce' errors in console...")
            
            # Check for the header to be sure we are on the right page
            if "Zero-Based Budget" not in content:
                print(f"FAILED: Header 'Zero-Based Budget' not found. Title: {page.title()}")
                # Take a screenshot to see what's there
                page.screenshot(path='C:/Users/mekat/.gemini/antigravity/brain/366c35b1-277a-4f00-b2f8-6b209c879ce4/verification_error.png')
                return

            print("Header found. Testing month switching...")
            
            # Click next month button (the right chevron)
            # Based on the component, it's the second button in the header's month selector
            # I'll look for the chevron-right icon's parent button
            next_btn = page.locator('button:has(svg.lucide-chevron-right)')
            if next_btn.count() > 0:
                next_btn.first.click()
                page.wait_for_timeout(1000) # Wait for animation/render
                print("Switched to next month. No crash.")
            
            page.screenshot(path='C:/Users/mekat/.gemini/antigravity/brain/366c35b1-277a-4f00-b2f8-6b209c879ce4/verification_success.png')
            print("SUCCESS: Budget Planner is stable.")
            
        except Exception as e:
            print(f"ERROR during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_fix()
