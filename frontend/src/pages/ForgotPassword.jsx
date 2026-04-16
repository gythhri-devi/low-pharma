import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Footer from '../components/Footer';
import './Login.css';

export default function ForgotPassword() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    try {
      await API.put('/api/auth/forgot-password', {
        username,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    }
  };

  const roleLabel = role === 'customer' ? 'For Customer' : 'For Pharmacist';

  return (
    <div className="auth-page">
      <div className="landing-navbar">
        <div className="navbar-logo">
          <span className="arrow">↓</span> LOWPHARMA
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-left">
          <button className="back-arrow" onClick={() => navigate(`/login/${role}`)}>←</button>
          <img src="https://cdn-icons-png.flaticon.com/512/2920/2920349.png" alt="Illustration" />
          <h2>Forgot your password?</h2>
          <p>No worries, reset it here using your username</p>
        </div>

        <div className="auth-right">
          {success ? (
            <div className="auth-form" style={{ textAlign: 'center' }}>
              <h2>Password Reset!</h2>
              <p className="subtitle" style={{ marginBottom: 24 }}>
                Your password has been updated successfully.
              </p>
              <button className="btn-pink" onClick={() => navigate(`/login/${role}`)}>
                Back to Login
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <h2>Reset Password</h2>
              <p className="subtitle">Enter your username and set a new password</p>
              <p className="role-label">{roleLabel}</p>

              {error && <p className="auth-error">{error}</p>}

              <input
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <span
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.1rem', userSelect: 'none' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <span
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.1rem', userSelect: 'none' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>

              <button type="submit" className="btn-pink">Reset Password</button>

              <p className="switch-link">
                Remember your password?{' '}
                <a onClick={() => navigate(`/login/${role}`)}>Login</a>
              </p>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
