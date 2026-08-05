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
- [ ] Create `POST /api/sellers/register` endpoint
- [ ] Create `GET /api/admin/sellers/pending` endpoint (Admin only)
- [ ] Create `PATCH /api/admin/sellers/:id/approve` endpoint (Admin only)
- [ ] Create `POST /api/admin/sellers/:id/commission` endpoint
- [ ] Postman Test 1: Register a new seller (assert `kyc_status = pending`)
- [ ] Postman Test 2: Attempt protected seller action with pending account (assert HTTP 403)
- [ ] Postman Test 3: Approve seller via Admin endpoint
- [ ] Postman Test 4: Retry seller action with approved account (assert HTTP 200)
- [ ] Commit Stage 3 to GitHub repository

## 📦 Stage 4: Catalog & CSV Bulk Import Engine
- [ ] Create Category endpoints (`GET`, `POST /api/categories`)
- [ ] Create Single Product endpoints (`POST`, `GET`, `PUT`, `DELETE /api/products`)
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