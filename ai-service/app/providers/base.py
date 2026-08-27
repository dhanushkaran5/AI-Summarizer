from abc import ABC, abstractmethod
from typing import Optional


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None,
                       max_tokens: int = 2000, temperature: float = 0.3) -> str:
        """Generate text from a prompt."""
        pass

    @abstractmethod
    async def generate_structured(self, prompt: str, system_prompt: Optional[str] = None,
                                   max_tokens: int = 2000, temperature: float = 0.3) -> dict:
        """Generate structured JSON response from a prompt."""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the provider name."""
        pass

    @abstractmethod
    def is_mock(self) -> bool:
        """Return whether this is a mock provider."""
        pass
