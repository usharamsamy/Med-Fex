import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, HeartPulse, User, ShoppingBag } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <nav style={{ 
            background: 'white', 
            borderBottom: '1px solid var(--border)', 
            padding: '1rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', fontWeight: '800', fontSize: '1.6rem', textDecoration: 'none' }}>
                    <HeartPulse size={34} strokeWidth={2.5} />
                    <span>MedFex</span>
                </Link>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {user ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text)', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.9rem' }}>
                                {user.role === 'retailer' ? <ShoppingBag size={16} /> : <User size={16} />}
                                <span style={{ fontWeight: '600' }}>{user.name}</span>
                            </div>
                            <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)', background: 'transparent', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                                <LogOut size={18} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/login-role" style={{ textDecoration: 'none' }}>
                                <button className="btn-secondary" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.9rem' }}>Login</button>
                            </Link>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <button className="btn-primary" style={{ fontSize: '0.9rem' }}>Register</button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
