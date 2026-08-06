# laindaindev

## 🎥 Demo Video

Watch the working project here:

https://github.com/laindaininterns/laindaindev/blob/sharaf/cart-animation-stackblitz/cart-animation-video.mp4


## 📸 Project Screenshots

### Image 1
![Image 1](./image%201.png)

### Image 2
![Image 2](./image%202.png)

### Image 3
![Image 3](./image%203.png)

### Image 4
![Image 4](./image%204.png)

---

## 🔧 Backend & Database

Branch merged: `mohsin/backend-setup`

### Stack
- Backend: Node.js + Express
- Database/Auth/Storage: Supabase (Postgres)
- Email: Resend

### Progress Log

#### Day 1
- Finalized v1 database schema — covers sellers, retailers, admins, products,
  orders, promotions, notifications, and platform settings
- Schema doc: [`docs/database-schema.md`](./docs/database-schema.md)
- Set up Supabase project (`laindain-dev`) with Row-Level Security enabled
  by default on all new tables

#### Stage 2 — Auth System
- Complete authentication controllers, JWT, email notifications, admin/seller workflow

#### Stage 3 — Product Catalog
- Complete product catalog CRUD engine verified

### Plan / Next Steps
- [ ] Create `sellers`, `retailers`, `admins` tables in Supabase
- [ ] Wire up Supabase Auth for each role
- [ ] Set up Row-Level Security policies (admin: read-only access)
- [ ] Build catalog service (products, categories, product_variants)
- [ ] Build order flow + stock-concurrency handling
- [ ] WhatsApp/email invoice automation on order confirmation
