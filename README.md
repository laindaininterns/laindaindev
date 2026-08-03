# Lain Dain — Backend & Database

Branch: `mohsin/backend-setup`
Owner: Mohsin (Backend Dev)

## Progress Log

### Day 1
- Finalized v1 database schema — covers sellers, retailers, admins, products,
  orders, promotions, notifications, and platform settings
- Schema doc: [`docs/database-schema.md`](./docs/database-schema.md)
- Set up Supabase project (`laindain-dev`) with Row-Level Security enabled
  by default on all new tables

## Stack (this branch)
- Backend: Node.js + TypeScript
- Database/Auth/Storage: Supabase (Postgres)
- Email: Resend

## Plan / Next Steps
- [ ] Create `sellers`, `retailers`, `admins` tables in Supabase
- [ ] Wire up Supabase Auth for each role
- [ ] Set up Row-Level Security policies (admin: read-only access)
- [ ] Build catalog service (products, categories, product_variants)
- [ ] Build order flow + stock-concurrency handling
- [ ] WhatsApp/email invoice automation on order confirmation