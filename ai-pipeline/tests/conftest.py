"""Shared pytest fixtures."""

import httpx
import pytest

from app.services.intent import tier3_agent
from mock_backend.main import app as mock_backend_app

# Captured before any monkeypatching, tier3_agent.httpx IS the same module
# object as any other `import httpx`, so patching one attribute on it
# patches all references. Fixtures below must build clients from this
# original reference, not from httpx.AsyncClient, or they recurse into
# their own patched self.
_real_async_client = httpx.AsyncClient


@pytest.fixture
def route_to_mock_backend(monkeypatch):
    """Redirects the tier 3 agent's tool calls at the real mock_backend
    app, in-process via ASGITransport, no Docker or network socket
    needed. Use this whenever a test needs the agent's tools to behave
    like a real (if fake) backend instead of failing to connect."""

    def _client_factory(*_args, **_kwargs):
        return _real_async_client(transport=httpx.ASGITransport(app=mock_backend_app), base_url="http://mock-backend")

    monkeypatch.setattr(tier3_agent.httpx, "AsyncClient", _client_factory)
