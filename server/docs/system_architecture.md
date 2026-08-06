# System Architecture & Technical Specifications

## 🏛️ Stack Overview
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Database** | Supabase (PostgreSQL) | Primary data storage, Auth management, RLS security |
| **Backend API** | Node.js / Express | Business logic, order snapshotting, CSV processing |
| **Cache & Rate Limit** | Upstash Redis | Fast product query caching & API rate-limiting |
| **Email Service** | Resend | Operational email alerts (Order confirmation, KYC status) |
| **Deployment** | Railway | Cloud hosting for Express backend application |

---

## 📊 Database Relationship Model (Mermaid)

```mermaid
erDiagram
    SELLERS ||--o{ PRODUCTS : "lists"
    SELLERS ||--o{ SELLER_COMMISSIONS : "has rate history"
    CATEGORIES ||--o{ PRODUCTS : "classifies"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has options"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has media"
    RETAILERS ||--o{ ORDERS : "places"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced in"
    ADMINS ||--o{ SELLER_COMMISSIONS : "sets"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "tracks transition"