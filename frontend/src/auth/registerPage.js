import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contactNumber: '',
        password: '',
        role: 'Customer'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
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
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/auth/register', formData);
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
                <h2 style={styles.title}>Register for BuFood</h2>
                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="name" style={styles.label}>Name:</label>
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
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.label}>Email:</label>
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
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="contactNumber" style={styles.label}>Contact Number:</label>
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
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="password" style={styles.label}>Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            style={styles.input}
                            disabled={loading}
                            autoComplete="new-password"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="role" style={styles.label}>Role:</label>
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

                    <button 
                        type="submit" 
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div style={styles.links}>
                    <a href="/login" style={styles.link}>Already have an account? Login</a>
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
        backgroundColor: '#ffffff',
        borderRadius: 'clamp(12px, 3vw, 20px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        margin: '0 auto',
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
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: 'clamp(12px, 3vw, 14px)',
        color: '#666',
        fontWeight: '500',
    },
    input: {
        width: '100%',
        padding: 'clamp(12px, 3vw, 15px) 16px',
        fontSize: 'clamp(14px, 3.5vw, 16px)',
        border: '1px solid #ddd',
        borderRadius: '50px',
        backgroundColor: 'rgba(53, 6, 6, 0.26)',
        transition: 'all 0.2s ease',
        outline: 'none',
        boxSizing: 'border-box',
        '&:focus': {
            borderColor: '#ff8c00',
            boxShadow: '0 0 0 2px rgba(255, 140, 0, 0.1)',
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
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: 'clamp(15px, 4vw, 20px)',
        boxShadow: '0 4px 15px rgba(36, 34, 33, 0.4)',
        '&:hover': {
            backgroundColor: '#e67e00',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(109, 71, 24, 0.4)',
        },
        '&:active': {
            transform: 'translateY(0)',
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
        marginTop: 'clamp(20px, 5vw, 30px)',
        textAlign: 'center',
    },
    link: {
        padding: 'clamp(8px, 2vw, 10px) clamp(20px, 5vw, 25px)',
        backgroundColor: '#fff',
        color: '#ff8c00',
        border: '2px solid #ff8c00',
        borderRadius: '50px',
        fontSize: 'clamp(12px, 3vw, 14px)',
        fontWeight: '600',
        textDecoration: 'none',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(36, 34, 33, 0.1)',
        display: 'inline-block',
        '&:hover': {
            backgroundColor: '#fff8f0',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(255, 140, 0, 0.2)',
        }
    }
}

export default RegisterPage;