import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logod from '../assets/logod.png';
import { MdMailOutline, MdLockOpen } from 'react-icons/md';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { auth, warmup } from '../api';
import { setToken, setRefreshToken, setUser, getToken, getUser } from '../utils/tokenUtils';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Signing in...');
    const wakeTimerRef = React.useRef(null);
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

    // Non-blocking warmup ping on mount to help wake sleeping servers
    React.useEffect(() => {
        warmup();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setLoadingMessage('Signing in...');

        // If the request takes too long, inform the user the server may be waking up
        if (wakeTimerRef.current) {
            clearTimeout(wakeTimerRef.current);
        }
        wakeTimerRef.current = setTimeout(() => {
            setLoadingMessage('Waking server... This first login can take up to a minute.');
        }, 4000);

        // Validate password length
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setPasswordError(`Password must be 8 characters (${password.length}/8)`);
            setLoading(false);
            return;
        }

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
            if (wakeTimerRef.current) {
                clearTimeout(wakeTimerRef.current);
                wakeTimerRef.current = null;
            }
            setLoading(false);
            setLoadingMessage('Signing in...');
        }
    };

    return (
        <div style={styles.pageContainer}>
            {/* Loading overlay and keyframes definition */}
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
            {loading && (
                <div style={styles.loadingOverlay}>
                    <div style={styles.loadingBox}>
                        <div style={styles.spinner} />
                        <div style={styles.loadingText}>{loadingMessage}</div>
                    </div>
                </div>
            )}
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
                            <div style={{ width: '100%', position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        const value = e.target.value.slice(0, 8); // limit to 8 characters
                                        setPassword(value);

                                        // Live hint if less than 8 characters
                                        if (value.length > 0 && value.length < 8) {
                                            setPasswordError(`Password must be 8 characters (${value.length}/8)`);
                                        } else {
                                            setPasswordError('');
                                        }
                                        setError(''); // Clear any previous error when typing
                                    }}
                                    required
                                    minLength={8}
                                    maxLength={8}
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
                                {passwordError && <div style={styles.errorMessage}>{passwordError}</div>}
                            </div>
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
        maxWidth: '100%',
        overflow: 'hidden',
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
        zIndex: 3,
        pointerEvents: 'none',
    },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        padding: 'clamp(12px, 3vw, 15px) 45px',
        fontSize: 'clamp(14px, 3.5vw, 16px)',
        border: '1px solid #ddd',
        borderRadius: '50px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        outline: 'none',
        transition: 'all 0.2s ease',
        position: 'relative',
        zIndex: 1,
        '&:focus': {
            borderColor: '#rgba(103, 70, 30, 0.7)'
        },
    },
    showPasswordButton: {
        position: 'absolute',
        right: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0',
        fontSize: 'clamp(16px, 4vw, 20px)',
        color: '#666',
        zIndex: 4,
    },
    errorMessage: {
        color: '#dc3545',
        fontSize: '12px',
        marginTop: '4px',
        paddingLeft: '15px',
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
    },
    loadingOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(1px)'
    },
    loadingBox: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    spinner: {
        width: '28px',
        height: '28px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #ff8c00',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: '#333',
        fontWeight: 600
    }
}

export default LoginPage;