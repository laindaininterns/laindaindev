# API Endpoint Blueprint

## 🔐 Authentication Routes (via Supabase Auth)
- `POST /api/auth/register` -> Payload: `{ email, password, role: 'seller' | 'retailer' }`
- `POST /api/auth/login` -> Returns JWT token & User Metadata

## 🏢 Seller & Admin KYC Routes
- `POST /api/sellers/profile` -> Setup store profile details (KYC initially defaults to pending)
- `GET /api/admin/sellers/pending` -> Admin-only list of pending KYC registrations
- `PATCH /api/admin/sellers/:id/kyc` -> Admin-only action: `{ status: 'approved' | 'rejected' }`
- `POST /api/admin/sellers/:id/commission` -> Admin sets a custom rate: `{ commission_rate: 0.05 }`

## 📦 Catalog Routes
- `GET /api/categories` -> Fetch tree structure of parent and child categories
- `GET /api/products` -> Public/Retailer paginated catalog browsing (Cached via Upstash Redis)
- `POST /api/products` -> Seller-only create single item (Requires approved KYC)
- `POST /api/products/bulk-import` -> Seller-only multipart form CSV file parser

## 🛒 Order & Checkout Routes
- `POST /api/orders/checkout` -> Handles Guest and Signed-in checkouts. Snapshots prices & platform shipping fees instantly.
- `GET /api/orders/track/:tracking_number` -> Public tracking route (returns status history)
- `PATCH /api/orders/:id/status` -> Admin or authorized logistics status transition updates