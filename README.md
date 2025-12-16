# E-Commerce Platform

Full-stack e-commerce application with an Express + MySQL2 API and a React + Vite frontend.

## Overview
- Customer features: authentication (JWT), product browse/search, cart, checkout with Stripe/VNPay, addresses, coupons, reviews, wishlist, order history.
- Admin features: dashboard, product/category/banner CRUD, order/user/coupon management, uploads.
- Infrastructure: MySQL 8+, optional Redis caching, Swagger docs, image processing with Sharp, email via Nodemailer.

## Tech Stack
- Backend: Node.js 18+, Express 5, TypeScript, MySQL2, Redis (optional), Zod + express-validator, Winston, Multer/Sharp, Swagger.
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Zustand, React Router, React Hook Form + Zod, PWA (Workbox).

## Requirements
- Node.js >= 18, npm >= 9
- MySQL >= 8.0
- Redis >= 6 (optional; app still runs without it)

## Project Structure
```
E-Commerce/
├── apps/
│   ├── api/   # Express API (TypeScript + JS)
│   └── web/   # React frontend (TypeScript)
├── database/  # SQL schemas and setup scripts
└── package.json
```

## Setup
1) Install dependencies
```bash
npm install
npm --prefix apps/api install
npm --prefix apps/web install
```

2) Configure environment
- Create `apps/api/.env` (see `.env.example` for variables such as DB connection, JWT, email, Redis).
- Create `apps/web/.env` if you need to override `VITE_API_URL` (default `/api`).

3) Initialize database  
See `database/README.md` for SQL scripts. Fast path:
```bash
cd database
# Windows
./setup_database.bat
# Linux/Mac
chmod +x setup_database.sh && ./setup_database.sh
```

4) Seed default admin
```bash
cd apps/api
npm run seed:admin
# default: admin@ecommerce.com / Admin@123 (change immediately)
```

## Run
- Dev (API + Web from root): `npm run dev`
- Dev only API: `npm run dev:api`
- Dev only Web: `npm run dev:web`
- API production: `cd apps/api && npm run build && npm run start:prod`
- Web production build: `cd apps/web && npm run build` (serve `dist/` with any static server)

## Useful API endpoints
- Swagger UI: `http://localhost:4000/api-docs`
- API base: `http://localhost:4000/api`

## Notes
- Redis is optional; when absent, caching is skipped gracefully.
- Test suites were removed; add your own before production.
- This repo uses a mix of TypeScript and JavaScript on the API side; migrate gradually as needed.
