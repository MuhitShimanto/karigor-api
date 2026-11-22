# Karigor API

Karigor is an on-demand household services platform connecting customers with verified, skilled technicians (electricians, plumbers, AC technicians, carpenters, cleaners, and painters) across Bangladesh.

---

## 1. Project Overview and Features by Role

### Customer Features
- **Public Browsing:** Explore service categories, browse active technicians, and search offered services with multi-criteria filtering (category, location, price, rating) and pagination.
- **Booking Management:** Book future availability slots with automated conflict detection; view personal booking history.
- **Flexible Cancellation:** Cancel bookings anytime prior to `IN_PROGRESS` status (automatically releases reserved slots and flags refunds for paid bookings).
- **Online Payment:** Secure checkout via Stripe Checkout sessions for accepted bookings.
- **Ratings & Reviews:** Submit star ratings (1–5) and feedback for completed bookings; technician average ratings and review counts update immediately in real time.

### Technician Features
- **Profile Customization:** Maintain professional bio, skills list, experience years, service location, and hourly rate.
- **Service Catalog Management:** Create, update, and remove offered services mapped to specific categories (guarded against deleting services with active bookings).
- **Availability Management:** Set and replace future time slots with automated overlap checks and past-time validation.
- **Booking Workflow:** Review incoming requests, accept or decline bookings, start work (`IN_PROGRESS`), and mark jobs as `COMPLETED`.

### Admin Features
- **User Management:** Search and filter all users by role and status; ban or unban accounts (with protection against self-banning or banning admin accounts).
- **Platform Monitoring:** Overview of all bookings and payments across the platform with status filters.
- **Category Control:** Create and manage service categories with guaranteed unique category names.
- **Automated Seeding:** Comprehensive seed script creating predefined admin, categories, customer, and technician profiles.

---

## 2. Tech Stack and Architecture Summary

Karigor is built as a clean layered monolith API following RESTful design principles and separation of concerns:

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5 with strict mode
- **Web Framework:** Express 5
- **ORM & Database:** Prisma ORM 6 with PostgreSQL (hosted on Neon)
- **Validation:** Zod for all request bodies, query parameters, and route parameters
- **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs password hashing, Helmet, CORS, and Express-Rate-Limit
- **Payment Integration:** Stripe Checkout API & verified webhook signatures
- **Documentation:** OpenAPI 3.0.3, Swagger UI, and Postman Collection v2.1

### Architecture Flow
```
Client Request ──> Helmet & CORS ──> Rate Limiter (Auth) ──> Router 
               ──> Authenticate (JWT) ──> Authorize (Role Guard) 
               ──> Zod Validate (Body/Params/Query) 
               ──> Controller ──> Service ──> Prisma ORM / Payment Provider 
               ──> SendResponse ──> Client Response
```

---

## 3. Local Setup Guide

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or cloud e.g. Neon, Supabase, Render)
- Git

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/MuhitShimanto/karigor-api.git
   cd karigor-api
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your PostgreSQL `DATABASE_URL` and `JWT_SECRET`.
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed initial data (admin, categories, technicians, customer):
   ```bash
   npx prisma db seed
   ```
6. Start development server:
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:5000`.

---

## 4. Environment Variables

| Variable | Description | Example / Default |
| --- | --- | --- |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `PORT` | Server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-host.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT signing | `min_16_characters_random_secret_key` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `BCRYPT_SALT_ROUNDS` | Salt rounds for password hashing | `10` |
| `CLIENT_URL` | Allowed client origin for CORS | `http://localhost:3000` |
| `API_BASE_URL` | Base public URL of API | `http://localhost:5000` |
| `ADMIN_EMAIL` | Admin account email for seed script | `admin@karigor.com` |
| `ADMIN_PASSWORD` | Admin account password for seed script | `Admin@12345` |
| `STRIPE_SECRET_KEY` | Stripe secret API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `PAYMENT_PROVIDER` | Default gateway provider | `STRIPE` |

