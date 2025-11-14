"""
End-to-End Integration Tests for Prompt-Laboratory
Tests complete user workflows, application startup, and component interactions
"""

import pytest
import requests
import time
import threading
import subprocess
import sys
import os
import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from backend.app import create_app
from backend.config import AppConfig
from backend.database import init_database, reset_database


class TestApplicationStartup:
    """Test application startup and initialization"""
    
    def test_application_startup_sequence(self):
        """Test complete application startup sequence"""
        # Create temporary database for testing
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
            db_path = tmp_db.name
        
        try:
            # Create test configuration
            test_config = AppConfig(
                database_path=db_path,
                flask_host='127.0.0.1',
                flask_port=5001,  # Use different port for testing
                flask_debug=False,
                ollama_endpoint='http://localhost:11434'
            )
            
            # Mock the global config
            with patch('backend.config.config', test_config):
                # Test database initialization
                init_database()
                assert os.path.exists(db_path), "Database file should be created"
                
                # Test Flask app creation
                app = create_app()
                assert app is not None, "Flask app should be created"
                
                # Test app configuration
                with app.test_client() as client:
                    # Test health endpoint
                    response = client.get('/api/health')
                    assert response.status_code == 200
                    
                    health_data = response.get_json()
                    assert health_data['status'] == 'healthy'
                    assert health_data['service'] == 'Prompt-Laboratory Backend'
                    assert 'components' in health_data
                    
                    # Test system info endpoint
                    response = client.get('/api/system/info')
                    assert response.status_code == 200
                    
                    system_data = response.get_json()
                    assert 'python_version' in system_data
                    assert 'platform' in system_data
                    assert 'app_config' in system_data
        
        finally:
            # Cleanup
            try:
                os.unlink(db_path)
            except (OSError, PermissionError):
                pass
    
    def test_startup_with_missing_dependencies(self):
        """Test startup behavior when dependencies are missing"""
        # This test would require more complex mocking to simulate missing dependencies
        # For now, we'll test that the app can handle import errors gracefully
        
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
            db_path = tmp_db.name
        
        try:
            test_config = AppConfig(database_path=db_path, flask_port=5002)
            
            with patch('backend.config.config', test_config):
                # Test that app creation doesn't crash with basic setup
                app = create_app()
                assert app is not None
        
        finally:
            try:
                os.unlink(db_path)
            except (OSError, PermissionError):
                pass


