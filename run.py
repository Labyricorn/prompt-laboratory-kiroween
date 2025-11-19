#!/usr/bin/env python3
"""
Prompt-Laboratory Startup Script
Single-command launch for the complete application with comprehensive initialization,
status display, logging, and graceful shutdown handling.
"""

import os
import sys
import signal
import webbrowser
import time
import threading
import logging
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

# Global flag for graceful shutdown
shutdown_requested = False

def setup_logging():
    """Configure logging for startup process"""
    log_format = '%(asctime)s - %(levelname)s - %(message)s'
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger('promptlab')

def print_banner():
    """Display application banner with version info"""
    print("=" * 60)
    print("🧪 Prompt-Laboratory - Prompt Engineering Environment")
    print("=" * 60)
    print(f"Python Version: {sys.version.split()[0]}")
    print(f"Platform: {sys.platform}")
    print(f"Startup Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

def check_python_version():
    """Ensure Python 3.8+ is being used"""
    logger = logging.getLogger('promptlab')
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        logger.error(f"Current version: {sys.version}")
        sys.exit(1)
    logger.info(f"✓ Python version check passed: {sys.version.split()[0]}")

def check_virtual_environment():
    """Check if we're in a virtual environment"""
    logger = logging.getLogger('promptlab')
    in_venv = (
        hasattr(sys, 'real_prefix') or 
        (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    )
    
    if in_venv:
        logger.info("✓ Running in virtual environment")
    else:
        logger.warning("⚠ Not running in a virtual environment")
        logger.warning("Consider creating one with: python -m venv venv")
        logger.warning("Then activate it and run: pip install -r requirements.txt")

def check_dependencies():
    """Check if required dependencies are installed"""
    logger = logging.getLogger('promptlab')
    requirements_file = Path("requirements.txt")
    
    if not requirements_file.exists():
        logger.error("❌ requirements.txt not found")
        return False
    
    logger.info("📦 Checking dependencies...")
    try:
        # Try importing key dependencies
        import flask
        import flask_cors
        import sqlalchemy
        import requests
        logger.info("✓ Core dependencies available")
        return True
    except ImportError as e:
        logger.warning(f"⚠ Missing dependency: {e}")
        logger.info("Installing dependencies...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("✓ Dependencies installed successfully")
            return True
        else:
            logger.error(f"❌ Failed to install dependencies: {result.stderr}")
            return False

def check_database():
    """Check database connectivity and initialization"""
    logger = logging.getLogger('promptlab')
    try:
        # Add backend to path temporarily for import
        backend_path = os.path.join(os.path.dirname(__file__), 'backend')
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        
        from backend.database import init_database
        from backend.config import config
        
        logger.info(f"📊 Initializing database: {config.database_path}")
        init_database()
        logger.info("✓ Database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False

def check_ollama_connection():
    """Check Ollama service availability"""
    logger = logging.getLogger('promptlab')
    try:
        import requests
        from backend.config import config
        
        logger.info(f"🤖 Checking Ollama connection: {config.ollama_endpoint}")
        response = requests.get(f"{config.ollama_endpoint}/api/tags", timeout=5)
        
        if response.status_code == 200:
            models = response.json().get('models', [])
            logger.info(f"✓ Ollama connected - {len(models)} models available")
            return True
        else:
            logger.warning(f"⚠ Ollama responded with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.warning(f"⚠ Ollama connection failed: {e}")
        logger.warning("Prompt-Laboratory will start but AI features may not work")
        logger.warning("Make sure Ollama is running: ollama serve")
        return False
    except Exception as e:
        logger.warning(f"⚠ Unexpected error checking Ollama: {e}")
        return False

def setup_signal_handlers():
    """Setup signal handlers for graceful shutdown"""
    logger = logging.getLogger('promptlab')
    
    def signal_handler(signum, frame):
        global shutdown_requested
        logger.info(f"\n🛑 Received signal {signum}, initiating graceful shutdown...")
        shutdown_requested = True
        # Exit immediately on Ctrl+C
        sys.exit(0)
    
    # Handle common shutdown signals
    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
    if hasattr(signal, 'SIGTERM'):
        signal.signal(signal.SIGTERM, signal_handler)  # Termination request

def open_browser_delayed(url, delay=3):
    """Open browser after a delay to ensure server is ready"""
    logger = logging.getLogger('promptlab')
    
    def delayed_open():
        global shutdown_requested
        time.sleep(delay)
        if not shutdown_requested:
            logger.info(f"🌐 Opening browser at {url}")
            try:
                webbrowser.open(url)
            except Exception as e:
                logger.warning(f"⚠ Failed to open browser: {e}")
                logger.info(f"Please manually open: {url}")
    
    thread = threading.Thread(target=delayed_open, daemon=True)
    thread.start()

def run_initialization_checks():
    """Run all initialization checks and return success status"""
    logger = logging.getLogger('promptlab')
    logger.info("🔍 Running initialization checks...")
    
    checks = [
        ("Python Version", check_python_version),
        ("Virtual Environment", check_virtual_environment),
        ("Dependencies", check_dependencies),
        ("Database", check_database),
        ("Ollama Connection", check_ollama_connection)
    ]
    
    failed_checks = []
    for check_name, check_func in checks:
        try:
            if check_func() is False:
                failed_checks.append(check_name)
        except SystemExit:
            raise  # Re-raise system exit from critical failures
        except Exception as e:
            logger.error(f"❌ {check_name} check failed with exception: {e}")
            failed_checks.append(check_name)
    
    if failed_checks:
        logger.warning(f"⚠ Some checks failed: {', '.join(failed_checks)}")
        logger.warning("Application may not function correctly")
    else:
        logger.info("✅ All initialization checks passed")
    
    return len(failed_checks) == 0

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(
        description='Prompt-Laboratory - Prompt Engineering Environment',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        '--www',
        action='store_true',
        help='Serve the application publicly on all network interfaces (0.0.0.0)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=None,
        help='Port to run the server on (default: from config)'
    )
    parser.add_argument(
        '--no-browser',
        action='store_true',
        help='Do not automatically open browser'
    )
    return parser.parse_args()

def main():
    """Main startup function with comprehensive initialization"""
    global shutdown_requested
    
    # Parse command-line arguments
    args = parse_arguments()
    
    # Setup logging first
    logger = setup_logging()
    
    # Display banner
    print_banner()
    
    # Setup signal handlers for graceful shutdown
    setup_signal_handlers()
    
    try:
        # Run initialization checks
        all_checks_passed = run_initialization_checks()
        
        if not all_checks_passed:
            logger.warning("⚠ Continuing startup despite failed checks...")
        
        # Add backend to Python path
        backend_path = os.path.join(os.path.dirname(__file__), 'backend')
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        
        # Import and create Flask app
        logger.info("🚀 Starting Prompt-Laboratory application...")
        from backend.app import create_app
        from backend.config import config
        
        app = create_app()
        
        # Override host if --www flag is used
        host = '0.0.0.0' if args.www else config.flask_host
        port = args.port if args.port else config.flask_port
        
        # Prepare server URL
        if args.www:
            # Show local network IP for public access
            import socket
            try:
                hostname = socket.gethostname()
                local_ip = socket.gethostbyname(hostname)
                url = f"http://{local_ip}:{port}"
                logger.info(f"🌍 Public access enabled - accessible from network")
                logger.info(f"📡 Local network URL: {url}")
            except:
                url = f"http://localhost:{port}"
        else:
            url = f"http://{host}:{port}"
        
        # Schedule browser opening unless disabled
        if not args.no_browser:
            open_browser_delayed(url)
        
        # Display startup information
        logger.info("=" * 50)
        logger.info("🎯 Prompt-Laboratory Server Starting")
        logger.info(f"📍 URL: {url}")
        logger.info(f"🏠 Host: {host}")
        logger.info(f"🔌 Port: {port}")
        logger.info(f"🐛 Debug: {config.flask_debug}")
        logger.info(f"🗄️ Database: {config.database_path}")
        logger.info(f"🤖 Ollama: {config.ollama_endpoint}")
        if args.www:
            logger.info("🌐 Mode: PUBLIC (accessible from network)")
            logger.info("⚠️  WARNING: Server is accessible from your network!")
        else:
            logger.info("🔒 Mode: LOCAL (localhost only)")
        logger.info("=" * 50)
        logger.info("✨ Server ready! Press Ctrl+C to stop")
        
        # Start the Flask application
        app.run(
            host=host,
            port=port,
            debug=config.flask_debug,
            use_reloader=False  # Disable reloader to prevent double startup
        )
        
    except ImportError as e:
        logger.error(f"❌ Failed to import backend modules: {e}")
        logger.error("Make sure all dependencies are installed:")
        logger.error("pip install -r requirements.txt")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("\n🛑 Shutdown requested by user")
    except OSError as e:
        if "Address already in use" in str(e):
            logger.error(f"❌ Port {config.flask_port} is already in use")
            logger.error("Try stopping other applications or use a different port")
        else:
            logger.error(f"❌ Network error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error starting Prompt-Laboratory: {e}")
        logger.exception("Full error details:")
        sys.exit(1)
    finally:
        # Graceful shutdown
        logger.info("🔄 Performing cleanup...")
        logger.info("👋 Prompt-Laboratory shutdown complete")

if __name__ == "__main__":
    main()