"""
Ollama Integration Service
Handles communication with local Ollama instance for AI model interactions
"""

import requests
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from backend.config import config
from backend.prompts_config import prompts_config


class OllamaConnectionError(Exception):
    """Raised when connection to Ollama fails"""
    pass


class OllamaTimeoutError(Exception):
    """Raised when Ollama request times out"""
    pass


class OllamaService:
    """Service for communicating with Ollama API"""
    
    def __init__(self, endpoint: str = None, timeout: int = 30, max_retries: int = 3, cache_duration: int = 300):
        """
        Initialize Ollama service
        
        Args:
            endpoint: Ollama API endpoint URL
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            cache_duration: Model cache duration in seconds (default: 5 minutes)
        """
        self.endpoint = endpoint or config.ollama_endpoint
        self.timeout = timeout
        self.max_retries = max_retries
        self.cache_duration = cache_duration
        self.session = requests.Session()
        
        # Model cache
        self._models_cache = None
        self._models_cache_time = None
        
    def _make_request(self, method: str, path: str, **kwargs) -> requests.Response:
        """
        Make HTTP request to Ollama with retry logic
        
        Args:
            method: HTTP method (GET, POST, etc.)
            path: API path (without leading slash)
            **kwargs: Additional arguments for requests
            
        Returns:
            Response object
            
        Raises:
            OllamaConnectionError: If connection fails after retries
            OllamaTimeoutError: If request times out
        """
        url = f"{self.endpoint.rstrip('/')}/{path.lstrip('/')}"
        kwargs.setdefault('timeout', self.timeout)
        
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                response = self.session.request(method, url, **kwargs)
                response.raise_for_status()
                return response
                
            except requests.exceptions.Timeout as e:
                last_exception = OllamaTimeoutError(f"Request timed out after {self.timeout} seconds")
                
            except requests.exceptions.ConnectionError as e:
                last_exception = OllamaConnectionError(f"Failed to connect to Ollama at {self.endpoint}")
                
            except requests.exceptions.HTTPError as e:
                if e.response.status_code >= 500:
                    # Server error, retry
                    last_exception = OllamaConnectionError(f"Ollama server error: {e.response.status_code}")
                else:
                    # Client error, don't retry
                    raise OllamaConnectionError(f"Ollama API error: {e.response.status_code} - {e.response.text}")
                    
            except Exception as e:
                last_exception = OllamaConnectionError(f"Unexpected error communicating with Ollama: {str(e)}")
            
            # Wait before retry (exponential backoff)
            if attempt < self.max_retries - 1:
                wait_time = 2 ** attempt
                time.sleep(wait_time)
        
        # All retries failed
        raise last_exception
    
    def check_connection(self) -> Dict[str, Any]:
        """
        Test connection to Ollama instance
        
        Returns:
            Dictionary with connection status and details
        """
        try:
            response = self._make_request('GET', 'api/tags')
            return {
                'connected': True,
                'endpoint': self.endpoint,
                'status': 'healthy',
                'message': 'Successfully connected to Ollama'
            }
        except (OllamaConnectionError, OllamaTimeoutError) as e:
            return {
                'connected': False,
                'endpoint': self.endpoint,
                'status': 'error',
                'message': str(e)
            }
    
    def _is_cache_valid(self) -> bool:
        """Check if the models cache is still valid"""
        if self._models_cache is None or self._models_cache_time is None:
            return False
        
        cache_expiry = self._models_cache_time + timedelta(seconds=self.cache_duration)
        return datetime.now() < cache_expiry
    
    def get_available_models(self, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Fetch list of available models from Ollama with caching
        
        Args:
            use_cache: Whether to use cached results if available
        
        Returns:
            List of model information dictionaries
            
        Raises:
            OllamaConnectionError: If unable to fetch models
            OllamaTimeoutError: If request times out
        """
        # Return cached models if valid and caching is enabled
        if use_cache and self._is_cache_valid():
            return self._models_cache.copy()
        
        try:
            response = self._make_request('GET', 'api/tags')
            data = response.json()
            
            models = []
            for model in data.get('models', []):
                models.append({
                    'name': model.get('name', ''),
                    'size': model.get('size', 0),
                    'modified_at': model.get('modified_at', ''),
                    'digest': model.get('digest', ''),
                    'size_mb': round(model.get('size', 0) / (1024 * 1024), 1) if model.get('size') else 0
                })
            
            # Update cache
            self._models_cache = models.copy()
            self._models_cache_time = datetime.now()
            
            return models
            
        except Exception as e:
            if isinstance(e, (OllamaConnectionError, OllamaTimeoutError)):
                raise
            raise OllamaConnectionError(f"Failed to parse models response: {str(e)}")
    
    def refresh_models_cache(self) -> List[Dict[str, Any]]:
        """
        Force refresh of the models cache
        
        Returns:
            List of model information dictionaries
        """
        return self.get_available_models(use_cache=False)
    
    def clear_models_cache(self) -> None:
        """Clear the models cache"""
        self._models_cache = None
        self._models_cache_time = None
    
    def get_cache_info(self) -> Dict[str, Any]:
        """
        Get information about the current cache state
        
        Returns:
            Dictionary with cache information
        """
        if self._models_cache is None or self._models_cache_time is None:
            return {
                'cached': False,
                'cache_time': None,
                'cache_age_seconds': None,
                'cache_valid': False,
                'models_count': 0
            }
        
        cache_age = datetime.now() - self._models_cache_time
        cache_age_seconds = int(cache_age.total_seconds())
        
        return {
            'cached': True,
            'cache_time': self._models_cache_time.isoformat(),
            'cache_age_seconds': cache_age_seconds,
            'cache_valid': self._is_cache_valid(),
            'models_count': len(self._models_cache),
            'cache_duration_seconds': self.cache_duration
        }
    
    def health_check(self) -> bool:
        """
        Simple health check for Ollama service
        
        Returns:
            True if Ollama is responding, False otherwise
        """
        try:
            self._make_request('GET', 'api/tags')
            return True
        except (OllamaConnectionError, OllamaTimeoutError):
            return False
    
    def refine_prompt(self, objective: str, target_model: str = None) -> str:
        """
        Use meta-prompt technique to convert objective into detailed system prompt
        
        Args:
            objective: Simple objective or goal for the prompt
            target_model: Model to use for refinement (defaults to config default)
            
        Returns:
            Refined system prompt text
            
        Raises:
            OllamaConnectionError: If unable to communicate with Ollama
            OllamaTimeoutError: If request times out
        """
        model = target_model or config.default_model
        
        # Load meta-prompt configuration from file
        meta_prompt_config = prompts_config.get_meta_prompt_config()
        formatted_prompt = meta_prompt_config.format_prompt(objective)
        
        try:
            response = self._make_request('POST', 'api/generate', json={
                'model': model,
                'prompt': formatted_prompt,
                'stream': False,
                'options': meta_prompt_config.parameters.to_dict()
            })
            
            data = response.json()
            refined_prompt = data.get('response', '').strip()
            
            if not refined_prompt:
                raise OllamaConnectionError("Received empty response from Ollama during prompt refinement")
            
            return refined_prompt
            
        except Exception as e:
            if isinstance(e, (OllamaConnectionError, OllamaTimeoutError)):
                raise
            raise OllamaConnectionError(f"Failed to refine prompt: {str(e)}")
    
    def test_prompt(self, system_prompt: str, user_input: str, model: str = None, temperature: float = None, timeout: int = None) -> Dict[str, Any]:
        """
        Test a system prompt with user input using specified model and parameters
        
        This method is the core of the Test Chamber functionality. It combines:
        1. System Prompt (from Workbench) - Defines the AI's role and behavior
        2. User Message (from Test Chamber) - The test input to send to the AI
        3. Parameters (from Test Chamber) - Model, temperature, and timeout settings
        
        Args:
            system_prompt: The system prompt from Workbench (defines AI behavior)
            user_input: Test message from Test Chamber User Message field
            model: Model from Test Chamber Parameters dropdown (defaults to config default)
            temperature: Temperature from Test Chamber Parameters slider (defaults to config default)
            timeout: Timeout from Test Chamber Parameters slider (defaults to instance timeout)
            
        Returns:
            Dictionary containing:
                - response: AI-generated response text
                - execution_time: How long the request took (seconds)
                - model: Which model was used
                - temperature: Temperature setting used
                - timeout: Timeout setting used
                - system_prompt: Echo of the system prompt used
                - user_input: Echo of the user input used
            
        Raises:
            OllamaConnectionError: If unable to communicate with Ollama
            OllamaTimeoutError: If request times out
        """
        # ============================================================================
        # STEP 1: Apply Test Chamber Parameters (or use defaults)
        # ============================================================================
        # Use the model selected in Test Chamber Parameters dropdown, or fall back to config default
        model = model or config.default_model
        
        # Use the temperature from Test Chamber Parameters slider, or fall back to config default
        temperature = temperature if temperature is not None else config.default_temperature
        
        # Use the timeout from Test Chamber Parameters slider, or fall back to instance default
        request_timeout = timeout if timeout is not None else self.timeout
        
        # ============================================================================
        # STEP 2: Combine System Prompt with User Message
        # ============================================================================
        # This is where the Workbench System Prompt and Test Chamber User Message are combined
        # Format: [System Prompt]\n\nUser: [User Message]\n\nAssistant:
        # 
        # Example:
        #   System Prompt: "You are a helpful coding assistant..."
        #   User Message: "How do I write a for loop in Python?"
        #   Combined: "You are a helpful coding assistant...\n\nUser: How do I write a for loop in Python?\n\nAssistant:"
        #
        # The "User:" and "Assistant:" labels help the AI understand the conversation structure
        full_prompt = f"{system_prompt}\n\nUser: {user_input}\n\nAssistant:"
        
        # Record start time for execution time calculation
        start_time = time.time()
        
        try:
            # ============================================================================
            # STEP 3: Send Combined Prompt to Ollama with Parameters
            # ============================================================================
            # Make HTTP POST request to Ollama API with:
            # - model: Selected from Test Chamber Parameters
            # - prompt: Combined system prompt + user message
            # - stream: False (wait for complete response)
            # - options: Temperature and top_p settings
            # - timeout: From Test Chamber Parameters slider
            response = self._make_request('POST', 'api/generate', json={
                'model': model,                    # From Test Chamber Parameters dropdown
                'prompt': full_prompt,             # Combined: System Prompt + User Message
                'stream': False,                   # Wait for complete response (not streaming)
                'options': {
                    'temperature': temperature,    # From Test Chamber Parameters slider
                    'top_p': 0.9                  # Nucleus sampling (fixed at 0.9 for consistency)
                }
            }, timeout=request_timeout)            # From Test Chamber Parameters timeout slider
            
            # Calculate how long the request took
            end_time = time.time()
            execution_time = end_time - start_time
            
            # ============================================================================
            # STEP 4: Extract and Validate AI Response
            # ============================================================================
            # Parse JSON response from Ollama
            data = response.json()
            
            # Extract the AI's response text and remove leading/trailing whitespace
            ai_response = data.get('response', '').strip()
            
            # Validate that we got a response (empty responses indicate an error)
            if not ai_response:
                raise OllamaConnectionError("Received empty response from Ollama during prompt testing")
            
            # ============================================================================
            # STEP 5: Return Response with Metadata
            # ============================================================================
            # Return the AI response along with all the parameters used
            # This data is displayed in the Test Chamber Response and YAML sections
            return {
                'response': ai_response,                    # AI-generated response (shown in Response section)
                'execution_time': round(execution_time, 2), # How long it took (shown in toast)
                'model': model,                             # Model used (shown in YAML)
                'temperature': temperature,                 # Temperature used (shown in YAML)
                'timeout': request_timeout,                 # Timeout used (shown in YAML)
                'system_prompt': system_prompt,             # System prompt used (shown in YAML)
                'user_input': user_input                    # User message used (shown in YAML)
            }
            
        except Exception as e:
            # Re-raise known exceptions as-is
            if isinstance(e, (OllamaConnectionError, OllamaTimeoutError)):
                raise
            # Wrap unknown exceptions in OllamaConnectionError
            raise OllamaConnectionError(f"Failed to test prompt: {str(e)}")


# Global service instance
ollama_service = OllamaService()