import sys
import json
import argparse
import hashlib
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

class VisionDaemonHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def do_GET(self):
        if self.path == "/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {"status": "ok", "service": "deepsift-vision", "engine": "PixelRAG"}
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        
        try:
            payload = json.loads(post_body.decode("utf-8"))
        except Exception:
            payload = {}

        if self.path == "/search":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            queries = payload.get("queries", [])
            query_text = queries[0].get("text", "") if queries else ""
            
            results = [
                {
                    "doc_id": f"vision_tile_{i+1}",
                    "score": round(0.95 - (i * 0.05), 4),
                    "title": f"Visual Match for: {query_text}",
                    "snippet": f"Matching visual layout tile #{i+1} for query '{query_text}'"
                }
                for i in range(min(payload.get("n_docs", 5), 5))
            ]
            response = {"status": "success", "results": results}
            self.wfile.write(json.dumps(response).encode("utf-8"))

        elif self.path == "/render":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()

            target = payload.get("target", "")
            target_hash = hashlib.sha256(target.encode("utf-8")).hexdigest()[:12]
            tiles = [f"tile_0_{target_hash}.png", f"tile_1_{target_hash}.png"]
            
            response = {
                "status": "success",
                "target": target,
                "tiles": tiles,
                "visual_hash": target_hash
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()

def run_server(port):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, VisionDaemonHandler)
    httpd.serve_forever()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8264)
    args = parser.parse_args()
    run_server(args.port)
