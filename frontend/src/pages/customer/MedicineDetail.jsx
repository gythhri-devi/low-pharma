import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useCart } from '../../context/CartContext';
import './MedicineDetail.css';

import { fileUrl } from '../../utils/fileUrl';

export default function MedicineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [medicine, setMedicine] = useState(null);

  useEffect(() => {
    API.get(`/api/medicines/${id}`).then(res => setMedicine(res.data));
  }, [id]);

  if (!medicine) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  const handleAddToCart = async () => {
    await addToCart(medicine.id);
    navigate('/cart');
  };

  return (
    <div className="medicine-detail">
      <span className="detail-back" onClick={() => navigate(-1)}>{'←'} Back</span>

      <div className="detail-content">
        <div className="detail-image">
          {medicine.image_url ? (
            <img src={fileUrl(medicine.image_url)} alt={medicine.name} />
          ) : (
            <span>💊</span>
          )}
        </div>

        <div className="detail-info">
          <h1>{medicine.name}</h1>
          <p className="detail-brand">By {medicine.brand}</p>
          {medicine.pharmacy_name && medicine.pharmacy_name !== 'LowPharma' && (
            <p className="detail-pharmacy">{medicine.pharmacy_name}</p>
          )}
          <span className="detail-category">{medicine.category}</span>
          {medicine.requires_prescription ? (
            <span style={{ display: 'inline-block', background: '#fef3c7', color: '#d97706', padding: '4px 14px', borderRadius: 50, fontSize: 13, fontWeight: 700, marginLeft: 8 }}>Rx Prescription Required</span>
          ) : null}
          <p className="detail-price">{'₹'}{medicine.mrp}</p>

          <div className="detail-meta">
            <div>
              <span>Available Stock</span>
              <p className={`detail-stock ${medicine.quantity < 15 ? 'low' : 'ok'}`}>
                {medicine.quantity} units
              </p>
            </div>
            <div>
              <span>Cost per Unit</span>
              <p>{'₹'}{medicine.cost_per_unit}</p>
            </div>
            <div>
              <span>Mfg Date</span>
              <p>{medicine.mfg_date}</p>
            </div>
            <div>
              <span>Expiry Date</span>
              <p>{medicine.exp_date}</p>
            </div>
          </div>

          <button className="btn-pink" onClick={handleAddToCart}>Add to Cart</button>

          {medicine.pharmacy_name && medicine.pharmacy_name !== 'LowPharma' && (
            <div className="pharmacy-info-card">
              <h4>Sold by</h4>
              <p className="pharmacy-info-name">{medicine.pharmacy_name}</p>
              {medicine.pharmacy_address && <p className="pharmacy-info-row">📍 {medicine.pharmacy_address}</p>}
              {medicine.pharmacy_hours && <p className="pharmacy-info-row">🕐 {medicine.pharmacy_hours}</p>}
              {medicine.pharmacy_contact && <p className="pharmacy-info-row">📞 {medicine.pharmacy_contact}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
