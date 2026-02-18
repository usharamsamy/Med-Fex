import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'customer' });
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData.name, formData.email, formData.password, formData.role);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div style={{ maxWidth: '450px', margin: '3rem auto' }}>
            <div className="card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <UserPlus size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2>Join MedFex</h2>
                    <p style={{ color: 'var(--text-light)' }}>Register to manage medications easily</p>
                </div>

                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '0.4rem', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500' }}>Full Name</label>
                        <input
                            type="text" required
                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500' }}>Email Address</label>
                        <input
                            type="email" required
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500' }}>Password</label>
                        <input
                            type="password" required
                            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500' }}>I am a...</label>
                        <select
                            value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'white' }}
                        >
                            <option value="customer">Customer</option>
                            <option value="retailer">Retailer (Medical Shop)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }}>Register</button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-light)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
