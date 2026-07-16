#!/usr/bin/env python3
"""Headless Chrome smoke test for FIGHT / RUN via DevTools protocol."""
import json
import subprocess
import sys
import tempfile
import time
import urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL = "http://127.0.0.1:8080/index.html?smoke=1"
PORT = 9222


def wait_for_server(timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen("http://127.0.0.1:8080/", timeout=1) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False


def http_get(url):
    with urllib.request.urlopen(url, timeout=5) as resp:
        return json.loads(resp.read().decode())


def main():
    if not wait_for_server():
        print("FAIL: local server not reachable on :8080")
        return 1

    with tempfile.TemporaryDirectory() as profile:
        chrome = subprocess.Popen(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                f"--remote-debugging-port={PORT}",
                f"--user-data-dir={profile}",
                URL,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            # Wait for page + async smoke tests
            deadline = time.time() + 20
            title = ""
            while time.time() < deadline:
                try:
                    tabs = http_get(f"http://127.0.0.1:{PORT}/json")
                    if not tabs:
                        time.sleep(0.3)
                        continue
                    # Prefer the smoke page tab
                    tab = next((t for t in tabs if "smoke=1" in t.get("url", "")), tabs[0])
                    title = tab.get("title", "")
                    if "button smoke tests passed" in title:
                        print(title)
                        if title.startswith(title.split("/")[0]) and title.split("/")[0].isdigit():
                            passed, total = title.split(" ", 1)[0].split("/")
                            ok = int(passed) == int(total)
                        else:
                            # e.g. "10/10 button smoke tests passed"
                            parts = title.split()
                            frac = parts[0]
                            passed, total = frac.split("/")
                            ok = int(passed) == int(total)
                        print("PASS" if ok else "FAIL", "—", title)
                        return 0 if ok else 1
                except Exception:
                    pass
                time.sleep(0.4)

            print("FAIL: timed out waiting for smoke test title")
            print("Last title:", title or "(none)")
            try:
                print("Tabs:", http_get(f"http://127.0.0.1:{PORT}/json"))
            except Exception as exc:
                print("Could not list tabs:", exc)
            return 1
        finally:
            chrome.terminate()
            try:
                chrome.wait(timeout=5)
            except subprocess.TimeoutExpired:
                chrome.kill()


if __name__ == "__main__":
    sys.exit(main())
