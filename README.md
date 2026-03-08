# LowPharma - Online Pharmacy Management & Ordering System

A fullstack web application for online medicine ordering with two roles: **Customer** and **Pharmacist**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Plain CSS with CSS Variables |
| Charts | Chart.js + react-chartjs-2 |
| HTTP Client | Axios |
| Backend | FastAPI (Python) |
| Database | SQLite + SQLAlchemy ORM |
| Auth | JWT (python-jose) + bcrypt |
| File Upload | python-multipart |

## Features

### Customer
- Role-based login & signup
- Browse medicines by category with search autocomplete
- Medicine detail page with stock, pricing, and prescription info
- Cart with quantity controls and bill summary
- Prescription upload (required only for Rx medicines)
- Checkout with coupon codes and multiple payment methods
- Order tracking (Placed > Approved > Dispatched > Out for Delivery > Delivered)
- Profile management (edit info, order history, medical records, addresses, change password)

### Pharmacist
- Inventory management with low-stock alerts (< 15 units)
- Add new medicines to inventory
- Full medicine list with detailed view
- Prescription review (approve/deny with status tracking)
- Order management with search, date filters, and approve/deny actions
- Dashboard with charts (Sales Trend, Stock Turnover, Expiry Loss)
- CSV export and report generation
- Transaction history with revenue summary
- Pharmacy profile and settings

### General
- Toast notifications for all key actions
- Consistent pink-themed UI with Syne + Nunito fonts
- Sticky navbar with role-based navigation
- Footer on every page
- Responsive design

## Design System

```
--pink: #FF1B8D         (primary CTA, active states)
--pink-light: #FFB3D9   (borders, accents)
--pink-pale: #FFF0F7    (hover backgrounds, panels)
--pink-bg: #FFD6EC      (navbar, footer background)
--dark: #1A1A2E         (text)
--green: #10B981        (success)
--red: #EF4444          (error, danger)
--orange: #F59E0B       (warnings, pending)
--blue: #3B82F6         (processing)
```

## Project Structure

```
LowPharma/
├── frontend/                # React + Vite
│   └── src/
│       ├── components/      # Navbar, Footer
│       ├── pages/
│       │   ├── customer/    # Home, Search, Cart, Checkout, Profile...
│       │   └── pharmacist/  # Inventory, Orders, Dashboard, Prescriptions...
│       ├── context/         # AuthContext, CartContext, ToastContext
│       ├── api/             # Axios instance
│       └── styles/          # Global CSS with design variables
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── routes/          # auth, medicines, cart, orders, prescriptions...
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + bcrypt utilities
│   │   └── main.py          # App entry point
│   └── seed.py              # Database seeder (25 medicines)
└── UI/                      # Design mockups
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Setup

**1. Backend**
```bash
cd backend
pip install -r requirements.txt
python3 seed.py              # Seeds 25 medicines into the database
```

**2. Frontend**
```bash
cd frontend
npm install
```

### Running the App

Run both servers (from two terminals):

```bash
# Terminal 1 - Backend (port 8000)
cd backend && python3 -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Or in a single command:
```bash
cd LowPharma && (cd backend && python3 -m uvicorn app.main:app --reload --port 8000) & (cd frontend && npm run dev)
```

Then open **http://localhost:5173** in your browser.

### API Docs

FastAPI auto-generates interactive API docs at **http://localhost:8000/docs**

## Team

- Gythhri Devi
- Abhineet Raj

## License

This project is for educational purposes.
