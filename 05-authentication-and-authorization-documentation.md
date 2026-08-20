# LainDain Authentication & Authorization Documentation (MVP v1)

> **Security, Authentication & Role-Based Access Control (RBAC) Specification**  
> **Version:** 1.0.0  
> **Status:** Production / MVP v1  
> **Security Standards:** JWT Bearer Token Session Management, Salted `bcryptjs` Hashing (10 Rounds), 6-Digit Resend Email OTP Verification, Strict Role-Based Middleware Authorization  

---

## 1. Executive Summary & Security Architecture

### 1.1 Overview & Core Principles

**LainDain** enforces a robust, multi-layered security architecture designed to protect B2B wholesale transactions, confidential factory pricing, and merchant profiles.

The platform combines:
* **Stateless JWT Session Management:** Short-lived (24-hour) JSON Web Tokens signed using HMAC-SHA256 (`jsonwebtoken`).
* **Password Hardening:** Salted password hashing powered by `bcryptjs` (10 cost rounds).
* **Role-Based Access Control (RBAC):** Strict separation of privileges across four identity types (`GUEST`, `BUYER`, `SELLER`, `ADMIN`).
* **Multi-Stage Seller KYC Guard:** Wholesale sellers undergo a mandatory two-tier onboarding pipeline requiring 6-digit email OTP verification followed by administrative verification before dashboard features are unlocked.
* **Rate Limiting & Threat Mitigation:** Denial of Service (DoS) and brute-force protection enforced via `express-rate-limit`, `helmet` HTTP header security, and CORS origin filtering.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          INCOMING HTTP REQUEST                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 GLOBAL SECURITY & RATE LIMITING LAYER                  │
│       Helmet Headers | CORS Filter | Auth Rate Limiter (15 req/15m)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION MIDDLEWARE LAYER                      │
│                  verifyToken (Bearer JWT Validation)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION & ROLE GUARD LAYER                      │
│         verifyBuyer | verifySeller (Status Check) | verifyAdmin        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PROTECTED CONTROLLER EXECUTION                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Roles & RBAC Permission Matrix

The system enforces strict permission boundaries across four distinct user session types:

| User Session Role | Identity Type | Onboarding & Verification Requirements | Access Scope & Endpoint Permissions |
| :--- | :--- | :--- | :--- |
| **`GUEST`** | Unauthenticated Browser | None (Auto-assigned `X-Guest-ID` client GUID) | Read-only product browsing, catalog search, guest cart management, and guest checkout execution. |
| **`BUYER`** | Retail Shop Owner | Account registration with auto-verified status (`is_email_verified = true`) | Full product search, cart operations, order placement (COD / Bank Transfer), order history tracking, and profile management. |
| **`SELLER`** | Wholesale Manufacturer | Mandatory email OTP verification + Admin KYC Review (`current_status = 'APPROVED'`) | Vendor inventory CRUD, stock level toggles, Minimum Order Quantity (MOQ) adjustments, and independent order line item fulfillment. |
| **`ADMIN`** | Platform Administrator | Administrative seed credentials or system assignment | System-wide analytics, seller application review/approval, catalog moderation, global order status override, and user directory access. |

---

## 3. Authentication Subsystems & Workflows

```mermaid
flowchart TD
    subgraph Client_Flow ["User Client Operations"]
        RegisterForm["Register Form (BUYER / SELLER)"]
        LoginForm["Login Form"]
        ForgotForm["Forgot Password Form"]
        ResetForm["Reset Password Form"]
    end

    subgraph Auth_API ["Auth Controller Endpoints (/api/auth)"]
        RegHandler["/register"]
        OTPHandler["/verify-email"]
        LoginHandler["/login"]
        ForgotHandler["/forgot-password"]
        ResetHandler["/reset-password"]
    end

    subgraph External_Services ["Services & Database"]
        ResendAPI["Resend Email API"]
        Bcrypt["bcryptjs (10 Salt Rounds)"]
        JWTEngine["JWT Engine (HMAC-SHA256)"]
        Database[(Supabase PostgreSQL)]
    end

    RegisterForm -->|POST email, password, role| RegHandler
    LoginForm -->|POST email, password| LoginHandler
    ForgotForm -->|POST email| ForgotHandler
    ResetForm -->|POST token, newPassword| ResetHandler

    RegHandler -->|Hash Password| Bcrypt
    RegHandler -->|Insert User & Profile| Database
    RegHandler -->|Dispatch Code / Welcome| ResendAPI

    OTPHandler -->|Verify 6-digit Code| Database

    LoginHandler -->|Compare Hash| Bcrypt
    LoginHandler -->|Verify Status & Generate Token| JWTEngine
    JWTEngine -->|Return Bearer Token| Client_Flow

    ForgotHandler -->|Generate Reset Token| JWTEngine
    ForgotHandler -->|Dispatch Reset Email| ResendAPI

    ResetHandler -->|Verify Reset Token & Hash New Password| Bcrypt
    ResetHandler -->|Update password_hash & Auto-Verify| Database
```

