import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logod from '../assets/logod.png';
import { MdMailOutline, MdLockOpen } from 'react-icons/md';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { auth } from '../api';
import { setToken, setRefreshToken, setUser, getToken, getUser } from '../utils/tokenUtils';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        const token = getToken();
        const user = getUser();
        if (token && user && user.role) {
            if (user.role === 'Seller') {
                navigate('/seller/dashboard');
            } else {
                navigate('/customer/home');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('Remember me value on submit:', rememberMe);
        try {
            const data = await auth.login(email, password);
            // Safely check for accessToken and refreshToken before using any data properties
            if (data?.accessToken && data?.refreshToken) {
                setToken(data.accessToken, rememberMe);
                setRefreshToken(data.refreshToken, rememberMe);
                setUser(data.user, rememberMe);
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
                if (data.user.role === 'Seller') {
                    navigate('/seller/dashboard');
                } else {
                    navigate('/customer/home');
                }
            } else {
                setError('Login failed: No tokens received. Please check your credentials or contact support.');
            }
        } catch (err) {
            // Robust error handling for various backend error shapes
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    setError(err.response.data);
                } else if (err.response.data.message) {
                    setError(err.response.data.message);
                } else if (err.response.data.error) {
                    let msg = err.response.data.error;
                    if (err.response.data.details) {
                        msg += ': ' + err.response.data.details;
                    }
                    setError(msg);
                } else if (err.response.data.details) {
                    setError(err.response.data.details);
                } else {
                    setError(JSON.stringify(err.response.data));
                }
            } else {
                setError(err.message || 'An error occurred during login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.container}>
                <img src={logod} alt="Logo" style={styles.logo} />
                <h1 style={styles.title}>SIGN IN</h1>
                
                {error && <div style={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <div style={styles.inputWrapper}>
                        <span style={styles.inputIcon}><MdMailOutline /></span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={styles.input}
                                disabled={loading}
                                placeholder="Email"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <div style={styles.inputWrapper}>
                        <span style={styles.inputIcon}><MdLockOpen /></span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={styles.input}
                                disabled={loading}
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.showPasswordButton}
                            >
                                {showPassword ? <FiEye /> : <FiEyeOff />}
                            </button>
                        </div>
                    </div>

                    <div style={styles.rememberForgot}>
                        <label style={styles.rememberMe}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={styles.checkbox}
                            />
                            Remember me
                        </label>
                        <a href="/forgot-password" style={styles.forgotPassword}>
                            Forgot Password?
                        </a>
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
                        {loading ? 'Signing in...' : 'SIGN IN'}
                    </button>
                </form>

                <div style={styles.signUpContainer}>
                    <span>Don't have an account? </span>
                    <a href="/register" style={styles.signUpLink}>
                        Sign Up
                    </a>
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
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    inputIcon: {
        position: 'absolute',
        left: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#666',
        fontSize: 'clamp(16px, 4vw, 20px)',
        display: 'flex',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        padding: 'clamp(12px, 3vw, 15px) 45px',
        fontSize: 'clamp(14px, 3.5vw, 16px)',
        border: '1px solid #ddd',
        borderRadius: '50px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        outline: 'none',
        transition: 'all 0.2s ease',
        '&:focus': {
            borderColor: '#rgba(103, 70, 30, 0.7)'
        },
    },
    showPasswordButton: {
        position: 'absolute',
        right: '15px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0',
        fontSize: 'clamp(16px, 4vw, 20px)',
        color: '#666',
    },
    rememberForgot: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 'clamp(8px, 2vw, 10px)',
        flexWrap: 'wrap',
        gap: '10px',
    },
    rememberMe: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#666',
        fontSize: 'clamp(12px, 3vw, 14px)',
    },
    checkbox: {
        width: 'clamp(14px, 3.5vw, 16px)',
        height: 'clamp(14px, 3.5vw, 16px)',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    forgotPassword: {
        color: '#666',
        textDecoration: 'none',
        fontSize: 'clamp(12px, 3vw, 14px)',
        '&:hover': {
            textDecoration: 'underline',
            color: '#ff8c00',
        },
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
        '&:hover': {
            backgroundColor: '#e67e00',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)',
        },
        '&:active': {
            transform: 'translateY(0)',
        },
    },
    signUpContainer: {
        marginTop: 'clamp(20px, 5vw, 30px)',
        textAlign: 'center',
        color: '#666',
        fontSize: 'clamp(12px, 3vw, 14px)',
    },
    signUpLink: {
        color: '#ff8c00',
        textDecoration: 'none',
        fontWeight: '600',
        '&:hover': {
            textDecoration: 'underline',
        },
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
    }
}

export default LoginPage;