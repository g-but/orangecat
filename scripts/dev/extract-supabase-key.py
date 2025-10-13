#!/usr/bin/env python3

"""
Supabase API Key Extraction Script

This script provides multiple methods to retrieve the fresh anon public API key
from Supabase dashboard and update the .env.local file:

1. Automated browser extraction (requires Selenium)
2. Manual extraction with guided steps
3. Direct API key input and validation

Usage: python3 scripts/extract-supabase-key.py [options]
"""

import os
import re
import sys
import time
import subprocess
from pathlib import Path

# Configuration
PROJECT_REF = "ohkueislstxomdjavyhs"
DASHBOARD_URL = f"https://app.supabase.com/project/{PROJECT_REF}/settings/api"
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ENV_FILE = PROJECT_DIR / ".env.local"

def create_backup():
    """Create a backup of the .env.local file"""
    if not ENV_FILE.exists():
        print(f"❌ Error: .env.local file not found at {ENV_FILE}")
        sys.exit(1)

    backup_file = ENV_FILE.with_suffix(f".local.backup.{int(time.time())}")
    backup_file.write_text(ENV_FILE.read_text())
    print(f"💾 Created backup: {backup_file}")
    return backup_file

def validate_api_key(api_key):
    """Validate the format of the API key"""
    if not api_key:
        return False, "API key is empty"

    if not api_key.startswith('eyJ'):
        return False, "JWT tokens should start with 'eyJ'"

    if '.' not in api_key:
        return False, "JWT tokens should contain dots"

    parts = api_key.split('.')
    if len(parts) != 3:
        return False, "JWT tokens should have exactly 3 parts separated by dots"

    if len(api_key) < 100:
        return False, "API key seems too short"

    return True, "Valid"

def update_env_file(new_api_key):
    """Update the .env.local file with the new API key"""
    content = ENV_FILE.read_text()

    # Pattern to match the existing NEXT_PUBLIC_SUPABASE_ANON_KEY line
    pattern = r'NEXT_PUBLIC_SUPABASE_ANON_KEY=.*'
    replacement = f'NEXT_PUBLIC_SUPABASE_ANON_KEY="{new_api_key}"'

    if re.search(pattern, content):
        # Replace existing key
        new_content = re.sub(pattern, replacement, content)
        print("✅ Updated existing NEXT_PUBLIC_SUPABASE_ANON_KEY")
    else:
        # Add new key
        new_content = content.rstrip() + f"\n{replacement}\n"
        print("✅ Added new NEXT_PUBLIC_SUPABASE_ANON_KEY")

    ENV_FILE.write_text(new_content)
    print("📝 .env.local file updated successfully!")

def try_selenium_extraction():
    """Try to extract API key using Selenium WebDriver"""
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.chrome.options import Options

        print("🤖 Attempting automated extraction with Selenium...")

        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        # Try to use existing Chrome session (if user is logged in)
        chrome_options.add_argument("--user-data-dir=/tmp/chrome_user_data")

        driver = webdriver.Chrome(options=chrome_options)

        try:
            driver.get(DASHBOARD_URL)
            print(f"🌐 Navigated to: {DASHBOARD_URL}")

            # Wait for page to load
            time.sleep(5)

            # Check if we're on login page
            if "login" in driver.current_url or "auth" in driver.current_url:
                print("🔐 Login required. Please log in manually...")
                input("Press Enter after you've logged in and are on the API settings page...")

            # Look for API key using various strategies
            selectors = [
                "[data-testid*='anon']",
                "[data-testid*='api-key']",
                "code",
                "pre",
                ".api-key",
                ".anon-key"
            ]

            api_key = None
            for selector in selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        text = element.text.strip()
                        if text.startswith('eyJ') and len(text) > 100:
                            # Validate JWT format
                            parts = text.split('.')
                            if len(parts) == 3:
                                api_key = text
                                break
                    if api_key:
                        break
                except:
                    continue

            if api_key:
                print("✅ Found API key automatically!")
                return api_key
            else:
                print("❌ Could not find API key automatically")
                return None

        finally:
            driver.quit()

    except ImportError:
        print("⚠️ Selenium not available. Install with: pip install selenium")
        return None
    except Exception as e:
        print(f"❌ Selenium extraction failed: {e}")
        return None

def manual_extraction():
    """Guide user through manual extraction"""
    print("\n🔍 Manual API Key Extraction Guide:")
    print("=" * 50)
    print(f"1. Open your browser and navigate to:")
    print(f"   {DASHBOARD_URL}")
    print()
    print("2. Log in to your Supabase account if prompted")
    print()
    print("3. On the API Settings page, look for:")
    print("   📋 'Project API keys' section")
    print("   🔑 'anon' or 'public' key (starts with 'eyJ')")
    print("   📄 The key should be quite long (200+ characters)")
    print()
    print("4. DOM Elements to look for:")
    print("   • Tables with 'anon' or 'public' in the row")
    print("   • Code blocks or <pre> elements")
    print("   • Copy buttons next to long text strings")
    print("   • Elements with data-testid containing 'anon' or 'api-key'")
    print()
    print("5. CSS Selectors to inspect:")
    print("   • [data-testid*='anon']")
    print("   • [data-testid*='api-key']")
    print("   • table tr:has-text('anon')")
    print("   • code, pre")
    print("   • .api-key, .anon-key")
    print()

    while True:
        api_key = input("🔑 Paste the anon public API key here: ").strip()

        valid, message = validate_api_key(api_key)
        if valid:
            return api_key
        else:
            print(f"❌ Error: {message}")
            print("Please try again or press Ctrl+C to exit.")

def main():
    """Main execution function"""
    print("🚀 Supabase API Key Retrieval Script")
    print(f"📍 Project Reference: {PROJECT_REF}")
    print(f"🌐 Dashboard URL: {DASHBOARD_URL}")
    print()

    # Create backup
    create_backup()

    # Try automated extraction first
    api_key = try_selenium_extraction()

    # Fall back to manual extraction
    if not api_key:
        print("\n🔄 Falling back to manual extraction...")
        api_key = manual_extraction()

    # Final validation
    valid, message = validate_api_key(api_key)
    if not valid:
        print(f"❌ Final validation failed: {message}")
        sys.exit(1)

    print(f"\n✅ API key validation passed")
    print(f"🔑 Key preview: {api_key[:20]}...{api_key[-20:]}")

    # Update .env.local file
    update_env_file(api_key)

    print("\n🎉 Success! API key has been updated in .env.local")
    print("🔧 You can now restart your development server to use the new key")
    print()
    print("To verify the update:")
    print(f"  grep NEXT_PUBLIC_SUPABASE_ANON_KEY {ENV_FILE}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ["--help", "-h"]:
        print(__doc__)
        sys.exit(0)

    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Script cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)