import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, HeartPulse, User, ShoppingBag, Bell, X, Check } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user && user.token) {
            fetchNotifications();
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await axios.delete('/api/notifications', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    const isDashboard = location.pathname === '/retailer' || location.pathname === '/customer';

    return (
        <nav style={{ 
            background: 'white', 
            borderBottom: '1px solid var(--border)', 
            padding: '0.75rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div className={user && ['retailer', 'customer'].includes(user.role) ? "" : "container"} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: user && ['retailer', 'customer'].includes(user.role) ? '0 2rem' : '0 1rem',
                maxWidth: user && ['retailer', 'customer'].includes(user.role) ? 'none' : '1200px',
                margin: '0 auto'
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', fontWeight: '800', fontSize: '1.5rem', textDecoration: 'none' }}>
                    <HeartPulse size={30} strokeWidth={2.5} />
                    <span>MedFex</span>
                </Link>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {user ? (
                        <>
                            {/* Notification Bell */}
                            <div style={{ position: 'relative' }}>
                                <button 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '0.5rem', position: 'relative' }}
                                >
                                    <Bell size={22} />
                                    {unreadCount > 0 && (
                                        <span style={{ 
                                            position: 'absolute', 
                                            top: '4px', 
                                            right: '4px', 
                                            background: 'var(--danger)', 
                                            color: 'white', 
                                            fontSize: '0.6rem', 
                                            fontWeight: 'bold', 
                                            width: '18px', 
                                            height: '18px', 
                                            borderRadius: '50%', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            border: '2px solid white'
                                        }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '100%', 
                                        right: 0, 
                                        width: '320px', 
                                        background: 'white', 
                                        borderRadius: 'var(--rounded-xl)', 
                                        boxShadow: 'var(--shadow-lg)', 
                                        border: '1px solid var(--border)', 
                                        marginTop: '0.5rem',
                                        maxHeight: '450px',
                                        overflow: 'auto',
                                        zIndex: 1001
                                    }}>
                                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifications</h4>
                                            {notifications.length > 0 && (
                                                <button onClick={clearAllNotifications} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Clear All</button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                                                    No new notifications
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div 
                                                        key={n._id} 
                                                        style={{ 
                                                            padding: '1rem', 
                                                            borderBottom: '1px solid var(--border)', 
                                                            background: n.isRead ? 'transparent' : '#f0fdfa',
                                                            display: 'flex',
                                                            gap: '0.75rem'
                                                        }}
                                                    >
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{n.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', lineHeight: '1.4' }}>{n.message}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                                        </div>
                                                        {!n.isRead && (
                                                            <button 
                                                                onClick={() => markAsRead(n._id)}
                                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.2rem' }}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)', background: '#f1f5f9', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem' }}>
                                {user.role === 'retailer' ? <ShoppingBag size={14} /> : <User size={14} />}
                                <span style={{ fontWeight: '700' }}>{user.name}</span>
                            </div>
                            
                            <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <LogOut size={16} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/login-role" style={{ textDecoration: 'none' }}>
                                <button className="btn-secondary" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.85rem', padding: '0.4rem 1.25rem' }}>Login</button>
                            </Link>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1.25rem' }}>Register</button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
