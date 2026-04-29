import React, { useState, useContext, useEffect } from 'react';
import { User, Mail, Phone, Lock, Tag, Heart, MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {
    const { user, setUser } = useContext(AuthContext);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        allergies: '',
        chronicConditions: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await axios.get('/api/auth/profile', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setProfile({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    location: data.location || '',
                    allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : '',
                    chronicConditions: Array.isArray(data.chronicConditions) ? data.chronicConditions.join(', ') : ''
                });
            } catch (err) {
                setMessage({ type: 'danger', text: 'Unable to load profile data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user.token]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            // Explicitly including userId in payload as per checklist (FE: userId, BE: id)
            const updateData = {
                ...profile,
                userId: user._id, 
                id: user._id 
            };

            const { data } = await axios.put('/api/auth/profile', updateData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const updatedUserData = { ...user, ...data };
            setUser(updatedUserData);
            localStorage.setItem('userInfo', JSON.stringify(updatedUserData));
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            console.error('Frontend Profile Update Error:', err);
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Unable to update profile. Please try again.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Profile & Settings</h1>
            </div>

            {message.text && (
                <div className={`status-badge status-${message.type}`} style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'center', padding: '1rem' }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} color="var(--primary)" /> Personal Information
                    </h3>
                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem', color: '#64748b' }}>FULL NAME</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                    type="text" 
                                    value={profile.name} 
                                    onChange={e => setProfile({...profile, name: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} 
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem', color: '#64748b' }}>EMAIL ADDRESS</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                    type="email" 
                                    value={profile.email} 
                                    disabled
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: '#f8fafc', cursor: 'not-allowed' }} 
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem', color: '#64748b' }}>CONTACT NUMBER</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                    type="text" 
                                    placeholder="+91 98765 43210"
                                    value={profile.phone} 
                                    onChange={e => setProfile({...profile, phone: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} 
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem', color: '#64748b' }}>LOCATION / CITY</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                    type="text" 
                                    value={profile.location} 
                                    onChange={e => setProfile({...profile, location: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} 
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Profile'}
                        </button>
                    </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Heart size={20} color="#ef4444" /> Medical Profile
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', marginBottom: '0.25rem' }}>ALLERGIES (Comma separated)</label>
                                <textarea 
                                    value={profile.allergies}
                                    onChange={e => setProfile({...profile, allergies: e.target.value})}
                                    placeholder="e.g. Peanuts, Penicillin"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem', minHeight: '80px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', marginBottom: '0.25rem' }}>CHRONIC CONDITIONS</label>
                                <textarea 
                                    value={profile.chronicConditions}
                                    onChange={e => setProfile({...profile, chronicConditions: e.target.value})}
                                    placeholder="e.g. Diabetes, Hypertension"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem', minHeight: '80px' }}
                                />
                            </div>
                            <button onClick={handleUpdate} className="btn-secondary" style={{ width: '100%', color: '#ef4444', borderColor: '#fee2e2' }}>Save Medical Record</button>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={20} color="var(--primary)" /> Privacy & Security
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>Manage your account password and security preferences.</p>
                        <button className="btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>Change Account Password</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
