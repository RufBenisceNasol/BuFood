import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [resendSuccess, setResendSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setShowResendVerification(false);
        setResendSuccess('');

        try {
            const response = await axios.post('http://localhost:8000/api/auth/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

            if (response.data.user.role === 'Seller') {
                navigate('/seller-dashboard');
            } else {
                navigate('/');
            }

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'An error occurred during login';
            setError(errorMessage);
            
            if (errorMessage.includes('verify your email')) {
                setShowResendVerification(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setLoading(true);
        setError('');
        setResendSuccess('');

        try {
            await axios.post('http://localhost:8000/api/auth/resend-verification', { email });
            setResendSuccess('Verification email has been resent. Please check your inbox.');
            setShowResendVerification(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend verification email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.container}>
                <h1 style={styles.title}>Welcome Back</h1>
                <p style={styles.subtitle}>Sign in to your BuFood account</p>
                
                {error && <div style={styles.error}>{error}</div>}
                {resendSuccess && <div style={styles.success}>{resendSuccess}</div>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                            disabled={loading}
                            placeholder="Email address"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                            disabled={loading}
                            placeholder="Password"
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
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {showResendVerification && (
                    <button
                        onClick={handleResendVerification}
                        style={{
                            ...styles.resendButton,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        disabled={loading}
                    >
                        Resend Verification Email
                    </button>
                )}

                <div style={styles.links}>
                    <a href="/forgot-password" style={styles.forgotPassword}>Forgot Password?</a>
                    <div style={styles.divider}>
                        <span style={styles.dividerText}>New to BuFood?</span>
                    </div>
                    <a href="/register" style={styles.registerButton}>
                        Create an account
                    </a>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f7f7',
        padding: '20px',
    },
    container: {
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#333',
        marginBottom: '8px',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '32px',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        position: 'relative',
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        fontSize: '16px',
        border: '1px solidrgba(184, 105, 15, 0.49)',
        borderRadius: '8px',
        backgroundColor: 'rgba(53, 6, 6, 0.26)',
        transition: 'all 0.2s ease',
        outline: 'none',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#28a745',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'background-color 0.2s ease',
        marginTop: '10px',
    },
    resendButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#6c757d',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        marginTop: '16px',
        transition: 'background-color 0.2s ease',
    },
    error: {
        color: '#dc3545',
        backgroundColor: '#ffe6e6',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    success: {
        color: '#28a745',
        backgroundColor: '#e6ffe6',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    links: {
        marginTop: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    forgotPassword: {
        color: '#666',
        textDecoration: 'none',
        fontSize: '14px',
        transition: 'color 0.2s ease',
    },
    divider: {
        width: '100%',
        textAlign: 'center',
        borderBottom: '1px solid #e1e1e1',
        marginTop: '16px',
        marginBottom: '16px',
        height: '12px',
    },
    dividerText: {
        backgroundColor: '#ffffff',
        padding: '0 10px',
        color: '#666',
        fontSize: '14px',
    },
    registerButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#fff',
        color: '#28a745',
        border: '2px solid #28a745',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        textDecoration: 'none',
        textAlign: 'center',
        transition: 'all 0.2s ease',
    }
};

export default LoginPage;