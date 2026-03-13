import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, ArrowRight } from 'lucide-react';

const RoleSelection = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '6rem auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Login to MedFex</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Please select your account type to continue.</p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem' 
            }}>
                <RoleCard 
                    to="/login"
                    role="customer"
                    title="Customer"
                    description="Order medicines, manage prescriptions, and get refill alerts."
                    icon={<User size={48} />}
                />
                <RoleCard 
                    to="/login"
                    role="retailer"
                    title="Retailer"
                    description="Manage inventory, fulfill requests, and track shop performance."
                    icon={<ShoppingBag size={48} />}
                />
            </div>

            <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-light)' }}>
                Don't have an account yet? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Register here</Link>
            </p>
        </div>
    );
};

const RoleCard = ({ to, role, title, description, icon }) => (
    <Link to={to} style={{ textDecoration: 'none' }}>
        <div style={{ 
            padding: '2.5rem', 
            borderRadius: '1rem', 
            background: 'white', 
            border: '2px solid var(--border)',
            transition: 'all 0.3s',
            textAlign: 'center',
            height: '100%'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(15, 118, 110, 0.1)';
            e.currentTarget.style.transform = 'translateY(-5px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
            <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: '#eff6ff', 
                color: 'var(--primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>Login as {title}</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '2rem', lineHeight: '1.6' }}>{description}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                Go to Login <ArrowRight size={18} />
            </div>
        </div>
    </Link>
);

export default RoleSelection;
