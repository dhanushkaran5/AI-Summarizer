"""OpenAI LLM provider implementation with error handling and fallback."""
import json
import logging
from typing import Optional
import httpx
from app.config import settings
from app.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API provider for production LLM generation."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        self.base_url = "https://api.openai.com/v1/chat/completions"

    def get_provider_name(self) -> str:
        return "openai"

    def is_mock(self) -> bool:
        return False

    async def generate(self, prompt: str, system_prompt: Optional[str] = None,
                       max_tokens: int = 2000, temperature: float = 0.3) -> str:
        """Generate text completion from OpenAI."""
        if not self.api_key or self.api_key.startswith("your_"):
            logger.warning("OpenAI API key missing or placeholder. Falling back to deterministic mock.")
            from app.providers.mock_provider import MockProvider
            return await MockProvider().generate(prompt, system_prompt, max_tokens, temperature)

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}. Falling back to mock generator.")
            from app.providers.mock_provider import MockProvider
            return await MockProvider().generate(prompt, system_prompt, max_tokens, temperature)

    async def generate_structured(self, prompt: str, system_prompt: Optional[str] = None,
                                   max_tokens: int = 2000, temperature: float = 0.3) -> dict:
        """Generate structured JSON response from OpenAI."""
        effective_system = (system_prompt or "") + "\nYou MUST return valid JSON only."
        raw_text = await self.generate(prompt, effective_system, max_tokens, temperature)
        try:
            # Strip potential markdown json formatting
            cleaned = raw_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception:
            return {"raw_response": raw_text, "status": "unstructured"}
