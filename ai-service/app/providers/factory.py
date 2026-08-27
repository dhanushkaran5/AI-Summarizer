from app.providers.base import BaseLLMProvider
from app.providers.mock_provider import MockProvider
from app.config import settings

_provider_instance: BaseLLMProvider | None = None


def get_llm_provider() -> BaseLLMProvider:
    """Get the configured LLM provider instance (singleton)."""
    global _provider_instance

    if _provider_instance is not None:
        return _provider_instance

    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "mock" or settings.AI_MODE == "mock":
        _provider_instance = MockProvider()
    elif provider_name == "openai":
        from app.providers.openai_provider import OpenAIProvider
        _provider_instance = OpenAIProvider()
    elif provider_name == "gemini":
        from app.providers.gemini_provider import GeminiProvider
        _provider_instance = GeminiProvider()
    else:
        print(f"Unknown AI provider: {provider_name}, falling back to mock")
        _provider_instance = MockProvider()

    print(f"Using LLM provider: {_provider_instance.get_provider_name()} (mock={_provider_instance.is_mock()})")
    return _provider_instance
