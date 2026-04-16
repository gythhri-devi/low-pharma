from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str  # "customer" or "pharmacist"
    preferred_pharmacist_id: Optional[int] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    user_id: int


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    role: str
    name: str
    mobile: str
    pharmacy_name: str
    license_number: str
    pharmacy_address: str
    operating_hours: str
    contact_number: str

    class Config:
        from_attributes = True


class UpdateCustomerProfile(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None


class UpdatePharmacistProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    pharmacy_name: Optional[str] = None
    license_number: Optional[str] = None
    pharmacy_address: Optional[str] = None
    operating_hours: Optional[str] = None
    contact_number: Optional[str] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ForgotPassword(BaseModel):
    username: str
    new_password: str


class AddressCreate(BaseModel):
    name: str
    mobile: str = ""
    house_no: str = ""
    road: str = ""
    city: str = ""
    state: str = ""
    pin_code: str
    address_type: str = "Home"


class AddressResponse(BaseModel):
    id: int
    name: str
    mobile: str
    house_no: str
    road: str
    city: str
    state: str
    pin_code: str
    address_type: str

    class Config:
        from_attributes = True


class CartItemAdd(BaseModel):
    medicine_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class MedicineCreate(BaseModel):
    name: str
    brand: str
    quantity: int
    mfg_date: str = ""
    exp_date: str = ""
    mrp: float = 0.0
    cost_per_unit: float = 0.0
    category: str = ""
    image_url: str = ""
    requires_prescription: int = 0


class MedicineResponse(BaseModel):
    id: int
    name: str
    brand: str
    quantity: int
    mfg_date: str
    exp_date: str
    mrp: float
    cost_per_unit: float
    category: str
    image_url: str
    requires_prescription: int
    pharmacist_id: Optional[int] = None
    pharmacy_name: Optional[str] = ""
    pharmacy_address: Optional[str] = ""
    pharmacy_hours: Optional[str] = ""
    pharmacy_contact: Optional[str] = ""

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    address_text: str = ""
    coupon_code: str = ""
    payment_method: str = ""
    prescription_id: Optional[int] = None


class OrderItemResponse(BaseModel):
    id: int
    medicine_name: str
    medicine_brand: str
    medicine_category: str
    quantity: int
    price: float
    pharmacy_name: Optional[str] = ""

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    address_text: str
    total_amount: float
    handling_charges: float
    discount: float
    delivery_charges: float
    coupon_code: str
    coupon_discount: float
    payment_method: str
    payment_status: str
    prescription_status: str
    delivery_stage: str
    created_at: datetime
    items: list[OrderItemResponse] = []
    customer_name: Optional[str] = ""
    customer_phone: Optional[str] = ""

    class Config:
        from_attributes = True


class PrescriptionResponse(BaseModel):
    id: int
    user_id: int
    order_id: Optional[int]
    filename: str
    original_name: str
    doctor_name: str
    patient_name: str = ""
    status: str
    uploaded_at: datetime
    is_expired: bool = False
    days_remaining: int = 15

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: int
    order_id: int
    customer_name: str
    amount: float
    payment_method: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardData(BaseModel):
    sales_trend: list[dict]
    stock_turnover: dict
    expiry_loss: list[dict]
    total_revenue: float
    total_orders: int