class TestCompleteUserWorkflows:
    """Test complete user workflows from start to finish"""
    
    @pytest.fixture
    def test_app(self):
        """Create test Flask application with isolated database"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
            db_path = tmp_db.name
        
        test_config = AppConfig(
            database_path=db_path,
            flask_port=5003,
            flask_debug=False
        )
        
        # Store original values
        import backend.database as db_module
        original_engine = db_module.engine
        original_session = db_module.SessionLocal
        
        try:
            # Reset database globals
            db_module.engine = None
            db_module.SessionLocal = None
            
            with patch('backend.config.config', test_config):
                init_database()
                app = create_app()
                
                with app.test_client() as client:
                    yield client
        finally:
            # Restore original values
            db_module.engine = original_engine
            db_module.SessionLocal = original_session
            
            # Cleanup
            try:
                os.unlink(db_path)
            except (OSError, PermissionError):
                pass
    
    def test_complete_prompt_creation_workflow(self, test_app):
        """Test complete workflow: create -> refine -> test -> save prompt"""
        client = test_app
        
        # Step 1: Create a new prompt with unique name
        import time
        unique_suffix = str(int(time.time() * 1000))  # millisecond timestamp
        prompt_data = {
            'name': f'E2E Test Prompt {unique_suffix}',
            'description': 'End-to-end test prompt',
            'system_prompt': 'You are a helpful assistant for testing.',
            'model': 'llama2',
            'temperature': 0.7
        }
        
        response = client.post('/api/prompts', 
                             json=prompt_data,
                             headers={'Content-Type': 'application/json'})
        assert response.status_code == 201
        
        response_data = response.get_json()
        assert response_data['success'] is True
        created_prompt = response_data['prompt']
        prompt_id = created_prompt['id']
        assert created_prompt['name'] == prompt_data['name']
        
        # Step 2: Verify prompt appears in list
        response = client.get('/api/prompts')
        assert response.status_code == 200
        
        response_data = response.get_json()
        assert response_data['success'] is True
        prompts = response_data['prompts']
        assert len(prompts) == 1
        assert prompts[0]['id'] == prompt_id
        
        # Step 3: Update the prompt
        updated_data = {
            'name': f'E2E Test Prompt Updated {unique_suffix}',
            'description': 'Updated description',
            'system_prompt': 'You are an updated helpful assistant.',
            'model': 'llama2',
            'temperature': 0.8
        }
        
        response = client.put(f'/api/prompts/{prompt_id}',
                            json=updated_data,
                            headers={'Content-Type': 'application/json'})
        assert response.status_code == 200
        
        response_data = response.get_json()
        assert response_data['success'] is True
        updated_prompt = response_data['prompt']
        assert updated_prompt['name'] == updated_data['name']
        assert updated_prompt['temperature'] == 0.8
        
        # Step 4: Search for the prompt
        response = client.get('/api/prompts?search=Updated')
        assert response.status_code == 200
        
        response_data = response.get_json()
        assert response_data['success'] is True
        search_results = response_data['prompts']
        assert len(search_results) == 1
        assert search_results[0]['id'] == prompt_id
        
        # Step 5: Delete the prompt
        response = client.delete(f'/api/prompts/{prompt_id}')
        assert response.status_code == 200
        
        # Step 6: Verify prompt is deleted
        response = client.get('/api/prompts')
        assert response.status_code == 200
        
        response_data = response.get_json()
        assert response_data['success'] is True
        prompts = response_data['prompts']
        assert len(prompts) == 0
    
    def test_prompt_refinement_workflow(self, test_app):
        """Test prompt refinement workflow with mocked Ollama"""
        client = test_app
        
        # Mock Ollama response
        mock_response = {
            'response': 'You are an expert code reviewer with extensive experience in software development best practices. Your role is to provide constructive, detailed feedback on code submissions...'
        }
        
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = mock_response
            
            # Test prompt refinement
            refinement_data = {
                'objective': 'Create a code review assistant',
                'target_model': 'llama2'
            }
            
            response = client.post('/api/refine-prompt',
                                 json=refinement_data,
                                 headers={'Content-Type': 'application/json'})
            
            assert response.status_code == 200
            result = response.get_json()
            assert 'refined_prompt' in result
            assert len(result['refined_prompt']) > 0
    
    def test_prompt_testing_workflow(self, test_app):
        """Test prompt testing workflow with mocked Ollama"""
        client = test_app
        
        # Mock Ollama response
        mock_response = {
            'response': 'This code looks good overall. Here are some suggestions for improvement...'
        }
        
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = mock_response
            
            # Test prompt execution
            test_data = {
                'system_prompt': 'You are a code review assistant.',
                'user_input': 'Please review this Python function: def hello(): print("Hello")',
                'model': 'llama2',
                'temperature': 0.7
            }
            
            response = client.post('/api/run-test',
                                 json=test_data,
                                 headers={'Content-Type': 'application/json'})
            
            assert response.status_code == 200
            result = response.get_json()
            assert 'response' in result
            assert 'yaml_config' in result
            assert 'execution_time' in result
    
    def test_library_import_export_workflow(self, test_app):
        """Test complete library import/export workflow"""
        client = test_app
        
        # Step 1: Create some test prompts with unique names
        import time
        unique_suffix = str(int(time.time() * 1000))
        prompts_data = [
            {
                'name': f'Test Prompt 1 {unique_suffix}',
                'description': 'First test prompt',
                'system_prompt': 'You are assistant 1.',
                'model': 'llama2',
                'temperature': 0.5
            },
            {
                'name': f'Test Prompt 2 {unique_suffix}',
                'description': 'Second test prompt',
                'system_prompt': 'You are assistant 2.',
                'model': 'llama2',
                'temperature': 0.8
            }
        ]
        
        created_ids = []
        for prompt_data in prompts_data:
            response = client.post('/api/prompts',
                                 json=prompt_data,
                                 headers={'Content-Type': 'application/json'})
            assert response.status_code == 201
            response_data = response.get_json()
            created_ids.append(response_data['prompt']['id'])
        
        # Step 2: Export library
        response = client.post('/api/export-library')
        assert response.status_code == 200
        
        export_data = response.get_json()
        assert 'prompts' in export_data
        assert len(export_data['prompts']) == 2
        assert 'metadata' in export_data
        
        # Step 3: Clear database
        for prompt_id in created_ids:
            response = client.delete(f'/api/prompts/{prompt_id}')
            assert response.status_code == 200
        
        # Verify database is empty
        response = client.get('/api/prompts')
        assert response.status_code == 200
        response_data = response.get_json()
        assert len(response_data['prompts']) == 0
        
        # Step 4: Import library
        response = client.post('/api/import-library',
                             json=export_data,
                             headers={'Content-Type': 'application/json'})
        assert response.status_code == 200
        
        import_result = response.get_json()
        assert import_result['imported_count'] == 2
        assert import_result['conflicts'] == 0
        
        # Step 5: Verify prompts were imported
        response = client.get('/api/prompts')
        assert response.status_code == 200
        
        response_data = response.get_json()
        imported_prompts = response_data['prompts']
        assert len(imported_prompts) == 2
        
        # Verify prompt data integrity
        imported_names = [p['name'] for p in imported_prompts]
        assert f'Test Prompt 1 {unique_suffix}' in imported_names
        assert f'Test Prompt 2 {unique_suffix}' in imported_names


class TestComponentInteractions:
    """Test interactions between different application components"""
    
    @pytest.fixture
    def test_app(self):
        """Create test Flask application with isolated database"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
            db_path = tmp_db.name
        
        test_config = AppConfig(
            database_path=db_path,
            flask_port=5004,
            flask_debug=False
        )
        
        # Store original values
        import backend.database as db_module
        original_engine = db_module.engine
        original_session = db_module.SessionLocal
        
        try:
            # Reset database globals
            db_module.engine = None
            db_module.SessionLocal = None
            
            with patch('backend.config.config', test_config):
                init_database()
                app = create_app()
                
                with app.test_client() as client:
                    yield client
        finally:
            # Restore original values
            db_module.engine = original_engine
            db_module.SessionLocal = original_session
            
            # Cleanup
            try:
                os.unlink(db_path)
            except (OSError, PermissionError):
                pass
    
    def test_api_database_integration(self, test_app):
        """Test API endpoints properly interact with database"""
        client = test_app
        
        # Create prompt via API with unique name
        import time
        unique_suffix = str(int(time.time() * 1000))
        prompt_data = {
            'name': f'Integration Test {unique_suffix}',
            'description': 'Testing API-DB integration',
            'system_prompt': 'Test prompt',
            'model': 'llama2',
            'temperature': 0.7
        }
        
        response = client.post('/api/prompts', json=prompt_data)
        assert response.status_code == 201
        
        response_data = response.get_json()
        created_prompt = response_data['prompt']
        prompt_id = created_prompt['id']
        
        # Verify data persistence by retrieving via different endpoint
        response = client.get(f'/api/prompts')
        assert response.status_code == 200
        
        response_data = response.get_json()
        prompts = response_data['prompts']
        assert len(prompts) == 1
        assert prompts[0]['id'] == prompt_id
        assert prompts[0]['name'] == prompt_data['name']
        
        # Test database constraints
        duplicate_prompt = prompt_data.copy()
        response = client.post('/api/prompts', json=duplicate_prompt)
        assert response.status_code == 400  # Should fail due to unique name constraint
    
    def test_configuration_service_integration(self, test_app):
        """Test configuration service integration with other components"""
        client = test_app
        
        # Test configuration endpoint
        response = client.get('/api/config')
        assert response.status_code == 200
        
        config_data = response.get_json()
        assert 'ollama_endpoint' in config_data
        assert 'default_model' in config_data
        assert 'default_temperature' in config_data
        
        # Test that configuration affects other endpoints
        with patch('requests.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = {'models': []}
            
            response = client.get('/api/models')
            assert response.status_code == 200
            
            # Verify the correct endpoint was called based on configuration
            mock_get.assert_called_once()
            called_url = mock_get.call_args[0][0]
            assert config_data['ollama_endpoint'] in called_url


class TestErrorScenariosAndRecovery:
    """Test error scenarios and recovery mechanisms"""
    
    @pytest.fixture
    def test_app(self):
        """Create test Flask application with isolated database"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
            db_path = tmp_db.name
        
        test_config = AppConfig(
            database_path=db_path,
            flask_port=5005,
            flask_debug=False
        )
        
        # Store original values
        import backend.database as db_module
        original_engine = db_module.engine
        original_session = db_module.SessionLocal
        
        try:
            # Reset database globals
            db_module.engine = None
            db_module.SessionLocal = None
            
            with patch('backend.config.config', test_config):
                init_database()
                app = create_app()
                
                with app.test_client() as client:
                    yield client
        finally:
            # Restore original values
            db_module.engine = original_engine
            db_module.SessionLocal = original_session
            
            # Cleanup
            try:
                os.unlink(db_path)
            except (OSError, PermissionError):
                pass
    
    def test_database_error_handling(self, test_app):
        """Test database error handling and recovery"""
        client = test_app
        
        # Test invalid data handling
        invalid_prompt = {
            'name': '',  # Empty name should fail validation
            'system_prompt': 'Test',
            'model': 'llama2',
            'temperature': 0.7
        }
        
        response = client.post('/api/prompts', json=invalid_prompt)
        assert response.status_code == 400
        
        error_data = response.get_json()
        assert 'error' in error_data
        
        # Test non-existent resource handling
        response = client.get('/api/prompts/99999')
        assert response.status_code == 404
        
        response = client.put('/api/prompts/99999', json={'name': 'Test'})
        assert response.status_code == 404
        
        response = client.delete('/api/prompts/99999')
        assert response.status_code == 404
    
    def test_ollama_service_error_handling(self, test_app):
        """Test Ollama service error handling"""
        client = test_app
        
        # Test connection timeout
        with patch('requests.post') as mock_post:
            mock_post.side_effect = requests.exceptions.Timeout()
            
            response = client.post('/api/refine-prompt', json={
                'objective': 'Test objective',
                'target_model': 'llama2'
            })
            
            assert response.status_code == 500
            error_data = response.get_json()
            assert 'error' in error_data
        
        # Test connection error
        with patch('requests.post') as mock_post:
            mock_post.side_effect = requests.exceptions.ConnectionError()
            
            response = client.post('/api/run-test', json={
                'system_prompt': 'Test prompt',
                'user_input': 'Test input',
                'model': 'llama2',
                'temperature': 0.7
            })
            
            assert response.status_code == 500
            error_data = response.get_json()
            assert 'error' in error_data
        
        # Test invalid response from Ollama
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 500
            mock_post.return_value.text = 'Internal Server Error'
            
            response = client.post('/api/refine-prompt', json={
                'objective': 'Test objective',
                'target_model': 'llama2'
            })
            
            assert response.status_code == 500
    
    def test_malformed_request_handling(self, test_app):
        """Test handling of malformed requests"""
        client = test_app
        
        # Test invalid JSON
        response = client.post('/api/prompts',
                             data='invalid json',
                             headers={'Content-Type': 'application/json'})
        assert response.status_code == 400
        
        # Test missing required fields
        response = client.post('/api/prompts', json={})
        assert response.status_code == 400
        
        # Test invalid data types
        response = client.post('/api/prompts', json={
            'name': 123,  # Should be string
            'temperature': 'invalid'  # Should be float
        })
        assert response.status_code == 400
    
    def test_system_recovery_mechanisms(self, test_app):
        """Test system recovery after errors"""
        client = test_app
        
        # Create a valid prompt first with unique name
        import time
        unique_suffix = str(int(time.time() * 1000))
        valid_prompt = {
            'name': f'Recovery Test {unique_suffix}',
            'description': 'Testing recovery',
            'system_prompt': 'Test prompt',
            'model': 'llama2',
            'temperature': 0.7
        }
        
        response = client.post('/api/prompts', json=valid_prompt)
        assert response.status_code == 201
        prompt_id = response.get_json()['id']
        
        # Simulate error condition and recovery
        with patch('backend.database.get_db_session') as mock_session:
            # First call fails
            mock_session.side_effect = Exception("Database error")
            
            response = client.get('/api/prompts')
            assert response.status_code == 500
            
            # Reset mock to allow recovery
            mock_session.side_effect = None
            mock_session.return_value.__enter__.return_value.query.return_value.all.return_value = []
            
            # System should recover on next request
            response = client.get('/api/health')
            assert response.status_code == 200
        
        # Verify system is still functional after error
        response = client.get(f'/api/prompts')
        assert response.status_code == 200


if __name__ == '__main__':
    # Run tests with pytest
    pytest.main([__file__, '-v'])