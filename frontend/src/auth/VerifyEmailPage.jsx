import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../api';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await auth.verifyEmail(token);
        if (!mounted) return;
        setStatus('success');
        setMessage(res?.message || 'Email verified successfully.');
        setTimeout(() => navigate('/login'), 2500);
      } catch (e) {
        if (!mounted) return;
        setStatus('error');
        const errMsg = e?.message || e?.response?.data?.message || 'Invalid or expired verification link.';
        setMessage(errMsg);
      }
    };
    if (token) run();
    return () => { mounted = false; };
  }, [token, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={status === 'success' ? styles.iconSuccess : status === 'error' ? styles.iconError : styles.iconPending}>
          {status === 'success' ? '✅' : status === 'error' ? '⚠️' : '⏳'}
        </div>
        <h1 style={styles.title}>{status === 'success' ? 'Email Verified' : status === 'error' ? 'Verification Failed' : 'Verifying...'}</h1>
        <p style={styles.message}>{message}</p>
        <button style={styles.button} onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 16
  },
  card: {
    width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 10px 24px rgba(0,0,0,0.08)', textAlign: 'center'
  },
  iconSuccess: { fontSize: 48, marginBottom: 12 },
  iconError: { fontSize: 48, marginBottom: 12 },
  iconPending: { fontSize: 48, marginBottom: 12 },
  title: { margin: '8px 0 4px', color: '#222' },
  message: { color: '#555', marginBottom: 16 },
  button: {
    padding: '10px 16px', background: '#ff8c00', color: '#fff', border: 'none', borderRadius: 24, cursor: 'pointer', fontWeight: 600
  }
};

export default VerifyEmailPage;