---

### 3.1 Account Registration & Email Verification (`/api/auth/register`)

#### 3.1.1 Registration Flow Rules
* **Buyer Registration (`role = 'BUYER'`):**
  1. Hashes raw password using `bcrypt.hash(password, 10)`.
  2. Creates a user record in `users` with `role = 'BUYER'` and `is_email_verified = true`.
  3. Instantiates an associated `buyer_profiles` record.
  4. Dispatches a general welcome email via Resend (`sendWelcomeEmail`).
  5. Generates and returns a 24-hour session JWT token immediately, giving buyers instant access to wholesale purchasing.

* **Seller Registration (`role = 'SELLER'`):**
  1. Hashes raw password using `bcrypt.hash(password, 10)`.
  2. Generates a random 6-digit numeric OTP code (`Math.floor(100000 + Math.random() * 900000)`).
  3. Creates a user record in `users` with `role = 'SELLER'`, `is_email_verified = false`, and `email_verification_token = otpCode`.
  4. Creates a `seller_profiles` record with `current_status = 'PENDING'`.
  5. Dispatches a seller welcome email and a 6-digit verification code email via Resend.
  6. **Withholds the JWT session token** and returns `{ success: true, requireVerification: true }`.

---

### 3.2 Email Verification OTP Handler (`/api/auth/verify-email`)

1. Accepts `{ email, code }`.
2. Queries `users` table matching `email` and `email_verification_token = code`.
3. If valid, updates `users`:
   ```sql
   UPDATE users 
   SET is_email_verified = true, email_verification_token = NULL 
   WHERE id = user_id;
   ```
4. For `SELLER` accounts, `seller_profiles.current_status` remains `PENDING` until approved by an Admin.
5. Issues a 24-hour session JWT token if account verification is complete.

---

### 3.3 Strict Login Security & Status Guards (`/api/auth/login`)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client App
    participant API as Auth Controller (/login)
    participant Bcrypt as bcryptjs Engine
    participant DB as Supabase PostgreSQL DB
    participant JWT as JWT Service

    User->>API: POST /api/auth/login { email, password }
    API->>DB: Query user record by email (case-insensitive ilike)
    
    alt User Not Found
        DB-->>API: null
        API-->>User: HTTP 401 Unauthorized ("Invalid credentials.")
    end

    API->>Bcrypt: compare(password, user.password_hash)
    alt Password Mismatch
        Bcrypt-->>API: false
        API-->>User: HTTP 401 Unauthorized ("Invalid credentials.")
    end

    alt Role == SELLER AND is_email_verified == false
        API-->>User: HTTP 403 Forbidden { requireVerification: true }
    end

    alt Role == BUYER or ADMIN AND is_email_verified == false
        API->>DB: Auto-heal: UPDATE users SET is_email_verified = true
    end

    alt Role == SELLER
        API->>DB: Query seller_profiles by user_id
        alt current_status != 'APPROVED'
            DB-->>API: seller_profiles (current_status = 'PENDING' / 'REJECTED')
            API-->>User: HTTP 403 Forbidden { pendingApproval: true }
        end
      end

    API->>JWT: sign({ id, email, role, profile_id }, JWT_SECRET, { expiresIn: '24h' })
    JWT-->>API: Signed Bearer Token
    API-->>User: HTTP 200 OK { success: true, token, user, profile }
