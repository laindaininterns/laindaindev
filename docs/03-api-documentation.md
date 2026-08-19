# LainDain API Documentation (MVP v1)

> **API Endpoint Specification & Integration Guide**  
> **Version:** 1.0.0  
> **Status:** MVP v1  

---

## 1. Global API Configuration & Protocol Standards

LainDain communicates via standard HTTP/1.1 REST protocols. All request bodies and response payloads are represented in JSON format, with the exception of the voice transcription interface, which accepts multipart form data.

### 1.1 Base URL configuration
* **Development Server URL**: `http://localhost:5000`
* **Production API Gateway URL**: Set via client configuration to the cloud deployment endpoint (e.g., `https://api.laindain.com`).

### 1.2 Mandatory Request Headers
* **Content-Type**: `application/json` (Required for all `POST`, `PUT`, `PATCH` endpoints unless otherwise noted).
* **Authorization**: `Bearer <JSON_WEB_TOKEN>` (Required for all protected endpoints).
* **X-Guest-ID**: `uuid-guest-id-string` (Required for guest cart tracking and account merging flows).

---

## 2. Authentication & Identity Namespace (`/api/auth`)

Encompasses user registration, OTP email verification, secure session initialization, and administrative seller applications.

### 2.1 Register User Account
* **Endpoint**: `POST /api/auth/register`
* **Access Control**: Public
* **Request Body**:
```json
{
  "email": "buyer@example.com",
  "password": "SecurePassword123",
  "role": "BUYER",
  "profileData": {
    "full_name": "Muhammad Ali",
    "contact_number": "03001234567"
  }
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "id": "c00fbb69-bbd1-4475-8025-a1312384a86b",
    "email": "buyer@example.com",
    "role": "BUYER",
    "is_email_verified": true
  }
}
```

### 2.2 Verify Email (OTP Verification)
Required for `SELLER` and `ADMIN` profiles before logging in.
* **Endpoint**: `POST /api/auth/verify-email` (Alias: `POST /api/auth/verify-otp`)
* **Access Control**: Public
* **Request Body**:
```json
{
  "email": "seller@example.com",
  "otp": "482019"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

### 2.3 Resend Verification OTP
* **Endpoint**: `POST /api/auth/resend-otp` (Alias: `POST /api/auth/resend-verification`)
* **Access Control**: Public
* **Request Body**:
```json
{
  "email": "seller@example.com"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Verification code resent successfully."
}
```

### 2.4 User Login
Generates a JWT token valid for 24 hours. If an `X-Guest-ID` header is passed, the backend automatically triggers the cart-merging pipeline.
* **Endpoint**: `POST /api/auth/login`
* **Access Control**: Public
* **Request Body**:
```json
{
  "email": "buyer@example.com",
  "password": "SecurePassword123"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c00fbb69-bbd1-4475-8025-a1312384a86b",
    "email": "buyer@example.com",
    "role": "BUYER"
  }
}
```

### 2.5 Submit Seller Application
Sellers use this endpoint to submit initial registration data for administrative onboarding reviews.
* **Endpoint**: `POST /api/auth/seller/submit_application`
* **Access Control**: Public
* **Request Body**:
```json
{
  "email": "vendor@textiles.com",
  "password": "VendorSecure99",
  "business_name": "Faisalabad Fabrics",
  "business_address": "Samanabad Road, Faisalabad",
  "tax_id": "NTN-998877-6"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Application submitted for admin review."
}
```

---

## 3. Buyer & Shopping Cart Namespace (`/api/buyer`)

Manages profiles, cart persistence, quantity modifications, and transactional checkout parameters.

### 3.1 Fetch Buyer Profile
* **Endpoint**: `GET /api/buyer/profile`
* **Access Control**: Private (Authenticated Buyer)
* **Headers**: `Authorization: Bearer <Token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "f8a09b33-e6ef-46e2-9b22-83b3cd17a02c",
    "full_name": "Muhammad Ali",
    "company_name": "Ali Retail Stores",
    "contact_number": "03001234567",
    "shipping_address": "Shop 4, Main Anarkali, Lahore"
  }
}
```

### 3.2 Add Product to Cart
Accepts user authentication token or guest ID. Uses the request environment details to associate quantities.
* **Endpoint**: `POST /api/buyer/cart`
* **Access Control**: Public / Guest
* **Headers**: `Authorization: Bearer <Token>` (Optional) or `X-Guest-ID: <GuestId>` (Required if unauthenticated)
* **Request Body**:
```json
{
  "product_id": "de5bc3f2-1a4b-4b16-be0d-450f38b1f516",
  "quantity": 15
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product added to cart.",
  "data": {
    "id": "e0b83ad8-90f7-4189-98ee-629858541bb2",
    "product_id": "de5bc3f2-1a4b-4b16-be0d-450f38b1f516",
    "quantity": 15
  }
}
```

### 3.3 Execute Checkout
Performs cart verification, reduces inventory, and generates order documents.
* **Endpoint**: `POST /api/buyer/checkout`
* **Access Control**: Public / Guest
* **Headers**: `Authorization: Bearer <Token>` (Optional) or `X-Guest-ID: <GuestId>` (Required if unauthenticated)
* **Request Body**:
```json
{
  "payment_method": "COD",
  "shipping_address": "Office 12, Blue Area, Islamabad",
  "contact_number": "03339988771"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Checkout completed successfully.",
  "data": {
    "order_number": "LD-20260819-A3E8",
    "total_amount": 45000.00,
    "payment_method": "COD",
    "status": "PENDING"
  }
}
```

---

## 4. Product Catalog Namespace (`/api/products`)

Public catalog browsing endpoints paired with restricted seller and admin CRUD controls.

### 4.1 List Catalog Products
* **Endpoint**: `GET /api/products`
* **Access Control**: Public
* **Query Parameters**:
  * `category_id`: Filtering matches against specific category UUIDs.
  * `search`: Standard string parsing search for product titles or SKUs.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "de5bc3f2-1a4b-4b16-be0d-450f38b1f516",
      "title": "Premium Lawn Cotton Yardage",
      "sku": "LNW-CTN-01",
      "price": 320.00,
      "moq": 100,
      "stock_quantity": 2500,
      "status": "ACTIVE"
    }
  ]
}
```

