"""Deterministic fake marketplace data.

There are no real buyers, sellers, or listings yet, the Node backend
that will eventually own this data isn't built. This fixture set exists
so the tier 3 agent's tools have something real to call and a known
correct answer to be checked against, rather than testing against
silence. When the real Node backend exists, mock_backend is swapped out
for it by changing one config value (BACKEND_BASE_URL), the contract
these fixtures implement is what the real endpoints need to match, see
docs/api_contract.md.

Keep this data small, deterministic, and never randomized, tests depend
on exact matches.
"""

LISTINGS = [
    {
        "id": "L1",
        "title": "Used mountain bike, good condition",
        "category": "bike",
        "price": 18000,
        "seller_id": "S1",
    },
    {
        "id": "L2",
        "title": "Brand new city bike",
        "category": "bike",
        "price": 25000,
        "seller_id": "S2",
    },
    {
        "id": "L3",
        "title": "Electric scooter, low mileage",
        "category": "scooter",
        "price": 45000,
        "seller_id": "S1",
    },
    {
        "id": "L4",
        "title": "Kids bicycle, 16 inch wheels",
        "category": "bike",
        "price": 9000,
        "seller_id": "S3",
    },
    {
        "id": "L5",
        "title": "Refurbished smartphone, 128GB",
        "category": "phone",
        "price": 32000,
        "seller_id": "S2",
    },
]

SELLERS = [
    {"id": "S1", "name": "Ahmed Cycles", "rating": 4.6},
    {"id": "S2", "name": "City Wheels Store", "rating": 4.8},
    {"id": "S3", "name": "Family Bikes Karachi", "rating": 4.2},
]


def search(query: str, max_price: float | None = None) -> list[dict]:
    query = (query or "").strip().lower()
    results = []
    for listing in LISTINGS:
        if query and query not in listing["title"].lower() and query not in listing["category"]:
            continue
        if max_price is not None and listing["price"] > max_price:
            continue
        results.append(listing)
    return results


def get_seller(seller_id: str) -> dict | None:
    return next((s for s in SELLERS if s["id"] == seller_id), None)
