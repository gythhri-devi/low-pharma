import os
import uuid
import random
import cloudinary
import cloudinary.uploader

from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from pydantic import BaseModel

from ..database import get_db
from ..models import Medicine, User
from ..schemas import MedicineResponse, MedicineCreate
from ..auth import get_current_user


class StockUpdate(BaseModel):
    quantity: int

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# Local fallback for dev
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "medicines")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/medicines", tags=["medicines"])


def _enrich_medicines(medicines):
    """Add pharmacy details from the pharmacist relationship."""
    results = []
    for med in medicines:
        data = med.__dict__.copy()
        p = med.pharmacist
        data["pharmacy_name"] = p.pharmacy_name if p and p.pharmacy_name else ""
        data["pharmacy_address"] = p.pharmacy_address if p and p.pharmacy_address else ""
        data["pharmacy_hours"] = p.operating_hours if p and p.operating_hours else ""
        data["pharmacy_contact"] = p.contact_number if p and p.contact_number else ""
        results.append(data)
    return results


@router.get("/", response_model=list[MedicineResponse])
def get_medicines(
    search: str = Query("", description="Search term"),
    category: str = Query("", description="Filter by category"),
    sort: str = Query("default", description="Sort: default, price_asc, price_desc, name"),
    pharmacy: str = Query("", description="Filter by pharmacy name"),
    db: Session = Depends(get_db),
):
    query = db.query(Medicine).options(joinedload(Medicine.pharmacist))

    if search:
        query = query.filter(
            or_(
                Medicine.name.ilike(f"%{search}%"),
                Medicine.brand.ilike(f"%{search}%"),
                Medicine.category.ilike(f"%{search}%"),
            )
        )

    if category and category != "All":
        query = query.filter(Medicine.category.ilike(f"%{category}%"))

    if pharmacy and pharmacy != "All":
        query = query.join(User, Medicine.pharmacist_id == User.id).filter(
            User.pharmacy_name.ilike(f"%{pharmacy}%")
        )

    if sort == "price_asc":
        query = query.order_by(Medicine.mrp.asc())
    elif sort == "price_desc":
        query = query.order_by(Medicine.mrp.desc())
    elif sort == "name":
        query = query.order_by(Medicine.name.asc())

    results = _enrich_medicines(query.all())
    if sort == "default":
        random.shuffle(results)
    return results


@router.get("/suggestions")
def get_suggestions(q: str = Query(""), db: Session = Depends(get_db)):
    if not q:
        return []
    medicines = db.query(Medicine.name).filter(
        or_(
            Medicine.name.ilike(f"%{q}%"),
            Medicine.brand.ilike(f"%{q}%"),
            Medicine.category.ilike(f"%{q}%"),
        )
    ).limit(6).all()
    return [m.name for m in medicines]


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Medicine.category).distinct().all()
    return ["All"] + [c[0] for c in cats if c[0]]


@router.get("/pharmacies")
def get_pharmacies(db: Session = Depends(get_db)):
    """Get list of all pharmacy names that have medicines."""
    pharmacists = db.query(User.pharmacy_name).filter(
        User.role == "pharmacist",
        User.pharmacy_name != "",
        User.pharmacy_name.isnot(None),
    ).distinct().all()
    names = [p[0] for p in pharmacists if p[0]]
    return ["All"] + names


@router.get("/bestsellers", response_model=list[MedicineResponse])
def get_bestsellers(db: Session = Depends(get_db)):
    meds = db.query(Medicine).options(joinedload(Medicine.pharmacist)).all()
    random.shuffle(meds)
    return _enrich_medicines(meds[:10])


@router.post("/upload-image")
def upload_medicine_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    if os.getenv("CLOUDINARY_CLOUD_NAME"):
        result = cloudinary.uploader.upload(
            file.file,
            folder="lowpharma/medicines",
            public_id=str(uuid.uuid4()),
        )
        return {"url": result["secure_url"], "filename": result["secure_url"]}
    # Local fallback
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())
    return {"url": f"/uploads/medicines/{filename}", "filename": f"medicines/{filename}"}


@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).options(joinedload(Medicine.pharmacist)).filter(Medicine.id == medicine_id).first()
    if not med:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Medicine not found")
    data = med.__dict__.copy()
    p = med.pharmacist
    data["pharmacy_name"] = p.pharmacy_name if p and p.pharmacy_name else ""
    data["pharmacy_address"] = p.pharmacy_address if p and p.pharmacy_address else ""
    data["pharmacy_hours"] = p.operating_hours if p and p.operating_hours else ""
    data["pharmacy_contact"] = p.contact_number if p and p.contact_number else ""
    return data


@router.post("/", response_model=MedicineResponse)
def add_medicine(med: MedicineCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Medicine).filter(
        Medicine.name.ilike(med.name),
        Medicine.brand.ilike(med.brand),
        Medicine.pharmacist_id == user.id,
    ).first()

    if existing:
        existing.quantity += med.quantity
        if med.exp_date:
            existing.exp_date = med.exp_date
        if med.mfg_date:
            existing.mfg_date = med.mfg_date
        if med.mrp:
            existing.mrp = med.mrp
        if med.cost_per_unit:
            existing.cost_per_unit = med.cost_per_unit
        if med.image_url:
            existing.image_url = med.image_url
        db.commit()
        db.refresh(existing)
        medicine = existing
    else:
        medicine = Medicine(**med.model_dump(), pharmacist_id=user.id)
        db.add(medicine)
        db.commit()
        db.refresh(medicine)

    data = medicine.__dict__.copy()
    data["pharmacy_name"] = user.pharmacy_name or ""
    return data


@router.put("/{medicine_id}/add-stock")
def add_stock(medicine_id: int, stock: StockUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    if med.pharmacist_id != user.id:
        raise HTTPException(status_code=403, detail="Not your medicine")
    med.quantity += stock.quantity
    db.commit()
    return {"id": med.id, "name": med.name, "quantity": med.quantity}


@router.delete("/{medicine_id}")
def delete_medicine(medicine_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    if med.pharmacist_id != user.id:
        raise HTTPException(status_code=403, detail="Not your medicine")
    db.delete(med)
    db.commit()
    return {"message": "Medicine deleted"}
