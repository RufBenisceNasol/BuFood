import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../api';
import logod from '../assets/logod.png';

const ResetPasswordConfirmationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('Invalid or missing token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await auth.resetPassword(token, newPassword);
      setMessage('Your password has been reset. You can now log in with your new password.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <img src={logod} alt="Logo" style={styles.logo} />
        <h1 style={styles.title}>Set New Password</h1>
        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            disabled={loading}
            maxLength={8}
            style={styles.input}
            autoComplete="new-password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            disabled={loading}
            maxLength={8}
            style={styles.input}
            autoComplete="new-password"
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Saving...' : 'Reset Password'}
          </button>
        </form>
        <div style={styles.links}>
          <a href="/login" style={styles.loginLink}>Back to Login</a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '15px',
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    padding: 'clamp(20px, 5vw, 40px) clamp(15px, 4vw, 30px)',
    backgroundColor: '#f5f5f5',
    borderRadius: 'clamp(12px, 3vw, 20px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0 auto',
  },
  logo: {
    width: 'clamp(60px, 15vw, 80px)',
    height: 'auto',
    marginBottom: 'clamp(15px, 4vw, 20px)',
  },
  title: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    fontWeight: '700',
    color: '#333',
    marginBottom: 'clamp(20px, 5vw, 30px)',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(15px, 4vw, 20px)'
  },
  input: {
    width: '100%',
    padding: 'clamp(12px, 3vw, 15px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    border: '1px solid #ddd',
    borderRadius: '50px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  button: {
    padding: 'clamp(12px, 3vw, 15px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    border: 'none',
    borderRadius: '50px',
    backgroundColor: '#ff8c00',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#ffe6e6',
    padding: 'clamp(10px, 2.5vw, 12px)',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    marginBottom: 'clamp(15px, 4vw, 20px)',
    textAlign: 'center',
    width: '100%',
  },
  success: {
    color: '#28a745',
    backgroundColor: '#e6ffe6',
    padding: 'clamp(10px, 2.5vw, 12px)',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    marginBottom: 'clamp(15px, 4vw, 20px)',
    textAlign: 'center',
    width: '100%',
  },
  links: {
    marginTop: '20px',
    textAlign: 'center',
  },
  loginLink: {
    color: '#ff8c00',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default ResetPasswordConfirmationPage; 