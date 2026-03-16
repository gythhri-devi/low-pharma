import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Prescription, User, OrderItem, Medicine, Order
from ..schemas import PrescriptionResponse
from ..auth import get_current_user


def _pharmacist_order_ids(db, pharmacist_id):
    return db.query(OrderItem.order_id).join(Medicine).filter(
        Medicine.pharmacist_id == pharmacist_id
    ).subquery()


PRESCRIPTION_VALIDITY_DAYS = 15


def _compute_expiry(resp):
    """Set is_expired and days_remaining on a PrescriptionResponse."""
    if resp.uploaded_at:
        age = (datetime.utcnow() - resp.uploaded_at).days
        resp.days_remaining = max(0, PRESCRIPTION_VALIDITY_DAYS - age)
        resp.is_expired = age > PRESCRIPTION_VALIDITY_DAYS
    return resp


def _enrich_prescriptions(prescriptions, db):
    """Add patient_name and expiry info from the user relationship."""
    result = []
    for p in prescriptions:
        user = db.query(User).filter(User.id == p.user_id).first()
        resp = PrescriptionResponse.model_validate(p)
        resp.patient_name = user.name or user.username if user else f"User #{p.user_id}"
        _compute_expiry(resp)
        result.append(resp)
    return result

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=PrescriptionResponse)
async def upload_prescription(
    file: UploadFile = File(...),
    doctor_name: str = Form(""),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    prescription = Prescription(
        user_id=user.id,
        filename=filename,
        original_name=file.filename,
        doctor_name=doctor_name,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


@router.get("/my", response_model=list[PrescriptionResponse])
def get_my_prescriptions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    prescriptions = db.query(Prescription).filter(Prescription.user_id == user.id).order_by(Prescription.uploaded_at.desc()).all()
    result = []
    for p in prescriptions:
        resp = PrescriptionResponse.model_validate(p)
        _compute_expiry(resp)
        result.append(resp)
    return result


@router.get("/pending", response_model=list[PrescriptionResponse])
def get_pending_prescriptions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "pharmacist":
        raise HTTPException(status_code=403, detail="Not authorized")
    order_ids_sq = _pharmacist_order_ids(db, user.id)
    presc = db.query(Prescription).filter(
        Prescription.status == "Pending",
        Prescription.order_id.in_(order_ids_sq),
    ).all()
    return _enrich_prescriptions(presc, db)


@router.get("/all", response_model=list[PrescriptionResponse])
def get_all_prescriptions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "pharmacist":
        raise HTTPException(status_code=403, detail="Not authorized")
    from sqlalchemy import or_
    order_ids_sq = _pharmacist_order_ids(db, user.id)
    presc = db.query(Prescription).filter(
        or_(
            Prescription.order_id.in_(order_ids_sq),
            Prescription.order_id.is_(None),
        )
    ).order_by(Prescription.uploaded_at.desc()).all()
    return _enrich_prescriptions(presc, db)


@router.put("/{prescription_id}/approve")
def approve_prescription(prescription_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "pharmacist":
        raise HTTPException(status_code=403, detail="Not authorized")
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if p.order_id:
        has_items = db.query(OrderItem).join(Medicine).filter(
            OrderItem.order_id == p.order_id, Medicine.pharmacist_id == user.id
        ).first()
        if not has_items:
            raise HTTPException(status_code=403, detail="Not your prescription")
    p.status = "Approved"
    if p.order_id:
        order = db.query(Order).filter(Order.id == p.order_id).first()
        if order:
            order.prescription_status = "Approved"
            order.delivery_stage = "Processing"
    db.commit()
    return {"message": "Prescription approved"}


@router.put("/{prescription_id}/deny")
def deny_prescription(prescription_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "pharmacist":
        raise HTTPException(status_code=403, detail="Not authorized")
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if p.order_id:
        has_items = db.query(OrderItem).join(Medicine).filter(
            OrderItem.order_id == p.order_id, Medicine.pharmacist_id == user.id
        ).first()
        if not has_items:
            raise HTTPException(status_code=403, detail="Not your prescription")
    p.status = "Denied"
    if p.order_id:
        order = db.query(Order).filter(Order.id == p.order_id).first()
        if order:
            order.prescription_status = "Rejected"
            order.delivery_stage = "Cancelled"
    db.commit()
    return {"message": "Prescription denied"}
