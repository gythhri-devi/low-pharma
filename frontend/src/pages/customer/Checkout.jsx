import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import API from '../../api/axios';
import './Checkout.css';

const PAYMENT_METHODS = ['Credit / Debit Card', 'Cash on Delivery', 'UPI', 'Netbanking'];

const AVAILABLE_COUPONS = [
  { code: 'LOWPHARMA30', discount: 30, description: 'Get ₹30 off on your order' },
  { code: 'FIRST50', discount: 50, description: 'First order special — ₹50 off' },
  { code: 'HEALTH20', discount: 20, description: 'Flat ₹20 off on health essentials' },
  { code: 'WELLNESS100', discount: 100, min: 500, description: '₹100 off on orders above ₹500' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [showCoupons, setShowCoupons] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const prescriptionId = location.state?.prescriptionId;

  useEffect(() => {
    API.get('/api/addresses/').then(res => {
      setAddresses(res.data);
      if (res.data.length > 0) setAddress(res.data[0]);
    });
  }, []);

  const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const handling = 10;
  const discount = 50;
  const delivery = 40;
  const couponDiscount = couponApplied ? appliedCouponDiscount : 0;
  const total = itemTotal + handling - discount + delivery - couponDiscount;

  const handleApplyCoupon = (code) => {
    const found = AVAILABLE_COUPONS.find(c => c.code === (code || coupon).trim().toUpperCase());
    if (!found) {
      showToast('Invalid coupon code');
      return;
    }
    if (found.min && itemTotal < found.min) {
      showToast(`Minimum order ₹${found.min} required for this coupon`);
      return;
    }
    setCoupon(found.code);
    setCouponApplied(true);
    setAppliedCouponDiscount(found.discount);
    setShowCoupons(false);
    showToast(`Coupon applied! ₹${found.discount} off`);
  };

  const handleRemoveCoupon = () => {
    setCoupon('');
    setCouponApplied(false);
    setAppliedCouponDiscount(0);
  };

  const handlePayNow = async () => {
    try {
      const addressText = address
        ? `${address.name}, ${address.house_no}, ${address.road}, ${address.city}, ${address.state} ${address.pin_code}`
        : '';

      const res = await API.post('/api/orders/', {
        address_text: addressText,
        coupon_code: couponApplied ? coupon : '',
        payment_method: paymentMethod,
        prescription_id: prescriptionId,
      });

      clearCart();
      showToast('Order placed successfully!');
      navigate('/thankyou', { state: { order: res.data } });
    } catch (err) {
      showToast(err.response?.data?.detail || 'Order failed');
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-left">
        <h2>Order Placed</h2>

        <div className="bill-summary">
          <h3>Bill Summary</h3>
          <div className="bill-row"><span>Item total (MRP)</span><span>₹{itemTotal}</span></div>
          <div className="bill-row"><span>Handling charges</span><span>₹{handling}</span></div>
          <div className="bill-row"><span>Delivery charges</span><span>₹{delivery}</span></div>
          <div className="bill-row discount"><span>Total discount</span><span>-₹{discount}</span></div>
          {couponApplied && <div className="bill-row discount"><span>Coupon discount</span><span>-₹{couponDiscount}</span></div>}
          <hr className="bill-divider" />
          <div className="bill-total"><span>To be paid</span><span>₹{total}</span></div>
        </div>

        <div className="delivery-section" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>🏠 Delivering to</h4>
            {address && addresses.length > 1 && (
              <a onClick={() => setShowAddressPicker(!showAddressPicker)} style={{ color: 'var(--pink)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {showAddressPicker ? 'Close' : 'Change'}
              </a>
            )}
          </div>
          {address ? (
            <>
              <div className="selected-address" style={{ marginTop: 8 }}>
                <span className="address-type-badge">{address.address_type}</span>
                <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6, marginTop: 4 }}>
                  {address.name}<br />
                  {address.house_no}, {address.road},<br />
                  {address.city}, {address.state}<br />
                  {address.pin_code}
                </p>
              </div>
              {showAddressPicker && (
                <div className="checkout-address-picker">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`checkout-address-item ${address?.id === addr.id ? 'selected' : ''}`}
                      onClick={() => { setAddress(addr); setShowAddressPicker(false); }}
                    >
                      <input type="radio" name="checkout-addr" checked={address?.id === addr.id} onChange={() => {}} />
                      <div>
                        <span className="addr-type">{addr.address_type}</span>
                        <p className="addr-name">{addr.name}</p>
                        <p className="addr-detail">{addr.house_no}, {addr.road}, {addr.city}, {addr.state} {addr.pin_code}</p>
                      </div>
                    </div>
                  ))}
                  <button
                    className="add-new-address-btn"
                    onClick={() => navigate('/add-address')}
                    style={{ width: '100%', padding: 12, background: 'white', borderTop: '1px solid #f0f0f0', color: 'var(--pink)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    + Add New Address
                  </button>
                </div>
              )}
            </>
          ) : (
            <a onClick={() => navigate('/add-address')} style={{ color: 'var(--pink)', fontWeight: 700, cursor: 'pointer' }}>+ Add address</a>
          )}
        </div>
      </div>

      <div className="checkout-right">
        <div className="coupon-section">
          <div className="coupon-input">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              disabled={couponApplied}
            />
            {couponApplied ? (
              <button className="coupon-remove-btn" onClick={handleRemoveCoupon}>✕</button>
            ) : (
              <button onClick={() => handleApplyCoupon()}>Apply</button>
            )}
          </div>
          {couponApplied && <p className="coupon-success">✓ {coupon} applied! ₹{appliedCouponDiscount} off</p>}
          {!couponApplied && (
            <button className="view-coupons-btn" onClick={() => setShowCoupons(!showCoupons)}>
              {showCoupons ? 'Hide coupons' : 'View available coupons'}
            </button>
          )}
          {showCoupons && !couponApplied && (
            <div className="coupons-list">
              {AVAILABLE_COUPONS.map(c => (
                <div key={c.code} className="coupon-card">
                  <div className="coupon-card-left">
                    <span className="coupon-code-badge">{c.code}</span>
                    <p className="coupon-desc">{c.description}</p>
                  </div>
                  <button className="coupon-apply-btn" onClick={() => handleApplyCoupon(c.code)}>Apply</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="payment-methods">
          <h3>Mode of Payment</h3>
          {PAYMENT_METHODS.map(method => (
            <div
              key={method}
              className={`payment-option ${paymentMethod === method ? 'selected' : ''}`}
              onClick={() => setPaymentMethod(method)}
            >
              {method}
            </div>
          ))}
        </div>

        <button
          className="btn-pink"
          style={{ width: '100%', marginTop: 24 }}
          disabled={!paymentMethod}
          onClick={handlePayNow}
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}
