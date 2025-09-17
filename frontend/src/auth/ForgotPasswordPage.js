import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import logod from '../assets/logod.png';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendIntervalId, setResendIntervalId] = useState(null);
  const navigate = useNavigate();

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    if (resendIntervalId) {
      clearInterval(resendIntervalId);
    }
    const id = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setResendIntervalId(id);
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await auth.sendPasswordResetOtp(email);
      setSuccess('If this email is registered, an OTP has been sent. Please check your inbox.');
      setStep('otp');
      startCooldown(60);
    } catch (err) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd) => {
    if (!pwd || pwd.length !== 8) return 'Password must be exactly 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
    if (!/\d/.test(pwd)) return 'Password must contain a number';
    return '';
  };

  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Frontend validation
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await auth.resetPasswordWithOtp({ email, otp, newPassword });
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.message || 'Failed to reset password with OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    try {
      await auth.resendPasswordResetOtp(email);
      setSuccess('A new OTP has been sent to your email.');
      startCooldown(60);
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <img src={logod} alt="Logo" style={styles.logo} />
        <h1 style={styles.title}>Forgot Password</h1>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        {step === 'email' && (
          <form onSubmit={handleSubmitEmail} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleSubmitOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                required
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                disabled={loading}
                inputMode="numeric"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                onClick={handleResend}
                style={{ ...styles.linkButton, opacity: resendCooldown > 0 ? 0.6 : 1 }}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <div style={styles.inputGroup}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="New password"
                disabled={loading}
                maxLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(v => !v)}
                style={styles.showPasswordButton}
                tabIndex={-1}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <div style={newPassword && newPassword.length !== 8 ? styles.hintError : styles.hint} aria-live="polite">
              Password must be exactly 8 characters ({newPassword.length}/8)
            </div>

            <div style={styles.inputGroup}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Confirm new password"
                disabled={loading}
                maxLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                style={styles.showPasswordButton}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <div style={(confirmPassword && confirmPassword !== newPassword) ? styles.hintError : styles.hint} aria-live="polite">
              {confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match' : ' '}
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
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
    gap: 'clamp(15px, 4vw, 20px)',
  },
  inputGroup: {
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
    transition: 'all 0.2s ease',
  },
  showPasswordButton: {
    position: 'absolute',
    right: '15px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    fontSize: '20px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    padding: 'clamp(12px, 3vw, 15px)',
    backgroundColor: '#ff8c00',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    marginTop: 'clamp(15px, 4vw, 20px)',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
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
  hint: {
    color: '#666',
    fontSize: '12px',
    marginTop: '6px'
  },
  hintError: {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '6px'
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
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#ff8c00',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0
  }
};

export default ForgotPasswordPage;