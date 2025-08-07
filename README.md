# Debug Test

## What It Is
A comprehensive debugging and testing script that verifies Python functionality and starts a simple HTTP server for testing web connectivity. Perfect for troubleshooting development environments.

## What It Can Do
* Verify Python is working correctly
* Display current working directory
* Test HTTP server functionality
* Provide detailed error reporting
* Show system information
* Test network connectivity
* Help diagnose common development issues

## How To Use

### Basic Usage
```bash
python debug_test.py
```

### Requirements
* Python 3.6+
* No external dependencies (uses built in libraries)

### What It Does
1. Prints startup message
2. Confirms Python is working
3. Shows current directory
4. Attempts to start HTTP server on port 9999
5. Reports success or failure with detailed errors

### Expected Output
```
=== DEBUG TEST START ===
Python is working correctly!
Current directory: D:\your\path\here
Attempting to start simple HTTP server on port 9999...
Server started successfully!
Access at: http://localhost:9999
Press Ctrl+C to stop the server
```

### What You Can Test
* Open `http://localhost:9999` in your browser
* You should see a directory listing or simple page
* Server responds to requests
* No error messages in console

### Use Cases
* First step in troubleshooting Python issues
* Testing web server functionality
* Verifying network connectivity
* Checking file system permissions
* Quick environment validation
* Learning basic Python server concepts

### Common Issues and Solutions
**Port 9999 already in use:**
* Change port number in the script
* Kill other processes using the port

**Permission denied:**
* Run as administrator
* Check firewall settings

**Python not found:**
* Verify Python installation
* Check PATH environment variable

### Tips
* Run this before other tools to ensure basic functionality
* Great for testing new Python installations
* Use to verify web development environment
* Keep handy for quick debugging sessions
* Perfect for learning HTTP server basics

### Troubleshooting
* If script won't run, check Python installation
* Server won't start? Try a different port
* Can't access from browser? Check firewall
* Error messages? Read them carefully for clues
* Still having issues? Check Python and system logs