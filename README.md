# AasaMedChem - High-Precision Inventory & Order Management System

A mini ERP / Inventory Management System built with **Next.js 16 (App Router)**, **PostgreSQL (Neon)**, **Prisma ORM**, **Tailwind CSS**, and **jose** JWT-based session proxy.

Designed specifically for pharmaceutical/chemical catalog tracking where high precision decimal measurements and flexible unit pricing are critical.

---

## 🌟 Key Features

### 🔐 1. Authentication & Role-Based Access Control
- Custom JWT-based secure sessions using Edge-compatible `jose` library.
- Custom Next.js 16 **Proxy** interceptor protecting `/admin` and `/dashboard` paths.
- Accounts are registered as either:
  - **Admin**: Has control over the database catalog, views requests, updates inventory stocks, and approves/rejects quotations.
  - **User/Seller**: Can browse/search the catalog, request catalog expansions, and place order quotations.

### 🧪 2. Multi-Unit Inventory & Conversion System
- Manage chemicals across three dimensions:
  - **Weight**: grams (`g`), kilograms (`kg`)
  - **Volume**: milliliters (`mL`), liters (`L`)
  - **Count**: items (`items`)
- Converted stock values and internal base values are stored in PostgreSQL using the **`Decimal(20, 8)`** type to guarantee precision (up to 8 decimal places) and prevent floating-point rounding errors.

### 💰 3. Live Price & Conversion Preview Calculator
- When ordering, users can enter quantities in **any supported unit** (e.g., ordering in `g` when the base price is set per `kg`).
- The UI calculates and displays a live preview:
  - Equivalent quantity in the configured base unit.
  - Equivalent quantity in the database's internal base unit.
  - Total estimated cost in INR.
  - Live stock validation that prevents ordering more than what is available.

### 📑 4. Admin Verification & Audit Trail
- Incoming quotations display a **mathematical audit trail** for each item.
- Admins can verify exactly how the ordered quantity was converted and how the total price was computed relative to the base price config before approving the order.
- Inventory stock is transactionally deducted only when the Admin **Approves** the quotation.

### 🔔 5. Fulfill & Restock Notification Loop
- If a chemical is out of stock or unlisted, users can submit a **Catalog Request**.
- Admins see these requests and can resolve them (e.g., restocking or adding the product).
- If the stock of a requested item becomes positive ($>0$), a system hook automatically creates a **Notification** for the requesting user, complete with a live unread indicator badge in their dashboard.

---

## ⚙️ Tech Stack & System Design

```mermaid
graph TD
    Client[Browser / Client Component]
    Proxy[Next.js 16 Proxy / Edge Server]
    API[Next.js App Router API Handlers]
    ORM[Prisma Client]
    DB[(Neon PostgreSQL)]

    Client -->|HTTP Request| Proxy
    Proxy -->|Pass Session| API
    API -->|Query/Mutate| ORM
    ORM -->|TCP Connection| DB
```

- **Frontend**: Next.js 16 (React 19), Tailwind CSS, Lucide icons.
- **Backend**: Next.js App Router API Handlers, JWT Cookies (`jose`).
- **Database**: Neon-hosted PostgreSQL.
- **ORM**: Prisma Client v6.

---

## 🗄️ Database Schema Design

We chose **`Decimal(20, 8)`** for all quantities and prices. 

**Why?**
1. **Precision**: Floating-point numbers (`float` or `double precision`) suffer from binary representation errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). In medical and chemical formulations, a sub-gram or sub-milliliter error is unacceptable.
2. **Database Integrity**: PostgreSQL's `numeric/decimal` type stores exact values. `20` digits total allows storing massive inventory batches, while `8` decimal places supports microgram/microliter accuracy.

### Models:
1. **User**: Stores email, password hash (bcrypt), name, and role (`ADMIN` / `USER`).
2. **Product**: Stores chemical configurations (SKU, name, category, dimension, baseUnit, basePrice, and stockQuantity).
3. **Quotation**: Stores header details for orders (userId, status, totalAmount).
4. **QuotationItem**: Stores ordered items (productId, orderUnit, orderQuantity, internalQuantity, and calculatedPrice).
5. **ProductRequest**: Log of catalog requests made by users (userId, productName, dimension, requestedUnit, requestedQuantity, status).
6. **Notification**: System alerts for restocks (userId, title, message, isRead).

---

## 📐 Unit Storage & Conversion Strategy

### 1. Internal Base Storage Units
To ensure calculations are simple and database queries remain consistent, we store all stocks internally in the smallest base unit:
- **Weight** $\rightarrow$ Grams (`g`)
- **Volume** $\rightarrow$ Milliliters (`mL`)
- **Count** $\rightarrow$ Items (`items`)