---

## 5. Seed Credentials

### Admin Account
- **Email:** `admin@karigor.com`
- **Password:** `Admin@12345`
- **Role:** `ADMIN`

### Sample Customer Account
- **Email:** `customer@karigor.com`
- **Password:** `Password@123`
- **Role:** `CUSTOMER`

### Sample Technician Accounts
- **Technician 1 (Electrician):** `tech1@karigor.com` / `Password@123`
- **Technician 2 (Plumber):** `tech2@karigor.com` / `Password@123`
- **Technician 3 (AC Expert):** `tech3@karigor.com` / `Password@123`

---

## 6. Documentation & Collection Links

- **Interactive Swagger UI:** `http://localhost:5000/api/docs` (or live `/api/docs`)
- **OpenAPI 3.0 YAML Specification:** Located at `docs/openapi.yaml`
- **Postman Collection:** Located at `docs/Karigor.postman_collection.json`
- **Postman Environment:** Located at `docs/Karigor.postman_environment.json`
- **Live Deployed API:** `https://karigor-api.onrender.com/api` *(Deploy to Render)*
- **Demo Video:** *(Link will be included with final submission)*

---

## 7. Payment Testing (Stripe Integration)

### Creating a Payment Session
1. As a customer, book a technician's slot (`POST /api/bookings`).
2. As the technician, accept the booking (`PATCH /api/technician/bookings/:id` with `{ "action": "accept" }`).
3. As the customer, initiate payment (`POST /api/payments/create` with `{ "bookingId": "<id>" }`).
4. Follow the returned `redirectUrl` to the Stripe Checkout test page.

### Test Cards (Stripe Test Mode)
- **Successful Payment:** `4242 4242 4242 4242` (any future expiry, any 3-digit CVC).
- **Declined Payment:** `4000 0000 0000 0002` (results in `FAILED` payment while booking remains `ACCEPTED`).

### Running Local Webhook Forwarder
```bash
stripe login
stripe listen --forward-to localhost:5000/api/payments/confirm
```
Copy the webhook signing secret (`whsec_...`) printed by Stripe CLI into your `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 8. Booking & Payment State Transitions

### Booking State Machine
```
 REQUESTED ──> ACCEPTED ──> PAID ──> IN_PROGRESS ──> COMPLETED
     │             │          │
     ├──> DECLINED └──> CANCELLED
     └──> CANCELLED
```

- `REQUESTED`: Initial booking state created by customer.
- `ACCEPTED`: Approved by technician. Customer can now initiate payment.
- `DECLINED`: Rejected by technician; slot is released.
- `PAID`: Payment verified by server-to-server webhook.
- `IN_PROGRESS`: Technician started the service.
- `COMPLETED`: Technician finished the job. Customer can now review.
- `CANCELLED`: Cancelled by customer before `IN_PROGRESS` (releases slot and marks refund if paid).

### Payment Statuses
- `PENDING`: Payment record generated upon checkout session creation.
- `COMPLETED`: Verified webhook received (`checkout.session.completed` & paid); booking moves to `PAID`.
- `FAILED`: Payment failed or expired; booking remains `ACCEPTED` so customer can retry.

---

## 9. Error Handling and Response Format

All responses follow a predictable JSON format:

### Success Response
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [
    {
      "field": "body.password",
      "message": "String must contain at least 8 character(s)"
    }
  ]
}
```

### HTTP Status Code Conventions
- `200 OK`: Successful retrieval or update
- `201 Created`: Resource successfully created
- `400 Bad Request`: Input validation failed
- `401 Unauthorized`: Missing or invalid JWT Bearer token
- `403 Forbidden`: Insufficient role permissions or banned account
- `404 Not Found`: Route or entity not found
- `409 Conflict`: Unique constraint violation or invalid state machine transition
- `500 Internal Server Error`: Unhandled server exception
