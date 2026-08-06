# Granular Task Checklist

## 🛠️ Stage 1: Database Initialization
- [x] Draft `supabase/migrations/01_auth_system.sql` containing all table schemas and status ENUMs
- [x] Run migration scripts inside Supabase SQL Editor / Supabase MCP
- [x] Test table creations and foreign key constraints in Supabase Studio
- [x] Commit Stage 1 to GitHub repository

## 🔐 Stage 2: Backend Core & Auth Setup
- [x] Run `npm init -y` and install Express, `@supabase/supabase-js`, `dotenv`, `cors`, `helmet`, `jsonwebtoken`, `bcryptjs`, `ioredis`, `resend`, `bullmq`
- [x] Set up project directory structure (`/src/config`, `/src/middleware`, `/src/routes`, `/src/controllers`)
- [x] Create `src/config/supabase.js` service wrapper
- [x] Build `src/middleware/auth.js` for JWT token verification
- [x] Create initial auth routes and controllers (`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/seller/submit_application`)
- [x] Create test endpoint `/api/health` to verify server functionality
- [x] Commit Stage 2 to GitHub repository

## 🏢 Stage 3: Seller Onboarding & KYC Management
- [x] Create `POST /api/auth/register` (Seller & Buyer registration with bcrypt password hashing)
- [x] Create `POST /api/auth/seller/submit_application` endpoint (Seller onboarding with welcome email)
- [x] Create `GET /api/admin/sellers/pending` endpoint (Admin only)
- [x] Create `PATCH /api/admin/sellers/:id/status` endpoint (Admin status update to APPROVED/REJECTED with notification email)
- [x] Built Resend notification service (`src/services/emailService.js`) for welcome & status emails
- [x] Verified seller registration (assert `current_status = PENDING`)
- [x] Verified Admin status update endpoint (assert `APPROVED` / `REJECTED`)
- [x] Commit Stage 3 to GitHub repository

## 📦 Stage 4: Catalog & CSV Bulk Import Engine
- [x] Create `supabase/migrations/02_products_crud.sql` — categories table, product_status ENUM, products table, seeds, updated_at trigger
- [x] Apply migration via Supabase MCP (`categories` + `products` tables live in DB)
- [x] Seed default categories: Electronics, Apparel & Textiles, Industrial Machinery, Office Supplies, Home & Living
- [x] Create `GET /api/products/categories` — public list categories
- [x] Create `POST /api/products` — authenticated SELLER (APPROVED only) create product
- [x] Create `GET /api/products` — public list with optional `?category_id=` filter
- [x] Create `GET /api/products/:id` — public single product detail
- [x] Create `PATCH /api/products/:id` — authenticated seller ownership update
- [x] Create `DELETE /api/products/:id` — authenticated seller ownership delete
- [x] Register `productRoutes` under `/api/products` in `src/server.js`
- [x] Verified all 7 CRUD operations pass automated tests on port 5000
- [ ] Install `multer` and `csv-parser`
- [ ] Create `POST /api/products/bulk-upload` endpoint
- [ ] Implement validation logic for CSV columns (`name`, `base_price`, `stock_qty`, `moq`)
- [ ] Postman Test: Upload test CSV file with 10 sample products
- [ ] Commit Stage 4 to GitHub repository

## 🛒 Stage 5: Cart, Checkout & Order Snapshotting
- [ ] Create tracking number generator helper (`LD-YYYYMMDD-XXXX`)
- [ ] Create `POST /api/orders/checkout` endpoint supporting Guest & Registered Retailers
- [ ] Implement database transaction for order creation + order items snapshot
- [ ] Create `GET /api/orders/track/:tracking_number` endpoint for guest order tracking
- [ ] Create `PATCH /api/orders/:id/status` endpoint to update order lifecycle (`placed` -> `processing` -> `delivered`)
- [ ] Postman Test 1: Guest checkout flow
- [ ] Postman Test 2: Order tracking lookup via tracking number
- [ ] Commit Stage 5 to GitHub repository

## ⚡ Stage 6: Caching, Notifications & Infrastructure Deployment
- [ ] Install `@upstash/redis` and setup Redis connection client
- [ ] Add caching strategy to `GET /api/products` (Cache hit/miss logic)
- [ ] Install `resend` package and build email notification service module
- [ ] Trigger order notification emails upon successful checkout
- [ ] Deploy Node.js server to Railway
- [ ] Configure environment variables in Railway dashboard
- [ ] End-to-End Postman testing on live Railway URL
- [ ] Final project commit & pull request merge