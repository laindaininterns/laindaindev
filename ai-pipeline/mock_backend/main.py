"""A minimal stand-in for the Node backend's internal endpoints, used only
for local development and testing of the tier 3 agent's tools.

This is not part of the shipped ai-pipeline service and is never
deployed. It exists purely so search_listings and contact_seller have
something real to call before the actual Node backend has these
endpoints. It implements the exact contract documented in
docs/api_contract.md under "Tool contract this service expects from the
Node backend", so swapping BACKEND_BASE_URL to the real thing later
requires no code changes here or in the agent.

Run it directly with:
  uvicorn mock_backend.main:app --port 8001 --reload
or as part of the full stack with docker compose (see docker-compose.yml).
"""

from fastapi import FastAPI
from pydantic import BaseModel

from mock_backend import fixtures

app = FastAPI(title="Mock Node Backend (dev only, not shipped)")


class SearchRequest(BaseModel):
    query: str = ""
    max_price: float | None = None


class SearchResponse(BaseModel):
    results: list[dict]


class ContactSellerRequest(BaseModel):
    seller_id: str
    message: str


class ContactSellerResponse(BaseModel):
    sent: bool
    message_id: str | None = None
    error: str | None = None


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/internal/search-listings", response_model=SearchResponse)
async def search_listings(payload: SearchRequest) -> SearchResponse:
    results = fixtures.search(payload.query, payload.max_price)
    return SearchResponse(results=results)


@app.post("/internal/contact-seller", response_model=ContactSellerResponse)
async def contact_seller(payload: ContactSellerRequest) -> ContactSellerResponse:
    seller = fixtures.get_seller(payload.seller_id)
    if seller is None:
        return ContactSellerResponse(sent=False, error=f"unknown seller_id '{payload.seller_id}'")
    # Deterministic fake message id, real message delivery is the Node
    # backend's job once it exists, this just proves the round trip works.
    return ContactSellerResponse(sent=True, message_id=f"MSG-{payload.seller_id}-{len(payload.message)}")
