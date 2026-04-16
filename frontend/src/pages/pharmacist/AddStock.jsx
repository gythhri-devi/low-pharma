import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import API from '../../api/axios';
import './Pharmacist.css';

export default function AddStock() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '', brand: '', quantity: '', mfg_date: '', exp_date: '', mrp: '', cost_per_unit: '', category: '', requires_prescription: 0,
  });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.brand || !form.quantity) {
      setError('Medicine Name, Brand and Quantity are required');
      return;
    }
    try {
      await API.post('/api/medicines/', {
        ...form,
        quantity: parseInt(form.quantity) || 0,
        mrp: parseFloat(form.mrp) || 0,
        cost_per_unit: parseFloat(form.cost_per_unit) || 0,
        requires_prescription: form.requires_prescription,
      });
      showToast('Medicine added to inventory!');
      navigate('/pharmacist/inventory');
    } catch {
      setError('Failed to add medicine');
    }
  };

  return (
    <div className="pharma-page">
      <p className="cart-breadcrumb" style={{ marginBottom: 8 }}>
        <a onClick={() => navigate('/pharmacist/inventory')}>Home</a> &gt; Add Stock
      </p>
      <h2 style={{ color: 'var(--pink)', marginBottom: 24 }}>Add Stock</h2>

      <div className="add-stock-form">
        <input placeholder="Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        <input placeholder="Expiry Date" value={form.exp_date} onChange={(e) => handleChange('exp_date', e.target.value)} />
        <input placeholder="Brand" value={form.brand} onChange={(e) => handleChange('brand', e.target.value)} />
        <input placeholder="Cost per unit" value={form.cost_per_unit} onChange={(e) => handleChange('cost_per_unit', e.target.value)} />
        <input placeholder="Quantity" value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)} />
        <input placeholder="Category" value={form.category} onChange={(e) => handleChange('category', e.target.value)} />
        <input placeholder="Mfg Date" value={form.mfg_date} onChange={(e) => handleChange('mfg_date', e.target.value)} />
        <input placeholder="MRP" value={form.mrp} onChange={(e) => handleChange('mrp', e.target.value)} />

        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>Requires Prescription</label>
          <input type="checkbox" checked={form.requires_prescription === 1} onChange={(e) => handleChange('requires_prescription', e.target.checked ? 1 : 0)} />
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="btn-pink" onClick={handleSubmit}>Add Medicine</button>
      </div>
    </div>
  );
}