### 2. Conversion Table
| Dimension | UI Unit | Internal Base Unit | Conversion Factor |
| :--- | :--- | :--- | :--- |
| **WEIGHT** | `g` | `g` | $1.0$ |
| **WEIGHT** | `kg` | `g` | $1000.0$ |
| **VOLUME** | `mL` | `mL` | $1.0$ |
| **VOLUME** | `L` | `mL` | $1000.0$ |
| **COUNT** | `items` | `items` | $1.0$ |

### 3. Mathematics of Conversion & Pricing
Let:
- $Q_{order}$ = quantity entered by user
- $U_{order}$ = unit chosen by user (e.g., `g` or `kg`)
- $U_{base}$ = configured product rate unit (e.g., `kg`)
- $P_{base}$ = configured price per $U_{base}$ (e.g., ₹500/kg)

**Formula for Stored Quantity ($Q_{internal}$):**
$$Q_{internal} = Q_{order} \times \text{factor}(U_{order})$$

**Formula for Price calculation:**
$$P_{internal} = \frac{P_{base}}{\text{factor}(U_{base})}$$
$$\text{Total Price} = Q_{internal} \times P_{internal} = Q_{order} \times \text{factor}(U_{order}) \times \frac{P_{base}}{\text{factor}(U_{base})}$$

*Example: User orders 250 g of Sodium Chloride, priced at ₹500/kg.*
- $Q_{order} = 250$, $\text{factor}(U_{order}) = 1$
- $P_{base} = 500$, $\text{factor}(U_{base}) = 1000$
- $Q_{internal} = 250 \times 1 = 250$ g
- $P_{internal} = \frac{500}{1000} = 0.5$ per gram
- $\text{Total Price} = 250 \times 0.5 = ₹125.00$

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- A Neon PostgreSQL Database project (or local PostgreSQL)

### 1. Clone the project and configure Environment Variables
Create a `.env` file in the project root:
```env
# Connection string from your Neon Dashboard
DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require"

# Any secure random string
JWT_SECRET="generate-a-secure-random-key"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Deploy Database Schema
Push the schema to your Neon database:
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ☁️ Vercel Deployment

1. Initialize a Git repository and push your changes to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your GitHub repository.
4. Under **Environment Variables**, add:
   - `DATABASE_URL` (your Neon PostgreSQL link)
   - `JWT_SECRET` (your JWT secret)
5. Click **Deploy**. Vercel will automatically run the build and publish the live URL.

---

## 📝 Credentials & Verification Guide

### Recommended Testing Steps:

1. **Register User/Admin Accounts**:
   - Go to `/register` or click "Create an Account".
   - Create one user with role **Administrator** (e.g. `admin@aasamedchem.com`).
   - Create another user with role **Seller / User** (e.g. `user@aasamedchem.com`).

2. **Admin Setup Catalog**:
   - Log in as the Admin.
   - Go to **Inventory Levels** tab, click **Add Product**.
   - Input:
     - Name: `Sodium Chloride (NaCl)`
     - SKU: `CHEM-NACL-01`
     - Category: `Salts`
     - Dimension: `Weight`
     - Base Unit: `kg`
     - Base Price: `400` (₹400 / kg)
     - Stock Level: `5.5` (5.5 kg = 5500 g)
   - Click **Save**.

3. **User Places Order**:
   - Log in as the User.
   - You will see the catalog card for `Sodium Chloride (NaCl)`.
   - Click **Order / Quote**.
   - Select **grams (g)** in the unit dropdown and type `500`.
   - Observe the **Live Conversion Calculator** displaying:
     - Equivalent base quantity: `0.5000 kg`
     - Equivalent stored quantity: `500.00 g`
     - Live total cost: `₹200.00`
   - Click **Add to Quotation**, then click **Submit Quotation Order** in the right-hand Cart sidebar.

4. **Admin Verifies and Approves**:
   - Log back in as the Admin.
   - Go to **Quotation Orders** tab, expand the new quotation.
   - Under **Audit Conversion Verification Formulas**, you will see the full mathematical calculation and unit conversions.
   - Click **Approve & Deduct Stock**.
   - Check the **Inventory Levels** tab; the stock of Sodium Chloride will have decreased to `5.0000 kg (5000 g)`.

5. **Restock Requests & Notifications Loop**:
   - As the User, submit a request for an out-of-stock or unlisted chemical (e.g., `Aspirin`, Weight, kg, notes "Urgent need for formulation").
   - As the Admin, go to **Product Requests** tab. You will see the user's request. Click **Add / Restock**.
   - The product configuration modal will open, prefilled with `Aspirin`, Weight, kg. Set price and stock, then save.
   - Log back in as the User; you will see an active number badge on the notifications bell. Click it to read: `"Requested Product Available: Good news! The product "Aspirin" you requested is now available. Stock: 2.0 kg."`
