import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../api';
import logod from '../assets/logod.png';

const ResetPasswordConfirmationPage = () => {
  const [status, setStatus] = useState('pending'); // 'pending', 'success', 'error'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing confirmation token.');
      return;
    }
    const confirmReset = async () => {
      try {
        await auth.resetPassword(token);
        setStatus('success');
        setMessage('Your password has been reset and confirmed! You can now log in with your new password.');
        setTimeout(() => navigate('/login'), 4000);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Failed to confirm password reset. The link may have expired or is invalid.');
      }
    };
    confirmReset();
  }, [location.search, navigate]);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <img src={logod} alt="Logo" style={styles.logo} />
        <h1 style={styles.title}>Password Reset Confirmation</h1>
        {status === 'pending' && <div style={styles.info}>Confirming your password reset...</div>}
        {status === 'success' && <div style={styles.success}>{message}</div>}
        {status === 'error' && <div style={styles.error}>{message}</div>}
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
  info: {
    color: '#333',
    backgroundColor: '#fffbe6',
    padding: 'clamp(10px, 2.5vw, 12px)',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    marginBottom: 'clamp(15px, 4vw, 20px)',
    textAlign: 'center',
    width: '100%',
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