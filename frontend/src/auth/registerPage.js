import React, { useState } from 'react';
import axios from 'axios';
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

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Remove confirmPassword and create dataToSend in one step
            const { confirmPassword: _, ...dataToSend } = formData;
            const response = await axios.post('http://localhost:8000/api/auth/register', dataToSend);

            if (response.data.accessToken && response.data.refreshToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            setSuccess(response.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <img src={logod} alt="BuFood Logo" style={styles.logo} />
                <h2 style={styles.title}>SIGN UP</h2>
                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}
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
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
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
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <div style={styles.inputWrapper}>
                            <span style={styles.inputIcon}><FiLock /></span>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '15px',
        boxSizing: 'border-box',
    },
    formContainer: {
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
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '30px',
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
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '50px',
        backgroundColor: '#ffffff',
        outline: 'none',
        boxSizing: 'border-box',
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
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0',
        fontSize: '20px',
        color: '#666',
    }
}

export default RegisterPage;