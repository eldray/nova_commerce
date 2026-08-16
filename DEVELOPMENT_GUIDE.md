# Nova Commerce - Development Guide

## Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or bun package manager

### 2. Installation
```bash
npm install
```

### 3. Database Setup

Set your database connection string in environment variables:
```bash
export DATABASE_URL="postgres://user:password@localhost:5432/nova_commerce"
```

Or create a `.env` file:
```env
DATABASE_URL=postgres://user:password@localhost:5432/nova_commerce
```

### 4. Initialize Database

Run all migrations and seed demo data:
```bash
npm run db:reset -- --force
```

This will:
- Create all database tables
- Insert demo data (store, products, categories)
- Create a demo admin user

### 5. Create Super Admin (Optional)
If you want to create a separate super admin account:
```bash
npm run db:create-admin
```

This creates:
- Email: `admin@novacommerce.com`
- Password: `NovaAdmin2024!`

### 6. Start Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Database Scripts

### Seed Demo Data
Populate the database with demo store, products, and sample data:
```bash
npm run db:seed
```

### Reset Database
⚠️ **WARNING**: This deletes ALL data and re-runs all migrations:
```bash
npm run db:reset -- --force
```

### Create Super Admin
Create a platform administrator account:
```bash
npm run db:create-admin
```

---

## Default Credentials

After running `npm run db:reset -- --force`:

**Demo Admin:**
- Email: `admin@novafashion.com`
- Password: `password123`

**Super Admin** (if created separately):
- Email: `admin@novacommerce.com`
- Password: `NovaAdmin2024!`

---

## Project Structure

```
/workspace
├── components/       # React UI components
├── pages/           # Page components
├── endpoints/       # API endpoints (backend)
├── helpers/         # Utilities, DB client, auth
├── database/        # SQL migrations and seeds
├── scripts/         # Database management scripts
├── static/          # Static assets
└── templates/       # Email templates
```

---

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Type check without emitting files |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset database (requires --force) |
| `npm run db:create-admin` | Create super admin user |

---

## Troubleshooting

### Port Already in Use
If port 3000 is in use, Vite will automatically use the next available port (3001, 3002, etc.)

### Database Connection Errors
Ensure your PostgreSQL server is running and the `DATABASE_URL` is correct.

### Migration Errors
If migrations fail, try resetting the database:
```bash
npm run db:reset -- --force
```

---

## Features

- ✅ Multi-tenant e-commerce platform
- ✅ Merchant store setup wizard
- ✅ Customer shopping experience
- ✅ Product catalog with categories
- ✅ Shopping cart and wishlist
- ✅ Order management
- ✅ Payment integration (Paystack, Hubtel)
- ✅ Analytics dashboard
- ✅ Homepage builder
- ✅ Email notifications
- ✅ Role-based access control (RBAC)

---

## Demo Store

After seeding, you'll have:
- **Store Name**: Nova Fashion Ghana
- **Categories**: Women's Fashion, Men's Wear, Accessories, Footwear
- **Products**: Multiple demo products with images
- **Brands**: Nova Couture, Kente Royal, AfriCraft

Visit http://localhost:3000 to see the demo store!