```

---

### 3.4 Seller Onboarding & KYC Approval Pipeline

To prevent unauthorized or unverified vendors from publishing products, seller accounts must complete an administrative approval workflow:

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Seller / Vendor
    actor Admin as Platform Admin
    participant Server as Express Server
    participant DB as Supabase DB
    participant Email as Resend Email Service

    Seller->>Server: POST /api/auth/register (Role: SELLER)
    Server->>DB: INSERT into users (is_email_verified: false)
    Server->>DB: INSERT into seller_profiles (current_status: 'PENDING')
    Server->>Email: sendVerificationCode (6-digit OTP)
    Server-->>Seller: HTTP 200 { requireVerification: true }

    Seller->>Server: POST /api/auth/verify-email { code: "123456" }
    Server->>DB: UPDATE users SET is_email_verified = true
    Server-->>Seller: HTTP 200 (Account Verified, Awaiting Admin Approval)

    note over Seller,Server: Seller Login Blocked (HTTP 403: pendingApproval = true)

    Admin->>Server: PATCH /api/admin/sellers/:id/status { status: "APPROVED" }
    Server->>DB: UPDATE seller_profiles SET current_status = 'APPROVED', approved_at = NOW()
    Server->>Email: sendSellerStatusAlert(sellerEmail, 'APPROVED')
    Server-->>Admin: HTTP 200 OK (Seller Account Activated)

    Seller->>Server: POST /api/auth/login { email, password }
    Server->>DB: Verify current_status == 'APPROVED'
    Server-->>Seller: HTTP 200 OK + JWT Token (Full Vendor Access Unlocked)
```

---

### 3.5 Password Reset Workflow (`/api/auth/forgot-password` & `/api/auth/reset-password`)

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Forgot Password)
    participant API as Auth Controller
    participant DB as Supabase DB
    participant Email as Resend Email Service
    participant JWT as JWT Engine

    User->>API: POST /api/auth/forgot-password { email }
    API->>DB: Query users by email (ilike case-insensitive)
    
    alt User Record Found
        API->>JWT: sign({ id, email, type: 'password_reset' }, JWT_SECRET, { expiresIn: '24h' })
        JWT-->>API: resetToken
        API->>Email: sendPasswordResetEmail({ email, resetToken, resetLink })
        API->>API: console.log("[DEV] PASSWORD RESET LINK: http://localhost:5173/reset-password?token=...")
    end

    API-->>User: HTTP 200 OK ("If an account exists, a reset link has been dispatched.")

    User->>API: POST /api/auth/reset-password { token, newPassword }
    API->>JWT: verify(token, JWT_SECRET)
    
    alt Valid Reset Token (type == 'password_reset')
        API->>DB: UPDATE users SET password_hash = newHash, is_email_verified = true WHERE id = decoded.id
        API-->>User: HTTP 200 OK ("Password reset successfully. You can now log in.")
    else Invalid / Expired Token
        API-->>User: HTTP 400 Bad Request ("Invalid or expired password reset link.")
    end
