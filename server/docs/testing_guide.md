# Backend Testing Guidelines

## 📮 Postman Environment Variables
To accurately test this B2B system, mock environment profiles in Postman containing:
- `{{base_url}}` = `http://localhost:3000/api`
- `{{admin_token}}` = Supabase JWT token belonging to an Admin account
- `{{seller_token}}` = Supabase JWT token belonging to a Seller account
- `{{guest_tracking_number}}` = Dynamically populated tracking string generated at checkout

## 🧪 Crucial Test Scenarios to Validate
1. **The Lockdown Test:** Attempt to call `POST /api/products` with a `pending` seller token. Expect `403 Forbidden`.
2. **The Price Lock Test:** Change a product's base price in the catalog *after* placing an order. Query the order endpoints to ensure `unit_price_snapshot` remains completely unchanged.
3. **The Guest Trace Test:** Place an order with an unauthenticated layout. Use the returned tracking number on the tracking route without sending any Auth headers. Expect `200 OK` with delivery status log history.