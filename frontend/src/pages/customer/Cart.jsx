import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import API from '../../api/axios';
import './Cart.css';

import { fileUrl } from '../../utils/fileUrl';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, fetchCart, updateCartItem, removeCartItem } = useCart();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  useEffect(() => {
    fetchCart();
    API.get('/api/addresses/').then(res => {
      setAddresses(res.data);
      if (res.data.length > 0) setSelectedAddressId(res.data[0].id);
    });
  }, []);

  const address = addresses.find(a => a.id === selectedAddressId) || null;

  const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const handling = 10;
  const discount = 50;
  const delivery = 40;
  const total = itemTotal + handling - discount + delivery;
  const needsPrescription = cartItems.some(item => item.requires_prescription);

  const handleMinus = async (item) => {
    if (item.quantity <= 1) {
      await removeCartItem(item.id);
      showToast('Item removed from cart');
    } else {
      await updateCartItem(item.id, item.quantity - 1);
    }
  };

  const handlePlus = async (item) => {
    await updateCartItem(item.id, item.quantity + 1);
  };

  const handleRemove = async (item) => {
    await removeCartItem(item.id);
    showToast('Item removed from cart');
  };

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some medicines to get started</p>
        <button className="btn-pink" style={{ marginTop: 20 }} onClick={() => navigate('/home')}>
          Browse Medicines
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-main">
        <p className="cart-breadcrumb">
          <a onClick={() => navigate('/home')}>Home</a> &gt; Cart
        </p>
        <h3 className="cart-count">{cartItems.length} items added</h3>

        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-img">
              {item.image_url ? (
                <img src={fileUrl(item.image_url)} alt={item.name} />
              ) : (
                <span>💊</span>
              )}
            </div>
            <div className="cart-item-info">
              <h4>{item.name}</h4>
              <p>{item.category}</p>
              <p className="cart-item-price">{'\u20B9'}{item.price}</p>
            </div>
            <div className="qty-control">
              <button onClick={() => handleMinus(item)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => handlePlus(item)}>+</button>
            </div>
            <button className="cart-remove" onClick={() => handleRemove(item)}>{'\u2715'}</button>
          </div>
        ))}
      </div>

      <div className="cart-sidebar">
        <div className="bill-summary">
          <h3>Bill Summary</h3>
          <div className="bill-row"><span>Item total (MRP)</span><span>{'\u20B9'}{itemTotal}</span></div>
          <div className="bill-row"><span>Handling charges</span><span>{'\u20B9'}{handling}</span></div>
          <div className="bill-row discount"><span>Total discount</span><span>-{'\u20B9'}{discount}</span></div>
          <div className="bill-row"><span>Delivery charges</span><span>{'\u20B9'}{delivery}</span></div>
          <hr className="bill-divider" />
          <div className="bill-total"><span>To be paid</span><span>{'\u20B9'}{total}</span></div>
        </div>

        <div className="delivery-section">
          <h4>{'🏠'} Delivering to</h4>
          {address ? (
            <>
              <div className="selected-address">
                <span className="address-type-badge">{address.address_type}</span>
                <p>{address.name}</p>
                <p>{address.house_no}, {address.road}, {address.city}, {address.state} {address.pin_code}</p>
              </div>
              <a className="change-address-link" onClick={() => setShowAddressPicker(!showAddressPicker)}>
                {showAddressPicker ? 'Close' : 'Change'}
              </a>
            </>
          ) : (
            <a onClick={() => navigate('/profile', { state: { tab: 'Manage Address' } })}>+ Add address</a>
          )}

          {showAddressPicker && (
            <div className="address-picker">
              {addresses.map(addr => (
                <label
                  key={addr.id}
                  className={`address-picker-item ${addr.id === selectedAddressId ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setShowAddressPicker(false);
                  }}
                >
                  <input
                    type="radio"
                    name="delivery-address"
                    checked={addr.id === selectedAddressId}
                    onChange={() => {}}
                  />
                  <div>
                    <span className="address-type-badge">{addr.address_type}</span>
                    <p className="addr-name">{addr.name}</p>
                    <p className="addr-detail">{addr.house_no}, {addr.road}, {addr.city}, {addr.state} {addr.pin_code}</p>
                    <p className="addr-phone">{addr.mobile}</p>
                  </div>
                </label>
              ))}
              <button
                className="add-new-address-btn"
                onClick={() => navigate('/profile', { state: { tab: 'Manage Address' } })}
              >
                + Add a new address
              </button>
            </div>
          )}
        </div>

        {needsPrescription && (
          <p style={{ fontSize: 12, color: 'var(--orange)', marginTop: 16, fontWeight: 600 }}>
            {'\u26A0'} Your cart contains medicines that require a prescription.
          </p>
        )}

        <button
          className="btn-pink"
          style={{ width: '100%', marginTop: 24 }}
          onClick={() => navigate(needsPrescription ? '/prescription' : '/checkout')}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
