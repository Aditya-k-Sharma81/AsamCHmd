# AasaMedChem - High-Precision 3-Role Inventory & Order Management System

A multi-tenant mini ERP / Inventory Management System built with **Next.js 16 (App Router)**, **PostgreSQL (Neon)**, **Prisma ORM**, **Tailwind CSS**, and **jose** JWT-based session proxy.

Designed specifically for chemical catalog management, featuring high-precision decimal operations and three distinct role perspectives: **Admins**, **Sellers**, and **Customers**.

---

## 🌟 Key Features & Role Perspectices

### 🔐 1. Authentication & Routing Proxy
- Custom JWT secure sessions using Edge-compatible `jose` library.
- Custom Next.js 16 **Proxy** interceptor enforcing:
  - Admin (`/admin/*`) $\rightarrow$ blocks non-admins.
  - Seller (`/seller/*`) $\rightarrow$ blocks non-sellers.
  - User (`/products`, `/orders`, `/profile`) $\rightarrow$ blocks non-users.
- Register page supports role selection (Customer, Seller, Admin) for easy verification.

---

### 👑 1. Admin Panel
Admins supervise the entire ecosystem.
- **Route Namespace**: `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/users`, `/admin/sellers`
- **Dashboard**: Stats on customer registrations, seller catalog count, total product counts, and recent activity.
- **Global Inventory**: CRUD catalog management across all products. Admins can create and assign products to any seller.
- **Global Order Overview**: Reviews all checkout order shipments, shows step-by-step mathematical conversion audit trails, and includes a **Flipkart-style visual progress tracker** for each order.
- **Customer Tracking**: Lists registered customers, registration dates, and orders count.
- **Seller Tracking**: Lists registered sellers and product count.

---

### 💼 2. Seller Panel
Sellers manage their own products and fulfill orders.
- **Route Namespace**: `/seller/dashboard`, `/seller/products`, `/seller/products/add`, `/seller/orders`
- **Dashboard**: Track self-listed product counts, revenue earned, and pending orders. Includes user requests to identify catalog demand.
- **Product Catalog CRUD**: Manage descriptions, categories, prices, and stock levels. Sellers can only modify/delete products they own.
- **Independent Order Fulfillment**: Lists quotations containing the seller's products (split per seller during checkout). Sellers can accept/reject, mark as shipped, and mark as delivered their orders independently, complete with a visual progress tracker bar. Stock is transactionally deducted upon accepting the order (`APPROVED`).

---

### 👥 3. User Panel
Customers browse the catalog, place orders, and track deliveries.
- **Route Namespace**: `/products`, `/orders/history`, `/profile`
- **Catalog Browser**: Search, filter by category/dimension, checkout cart.
- **Multi-Seller Order Splitting**: Checkout cart items are automatically grouped by seller, generating separate quotation orders so each seller can fulfill their shipment independently without stock or approval conflicts.
- **Flipkart-style Progress Tracker**: A beautiful, real-time visual progress bar (**Placed → Approved → Shipped → Delivered**) lets customers track the lifecycle of each order individually.
- **Catalog Requests**: Request out-of-stock or unlisted chemicals.
- **Profile Customization**: Manage shipping address and contact phone numbers directly from the profile dashboard.
- **Notifications Hub**: Alerts users when requested chemicals are added or restocked.

---

## 📐 Unit Storage & Conversion Strategy

### 1. Internal Base Storage Units
All stocks are stored in the smallest base unit:
- **Weight** $\rightarrow$ Grams (`g`)
- **Volume** $\rightarrow$ Milliliters (`mL`)
- **Count** $\rightarrow$ Items (`items`)

### 2. Conversion Factors
| Dimension | UI Unit | Internal Base Unit | Conversion Factor |
| :--- | :--- | :--- | :--- |
| **WEIGHT** | `g` | `g` | $1.0$ |
| **WEIGHT** | `kg` | `g` | $1000.0$ |
| **VOLUME** | `mL` | `mL` | $1.0$ |
| **VOLUME** | `L` | `mL` | $1000.0$ |
| **COUNT** | `items` | `items` | $1.0$ |

### 3. Mathematics of Conversion & Pricing
Let $Q_{order}$ be the ordered quantity, $U_{order}$ the ordered unit, $U_{base}$ the configured product rate unit, and $P_{base}$ the rate.
- **Stored Quantity ($Q_{internal}$)**:
  $$Q_{internal} = Q_{order} \times \text{factor}(U_{order})$$
- **Item Pricing**:
  $$P_{internal} = \frac{P_{base}}{\text{factor}(U_{base})}$$
  $$\text{Total Price} = Q_{internal} \times P_{internal}$$

All pricing and quantity fields use **`Decimal(20, 8)`** in PostgreSQL to support high decimal precision and prevent float rounding errors.

---

## 🚀 Local Setup Instructions

### 1. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Connection string from your Neon Dashboard
DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require"

# Any secure random string
JWT_SECRET="super-secret-key-change-me-in-production"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Deploy Database Schema
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## ☁️ Vercel Deployment

1. Push your changes to GitHub.
2. Go to Vercel and import your repository.
3. Add `DATABASE_URL` and `JWT_SECRET` in Vercel's **Environment Variables**.
4. Click **Deploy**.

---

## 📝 Credentials & Test Walkthrough

1. **Create Accounts**:
   - Go to `/register` and sign up three separate accounts:
     - Admin: Select **Admin** (e.g. `admin@aasamedchem.com`).
     - Seller: Select **Seller** (e.g. `seller@aasamedchem.com`).
     - Customer: Select **Customer** (e.g. `buyer@aasamedchem.com`).

2. **Seller Add Product**:
   - Log in as the Seller (`/login`).
   - Go to **Add Product** (`/seller/products/add`).
   - Input Name: `Aspirin Powder`, SKU: `ASP-RAW-01`, Dimension: `Weight`, Base Unit: `kg`, Price: `500` (₹500 / kg), Stock Level: `10` (10 kg). Save.

3. **Customer Orders**:
   - Log in as the Customer.
   - You will see the catalog card for `Aspirin Powder`. Click **Order / Quote**.
   - Input Quantity: `500` and select **grams (g)** in the dropdown.
   - Observe the live calculator displaying `0.5000 kg` base quantity and `₹250.00` estimated cost.
   - Add to quotation and submit the cart order.

4. **Seller Fulfills Order**:
   - Log in as the Seller (`/login`).
   - Go to **Orders History** (`/seller/orders`). Expand the order; you will see the client's request for `500 g` and your subtotal of `₹250.00`.
   - Click **Accept Order**. This action verifies and deducts stock in a secure database transaction, updating the status to `APPROVED`.
   - The card will show a **Flipkart-style visual tracking progress bar** highlighting that the order is "Approved".
   - Click **Mark as Shipped** to advance status to `SHIPPED` (progress bar advances).
   - Click **Mark as Delivered** to advance status to `DELIVERED`.

5. **Customer Tracks Order**:
   - Log in as the Customer.
   - Go to **Orders History** (`/orders/history`).
   - Observe the real-time visual progress bar showing the order's state (Placed → Approved → Shipped → Delivered) updated live by the seller.

6. **Admin Supervises**:
   - Log in as the Admin.
   - Go to **Orders & Quotations** (`/admin/orders`).
   - Expand the quotation to verify user details, items, mathematical audit verification formulas, and global tracking state.
   - Admins can also mark orders as completed or check the stock reduction in the Products Catalog.