---

## 5. Seller Management Namespace (`/api/seller`)

Provides multi-tenant catalog partitioning, KYC filing, and seller order fulfillment status tracking.

### 5.1 Fetch Seller KYC Status
* **Endpoint**: `GET /api/seller/kyc`
* **Access Control**: Private (Seller only)
* **Headers**: `Authorization: Bearer <Token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "PENDING",
    "tax_id": "NTN-998877-6",
    "documents": [
      {
        "document_type": "NTN_CERTIFICATE",
        "submitted_at": "2026-08-19T10:15:30Z"
      }
    ]
  }
}
```

### 5.2 Update Product Stock
* **Endpoint**: `PATCH /api/seller/products/:id/stock`
* **Access Control**: Private (Seller owner only)
* **Headers**: `Authorization: Bearer <Token>`
* **Request Body**:
```json
{
  "stock_quantity": 850
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Stock level updated successfully.",
  "data": {
    "id": "de5bc3f2-1a4b-4b16-be0d-450f38b1f516",
    "stock_quantity": 850,
    "is_out_of_stock": false
  }
}
```

---

## 6. Admin Panel Namespace (`/api/admin`)

Privileged analytical and application processing routes. Enforces the `ADMIN` role filter.

### 6.1 Review Pending Seller Applications
* **Endpoint**: `GET /api/admin/sellers/pending`
* **Access Control**: Private (Admin only)
* **Headers**: `Authorization: Bearer <Token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "b3e098df-cc11-419b-a012-32aef5c8290f",
      "business_name": "Karachi Weaving Mills",
      "tax_id": "NTN-554433-2",
      "created_at": "2026-08-18T14:22:11Z"
    }
  ]
}
```

### 6.2 Approve or Reject Seller
Modifies status and dispatches Resend transactional email notification to applicant.
* **Endpoint**: `PATCH /api/admin/sellers/:id/status`
* **Access Control**: Private (Admin only)
* **Headers**: `Authorization: Bearer <Token>`
* **Request Body**:
```json
{
  "status": "APPROVED",
  "rejection_reason": ""
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Seller application processed successfully."
}
```

---

## 7. AI & Voice Services Namespace (`/api/voice`, `/api/rahi`, `/api/chatbot`)

Encompasses Whisper transcription pipelines, speech synthesis, and contextual intent engines.

### 7.1 Speech-to-Text Transcription
* **Endpoint**: `POST /api/voice/transcribe`
* **Access Control**: Public
* **Headers**: `Content-Type: multipart/form-data`
* **Payload Format**: Form-Data containing:
  * `audio`: Binary WebM audio blob (Limit: 10MB)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "text": "lawn cotton price search karein"
}
```

### 7.2 Rahi Multilingual Voice Assistant Interaction
Processes user text messages along with current frontend route context.
* **Endpoint**: `POST /api/rahi/message`
* **Access Control**: Public
* **Request Body**:
```json
{
  "message": "lawn cotton products display karein",
  "context": "BUYER_CATALOG"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "reply": "Main lawn cotton products page select kar raha hoon.",
  "suggested_actions": [
    {
      "action": "SEARCH_PRODUCT",
      "parameters": {
        "query": "lawn cotton"
      }
    }
  ]
}
```

---

## 8. API Rate Limiting Policies

To ensure platform reliability and prevent abuse of processing targets, explicit rate limits are configured inside the Express pipeline.

| Target Endpoints / Routes               | Limit Period | Max Allowable Requests | Middleware Target            |
| :-------------------------------------- | :----------- | :--------------------- | :--------------------------- |
| `/api/auth/*` (Login, Register, OTP)   | 15 Minutes   | 20 (Prod) / 100 (Dev)  | `authLimiter`                |
| `/api/voice/transcribe` / `/api/voice/*` | 1 Minute     | 10                     | `voiceLimiter`               |
| `/api/rahi/message`                     | 1 Minute     | 20                     | `rahiLimiter`                |
| `/api/chatbot/message`                  | 1 Minute     | 30                     | `chatbotLimiter`             |

---

## 9. Error Reference Standard

The API implements predictable HTTP status codes combined with structured JSON errors.

| HTTP Status Code | Definition              | Typical Cause                                                      |
| :--------------- | :---------------------- | :----------------------------------------------------------------- |
| `400 Bad Request`| Request Syntax Error    | Required fields are missing from body or parsing schema is invalid |
| `401 Unauthorized`| Authentication Fail   | JWT signature expired or token is missing from headers             |
| `403 Forbidden`  | Permission Blocked      | User credentials do not align with required RBAC profile (e.g., Buyer hits admin route) |
| `409 Conflict`   | Resource Duplication   | Attempting to register an email address that is already active     |
| `429 Too Many`   | Rate Limit Exceeded     | Client issued too many requests within the specified window        |
| `500 Server Err` | System Failure          | Database instance timeout or unhandled exception in controller     |
