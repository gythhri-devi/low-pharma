from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Order, OrderItem, CartItem, Medicine, Transaction, User, Prescription
from ..schemas import OrderCreate, OrderResponse, OrderItemResponse
from ..auth import get_current_user


DELIVERY_STAGES = ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"]


def _pharmacist_order_ids(db: Session, pharmacist_id: int):
    """Subquery returning order IDs that contain this pharmacist's medicines."""
    return db.query(OrderItem.order_id).join(Medicine).filter(
        Medicine.pharmacist_id == pharmacist_id
    ).subquery()


def _auto_progress_delivery(orders, db: Session):
    """Auto-progress delivery stages based on order age.
    Skips cancelled orders and orders still pending prescription approval.
    Stages progress every ~8 hours after order creation."""
    changed = False
    now = datetime.utcnow()
    for order in orders:
        if order.delivery_stage in ("Cancelled", "Delivered"):
            continue
        if order.prescription_status == "Pending Approval":
            continue
        if order.prescription_status == "Rejected":
            continue

        # Approved prescription orders should be at least "Processing"
        if order.prescription_status == "Approved" and order.delivery_stage == "Placed":
            order.delivery_stage = "Processing"
            changed = True

        hours_old = (now - order.created_at).total_seconds() / 3600
        if hours_old < 0.5:
            new_stage = "Placed"
        elif hours_old < 8:
            new_stage = "Processing"
        elif hours_old < 24:
            new_stage = "Shipped"
        elif hours_old < 48:
            new_stage = "Out for Delivery"
        else:
            new_stage = "Delivered"

        current_idx = DELIVERY_STAGES.index(order.delivery_stage) if order.delivery_stage in DELIVERY_STAGES else 0
        new_idx = DELIVERY_STAGES.index(new_stage) if new_stage in DELIVERY_STAGES else 0
        if new_idx > current_idx:
            order.delivery_stage = new_stage
            changed = True
    if changed:
        db.commit()


router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/", response_model=OrderResponse)
def create_order(req: OrderCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate prescription is not expired (15-day validity)
    if req.prescription_id:
        presc = db.query(Prescription).filter(Prescription.id == req.prescription_id).first()
        if presc and presc.uploaded_at:
            age_days = (datetime.utcnow() - presc.uploaded_at).days
            if age_days > 15:
                raise HTTPException(status_code=400, detail="Prescription has expired (older than 15 days). Please upload a new one.")

    item_total = 0.0
    needs_prescription = False
    order_items = []

    for ci in cart_items:
        med = db.query(Medicine).filter(Medicine.id == ci.medicine_id).first()
        if med:
            if med.quantity < ci.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough stock for {med.name}. Available: {med.quantity}, Requested: {ci.quantity}"
                )
            price = med.mrp * ci.quantity
            item_total += price
            if med.requires_prescription:
                needs_prescription = True
            order_items.append(OrderItem(
                medicine_id=med.id,
                medicine_name=med.name,
                medicine_brand=med.brand,
                medicine_category=med.category,
                quantity=ci.quantity,
                price=price,
            ))
            med.quantity -= ci.quantity

    handling = 10.0
    discount = 50.0
    delivery = 40.0
    coupon_discount = 30.0 if req.coupon_code else 0.0
    total = item_total + handling - discount + delivery - coupon_discount

    order = Order(
        user_id=user.id,
        address_text=req.address_text,
        total_amount=total,
        handling_charges=handling,
        discount=discount,
        delivery_charges=delivery,
        coupon_code=req.coupon_code,
        coupon_discount=coupon_discount,
        payment_method=req.payment_method,
        payment_status="Successful",
        prescription_status="Pending Approval" if needs_prescription else "Not Required",
        delivery_stage="Placed",
    )
    db.add(order)
    db.flush()

    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    transaction = Transaction(
        order_id=order.id,
        user_id=user.id,
        customer_name=user.name or user.username,
        amount=total,
        payment_method=req.payment_method,
        status="Successful" if req.payment_method != "Cash on Delivery" else "Pending",
    )
    db.add(transaction)

    if req.prescription_id:
        presc = db.query(Prescription).filter(Prescription.id == req.prescription_id).first()
        if presc:
            presc.order_id = order.id
            presc.status = "Pending"

    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    db.refresh(order)

    return _order_to_response(order, user)


@router.get("/my", response_model=list[OrderResponse])
def get_my_orders(user=Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.medicine).joinedload(Medicine.pharmacist)
    ).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    _auto_progress_delivery(orders, db)
    return [_order_to_response(o, user) for o in orders]


@router.get("/all", response_model=list[OrderResponse])
def get_all_orders(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "pharmacist":
        raise HTTPException(status_code=403, detail="Not authorized")
    order_ids_sq = _pharmacist_order_ids(db, user.id)
    orders = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.medicine).joinedload(Medicine.pharmacist)
    ).filter(Order.id.in_(order_ids_sq)).order_by(Order.created_at.desc()).all()
    _auto_progress_delivery(orders, db)
    result = []
    for o in orders:
        customer = db.query(User).filter(User.id == o.user_id).first()
        result.append(_order_to_response(o, customer))
    return result


@router.put("/{order_id}/approve")
def approve_order(order_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "pharmacist":
        raise HTTPException(status_code=403, detail="Not authorized")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    has_items = db.query(OrderItem).join(Medicine).filter(
        OrderItem.order_id == order_id, Medicine.pharmacist_id == user.id
    ).first()
    if not has_items:
        raise HTTPException(status_code=403, detail="Not your order")
    order.prescription_status = "Approved"
    order.delivery_stage = "Processing"
    presc = db.query(Prescription).filter(Prescription.order_id == order_id).first()
    if presc:
        presc.status = "Approved"
    db.commit()
    return {"message": "Order approved"}


@router.put("/{order_id}/deny")
def deny_order(order_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "pharmacist":
        raise HTTPException(status_code=403, detail="Not authorized")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    has_items = db.query(OrderItem).join(Medicine).filter(
        OrderItem.order_id == order_id, Medicine.pharmacist_id == user.id
    ).first()
    if not has_items:
        raise HTTPException(status_code=403, detail="Not your order")
    order.prescription_status = "Rejected"
    order.delivery_stage = "Cancelled"
    presc = db.query(Prescription).filter(Prescription.order_id == order_id).first()
    if presc:
        presc.status = "Denied"
    db.commit()
    return {"message": "Order denied"}


def _order_to_response(order: Order, user) -> OrderResponse:
    items = []
    for i in order.items:
        pharmacy_name = ""
        if i.medicine and i.medicine.pharmacist and i.medicine.pharmacist.pharmacy_name:
            pharmacy_name = i.medicine.pharmacist.pharmacy_name
        items.append(OrderItemResponse(
            id=i.id,
            medicine_name=i.medicine_name,
            medicine_brand=i.medicine_brand,
            medicine_category=i.medicine_category,
            quantity=i.quantity,
            price=i.price,
            pharmacy_name=pharmacy_name,
        ))
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        address_text=order.address_text,
        total_amount=order.total_amount,
        handling_charges=order.handling_charges,
        discount=order.discount,
        delivery_charges=order.delivery_charges,
        coupon_code=order.coupon_code,
        coupon_discount=order.coupon_discount,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        prescription_status=order.prescription_status,
        delivery_stage=order.delivery_stage,
        created_at=order.created_at,
        items=items,
        customer_name=user.name or user.username if user else "",
        customer_phone=user.mobile if user else "",
    )


