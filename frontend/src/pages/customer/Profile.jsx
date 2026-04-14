import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import API from '../../api/axios';
import { fileUrl } from '../../utils/fileUrl';
import './Profile.css';

const DELIVERY_STAGES = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const TABS = ['Edit Profile', 'Your Order', 'Medical Records', 'Manage Address', 'Settings'];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'Edit Profile');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saveLabel, setSaveLabel] = useState('Save');
  const prescFileRef = useRef();
  const [editingAddress, setEditingAddress] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    API.get('/api/profile/').then(res => {
      setName(res.data.name);
      setMobile(res.data.mobile);
    });
    API.get('/api/orders/my').then(res => setOrders(res.data));
    API.get('/api/prescriptions/my').then(res => setPrescriptions(res.data));
    API.get('/api/addresses/').then(res => setAddresses(res.data));
  }, []);

  const handleSaveProfile = async () => {
    await API.put('/api/profile/customer', { name, mobile });
    setSaveLabel('Saved!');
    setTimeout(() => setSaveLabel('Save'), 2000);
  };

  const handleDeleteAddress = async (id) => {
    await API.delete(`/api/addresses/${id}`);
    setAddresses(addresses.filter(a => a.id !== id));
    showToast('Address removed');
  };

  const handleStartEdit = (addr) => {
    setEditingAddress(addr.id);
    setEditForm({
      name: addr.name, mobile: addr.mobile || '', house_no: addr.house_no,
      road: addr.road, city: addr.city, state: addr.state,
      pin_code: addr.pin_code, address_type: addr.address_type,
    });
  };

  const handleSaveEdit = async () => {
    try {
      const res = await API.put(`/api/addresses/${editingAddress}`, editForm);
      setAddresses(addresses.map(a => a.id === editingAddress ? res.data : a));
      setEditingAddress(null);
      showToast('Address updated!');
    } catch {
      showToast('Failed to update address');
    }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      showToast('Passwords do not match');
      return;
    }
    try {
      await API.put('/api/profile/change-password', {
        current_password: currentPwd,
        new_password: newPwd,
      });
      showToast('Password changed!');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to change password');
    }
  };

  const currentOrders = orders.filter(o => o.delivery_stage !== 'Delivered');
  const pastOrders = orders.filter(o => o.delivery_stage === 'Delivered');

  return (
    <div className="profile-page">
      <div className="profile-sidebar">
        <p className="cart-breadcrumb" style={{ marginBottom: 16 }}>
          <a onClick={() => navigate('/home')}>Home</a> &gt; Profile
        </p>
        <div className="profile-user">
          <span className="avatar"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
          <h3>{user?.username}</h3>
        </div>
        <div className="profile-menu">
          {TABS.map(tab => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-content">
        {activeTab === 'Edit Profile' && (
          <>
            <h2>Edit Profile</h2>
            <div className="profile-form">
              <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input placeholder="Mobile No." value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>
            <button className="btn-pink" style={{ marginTop: 16 }} onClick={handleSaveProfile}>
              {saveLabel}
            </button>
          </>
        )}

        {activeTab === 'Your Order' && (
          <>
            <div className="order-section">
              <h3>Current Orders</h3>
              {currentOrders.length === 0 && <p className="empty-state">No current orders</p>}
              {currentOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-card-id">Order #{order.id}</span>
                      <span className="order-card-date">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="order-card-total">₹{order.total_amount}</span>
                  </div>
                  <div className="order-card-items">
                    {order.items.map(item => (
                      <div key={item.id} className="order-card-item">
                        <span>{item.medicine_name} <span className="order-card-qty">x{item.quantity}</span></span>
                        <span className="order-card-price">₹{item.price}</span>
                        {item.pharmacy_name && <span className="order-card-pharmacy">{item.pharmacy_name}</span>}
                      </div>
                    ))}
                  </div>
                  {order.delivery_stage === 'Cancelled' ? (
                    <div className="order-card-cancelled">Cancelled</div>
                  ) : (
                    <div className="mini-tracker">
                      {DELIVERY_STAGES.map((stage, idx) => {
                        const currentIdx = DELIVERY_STAGES.indexOf(order.delivery_stage);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <div key={stage} className={`mini-tracker-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            <div className="mini-tracker-dot" />
                            {idx < DELIVERY_STAGES.length - 1 && <div className={`mini-tracker-line ${idx < currentIdx ? 'completed' : ''}`} />}
                            <span className="mini-tracker-label">{stage}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="order-section">
              <h3>Past Orders</h3>
              {pastOrders.length === 0 && <p className="empty-state">No past orders</p>}
              {pastOrders.map(order => (
                <div key={order.id} className="order-card past">
                  <div className="order-card-header">
                    <div>
                      <span className="order-card-id">Order #{order.id}</span>
                      <span className="order-card-date">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="order-card-total">₹{order.total_amount}</span>
                  </div>
                  <div className="order-card-items">
                    {order.items.map(item => (
                      <div key={item.id} className="order-card-item">
                        <span>{item.medicine_name} <span className="order-card-qty">x{item.quantity}</span></span>
                        <span className="order-card-price">₹{item.price}</span>
                        {item.pharmacy_name && <span className="order-card-pharmacy">{item.pharmacy_name}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="order-card-delivered">Delivered on {new Date(order.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'Medical Records' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Medical Records</h2>
              <button className="btn-pink-outline" onClick={() => prescFileRef.current?.click()}>
                + Upload Prescription
              </button>
              <input
                type="file"
                ref={prescFileRef}
                style={{ display: 'none' }}
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    await API.post('/api/prescriptions/upload', formData);
                    showToast('Prescription uploaded!');
                    const res = await API.get('/api/prescriptions/my');
                    setPrescriptions(res.data);
                  } catch {
                    showToast('Upload failed');
                  }
                  e.target.value = '';
                }}
              />
            </div>
            {prescriptions.length === 0 ? (
              <p className="empty-state">No medical records saved yet</p>
            ) : (
              prescriptions.map(p => (
                <div key={p.id} className="address-card presc-card" style={{ marginBottom: 12, opacity: p.is_expired ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{p.original_name || 'Prescription'}</h4>
                    {p.is_expired ? (
                      <span className="presc-badge expired">Expired</span>
                    ) : (
                      <span className="presc-badge valid">{p.days_remaining}d left</span>
                    )}
                  </div>
                  <p>Status: {p.status}</p>
                  <p>Uploaded: {new Date(p.uploaded_at).toLocaleDateString()}</p>
                  <a
                    href={fileUrl(p.filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--pink)', fontWeight: 700, fontSize: 13 }}
                  >
                    View Prescription
                  </a>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Manage Address' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Manage Address</h2>
              <button className="btn-pink-outline" onClick={() => navigate('/add-address')}>
                + Add Address
              </button>
            </div>
            {addresses.length === 0 && <p className="empty-state">No saved addresses</p>}
            {addresses.map(addr => (
              <div key={addr.id} className="address-card">
                {editingAddress === addr.id ? (
                  <div className="address-edit-form">
                    <input placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                    <input placeholder="Mobile" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} />
                    <input placeholder="House No., Building" value={editForm.house_no} onChange={(e) => setEditForm({...editForm, house_no: e.target.value})} />
                    <input placeholder="Road, Area" value={editForm.road} onChange={(e) => setEditForm({...editForm, road: e.target.value})} />
                    <input placeholder="City" value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
                    <input placeholder="State" value={editForm.state} onChange={(e) => setEditForm({...editForm, state: e.target.value})} />
                    <input placeholder="Pin Code" value={editForm.pin_code} onChange={(e) => setEditForm({...editForm, pin_code: e.target.value})} />
                    <div className="address-type-chips">
                      {['Home', 'Work', 'Other'].map(type => (
                        <button key={type} className={editForm.address_type === type ? 'active' : ''} onClick={() => setEditForm({...editForm, address_type: type})}>
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="address-card-actions">
                      <button className="btn-pink" style={{ padding: '8px 20px', fontSize: 13 }} onClick={handleSaveEdit}>Save</button>
                      <button className="btn-pink-outline" style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => setEditingAddress(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4>{addr.address_type}</h4>
                    <p>
                      {addr.name}<br />
                      {addr.house_no}, {addr.road},<br />
                      {addr.city}, {addr.state}<br />
                      {addr.pin_code}
                    </p>
                    <div className="address-card-actions">
                      <button className="edit-btn" onClick={() => handleStartEdit(addr)}>Edit</button>
                      <button className="remove-btn" onClick={() => handleDeleteAddress(addr.id)}>Remove</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {activeTab === 'Settings' && (
          <>
            <h2>Change Password</h2>
            <div className="password-form">
              <input type="password" placeholder="Current password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              <input type="password" placeholder="New password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              <input type="password" placeholder="Confirm password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
              <button className="btn-pink" onClick={handleChangePassword}>Update</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
