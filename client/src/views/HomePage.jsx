import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Zap, Package, ChevronRight, HeartPulse } from 'lucide-react';
import pharmacyImg from '../assets/pharmacy.jpg';

const FeatureCard = ({ icon, title, description }) => (
    <div 
        className="card"
        style={{ 
            padding: '2.5rem', 
            transition: 'transform 0.3s',
            cursor: 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '1rem',
            height: '100%'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <div style={{ marginBottom: '0.5rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', margin: 0 }}>{title}</h3>
        <p style={{ color: 'var(--text-light)', lineHeight: '1.6', fontSize: '0.95rem', margin: 0 }}>{description}</p>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', paddingTop: '1rem' }}>
            Learn more <ChevronRight size={16} />
        </div>
    </div>
);

const HomePage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Safety: ensure background image path is a string
    const bgImage = typeof pharmacyImg === 'string' ? pharmacyImg : (pharmacyImg?.default || pharmacyImg);

    return (
        <div className="homepage-wrapper">
            {/* Hero Section */}
            <section style={{ 
                height: '85vh',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                {/* Background Image with Overlay */}
                <div 
                    className="animate-zoom"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(rgba(15, 118, 110, 0.8), rgba(15, 118, 110, 0.4)), url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: -1
                    }} 
                />
                
                <div className="container" style={{ zIndex: 1 }}>
                    <h1 style={{ 
                        fontSize: '3.5rem', 
                        fontWeight: '800', 
                        marginBottom: '1rem',
                        textShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        letterSpacing: '-1px'
                    }}>
                        MedFex – Smart Medical Shop System
                    </h1>
                    <p style={{ 
                        fontSize: '1.25rem', 
                        maxWidth: '700px', 
                        margin: '0 auto 2.5rem',
                        opacity: 0.95,
                        lineHeight: 1.6
                    }}>
                        Streamline your prescriptions, track medicine availability, and automate refills with our professional healthcare management solution.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <Link to="/login-role" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ 
                                padding: '1rem 2.5rem', 
                                fontSize: '1.1rem', 
                                background: 'white', 
                                color: 'var(--primary)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}>
                                Get Started
                            </button>
                        </Link>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <button className="btn-secondary" style={{ 
                                padding: '1rem 2.5rem', 
                                fontSize: '1.1rem',
                                border: '2px solid white',
                                color: 'white',
                                background: 'transparent'
                            }}>
                                Join Us
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '6rem 0', background: 'white' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '1rem' }}>Everything you need in one place</h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Designed for pharmacies and customers who value efficiency and care.</p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '2.5rem' 
                    }}>
                        <FeatureCard 
                            icon={<ClipboardCheck size={40} color="var(--primary)" />}
                            title="Prescription Management"
                            description="Easily upload and store prescriptions. Access your medical history whenever you need it."
                        />
                        <FeatureCard 
                            icon={<Zap size={40} color="var(--primary)" />}
                            title="Smart Refill Automation"
                            description="Never run out of meds. Get smart reminders 5 days before your refill is due."
                        />
                        <FeatureCard 
                            icon={<Package size={40} color="var(--primary)" />}
                            title="Inventory Control"
                            description="Retailers can track stock levels accurately in tablets and units with real-time updates."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '4rem 0', background: 'var(--primary)', color: 'white', textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Ready to simplify your medicine management?</h2>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <button style={{ background: 'white', color: 'var(--primary)', padding: '0.8rem 2rem' }}>
                            Register for Free
                        </button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '3rem 0', background: '#f8fafc', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
                        <HeartPulse size={24} />
                        <span>MedFex</span>
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        MedFex © 2026<br /> 
                        Smart Medical Shop Management System. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
