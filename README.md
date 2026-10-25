# SpendWise - MERN Expense Manager

Full-stack expense management app: income/expense tracking, budgets with alerts, savings goals, charts and CSV export, dark/light mode.

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT + bcrypt
- **Frontend:** React (Vite), React Router, Recharts, Axios

## Run locally

Requirements: Node.js 18+ and MongoDB running locally (or a MongoDB Atlas URI).

```bash
# 1. Backend
cd server
npm install
# edit .env if needed (MONGO_URI, JWT_SECRET)
npm run seed      # optional demo data: demo@example.com / demo123
npm run dev       # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev       # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`.

## Features
- Signup / login with JWT, protected routes, every query scoped to the logged-in user
- Dashboard: month income, expenses, all-time balance (Income - Expenses), income vs expense chart, cash flow donut, recent transactions
- Transactions: add / edit / delete, search, filters (type, category, payment method, date range), pagination, CSV export
- Payment methods: Cash, Bank, Card, Easypaisa, JazzCash
- Budgets: monthly limit per category, usage progress, status (Safe / Near Limit / Limit Reached / Exceeded), alerts in the bell icon
- Statistics: spending by category, income vs outgoings, highest category, yearly report
- Savings goals with progress and "Add savings"
- Settings: name, currency, theme, change password
- Responsive layout (bottom nav on mobile)

## API overview
| Route | Purpose |
| --- | --- |
| `POST /api/auth/register`, `/login`, `GET /me`, `PUT /profile`, `PUT /password` | Auth and profile |
| `/api/transactions` (GET, POST, PUT/:id, DELETE/:id, GET /export) | Income and expenses |
| `/api/budgets?month=YYYY-MM` | Budgets with spent amount |
| `/api/goals`, `POST /api/goals/:id/add` | Savings goals |
| `/api/stats/summary`, `/monthly`, `/categories` | Dashboard and reports |

## Ideas to add next
Recurring transactions, bill reminders, debt tracking, receipt upload (Multer), PDF export.
