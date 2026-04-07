#!/usr/bin/env python3
"""
Kids Chore App - Local Server
Run: python3 server.py
Then open: http://localhost:8080
"""

import http.server
import json
import os
import sys
import urllib.parse
from pathlib import Path

PORT = 8080
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "assets" / "data"
USER_DATA_FILE = DATA_DIR / "user-data.json"
TEMPLATES_DIR = DATA_DIR / "templates"


class AppHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def log_message(self, format, *args):
        # Clean logs
        print(f"  {self.command} {self.path} → {args[1]}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, msg, status=400):
        self.send_json({"error": msg}, status)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # API: get user data
        if path == "/api/user-data":
            if USER_DATA_FILE.exists():
                data = json.loads(USER_DATA_FILE.read_text(encoding="utf-8"))
                self.send_json(data)
            else:
                self.send_json({"exists": False}, 404)
            return

        # API: list templates
        if path == "/api/templates":
            templates = []
            for f in sorted(TEMPLATES_DIR.glob("*.json")):
                t = json.loads(f.read_text(encoding="utf-8"))
                templates.append({"id": f.stem, "label": t.get("label", f.stem)})
            self.send_json(templates)
            return

        # API: get a specific template
        if path.startswith("/api/templates/"):
            name = path.split("/api/templates/")[1].strip("/")
            tfile = TEMPLATES_DIR / f"{name}.json"
            if tfile.exists():
                self.send_json(json.loads(tfile.read_text(encoding="utf-8")))
            else:
                self.send_error_json("Template not found", 404)
            return

        # Serve static files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # API: save user data
        if path == "/api/user-data":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode("utf-8"))
                DATA_DIR.mkdir(parents=True, exist_ok=True)
                USER_DATA_FILE.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
                )
                self.send_json({"ok": True})
            except Exception as e:
                self.send_error_json(str(e))
            return

        # API: delete user data (reset)
        if path == "/api/user-data/reset":
            if USER_DATA_FILE.exists():
                USER_DATA_FILE.unlink()
            self.send_json({"ok": True, "message": "User data cleared"})
            return

        self.send_error_json("Not found", 404)


def main():
    print("=" * 50)
    print("  🌟 Kids Chore App Server")
    print("=" * 50)
    print(f"  Serving from: {BASE_DIR}")
    print(f"  User data:    {USER_DATA_FILE}")
    print(f"  Open browser: http://localhost:{PORT}")
    print(f"  Press Ctrl+C to stop")
    print("=" * 50)

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    server = http.server.HTTPServer(("", PORT), AppHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.shutdown()


if __name__ == "__main__":
    main()
