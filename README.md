# Justoo Backend — Team Testing Guide

This repo is a Node.js (Express) backend using Postgres + Drizzle ORM.

## 1) What’s in this backend

### Components

- **Admin API** (`/admin/*`): cookie-session auth (server-side sessions stored in Postgres), role-based access control, CRUD for products/inventory/riders/whitelist/customers, order viewing + cancel + audit events.
- **Customer API** (`/customer/*`): OTP-based login → JWT, backed by a DB session table (`customer_sessions`). Customer can manage profile/addresses and create + list orders.
- **Rider API** (`/rider/*`): username/password login → JWT, backed by a DB session table (`rider_sessions`). Rider can see available orders and perform sensitive state transitions (accept/out-for-delivery/delivered).

### Auth models (important for testing)

- **Admin**: `POST /admin/auth/login` sets a session cookie. Subsequent admin requests must send that cookie.
- **Customer**: `POST /customer/auth/verify-otp` returns a JWT. All customer routes require `Authorization: Bearer <token>`.
  - Token is only valid if a matching unexpired row exists in `customer_sessions` (token hash lookup).
- **Rider**: `POST /rider/auth/login` returns a JWT. All rider routes require `Authorization: Bearer <token>`.
  - Token is only valid if a matching unexpired row exists in `rider_sessions`.

## 2) Prerequisites

- Node.js 18+ (or 20+ recommended)
- `pnpm` (repo uses `pnpm`)
- Docker Desktop (for Postgres)

## 3) Setup: Database via Docker

From the backend folder:

1. Start Postgres:
   - `docker compose up -d`
2. Confirm it’s healthy:
   - `docker ps` (container `justoo-postgres`)
   - or `docker logs justoo-postgres`

The docker config exposes Postgres on `localhost:5432` with:

- DB: `justoo`
- User: `justoo`
- Password: `justoo`

## 4) Setup: Environment variables

1. Create your env file:
   - Copy `.env.example` to `.env`
2. Update as needed:
   - `DATABASE_URL` (must point to your Postgres)
   - `SESSION_SECRET` (required in production; recommended for local too)

Optional but recommended for testing JWT flows:

- `CUSTOMER_JWT_SECRET` (customer JWT signing)
- `RIDER_JWT_SECRET` (rider JWT signing)

If you don’t set these in dev, the server uses dev defaults.

## 5) Setup: Install deps & create tables

1. Install dependencies:

   - `pnpm install`

2. Create/update tables from the Drizzle schema:
   - `pnpm drizzle-kit push`

Notes:

- Drizzle config is in `drizzle.config.js` and reads `DATABASE_URL`.
- The Express session store (`connect-pg-simple`) auto-creates the admin session table (default `user_sessions`) when the server starts.

## 6) Seed: Create SUPERADMIN

Run:

- `pnpm seed:superadmin`

Configuration:

- Reads `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, `SUPERADMIN_NAME` (see `.env.example`).
- Script location: `src/scripts/superadmin.js`

## 7) Run the server

- Dev mode: `pnpm dev`
- Prod-like: `pnpm start`

Default server:

- Base URL: `http://localhost:4000`

CORS:

- If you set `FRONTEND_ORIGIN`, CORS is enabled with `credentials: true`.

## 8) Data model overview (tables)

Core tables:

- `admins`, `admin_roles`
- `customers`, `customer_sessions`
- `riders`, `rider_sessions`
- `products`, `inventory`
- `orders`, `order_items`, `order_addresses`
- `rider_assignments` (1 row per order when assigned)
- `order_events` (audit trail for transitions)
- `payments`
- `phone_whitelist`

Session tables:

- `customer_sessions` stores `token_hash = sha256(jwt)` + `expires_at`
- `rider_sessions` stores `token_hash = sha256(jwt)` + `expires_at`

## 9) Workflows to test (end-to-end)

### 9.1 Admin workflow

1. Login (creates cookie session)
   - `POST /admin/auth/login`
2. Create products (multipart/form-data because of optional image upload)
   - `POST /admin/products`
3. Create inventory for each product
   - `POST /admin/inventory`
4. Whitelist customer phone
   - `POST /admin/whitelist`
