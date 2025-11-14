#!/usr/bin/env python3
"""
Integration Test Runner for Prompt-Laboratory
Runs comprehensive end-to-end tests with proper setup and teardown
"""

import sys
import os
import subprocess
import time
import signal
import threading
from pathlib import Path

# Add backend to path
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

def print_banner():
    """Print test runner banner"""
    print("=" * 60)
    print("🧪 Prompt-Laboratory Integration Test Runner")
    print("=" * 60)

def check_dependencies():
    """Check if required test dependencies are available"""
    print("📦 Checking test dependencies...")
    
    required_packages = ['pytest', 'requests']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n⚠ Missing packages: {', '.join(missing_packages)}")
        print("Install with: pip install pytest requests")
        return False
    
    print("✅ All test dependencies available")
    return True

def run_unit_tests():
    """Run existing unit tests first"""
    print("\n🔬 Running Unit Tests...")
    print("-" * 40)
    
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            'tests/', 
            '-v',
            '--tb=short',
            '-x',  # Stop on first failure
            '--ignore=tests/test_integration_e2e.py',  # Skip integration tests for now
            '--ignore=tests/run_integration_tests.py'
        ], capture_output=True, text=True, timeout=60)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        if result.returncode == 0:
            print("✅ Unit tests passed")
            return True
        else:
            print("❌ Unit tests failed")
            return False
            
    except subprocess.TimeoutExpired:
        print("⏰ Unit tests timed out")
        return False
    except Exception as e:
        print(f"❌ Error running unit tests: {e}")
        return False

def run_integration_tests():
    """Run integration tests"""
    print("\n🔗 Running Integration Tests...")
    print("-" * 40)
    
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            'tests/test_integration_e2e.py',
            '-v',
            '--tb=short',
            '-s'  # Don't capture output for better debugging
        ], timeout=120)
        
        if result.returncode == 0:
            print("✅ Integration tests passed")
            return True
        else:
            print("❌ Integration tests failed")
            return False
            
    except subprocess.TimeoutExpired:
        print("⏰ Integration tests timed out")
        return False
    except Exception as e:
        print(f"❌ Error running integration tests: {e}")
        return False

def test_application_startup():
    """Test actual application startup"""
    print("\n🚀 Testing Application Startup...")
    print("-" * 40)
    
    try:
        # Import and test basic startup components
        from backend.app import create_app
        from backend.config import AppConfig
        from backend.database import init_database
        
        print("✓ Backend imports successful")
        
        # Test configuration loading
        config = AppConfig()
        print(f"✓ Configuration loaded: {config.flask_host}:{config.flask_port}")
        
        # Test app creation (without starting server)
        app = create_app()
        print("✓ Flask app creation successful")
        
        # Test basic endpoints with test client
        with app.test_client() as client:
            response = client.get('/api/health')
            if response.status_code == 200:
                print("✓ Health endpoint responsive")
            else:
                print(f"⚠ Health endpoint returned {response.status_code}")
            
            response = client.get('/')
            if response.status_code == 200:
                print("✓ Frontend serving functional")
            else:
                print(f"⚠ Frontend serving returned {response.status_code}")
        
        print("✅ Application startup test passed")
        return True
        
    except Exception as e:
        print(f"❌ Application startup test failed: {e}")
        return False

def test_database_operations():
    """Test database operations"""
    print("\n🗄️ Testing Database Operations...")
    print("-" * 40)
    
    try:
        import tempfile
        from backend.database import init_database, get_db_session, close_db_session
        from backend.models.prompt import Prompt
        from backend.config import AppConfig
        from unittest.mock import patch
        
        # Create temporary database
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
            db_path = tmp_db.name
        
        test_config = AppConfig(database_path=db_path)
        
        with patch('backend.config.config', test_config):
            # Test database initialization
            init_database()
            print("✓ Database initialization successful")
            
            # Test database operations
            session = get_db_session()
            
            # Create test prompt
            test_prompt = Prompt(
                name='Test Prompt',
                description='Test description',
                system_prompt='Test system prompt',
                model='llama2',
                temperature=0.7
            )
            
            session.add(test_prompt)
            session.commit()
            print("✓ Database write operation successful")
            
            # Read test prompt
            retrieved_prompt = session.query(Prompt).filter_by(name='Test Prompt').first()
            assert retrieved_prompt is not None
            assert retrieved_prompt.description == 'Test description'
            print("✓ Database read operation successful")
            
            close_db_session(session)
            print("✓ Database session cleanup successful")
        
        # Cleanup
        os.unlink(db_path)
        print("✅ Database operations test passed")
        return True
        
    except Exception as e:
        print(f"❌ Database operations test failed: {e}")
        return False

def run_comprehensive_tests():
    """Run all test suites"""
    print_banner()
    
    # Check dependencies first
    if not check_dependencies():
        return False
    
    test_results = []
    
    # Run test suites in order
    test_suites = [
        ("Application Startup", test_application_startup),
        ("Database Operations", test_database_operations),
        ("Unit Tests", run_unit_tests),
        ("Integration Tests", run_integration_tests)
    ]
    
    for suite_name, test_func in test_suites:
        try:
            result = test_func()
            test_results.append((suite_name, result))
        except KeyboardInterrupt:
            print(f"\n⚠ Test suite '{suite_name}' interrupted by user")
            test_results.append((suite_name, False))
            break
        except Exception as e:
            print(f"\n❌ Unexpected error in '{suite_name}': {e}")
            test_results.append((suite_name, False))
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for suite_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{suite_name:<25} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Total: {passed}/{total} test suites passed")
    
    if passed == total:
        print("🎉 All tests passed! Prompt-Laboratory is ready for use.")
        return True
    else:
        print("⚠ Some tests failed. Please review the output above.")
        return False

def main():
    """Main test runner function"""
    try:
        success = run_comprehensive_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠ Test run interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()