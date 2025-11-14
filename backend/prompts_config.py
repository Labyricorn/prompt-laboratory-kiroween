"""
Prompts Configuration Management
Handles loading and validation of meta-prompt configuration
"""

import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class MetaPromptParameters:
    """Parameters for meta-prompt generation"""
    temperature: float = 0.3
    top_p: float = 0.9
    top_k: int = 0
    repeat_penalty: float = 1.1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Ollama API"""
        return {
            'temperature': self.temperature,
            'top_p': self.top_p,
            'top_k': self.top_k,
            'repeat_penalty': self.repeat_penalty
        }
    
    def validate(self) -> Dict[str, str]:
        """Validate parameter values"""
        errors = {}
        
        if not isinstance(self.temperature, (int, float)):
            errors['temperature'] = 'Temperature must be a number'
        elif not (0.0 <= self.temperature <= 2.0):
            errors['temperature'] = 'Temperature must be between 0.0 and 2.0'
        
        if not isinstance(self.top_p, (int, float)):
            errors['top_p'] = 'Top P must be a number'
        elif not (0.0 <= self.top_p <= 1.0):
            errors['top_p'] = 'Top P must be between 0.0 and 1.0'
        
        if not isinstance(self.top_k, int):
            errors['top_k'] = 'Top K must be an integer'
        elif self.top_k < 0:
            errors['top_k'] = 'Top K must be non-negative'
        
        if not isinstance(self.repeat_penalty, (int, float)):
            errors['repeat_penalty'] = 'Repeat penalty must be a number'
        elif self.repeat_penalty < 0:
            errors['repeat_penalty'] = 'Repeat penalty must be non-negative'
        
        return errors


@dataclass
class MetaPromptConfig:
    """Configuration for meta-prompt refinement"""
    template: str
    parameters: MetaPromptParameters
    
    def format_prompt(self, objective: str) -> str:
        """Format the meta-prompt with the given objective"""
        return self.template.format(objective=objective)
    
    def validate(self) -> Dict[str, str]:
        """Validate configuration"""
        errors = {}
        
        if not self.template or not isinstance(self.template, str):
            errors['template'] = 'Meta-prompt template must be a non-empty string'
        elif '{objective}' not in self.template:
            errors['template'] = 'Meta-prompt template must contain {objective} placeholder'
        
        # Validate parameters
        param_errors = self.parameters.validate()
        if param_errors:
            errors['parameters'] = param_errors
        
        return errors


class PromptsConfig:
    """Manages prompts configuration from YAML file"""
    
    DEFAULT_CONFIG_PATH = Path('prompts_config.yaml')
    BACKUP_CONFIG_PATH = Path('prompts_config.yaml.backup')
    
    def __init__(self, config_path: Optional[Path] = None):
        """Initialize with optional custom config path"""
        self.config_path = config_path or self.DEFAULT_CONFIG_PATH
        self.meta_prompt_config: Optional[MetaPromptConfig] = None
        self._load_config()
    
    def _load_config(self):
        """Load configuration from YAML file"""
        try:
            if not self.config_path.exists():
                # Try to load from backup if main config doesn't exist
                if self.BACKUP_CONFIG_PATH.exists():
                    print(f"Warning: {self.config_path} not found, loading from backup")
                    self.config_path = self.BACKUP_CONFIG_PATH
                else:
                    raise FileNotFoundError(
                        f"Configuration file not found: {self.config_path}\n"
                        f"Backup file also not found: {self.BACKUP_CONFIG_PATH}"
                    )
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if not isinstance(data, dict):
                raise ValueError("Configuration file must contain a YAML mapping")
            
            # Load meta-prompt configuration
            meta_prompt_data = data.get('meta_prompt', {})
            if not meta_prompt_data:
                raise ValueError("Configuration must contain 'meta_prompt' section")
            
            # Load template
            template = meta_prompt_data.get('template', '')
            if not template:
                raise ValueError("Meta-prompt must contain 'template'")
            
            # Load parameters
            params_data = meta_prompt_data.get('parameters', {})
            parameters = MetaPromptParameters(
                temperature=float(params_data.get('temperature', 0.3)),
                top_p=float(params_data.get('top_p', 0.9)),
                top_k=int(params_data.get('top_k', 0)),
                repeat_penalty=float(params_data.get('repeat_penalty', 1.1))
            )
            
            # Create config object
            self.meta_prompt_config = MetaPromptConfig(
                template=template,
                parameters=parameters
            )
            
            # Validate configuration
            errors = self.meta_prompt_config.validate()
            if errors:
                raise ValueError(f"Invalid configuration: {errors}")
            
            print(f"✓ Prompts configuration loaded from {self.config_path}")
            
        except FileNotFoundError as e:
            print(f"Error: {e}")
            self._use_fallback_config()
        except Exception as e:
            print(f"Error loading prompts configuration: {e}")
            print("Using fallback configuration")
            self._use_fallback_config()
    
    def _use_fallback_config(self):
        """Use hardcoded fallback configuration"""
        fallback_template = """You are an expert prompt engineer. Your task is to convert a simple objective into a detailed, effective system prompt that will guide an AI assistant to achieve that objective.

Guidelines for creating system prompts:
1. Be specific and clear about the role and behavior expected
2. Include relevant context and constraints
3. Specify the desired output format if applicable
4. Add examples or templates when helpful
5. Include error handling or edge case instructions
6. Make it actionable and measurable

The objective to convert into a system prompt is:
{objective}

Create a comprehensive system prompt that will effectively guide an AI to accomplish this objective. Return only the system prompt text, without any additional commentary or explanation."""
        
        self.meta_prompt_config = MetaPromptConfig(
            template=fallback_template,
            parameters=MetaPromptParameters()
        )
        print("✓ Using fallback prompts configuration")
    
    def get_meta_prompt_config(self) -> MetaPromptConfig:
        """Get the meta-prompt configuration"""
        if not self.meta_prompt_config:
            self._load_config()
        return self.meta_prompt_config
    
    def reload(self):
        """Reload configuration from file"""
        self._load_config()


# Global prompts configuration instance
prompts_config = PromptsConfig()
