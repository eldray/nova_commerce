# Nova Commerce — Multi-Tenant E-Commerce Platform

A complete multi-tenant e-commerce SaaS platform built for Ghana, supporting both merchants (store owners) and customers with local payment integrations (Paystack, Hubtel Mobile Money).

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
Make sure PostgreSQL is running, then set up your database:

```bash
# Create database
createdb nova_commerce

# Or update DATABASE_URL in .env if you have a different connection string
```

### 3. Run Complete Setup
This will run all migrations and seed demo data including users, products, coupons, and reviews:

```bash
npm run setup
```

**Optional:** Force reset everything and re-seed:
```bash
npm run setup -- --force
```

### 4. Start Development Server
```bash
npm run dev
```

Visit:
- **Dashboard**: http://localhost:5173/dashboard
- **Store**: http://localhost:5173/store/nova-fashion

### Demo Credentials
- **Email**: admin@novafashion.com
- **Password**: password123

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript type checking |
| `npm run setup` | **Complete setup: migrations + seed data** |
| `npm run db:seed` | Seed demo data only |
| `npm run db:reset` | Reset database (requires --force) |
| `npm run server` | Start production server |

## What's Included

### Database Tables
- ✅ Users & Authentication
- ✅ Multi-tenant Architecture (Tenants, Stores)
- ✅ RBAC (6 merchant roles: owner, admin, manager, sales, inventory, support)
- ✅ Product Catalog (Products, Variants, Categories, Brands, Images)
- ✅ Inventory Management with Audit Trail
- ✅ Orders & Customers
- ✅ Payments (Paystack, Hubtel integration ready)
- ✅ **Coupons & Discount Codes**
- ✅ **Product Reviews & Ratings**
- ✅ Subscriptions & Billing
- ✅ Delivery Zones
- ✅ Wishlist
- ✅ Email Notifications
- ✅ Custom Domains
- ✅ Homepage Builder

### Demo Data Seeded
- Admin user with full access
- Store: "Nova Fashion Ghana"
- 4 Product Categories (Women's Fashion, Men's Wear, Accessories, Footwear)
- 3 Brands (Nova Couture, Kente Royal, AfriCraft)
- 4 Demo Products with images
- **4 Sample Coupons**:
  - `WELCOME10` - 10% off for new customers
  - `SAVE50` - GHS 50 off orders above GHS 300
  - `FREESHIP` - Free shipping on orders above GHS 100
  - `FLASH20` - Expired 20% off (for testing)
- **6 Product Reviews** (mix of approved and pending)
- 4 Delivery Zones (Accra, Tema, Kumasi, Nationwide)

## Backend API Endpoints

### Coupons
- `POST /api/coupons/create` - Create new coupon
- `GET /api/coupons/list` - List coupons with filters
- `POST /api/coupons/validate` - Validate coupon for checkout

### Reviews
- `POST /api/reviews/create` - Submit product review
- `GET /api/reviews/list` - Get product reviews
- `POST /api/reviews/moderate` - Approve/reject reviews (merchant)
- `POST /api/reviews/helpful` - Mark review as helpful

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- React Router v6
- TanStack Query (React Query)
- CSS Modules with design tokens

**Backend:**
- Node.js custom server
- PostgreSQL
- Kysely ORM (type-safe SQL)
- JWT-based authentication

**Integrations:**
- Cloudinary (image hosting)
- AWS S3 (file storage)
- Paystack (payments)
- Hubtel (Ghana Mobile Money)
- Nodemailer (email)

## Project Structure

```
/workspace
├── database/           # SQL migrations and seed files
├── endpoints/          # API routes (file-based routing)
│   ├── auth/          # Authentication endpoints
│   ├── coupons/       # Coupon management
│   ├── reviews/       # Product reviews
│   ├── products/      # Product CRUD
│   ├── orders/        # Order management
│   └── ...
├── helpers/           # Shared utilities, DB client, hooks
├── pages/             # Page components
├── components/        # Reusable UI components
├── scripts/           # Setup and maintenance scripts
└── server.ts          # Main server entry point
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/nova_commerce
JWT_SECRET=your-secret-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PAYSTACK_SECRET_KEY=your-paystack-key
HUBTEL_API_KEY=your-hubtel-key
```

## Next Steps

1. **Customize**: Update demo data with your own products and branding
2. **Configure Payments**: Add your Paystack/Hubtel credentials
3. **Set Up Email**: Configure SMTP for transactional emails
4. **Deploy**: Build and deploy to your preferred hosting platform

---

Built with ❤️ for Ghana's e-commerce ecosystem
