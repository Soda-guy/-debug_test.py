#!/usr/bin/env python3
print("=== DEBUG TEST START ===")
print("Python is working!")
print("Current directory:", __file__)

try:
    from http.server import HTTPServer, BaseHTTPRequestHandler
    print("HTTP server import successful")
    
    class TestHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Test Server Working!</h1>')
    
    print("Starting test server on port 9999...")
    server = HTTPServer(('localhost', 9999), TestHandler)
    print("Server created, starting...")
    server.serve_forever()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("=== DEBUG TEST END ===")