from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "customer" or "pharmacist"
    name = Column(String, default="")
    mobile = Column(String, default="")
    pharmacy_name = Column(String, default="")
    license_number = Column(String, default="")
    pharmacy_address = Column(String, default="")
    operating_hours = Column(String, default="")
    contact_number = Column(String, default="")
    preferred_pharmacist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="user", cascade="all, delete-orphan")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    mobile = Column(String, default="")
    house_no = Column(String, default="")
    road = Column(String, default="")
    city = Column(String, default="")
    state = Column(String, default="")
    pin_code = Column(String, nullable=False)
    address_type = Column(String, default="Home")

    user = relationship("User", back_populates="addresses")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    brand = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    mfg_date = Column(String, default="")
    exp_date = Column(String, default="")
    mrp = Column(Float, default=0.0)
    cost_per_unit = Column(Float, default=0.0)
    category = Column(String, default="")
    image_url = Column(String, default="")
    requires_prescription = Column(Integer, default=0)
    pharmacist_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    pharmacist = relationship("User", foreign_keys=[pharmacist_id])


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, default=1)

    user = relationship("User", back_populates="cart_items")
    medicine = relationship("Medicine")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address_text = Column(Text, default="")
    total_amount = Column(Float, default=0.0)
    handling_charges = Column(Float, default=10.0)
    discount = Column(Float, default=50.0)
    delivery_charges = Column(Float, default=40.0)
    coupon_code = Column(String, default="")
    coupon_discount = Column(Float, default=0.0)
    payment_method = Column(String, default="")
    payment_status = Column(String, default="Pending")  # Pending, Successful
    prescription_status = Column(String, default="Not Required")  # Pending Approval, Approved, Rejected, Not Required
    delivery_stage = Column(String, default="Placed")  # Placed, Approved, Processing, Dispatched, Out for Delivery, Delivered, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    medicine_name = Column(String, default="")
    medicine_brand = Column(String, default="")
    medicine_category = Column(String, default="")
    quantity = Column(Integer, default=1)
    price = Column(Float, default=0.0)

    order = relationship("Order", back_populates="items")
    medicine = relationship("Medicine")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, default="")
    doctor_name = Column(String, default="")
    status = Column(String, default="Pending")  # Pending, Approved, Denied
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="prescriptions")
    order = relationship("Order", back_populates="prescriptions")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_name = Column(String, default="")
    amount = Column(Float, default=0.0)
    payment_method = Column(String, default="")
    status = Column(String, default="Pending")  # Pending, Successful
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order")
    user = relationship("User")
