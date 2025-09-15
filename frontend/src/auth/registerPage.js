import React, { useState } from 'react';
import { auth } from '../api';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock, FiBriefcase, FiEye, FiEyeOff } from 'react-icons/fi';
import logod from '../assets/logod.png';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contactNumber: '',
        password: '',
        confirmPassword: '',
        role: 'Customer'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setPasswordError('');
        setConfirmPasswordError('');

        // Validate password length
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            setPasswordError(`Password must be 8 characters (${formData.password.length}/8)`);
            return;
        }

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setConfirmPasswordError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Remove confirmPassword and create dataToSend in one step
            const { confirmPassword: _, ...dataToSend } = formData;
            const data = await auth.register(dataToSend);
            // Safely check for accessToken and refreshToken before using any data properties
            if (data?.accessToken && data?.refreshToken) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                setSuccess(data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 5000);
            } else if (data?.message) {
                setSuccess(data.message);
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
                setError(err.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <div style={{ marginBottom: '1rem' }}>
                    <img src={logod} alt="BuFood Logo" style={styles.logo} />
                    <h2 style={styles.title}>SIGN UP</h2>
                    {error && <div style={styles.error}>{error}</div>}
                    {success && <div style={styles.success}>{success}</div>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <span style={styles.inputIcon}><FiUser /></span>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={styles.input}
                                disabled={loading}
                                autoComplete="name"
                                placeholder="Full Name"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <span style={styles.inputIcon}><FiMail /></span>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={styles.input}
                                disabled={loading}
                                autoComplete="email"
                                placeholder="Email"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}><FiLock /></span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 8); // limit to 8 characters
                                            handleChange({ target: { name: 'password', value } });
                                            
                                            // Show error if less than 8 characters
                                            if (value.length > 0 && value.length < 8) {
                                                setPasswordError(`Password must be 8 characters (${value.length}/8)`);
                                            } else {
                                                setPasswordError('');
                                            }
                                        }}
                                        required
                                        minLength={8}
                                        maxLength={8}
                                        style={styles.input}
                                        disabled={loading}
                                        autoComplete="new-password"
                                        placeholder="Password"
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

                        <div style={styles.inputGroup}>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}><FiLock /></span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 8); // limit to 8 characters
                                            handleChange({ target: { name: 'confirmPassword', value } });
                                            
                                            // Clear error when typing
                                            if (confirmPasswordError) {
                                                setConfirmPasswordError('');
                                            }
                                        }}
                                        required
                                        minLength={8}
                                        maxLength={8}
                                        style={styles.input}
                                        disabled={loading}
                                        autoComplete="new-password"
                                        placeholder="Confirm Password"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.showPasswordButton}
                                    >
                                        {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
                                    </button>
                                    {confirmPasswordError && <div style={styles.errorMessage}>{confirmPasswordError}</div>}
                                </div>
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <span style={styles.inputIcon}><FiPhone /></span>
                            <input
                                type="tel"
                                id="contactNumber"
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleChange}
                                required
                                style={styles.input}
                                disabled={loading}
                                autoComplete="tel"
                                placeholder="Phone Number"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <span style={styles.inputIcon}><FiBriefcase /></span>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                style={styles.input}
                                disabled={loading}
                            >
                                <option value="Customer">Customer</option>
                                <option value="Seller">Seller</option>
                            </select>
                        </div>

                        <div style={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="terms"
                                required
                                style={styles.checkbox}
                            />
                            <label htmlFor="terms" style={styles.checkboxLabel}>
                                I agree to the Terms of Service and Privacy Policy
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            style={styles.button}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>
                </div>
                <div style={styles.links}>
                    <p style={styles.loginText}>
                        Already have an account? <a href="/login" style={styles.loginLink}>Sign In</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '1px',
        boxSizing: 'border-box',
    },
    formContainer: {
        maxWidth: '400px',
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 24px)',
        boxSizing: 'border-box',
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh',
    },
    logo: {
        width: 'clamp(60px, 15vw, 80px)',
        height: 'auto',
        marginBottom: 'clamp(15px, 4vw, 20px)',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '3px',
        textAlign: 'center',
    },
    form: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(15px, 4vw, 20px)',
    },
    inputGroup: {
        position: 'relative',
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
    },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '50px',
        backgroundColor: '#ffffff',
        outline: 'none',
        padding: 'clamp(12px, 3vw, 15px) 45px',
        fontSize: 'clamp(14px, 3.5vw, 16px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: '#ff8c00',
        },
        '&:focus': {
            borderColor: '#ff8c00',
            boxShadow: '0 4px 15px rgba(255, 140, 0, 0.1)',
        },
    },
    checkbox: {
        width: 'clamp(14px, 3.5vw, 16px)',
        height: 'clamp(14px, 3.5vw, 16px)',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    checkboxLabel: {
        fontSize: '14px',
        color: '#666',
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
    error: {
        color: '#dc3545',
        backgroundColor: '#ffe6e6',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '20px',
        textAlign: 'center',
        width: '100%',
    },
    success: {
        color: '#28a745',
        backgroundColor: '#e6ffe6',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '20px',
        textAlign: 'center',
        width: '100%',
    },
    links: {
        marginTop: '20px',
        textAlign: 'center',
    },
    loginText: {
        color: '#666',
        fontSize: '14px',
        margin: 0,
    },
    loginLink: {
        color: '#ff8c00',
        textDecoration: 'none',
        fontWeight: '600',
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
        fontSize: '20px',
        color: '#666',
    },
    errorMessage: {
        color: '#dc3545',
        fontSize: '12px',
        marginTop: '4px',
        paddingLeft: '15px',
    }
}

export default RegisterPage;