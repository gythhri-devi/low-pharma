import { useNavigate, useLocation } from 'react-router-dom';
import './ThankYou.css';

const STEPS = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function ThankYou() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;
  const activeStep = 0; // Just placed — only "Placed" is highlighted

  return (
    <div className="thankyou-page">
      <div className="thankyou-banner">
        <div className="thankyou-icon">{'\uD83D\uDED2'}</div>
        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--pink)', marginTop: 8 }}>
          THANK YOU FOR YOUR PURCHASE
        </p>
      </div>

      <div className="thankyou-text">
        <h1>THANK</h1>
        <h1>YOU</h1>
      </div>

      {order && (
        <div className="thankyou-order-summary">
          <h3>Order Summary</h3>
          <div className="thankyou-order-meta">
            <p><strong>Order ID:</strong> ORD {order.id}</p>
            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Delivery to:</strong> {order.address_text || 'N/A'}</p>
            <p><strong>Payment:</strong> {order.payment_method}</p>
          </div>

          <table className="thankyou-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Brand</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td>{item.medicine_name}</td>
                  <td>{item.medicine_brand}</td>
                  <td>{item.quantity}x</td>
                  <td>₹{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="thankyou-bill">
            <div className="thankyou-bill-row"><span>Subtotal</span><span>₹{order.items.reduce((s, i) => s + i.price, 0)}</span></div>
            <div className="thankyou-bill-row"><span>Handling</span><span>₹{order.handling_charges}</span></div>
            <div className="thankyou-bill-row"><span>Delivery</span><span>₹{order.delivery_charges}</span></div>
            <div className="thankyou-bill-row discount"><span>Discount</span><span>-₹{order.discount}</span></div>
            {order.coupon_discount > 0 && (
              <div className="thankyou-bill-row discount"><span>Coupon ({order.coupon_code})</span><span>-₹{order.coupon_discount}</span></div>
            )}
            <div className="thankyou-bill-row total"><span>Total Paid</span><span>₹{order.total_amount}</span></div>
          </div>
        </div>
      )}

      <div className="tracker">
        <h3>Track your order</h3>
        <div className="tracker-steps">
          {STEPS.map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div className="tracker-step">
                <div className={`tracker-dot ${i <= activeStep ? 'active' : ''}`} />
                <span>{step}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`tracker-line ${i < activeStep ? 'active' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-pink" onClick={() => navigate('/home')}>Continue Shopping</button>
    </div>
  );
}
