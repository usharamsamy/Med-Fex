import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, HeartPulse } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    <HeartPulse size={32} />
                    <span>MedFex</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ color: 'var(--text-light)' }}>Hello, <strong>{user.name}</strong> ({user.role})</span>
                    <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)', background: 'transparent' }}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
