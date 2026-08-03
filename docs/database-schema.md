# Lain Dain — Database Schema (v1)

Status: Finalized for initial build. This document is the shared reference for both backend developers — update it here first before changing the live schema.

## Business Rules (read before writing queries)

- Sellers register and remain `kyc_status = pending` until Admin approves manually offline. Only `approved` sellers can access their dashboard.
- No direct contact between seller and retailer — Lain Dain handles logistics and support entirely.
- Retailers can buy as guest or signed-in; no KYC required for retailers.
- Payment is COD only for v1, but `payment_method` is an enum so more methods can be added without a schema change.
- Admin has read-only access to products/sellers/retailers at the data level — enforce via Supabase Row-Level Security (RLS), not just app logic.
- Returns and disputes are handled manually (WhatsApp contact on dashboard) — not modeled in the schema for v1.
- A "Verified Seller" badge is derived from `sellers.kyc_status = 'approved'` — no separate flag.
- Prices and fees must be **snapshotted at transaction time** (`unit_price_snapshot`, `orders.shipping_fee`) — never recomputed retroactively from live settings.

---

## Identity & Approval

```
sellers
- id (uuid, pk)
- auth_user_id (fk -> auth.users)
- store_name
- kyc_status (enum: pending / approved / rejected)
- account_status (enum: active / blocked)
- logo_url
- description
- banner_url
- created_at

retailers
- id (uuid, pk)
- auth_user_id (fk -> auth.users, nullable)
- name
- phone
- account_status (enum: active / blocked)
- created_at

admins
- id (uuid, pk)
- auth_user_id (fk -> auth.users)
- role (enum: super_admin / support)
```

## Commission (per seller, admin-set, historized)

```
seller_commissions
- id (uuid, pk)
- seller_id (fk -> sellers)
- commission_rate (numeric)
- effective_from (timestamp)
- set_by_admin_id (fk -> admins)
```

## Catalog

```
categories
- id (uuid, pk)
- name
- parent_id (nullable, self-referencing)

products
- id (uuid, pk)
- seller_id (fk -> sellers)
- category_id (fk -> categories)
- name
- base_price (numeric)
- stock_qty (integer)
- moq (integer)
- status (enum: active / out_of_stock / delisted)
- embedding (vector(1536))        -- pgvector, for semantic search / chatbot matching
- created_at

product_variants
- id (uuid, pk)
- product_id (fk -> products)
- variant_name (e.g. "25kg", "Red")
- price (numeric)
- stock_qty (integer)

product_images
- id (uuid, pk)
- product_id (fk -> products)
- url
- sort_order (integer)
```

## Promotions

```
promotions
- id (uuid, pk)
- seller_id (fk -> sellers, nullable)     -- null = platform-wide, admin-set
- product_id (fk -> products, nullable)   -- null = applies to seller's whole store
- discount_type (enum: percentage / flat)
- discount_value (numeric)
- start_date (timestamp)
- end_date (timestamp)
- status (enum: scheduled / active / expired)
- created_by_type (enum: seller / admin)
- created_by_id (uuid)
```

## Reviews & Wishlist

```
reviews
- id (uuid, pk)
- product_id (fk -> products)
- retailer_id (fk -> retailers, nullable)
- rating (integer, 1-5)
- comment (text)
- created_at

wishlists
- id (uuid, pk)
- retailer_id (fk -> retailers)   -- signed-in only
- product_id (fk -> products)
- created_at
```

## Orders

```
orders
- id (uuid, pk)
- retailer_id (fk -> retailers, nullable)     -- null if guest
- is_guest (boolean)
- guest_name (nullable)
- guest_phone (nullable)
- guest_address (nullable)
- tracking_number (text, unique)
- status (enum: placed / processing / shipped / delivered / cancelled)
- payment_method (enum: cod)                   -- extensible later
- shipping_fee (numeric)                        -- snapshotted from platform_settings at checkout
- shipping_fee_source (enum: platform_default / manual_override)
- shipping_fee_set_by (fk -> admins, nullable)  -- set only when manually overridden
- total_amount (numeric)
- created_at

order_items
- id (uuid, pk)
- order_id (fk -> orders)
- product_id (fk -> products)
- seller_id (denormalized from products.seller_id)
- qty (integer)
- unit_price_snapshot (numeric)

order_status_history
- id (uuid, pk)
- order_id (fk -> orders)
- status (enum, same values as orders.status)
- changed_at (timestamp)
- changed_by (fk -> admins, nullable)
```

## Notifications

```
notification_logs
- id (uuid, pk)
- order_id (fk -> orders)
- channel (enum: whatsapp / email)
- recipient_type (enum: seller / retailer)
- status (enum: sent / failed)
- sent_at (timestamp)
```

## Platform Settings (generic, admin-editable)

```
platform_settings
- id (uuid, pk)
- setting_key (text, unique)        -- e.g. 'shipping_fee', 'support_whatsapp_number'
- value_type (enum: fixed / percentage / text)
- value (text)
- updated_by (fk -> admins)
- updated_at (timestamp)
```

---

## Deferred to Later (documented, not built in v1)

| Feature | Why Deferred |
|---|---|
| Returns | Handled manually via WhatsApp contact for now |
| Disputes | Same — manual resolution via dashboard contact |
| Featured/sponsored listings | Not core to launch, low schema cost to add later (`products.is_featured`) |
| Separate `shipments`/carrier integration | Lain Dain currently handles logistics directly; `orders.status` + `order_status_history` cover this for now |

## Access Control Note

Enforce Admin's read-only access via **Supabase RLS policies**, not just app-layer checks:
- Admin role: `SELECT` on `products`, `sellers`, `retailers`
- Admin role: `UPDATE` only on `sellers.kyc_status`, `sellers.account_status`, `retailers.account_status`, `platform_settings`
- No `DELETE` policies for Admin on catalog/user tables
