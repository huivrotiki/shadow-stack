#!/usr/bin/env python3
"""Test new features: theme selector, refresh, notifications, versioning, shortcuts"""

from playwright.sync_api import sync_playwright
import time

URL = "http://localhost:8085"


def test_new_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL, wait_until="networkidle")

        # Test 1: Header controls exist
        print("Test 1: Header controls...")
        controls = page.locator(".header-controls")
        assert controls.count() > 0, "Header controls not found"

        # Test 2: Theme selector
        print("Test 2: Theme selector...")
        theme_selector = page.locator("#themeSelector")
        assert theme_selector.count() > 0, "Theme selector not found"
        theme_btns = page.locator(".theme-btn")
        print(f"  Found {theme_btns.count()} theme buttons")
        assert theme_btns.count() >= 5, "Should have at least 5 theme buttons"

        # Test 3: Refresh controls
        print("Test 3: Refresh controls...")
        refresh_select = page.locator("#refreshInterval")
        assert refresh_select.count() > 0, "Refresh interval select not found"
        refresh_btn = page.locator("#refreshToggle")
        assert refresh_btn.count() > 0, "Refresh toggle button not found"

        # Test 4: Notification panel
        print("Test 4: Notification panel...")
        notif_btn = page.locator("button[onclick*='notifPanel']")
        assert notif_btn.count() > 0, "Notification button not found"
        notif_btn.first.click()
        time.sleep(0.3)
        notif_panel = page.locator("#notifPanel.visible")
        assert notif_panel.count() > 0, "Notification panel should be visible"
        notif_badge = page.locator("#notifBadge")
        print(f"  Notification badge: {notif_badge.text_content()}")

        # Test 5: Version panel
        print("Test 5: Version panel...")
        version_btn = page.locator("button[onclick*='versionPanel']")
        assert version_btn.count() > 0, "Version button not found"
        version_btn.first.click()
        time.sleep(0.3)
        version_panel = page.locator("#versionPanel.visible")
        assert version_panel.count() > 0, "Version panel should be visible"

        # Test 6: Shortcuts panel
        print("Test 6: Shortcuts panel...")
        # Close version panel first
        page.locator("#versionPanel .panel-close").click()
        time.sleep(0.2)
        shortcuts_btn = page.locator("button[onclick*='shortcutsPanel']")
        assert shortcuts_btn.count() > 0, "Shortcuts button not found"
        shortcuts_btn.first.click()
        time.sleep(0.3)
        shortcuts_panel = page.locator("#shortcutsPanel.visible")
        assert shortcuts_panel.count() > 0, "Shortcuts panel should be visible"
        shortcuts_list = page.locator("#shortcutsList .shortcut-item")
        print(f"  Found {shortcuts_list.count()} shortcuts")

        # Test 7: Keyboard shortcuts work
        print("Test 7: Keyboard shortcuts...")
        page.keyboard.press("Escape")
        time.sleep(0.2)
        assert page.locator("#shortcutsPanel.visible").count() == 0, (
            "Panel should close on Escape"
        )

        # Test 8: Tab switching with number keys
        print("Test 8: Tab switching with keys...")
        page.keyboard.press("2")
        time.sleep(0.3)
        active_tab = page.locator(".tab.active")
        assert "providers" in active_tab.get_attribute("data-tab"), (
            "Tab 2 should be providers"
        )

        # Test 9: Storage status
        print("Test 9: Storage status...")
        storage_status = page.locator("#storageStatus")
        assert storage_status.count() > 0, "Storage status not found"

        browser.close()
        print("\n✅ All new feature tests passed!")


if __name__ == "__main__":
    test_new_features()
