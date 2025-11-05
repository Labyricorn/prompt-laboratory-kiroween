"""
PromptLab Backend Application
Main Flask application with CORS configuration, enhanced logging, and health checks
"""

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime
from backend.database import init_database
from backend.api.prompts import prompts_bp
from backend.api.ollama import ollama_bp
from backend.api.config import config_bp
from backend.config import config

def create_app():
    """Create and configure the Flask application with enhanced features"""
    app = Flask(__name__)
    
    # Configure Flask logging
    if not config.flask_debug:
        # In production mode, reduce Flask's default logging
        logging.getLogger('werkzeug').setLevel(logging.WARNING)
    
    # Configure CORS for local development with dynamic origins
    allowed_origins = [
        f"http://localhost:{config.flask_port}",
        f"http://127.0.0.1:{config.flask_port}",
        f"http://{config.flask_host}:{config.flask_port}"
    ]
    CORS(app, origins=allowed_origins)
    
    # Initialize database
    try:
        init_database()
        app.logger.info("Database initialized successfully")
    except Exception as e:
        app.logger.error(f"Database initialization failed: {e}")
        raise
    
    # Register API blueprints
    app.register_blueprint(prompts_bp)
    app.register_blueprint(ollama_bp)
    app.register_blueprint(config_bp)
    
    # Enhanced health check endpoint with system status
    @app.route('/api/health')
    def health_check():
        """Comprehensive health check with system information"""
        try:
            # Check database connectivity
            from backend.database import get_db_connection
            from sqlalchemy import text
            db_status = "healthy"
            try:
                conn = get_db_connection()
                conn.execute(text("SELECT 1")).fetchone()
                conn.close()
            except Exception as e:
                db_status = f"error: {str(e)}"
            
            # Check Ollama connectivity
            ollama_status = "unknown"
            try:
                import requests
                response = requests.get(f"{config.ollama_endpoint}/api/tags", timeout=2)
                if response.status_code == 200:
                    models = response.json().get('models', [])
                    ollama_status = f"healthy ({len(models)} models)"
                else:
                    ollama_status = f"error: HTTP {response.status_code}"
            except Exception as e:
                ollama_status = f"error: {str(e)}"
            
            return jsonify({
                'status': 'healthy',
                'service': 'PromptLab Backend',
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0',
                'components': {
                    'database': db_status,
                    'ollama': ollama_status
                },
                'config': {
                    'ollama_endpoint': config.ollama_endpoint,
                    'database_path': config.database_path,
                    'debug_mode': config.flask_debug
                }
            })
        except Exception as e:
            app.logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'error',
                'service': 'PromptLab Backend',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }), 500
    
    # System information endpoint
    @app.route('/api/system/info')
    def system_info():
        """Get system information for debugging"""
        import sys
        import platform
        import flask
        
        return jsonify({
            'python_version': sys.version,
            'platform': platform.platform(),
            'architecture': platform.architecture(),
            'processor': platform.processor(),
            'hostname': platform.node(),
            'flask_version': flask.__version__,
            'app_config': config.to_dict()
        })
    
    # Serve frontend files with better error handling
    @app.route('/')
    def serve_frontend():
        """Serve the main frontend application"""
        try:
            frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
            if not os.path.exists(os.path.join(frontend_dir, 'index.html')):
                app.logger.error(f"Frontend index.html not found in {frontend_dir}")
                return "Frontend files not found. Please check the installation.", 404
            return send_from_directory(frontend_dir, 'index.html')
        except Exception as e:
            app.logger.error(f"Error serving frontend: {e}")
            return f"Error loading application: {e}", 500
    
    @app.route('/<path:filename>')
    def serve_static(filename):
        """Serve static frontend files with error handling"""
        try:
            frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
            return send_from_directory(frontend_dir, filename)
        except Exception as e:
            app.logger.error(f"Error serving static file {filename}: {e}")
            return f"File not found: {filename}", 404
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors"""
        return jsonify({'error': 'Not found', 'message': str(error)}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors"""
        app.logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error', 'message': str(error)}), 500
    
    # Log application startup
    app.logger.info("PromptLab Flask application created successfully")
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=5000)