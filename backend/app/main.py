import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy import inspect, text
from .database import engine, Base, DATABASE_URL
from .routes import auth, medicines, cart, orders, prescriptions, addresses, profile, pharmacist

Base.metadata.create_all(bind=engine)

# SQLite-only migration for local dev
if DATABASE_URL.startswith("sqlite"):
    with engine.connect() as conn:
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("medicines")]
        if "pharmacist_id" not in columns:
            conn.execute(text("ALTER TABLE medicines ADD COLUMN pharmacist_id INTEGER REFERENCES users(id)"))
            conn.commit()

app = FastAPI(title="LowPharma API")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)
    # Also allow Vercel preview deployments
    if "vercel.app" in frontend_url:
        ALLOWED_ORIGINS.append("https://low-pharma-git-main-abhineetraj07s-projects.vercel.app")
        ALLOWED_ORIGINS.append("https://low-pharma-abhineetraj07s-projects.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local uploads only in dev
if DATABASE_URL.startswith("sqlite"):
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router)
app.include_router(medicines.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(prescriptions.router)
app.include_router(addresses.router)
app.include_router(profile.router)
app.include_router(pharmacist.router)


@app.get("/")
def root():
    return {"message": "LowPharma API is running"}
