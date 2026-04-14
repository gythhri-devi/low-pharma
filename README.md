<h1 align="center">💊 LowPharma</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Educational-pink?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://low-pharma.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-low--pharma.vercel.app-000000?style=for-the-badge&logo=vercel" />
  </a>
</p>

<p align="center">
  A <b>full-stack online pharmacy management system</b> with dual roles — <b>Customer</b> and <b>Pharmacist</b> — featuring medicine ordering, prescription handling, inventory management, and analytics dashboards.<br/>
  Deployed on <b>Vercel</b> (frontend) + <b>Render</b> (backend) with <b>Neon PostgreSQL</b> and <b>Cloudinary</b> for production file storage.
</p>

---

## ✨ Features

### 👤 Customer

| Feature | Details |
|---------|---------|
| **Authentication** | Role-based login & signup, forgot password (username-based reset) |
| **Medicine Browsing** | Browse by category, search autocomplete, randomized display |
| **Medicine Detail** | Stock info, pricing, category images, prescription requirement |
| **Cart** | Quantity controls, bill summary |
| **Prescriptions** | Upload with 15-day validity · reuse past valid prescriptions via radio-button picker |
| **Checkout** | Coupon codes, multiple payment methods, address picker (required before placing order) |
| **Order Tracking** | Placed → Processing → Shipped → Out for Delivery → Delivered |
| **Profile** | Edit name & mobile, order history, medical records, manage addresses, change password |
| **Session Management** | Fresh browser session always starts at the landing page |

### 🏥 Pharmacist

| Feature | Details |
|---------|---------|
| **Inventory** | Full medicine list with low-stock alerts (< 15 units) |
| **Add Medicine** | Image upload (Cloudinary in prod), prescription-required toggle |
| **Prescription Review** | Approve / deny with status tracking + clickable file links |
| **Order Management** | Search, date filters (no future dates), approve / deny actions |
| **Dashboard** | Charts — Sales Trend, Stock Turnover, Expiry Loss — filtered by date range |
| **Reports** | CSV export and report generation |
| **Transactions** | Transaction history with revenue summary |
| **Profile & Settings** | Edit profile, pharmacy details, change password |

### ⚙️ General
- Toast notifications for all key actions
- Consistent pink-themed UI with **Syne + Nunito** fonts
- Sticky navbar with role-based navigation
- Fully responsive — desktop, tablet, mobile
- Stock validation — orders rejected if insufficient inventory
- Environment-variable-based API URL for deployment readiness

---

## 🚀 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| **Frontend** | Vercel | https://low-pharma.vercel.app |
| **Backend** | Render | Auto-deployed via `render.yaml` |
| **Database** | Neon (PostgreSQL) | Serverless PostgreSQL |
| **File Storage** | Cloudinary | Prescription uploads + medicine images |

The app runs **SQLite locally** and **PostgreSQL (Neon) in production** — switching is fully automatic via the `DATABASE_URL` env var.

---

## 🎨 Design System

| Variable | Value | Usage |
|----------|-------|-------|
| `--pink` | `#FF1B8D` | Primary CTA, active states |
| `--pink-light` | `#FFB3D9` | Borders, accents |
| `--pink-pale` | `#FFF0F7` | Hover backgrounds, panels |
| `--pink-bg` | `#FFD6EC` | Navbar, footer background |
| `--dark` | `#1A1A2E` | Text |
| `--green` | `#10B981` | Success |
| `--red` | `#EF4444` | Error, danger |
| `--orange` | `#F59E0B` | Warnings, pending |
| `--blue` | `#3B82F6` | Processing |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router v6 |
| **Styling** | Plain CSS with CSS Variables (fully responsive) |
| **Charts** | Chart.js + react-chartjs-2 |
| **HTTP Client** | Axios |
| **Backend** | FastAPI (Python 3.11) |
| **Database** | SQLite (dev) · PostgreSQL via Neon (prod) |
| **ORM** | SQLAlchemy |
| **Auth** | JWT (python-jose) + bcrypt |
| **File Storage** | Local filesystem (dev) · Cloudinary (prod) |
| **File Upload** | python-multipart |

---

## 📁 Project Structure

```
LowPharma/
├── frontend/                # React + Vite
│   ├── vercel.json          # Vercel SPA rewrite config
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
│   ├── .env.example         # Environment variable template
│   ├── app/
│   │   ├── routes/          # auth, medicines, cart, orders, prescriptions, addresses...
│   │   ├── database.py      # SQLite (dev) / PostgreSQL (prod) via DATABASE_URL
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + bcrypt utilities
│   │   └── main.py          # App entry point, CORS from FRONTEND_URL env var
│   ├── uploads/             # Local prescription files & medicine images (dev only)
│   └── seed.py              # Database seeder
├── UML/                     # UML diagrams (JPEG)
├── render.yaml              # Render backend deployment config
└── runtime.txt              # Python 3.11.9 for Render
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python3 seed.py        # Seeds medicines into the database
```

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Environment Variables

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`) — copy from `.env.example`:
```
SECRET_KEY=your-strong-secret-key-here

# Leave blank for local SQLite:
DATABASE_URL=

# Leave blank for local file storage:
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

FRONTEND_URL=http://localhost:5173
```

### 4. Run the App

```bash
# Terminal 1 — Backend (port 8000)
cd backend && python3 -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

### 5. API Docs

FastAPI auto-generates interactive API docs at **http://localhost:8000/docs**

---

## ☁️ Production Deployment

### Backend → Render

1. Connect repo to [Render](https://render.com)
2. Render auto-detects `render.yaml` at the root
3. Set these env vars in the Render dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `SECRET_KEY` | Strong random string for JWT signing |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Your Vercel frontend URL |

### Frontend → Vercel

1. Connect `frontend/` folder to [Vercel](https://vercel.com)
2. Set env var: `VITE_API_URL=https://your-render-backend.onrender.com`
3. `vercel.json` handles SPA routing automatically

---

## 📐 UML Diagrams

The `UML/` directory contains 5 diagrams:

| Diagram | Description |
|---------|-------------|
| **Use Case** | All customer and pharmacist interactions |
| **Class** | Data models and relationships |
| **Sequence** | Order placement flow with prescription and address selection |
| **Activity** | Customer order flow and pharmacist workflows |
| **ER** | Full database schema with foreign key relationships |

---

## 👥 Team

| Member | GitHub |
|--------|--------|
| **Gayathri Devi** | [@gythhri-devi](https://github.com/gythhri-devi) |
| **Aishani Mishra** | [@aishanimishra](https://github.com/aishanimishra) |
| **Abhineet Raj** | [@Abhineetraj07](https://github.com/Abhineetraj07) |

---

## 📄 License

This project is for educational purposes.
