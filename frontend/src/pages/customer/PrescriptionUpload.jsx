import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { fileUrl } from '../../utils/fileUrl';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import './PrescriptionUpload.css';

export default function PrescriptionUpload() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { showToast } = useToast();
  const fileRef = useRef();

  const [uploaded, setUploaded] = useState(false);
  const [selectedPast, setSelectedPast] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pastPrescriptions, setPastPrescriptions] = useState([]);
  const [address, setAddress] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);

  useEffect(() => {
    API.get('/api/prescriptions/my').then(res => setPastPrescriptions(res.data));
    API.get('/api/addresses/').then(res => {
      if (res.data.length > 0) setAddress(res.data[0]);
    });
  }, []);

  const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const handling = 10;
  const discount = 50;
  const delivery = 40;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/api/prescriptions/upload', formData);
      setPrescriptionId(res.data.id);
      setUploaded(true);
      setSelectedPast(false);
      showToast('Prescription uploaded!');
    } catch {
      showToast('Upload failed');
    }
  };

  const validPrescriptions = pastPrescriptions.filter(p => !p.is_expired);

  const handleTogglePicker = () => {
    if (validPrescriptions.length > 0) {
      setShowPicker(!showPicker);
    }
  };

  const handlePickPrescription = (id) => {
    setPrescriptionId(id);
    setSelectedPast(true);
    setUploaded(false);
    setShowPicker(false);
  };

  const canCheckout = uploaded || selectedPast;

  return (
    <div className="prescription-page">
      <div className="prescription-main">
        <p className="prescription-breadcrumb">
          <a onClick={() => navigate('/home')}>Home</a> &gt; <a onClick={() => navigate('/cart')}>Cart</a> &gt; Prescription
        </p>

        <div className={`upload-box ${uploaded ? 'uploaded' : ''}`} onClick={() => fileRef.current?.click()}>
          <div className="upload-icon">📋</div>
          <button className="btn-pink-outline">
            {uploaded ? 'File uploaded' : 'Upload Prescription'}
          </button>
          <input type="file" ref={fileRef} onChange={handleUpload} accept="image/*,.pdf" />
        </div>

        <div className="upload-divider">
          <hr /><span>OR</span><hr />
        </div>

        <div className="past-prescription-section">
          <div className="past-prescription-header" onClick={handleTogglePicker}>
            <div className="rx-icon">📝</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700 }}>Select from past prescriptions</p>
              {validPrescriptions.length > 0 ? (
                <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>
                  {validPrescriptions.length} valid prescription{validPrescriptions.length > 1 ? 's' : ''} available
                </p>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                  No valid prescriptions (older than 15 days)
                </p>
              )}
            </div>
            {selectedPast && (
              <span className="past-selected-badge">Selected</span>
            )}
            <button
              className="btn-pink-outline"
              onClick={(e) => { e.stopPropagation(); handleTogglePicker(); }}
              disabled={validPrescriptions.length === 0}
            >
              {showPicker ? 'Close' : 'Choose'}
            </button>
          </div>

          {showPicker && (
            <div className="prescription-picker">
              {validPrescriptions.map(p => (
                <div
                  key={p.id}
                  className={`prescription-picker-item ${prescriptionId === p.id ? 'selected' : ''}`}
                  onClick={() => handlePickPrescription(p.id)}
                >
                  <input
                    type="radio"
                    name="prescription"
                    checked={prescriptionId === p.id}
                    onChange={() => handlePickPrescription(p.id)}
                  />
                  <div className="picker-item-info">
                    <span className="picker-item-name">Prescription #{p.id}</span>
                    <span className="picker-item-date">
                      Uploaded: {new Date(p.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="picker-item-days">{p.days_remaining} days remaining</span>
                  </div>
                  <a
                    href={fileUrl(p.filename)}
                    target="_blank"
                    rel="noreferrer"
                    className="picker-view-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="prescription-sidebar">
        <div className="bill-summary">
          <h3>Bill Summary</h3>
          <div className="bill-row"><span>Item total (MRP)</span><span>₹{itemTotal}</span></div>
          <div className="bill-row"><span>Handling charges</span><span>₹{handling}</span></div>
          <div className="bill-row discount"><span>Total discount</span><span>-₹{discount}</span></div>
          <div className="bill-row"><span>Delivery charges</span><span>₹{delivery}</span></div>
        </div>

        <div className="delivery-section" style={{ marginTop: 20 }}>
          <h4>Delivery Address</h4>
          {address ? (
            <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 8, lineHeight: 1.6 }}>
              {address.house_no}, {address.road},<br />
              {address.city}, {address.state}<br />
              {address.pin_code}
            </p>
          ) : (
            <a onClick={() => navigate('/add-address')} style={{ color: 'var(--pink)', fontWeight: 700, fontSize: 13 }}>
              Add one
            </a>
          )}
        </div>

        <button
          className="btn-pink"
          style={{ width: '100%', marginTop: 24 }}
          disabled={!canCheckout}
          onClick={() => navigate('/checkout', { state: { prescriptionId } })}
        >
          Checkout
        </button>

        <p className="prescription-note">
          All uploads are encrypted and only visible to the pharmacists.
          Any prescription you upload is verified before processing the order.
        </p>
      </div>
    </div>
  );
}
