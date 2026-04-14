import { useState, useRef } from 'react';
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.brand || !form.quantity) {
      setError('Medicine Name, Brand and Quantity are required');
      return;
    }
    try {
      let image_url = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await API.post('/api/medicines/upload-image', formData);
        image_url = uploadRes.data.url || uploadRes.data.filename;
      }
      await API.post('/api/medicines/', {
        ...form,
        quantity: parseInt(form.quantity) || 0,
        mrp: parseFloat(form.mrp) || 0,
        cost_per_unit: parseFloat(form.cost_per_unit) || 0,
        image_url,
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

        <div className="image-upload-field" style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Medicine Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, background: 'var(--pink-pale)' }} />}
            <button type="button" className="btn-pink-outline" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => fileRef.current?.click()}>
              {imageFile ? 'Change Image' : 'Upload Image'}
            </button>
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageSelect} />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="btn-pink" onClick={handleSubmit}>Add Medicine</button>
      </div>
    </div>
  );
}
