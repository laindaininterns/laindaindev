# Detailed Execution Plan & Technical Architecture

## 📋 Project Philosophy & Rules
- **Modular Monolith Architecture:** Keep code segregated into clear controllers, services, and routes (`/src/controllers`, `/src/services`, `/src/routes`).
- **Data Integrity First:** All price calculations and shipping charges must be snapshotted in PostgreSQL during checkout (`unit_price_snapshot`, `shipping_fee`).
- **Security Standard:** Use Supabase RLS policies for strict data separation. Never trust client-side role checks alone.
- **Git Commit Routine:** Every stage must be verified with Postman tests before creating a Git commit and updating `docs/checklist.md`.

---

## 🏁 Phase Breakdown

### Phase 1: Database Setup & Security Foundation
- Setup database migrations using SQL DDL scripts.
- Define custom Postgres `ENUM` types for statuses (`kyc_status`, `account_status`, `order_status`, etc.).
- Enable `pgvector` extension for future product semantic search.
- Configure Supabase Row-Level Security (RLS) policies to enforce Admin read-only rules on core catalog tables.

### Phase 2: Express Server Boilerplate & Auth Middleware
- Initialize Node.js + Express application structure with TypeScript/JavaScript.
- Setup environment variables (`.env`) for Supabase credentials, Upstash Redis, and Resend API.
- Build custom authentication middleware to decode Supabase JWT tokens.
- Implement role-based access control (RBAC) middleware (`isAdmin`, `isApprovedSeller`, `isRetailer`).

### Phase 3: Seller Onboarding & Admin KYC Pipeline
- Build seller registration API endpoint (`kyc_status` defaults to `pending`).
- Build Admin approval endpoint (`PATCH /api/admin/sellers/:id/kyc` -> update status to `approved`/`rejected`).
- Build Admin seller commission assignment endpoint (`POST /api/admin/commissions`).
- Verify unapproved sellers cannot access product management endpoints.

### Phase 4: Product Catalog & CSV Bulk Import Engine
- Build Category CRUD APIs (handling self-referencing parent/child categories).
- Build Single Product CRUD APIs (with variants and images).
- Build CSV Bulk Import endpoint using stream processing (`multer` + `csv-parser`) for high-volume catalog uploads.
- Implement stock management and Minimum Order Quantity (MOQ) validation.

### Phase 5: Cart, Guest Tracking & Order Engine
- Build guest tracking generator (UUID generation for unauthenticated buyers).
- Build checkout endpoint with **Transaction Snapshotting**:
  - Fetch current product price & snapshot as `unit_price_snapshot`.
  - Fetch platform shipping fee from `platform_settings` and snapshot as `shipping_fee`.
- Implement Cash on Delivery (COD) order placement flow.
- Build order status history transition tracker (`order_status_history`).

### Phase 6: Redis Caching, Notifications & Admin Metrics
- Integrate Upstash Redis for caching frequently requested data (e.g., active product listings, platform settings).
- Integrate Resend API for automated email notifications (Order Confirmation, Seller New Order Alert).
- Implement basic rate-limiting middleware using Upstash to prevent API abuse.