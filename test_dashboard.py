"""
Dashboard Test - LOOP 3
Tests: Navigation, Neural Animation, Tab switching
"""

from playwright.sync_api import sync_playwright
import time

DASHBOARD_URL = "https://health-dashboard-zeta-tawny.vercel.app"


def test_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        print("🧪 Testing Shadow Stack Dashboard...")

        # Test 1: Load page
        page.goto(DASHBOARD_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)  # Wait for JS to initialize
        print("✅ Page loaded successfully")

        # Test 2: Check title
        title = page.title()
        assert "Shadow Stack" in title, f"Title mismatch: {title}"
        print(f"✅ Title correct: {title}")

        # Test 3: Check sidebar exists
        sidebar = page.locator(".sidebar")
        assert sidebar.is_visible(), "Sidebar not visible"
        print("✅ Sidebar visible")

        # Test 4: Check nav items
        nav_items = page.locator(".nav-item").all()
        assert len(nav_items) >= 8, f"Expected 8 nav items, got {len(nav_items)}"
        print(f"✅ Nav items: {len(nav_items)}")

        # Test 5: Check dashboard tab active
        dashboard_tab = page.locator(".tab.active")
        assert dashboard_tab.is_visible(), "No active tab"
        print("✅ Dashboard tab active")

        # Test 6: Click Providers tab via sidebar nav-item
        page.locator('.nav-item[data-tab="providers"]').click()
        page.wait_for_timeout(500)
        providers_content = page.locator("#tab-providers")
        assert providers_content.is_visible(), "Providers tab not visible"
        print("✅ Providers tab works (sidebar nav)")

        # Test 7: Click AI Neural tab via top tabs
        page.locator('.tab[data-tab="neural"]').click()
        page.wait_for_timeout(500)
        neural_canvas = page.locator("#fullNeural")
        assert neural_canvas.is_visible(), "Neural canvas not visible"
        print("✅ Neural tab works (top tabs)")

        # Test 8: Click Architecture tab via sidebar
        page.locator('.nav-item[data-tab="architecture"]').click()
        page.wait_for_timeout(500)
        arch_content = page.locator("#tab-architecture")
        assert arch_content.is_visible(), "Architecture tab not visible"
        print("✅ Architecture tab works")

        # Test 9: Back to dashboard
        page.locator('.tab[data-tab="dashboard"]').click()
        page.wait_for_timeout(500)
        hero = page.locator("#heroNeural")
        assert hero.is_visible(), "Hero neural canvas not visible"
        print("✅ Dashboard with neural hero works")

        # Test 10: Take screenshot
        page.screenshot(
            path="/Users/work/shadow-stack/dashboard-test.png", full_page=False
        )
        print("✅ Screenshot saved")

        browser.close()
        print("\n🎉 ALL TESTS PASSED!")


if __name__ == "__main__":
    test_dashboard()