5. Create rider (with username/password)
   - `POST /admin/riders`
6. View orders / cancel orders / view audit events
   - `GET /admin/orders`
   - `GET /admin/orders/:orderId/events`
   - `POST /admin/orders/:orderId/cancel`

Roles:

- `/admin/admins/*` is **SUPERADMIN-only**.
- Products: any admin can view; only `ADMIN`/`SUPERADMIN` can create/update/delete.
- Inventory: `INVENTORY_VIEWER` can read; only `ADMIN`/`SUPERADMIN` can write.

### 9.2 Customer workflow

Important: **Customer OTP verify only works for an existing customer record**.

To create a test customer, insert a row in SQL (example):

```sql
insert into customers (id, name, phone, email, created_at)
values (gen_random_uuid(), 'Test Customer', '9999999999', 'test@example.com', now());
```

Then:

1. Admin whitelist the phone (required for OTP send)
   - `POST /admin/whitelist` with the same phone
2. Customer send OTP
   - `POST /customer/auth/send-otp`
   - OTP is logged by the backend (see server console output)
3. Customer verify OTP → gets JWT
   - `POST /customer/auth/verify-otp`
4. Customer profile
   - `GET /customer/me`
   - `PATCH /customer/me`
5. Customer addresses
   - `POST /customer/addresses`
   - `GET /customer/addresses`
6. Customer create order
   - `POST /customer/orders`

Inventory consistency:

- Order creation reserves inventory inside a DB transaction.
- If stock is insufficient, order creation fails and inventory is not reduced.

### 9.3 Rider workflow (order state machine)

Rider endpoints require a rider JWT (`Authorization: Bearer …`).

1. Create a rider via admin and set username/password
   - `POST /admin/riders`
2. Rider login
   - `POST /rider/auth/login`
3. Rider sees available orders
   - `GET /rider/orders/available`

Important: “available” means:

- order status is `CONFIRMED`
- AND there is no row in `rider_assignments`

If you don’t currently have an API that sets an order to `CONFIRMED`, you can do it via SQL for testing:

```sql
update orders set status = 'CONFIRMED' where id = '<order-id>';
```

Sensitive transitions:

- Accept: `POST /rider/orders/:orderId/accept`
  - Must be atomic and race-safe. If another rider already took it → returns `409`.
- Out for delivery: `POST /rider/orders/:orderId/out-for-delivery`
  - Requires the order is assigned to this rider and in `ASSIGNED_RIDER`.
- Delivered: `POST /rider/orders/:orderId/delivered`
  - In one transaction:
    - order `OUT_FOR_DELIVERY → DELIVERED`
    - insert `order_events` (actorType `RIDER`)
    - insert `payments` with amount fetched from DB (`orders.total_amount`), provider `COD`, status `SUCCESS`

## 10) Postman testing

A ready-to-import Postman collection is included:

- `postman/justoo-backend.postman_collection.json`

How to use:

1. Import the collection into Postman.
2. Set collection variables:
   - `baseUrl` (default `http://localhost:4000`)
   - `adminEmail`, `adminPassword`
   - `customerPhone`, `customerOtp`
   - `riderUsername`, `riderPassword`
3. Run requests in this order:
   - Admin → Login
   - Admin → Whitelist → Add phone
   - Customer → Send OTP → Verify OTP
   - Rider → Login
   - Customer → Create Order
   - (SQL) set order to `CONFIRMED`
   - Rider → Available → Accept → Out for delivery → Delivered

Notes:

- Admin routes require cookies. Postman will typically keep cookies automatically.
- Customer/Rider routes use `Authorization: Bearer {{customerToken}}` and `Authorization: Bearer {{riderToken}}`.

## 11) Troubleshooting

- **500 errors / missing tables**: run `pnpm drizzle-kit push` again.
- **Admin requests unauthorized**: make sure you logged in and are sending the session cookie.
- **Customer OTP not whitelisted**: ensure `phone_whitelist` contains the phone.
- **Customer OTP verify says CUSTOMER_NOT_FOUND**: insert a customer row first (no signup route exists right now).
- **Rider available orders is empty**: order must be `CONFIRMED` and not assigned.
