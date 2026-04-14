import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './Home.css';

import { fileUrl } from '../../utils/fileUrl';

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [medicines, setMedicines] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);

  useEffect(() => {
    API.get('/api/medicines/categories').then(res => setCategories(res.data));
    API.get('/api/medicines/bestsellers').then(res => setBestsellers(res.data));
    API.get('/api/medicines/').then(res => setMedicines(res.data));
  }, []);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    if (cat === 'All') {
      navigate('/search?q=');
    } else {
      navigate(`/search?category=${encodeURIComponent(cat)}`);
    }
  };

  return (
    <div className="home">
      <div className="category-nav">
        {categories.map(cat => (
          <button
            key={cat}
            className={activeCategory === cat ? 'active' : ''}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="hero-banners">
        <div className="hero-banner concept">
          <img src="https://cdn-icons-png.flaticon.com/512/2920/2920349.png" alt="Online pharmacy" />
        </div>
        <div className="hero-banner promo">
          <h2>Medicines<br />Up To 70% OFF</h2>
          <p>Health & Wellness Products</p>
          <button onClick={() => navigate('/search?q=')}>ORDER NOW</button>
        </div>
      </div>

      <div className="bestsellers">
        <h3>Bestsellers</h3>
        <div className="bestsellers-row">
          {bestsellers.map(med => (
            <div key={med.id} className="med-card" onClick={() => navigate(`/medicine/${med.id}`)}>
              <div className="med-img">
                {med.image_url ? (
                  <img src={fileUrl(med.image_url)} alt={med.name} />
                ) : (
                  <span>💊</span>
                )}
              </div>
              <h4>{med.name}</h4>
              <p className="med-price">{'₹'}{med.mrp}</p>
              <p className="med-brand">{med.brand}</p>
              {med.pharmacy_name && med.pharmacy_name !== 'LowPharma' && (
                <p className="med-pharmacy">{med.pharmacy_name}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
