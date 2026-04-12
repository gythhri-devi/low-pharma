# LowPharma - Online Pharmacy Management & Ordering System

A fullstack web application for online medicine ordering with two roles: **Customer** and **Pharmacist**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Plain CSS with CSS Variables (fully responsive) |
| Charts | Chart.js + react-chartjs-2 |
| HTTP Client | Axios |
| Backend | FastAPI (Python) |
| Database | SQLite + SQLAlchemy ORM |
| Auth | JWT (python-jose) + bcrypt |
| File Upload | python-multipart |

## Key Highlights

- 🔐 JWT-based Authentication with role-based access
- 💊 Prescription validation with expiry logic (15-day validity)
- 📦 Real-time inventory tracking with stock validation
- 📊 Analytics dashboard with sales & stock insights
- 🧾 End-to-end order lifecycle management
- 📁 File upload support for prescriptions

## Features

### Customer
- Role-based login & signup with forgot password (username-based reset)
- Browse medicines by category with search autocomplete and randomized display
- Medicine detail page with stock, pricing, category images, and prescription info
- Cart with quantity controls and bill summary
- Prescription upload with 15-day validity — reuse past valid prescriptions or upload new ones via a radio-button picker
- Checkout with coupon codes, multiple payment methods, and address picker
- Order tracking (Placed > Processing > Shipped > Out for Delivery > Delivered)
- Profile management:
  - Edit name & mobile
  - Order history (current & past orders with delivery tracker)
  - Medical records (view prescriptions with validity badges and expiry countdown)
  - Manage addresses (add, edit inline, delete with type labels)
  - Change password
- Session management — fresh browser session always starts at the landing page

### Pharmacist
- Inventory management with low-stock alerts (< 15 units)
- Add new medicines with image upload and prescription-required toggle
- Full medicine list with detailed view
- Prescription review (approve/deny with status tracking)
- Order management with search, date filters (no future dates), and approve/deny actions
- Dashboard with charts (Sales Trend, Stock Turnover, Expiry Loss) filtered by date range
- CSV export and report generation
- Transaction history with revenue summary
- Pharmacy profile and settings (edit profile, pharmacy details, change password)

### General
- Toast notifications for all key actions
- Consistent pink-themed UI with Syne + Nunito fonts
- Sticky navbar with role-based navigation
- Footer on every page
- Fully responsive (desktop, tablet, mobile)
- Stock validation — orders rejected if insufficient inventory
- Environment-variable-based API URL for deployment readiness

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
│   ├── .env                 # VITE_API_URL config
│   └── src/
│       ├── components/      # Navbar, Footer
│       ├── pages/
│       │   ├── customer/    # Home, Search, Cart, Checkout, Profile, PrescriptionUpload...
│       │   └── pharmacist/  # Inventory, Orders, Dashboard, Prescriptions, AddStock...
│       ├── context/         # AuthContext, CartContext, ToastContext
│       ├── api/             # Axios instance with env-based API URL
│       └── styles/          # Global CSS with design variables
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── routes/          # auth, medicines, cart, orders, prescriptions, addresses...
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + bcrypt utilities
│   │   └── main.py          # App entry point
│   ├── uploads/             # Prescription files & medicine images
│   └── seed.py              # Database seeder
└── UML/                     # Mermaid.js UML diagrams (use case, class, sequence, activity, ER)
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
python3 seed.py              # Seeds medicines into the database
```

**2. Frontend**
```bash
cd frontend
npm install
```

### Environment Variables

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:8000
```

### Running the App

Run both servers (from two terminals):

```bash
# Terminal 1 - Backend (port 8000)
cd backend && python3 -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

### API Docs

FastAPI auto-generates interactive API docs at **http://localhost:8000/docs**

## UML Diagrams

The `UML/` directory contains five Mermaid.js diagrams:

1. **Use Case Diagram** — all customer and pharmacist interactions
2. **Class Diagram** — data models and relationships
3. **Sequence Diagram** — order placement flow with prescription and address selection
4. **Activity Diagram** — customer order flow and pharmacist workflows
5. **ER Diagram** — full database schema with foreign key relationships

Paste the code from each file into [mermaid.live](https://mermaid.live) to render.

## Team

- Gayathri Devi
- Aishani Mishra
- Abhineet Raj

## License

This project is for educational purposes.