```

---

## 4. JWT Token Architecture & Specification

### 4.1 Token Structure & Claims

All JWTs issued by LainDain use HMAC-SHA256 signing with the secret key `process.env.JWT_SECRET` (fallback: `'lain-dain-jwt-secret-key-change-in-prod'`).

#### 4.1.1 Session JWT Token Payload Schema
Included in HTTP `Authorization: Bearer <token>` headers for authenticated requests:

```json
{
  "id": "6452c106-d266-4237-93ac-2878bdf7a048",
  "email": "seller@factory.com",
  "role": "SELLER",
  "profile_id": "961fd2e0-dfd6-4f4d-815c-c665bd9aa45b",
  "iat": 1786959542,
  "exp": 1787045942
}
```

* `id`: Unique user surrogate ID (`users.id`).
* `email`: User account email address.
* `role`: System authorization role (`ADMIN`, `BUYER`, `SELLER`).
* `profile_id`: Foreign key reference to the role profile (`buyer_profiles.id` or `seller_profiles.id`).
* `iat`: Issue timestamp (Unix epoch seconds).
* `exp`: Expiration timestamp (24 hours after issuance).

#### 4.1.2 Password Reset Token Payload Schema
Short-lived token dedicated exclusively to password reset verification:

```json
{
  "id": "9251d5a9-4c21-42ca-bab7-f1f92e9aadcc",
  "email": "buyer@store.com",
  "type": "password_reset",
  "iat": 1786958519,
  "exp": 1786962119
}
```

---

## 5. Authorization Middleware Specifications

### 5.1 `verifyToken` Middleware (`server/src/middleware/auth.js`)
Validates incoming bearer tokens on protected endpoints.

```javascript
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};
```

---

### 5.2 `verifySeller` Middleware (`server/src/middleware/sellerAuth.js`)
Enforces vendor role authorization AND verifies database status (`current_status === 'APPROVED'`).

```javascript
const verifySeller = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'SELLER') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Seller credentials required.',
      });
    }

    const { data: sellerProfile, error } = await supabase
      .from('seller_profiles')
      .select('id, current_status')
      .eq('user_id', req.user.id)
      .single();

    if (error || !sellerProfile || sellerProfile.current_status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Seller account pending admin approval. Access restricted until approved.',
      });
    }

    req.sellerProfile = sellerProfile;
    next();
  } catch (err) {
    console.error('Error in verifySeller middleware:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error verifying seller status.',
    });
  }
};
```

---

### 5.3 `verifyAdmin` Middleware (`server/src/middleware/adminAuth.js`)
Restricts system metrics, approval management, and catalog override endpoints to `ADMIN` users.

```javascript
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Admin credentials required.',
    });
  }
  next();
};
```

---

## 6. Endpoint Authorization Matrix

The table below documents the exact security policies enforced across all backend REST endpoints:

| HTTP Method | API Endpoint Path | Public / Protected | Required Middleware | Authorized Roles | Failure Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `authLimiter` | Anyone | `400 Bad Request` |
| `POST` | `/api/auth/verify-email` | Public | `authLimiter` | Anyone | `400 Bad Request` |
| `POST` | `/api/auth/login` | Public | `authLimiter` | Anyone | `401 Unauthorized / 403 Forbidden` |
| `POST` | `/api/auth/forgot-password` | Public | `authLimiter` | Anyone | `400 Bad Request` |
| `POST` | `/api/auth/reset-password` | Public | `authLimiter` | Anyone | `400 Bad Request` |
| `GET` | `/api/buyer/cart` | Public / Hybrid | `resolveGuestOrUser` | `GUEST`, `BUYER` | `200 OK (Empty Cart)` |
| `POST` | `/api/buyer/cart` | Public / Hybrid | `resolveGuestOrUser` | `GUEST`, `BUYER` | `400 Bad Request` |
| `POST` | `/api/buyer/checkout` | Public / Hybrid | `resolveGuestOrUser` | `GUEST`, `BUYER` | `400 Bad Request` |
| `GET` | `/api/buyer/orders` | Protected | `verifyToken` | `BUYER` | `401 Unauthorized / 403 Forbidden` |
| `GET` | `/api/seller/products` | Protected | `verifyToken, verifySeller` | `SELLER` (`APPROVED`) | `403 Forbidden (pendingApproval: true)` |
| `POST` | `/api/seller/products` | Protected | `verifyToken, verifySeller` | `SELLER` (`APPROVED`) | `403 Forbidden (pendingApproval: true)` |
| `PATCH` | `/api/seller/products/:id` | Protected | `verifyToken, verifySeller` | `SELLER` (`APPROVED`) | `403 Forbidden` |
| `GET` | `/api/seller/orders` | Protected | `verifyToken, verifySeller` | `SELLER` (`APPROVED`) | `403 Forbidden` |
| `PATCH` | `/api/seller/orders/items/:id` | Protected | `verifyToken, verifySeller` | `SELLER` (`APPROVED`) | `403 Forbidden` |
| `GET` | `/api/admin/sellers/pending` | Protected | `verifyToken, verifyAdmin` | `ADMIN` | `401 Unauthorized / 403 Forbidden` |
| `PATCH` | `/api/admin/sellers/:id/status`| Protected | `verifyToken, verifyAdmin` | `ADMIN` | `401 Unauthorized / 403 Forbidden` |
| `GET` | `/api/admin/orders` | Protected | `verifyToken, verifyAdmin` | `ADMIN` | `401 Unauthorized / 403 Forbidden` |
| `PATCH` | `/api/admin/orders/:id/status` | Protected | `verifyToken, verifyAdmin` | `ADMIN` | `401 Unauthorized / 403 Forbidden` |
| `GET` | `/api/admin/summary` | Protected | `verifyToken, verifyAdmin` | `ADMIN` | `401 Unauthorized / 403 Forbidden` |

---

## 7. Security Best Practices & Threat Safeguards

### 7.1 Attack Vector Mitigation Summary

1. **Password Hashing:** Passwords are hashed using `bcryptjs` with 10 salt rounds before storage. Plaintext passwords are never logged or persisted.
2. **Brute Force & DoS Defense:** Authentication routes (`/register`, `/login`, `/forgot-password`, `/reset-password`) use `express-rate-limit` to restrict requests to 15 attempts per 15 minutes per IP address.
3. **HTTP Header Security (`helmet`):** Configures security headers to mitigate Clickjacking (`X-Frame-Options`), Cross-Site Scripting (`X-XSS-Protection`), and MIME-type sniffing (`X-Content-Type-Options`).
4. **CORS Control:** Restricts origin access to trusted domain environments via environment configuration (`process.env.CLIENT_URL`).
5. **Token Storage Safety:** Tokens are sent using Bearer authentication and stored in client memory or local storage. In production, HTTPS enforcement prevents header interception.

---
