import React, { useContext } from 'react';
import { Clock, CheckCircle, FileText, AlertCircle, TrendingUp, Bell, ChevronRight, Activity, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const DashboardOverview = ({ prescriptions, requests, suggestions }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const activePrescriptions = prescriptions.length;
    
    // Find upcoming refills
    const upcomingRefillsList = prescriptions.filter(p => {
        const diff = new Date(p.nextRefillDate) - new Date();
        return diff > 0 && diff < (7 * 24 * 60 * 60 * 1000); // 7 days
    });
    const upcomingRefills = upcomingRefillsList.length;
    const pendingRequests = requests.filter(r => r.status === 'Pending').length;
    const completedOrders = requests.filter(r => r.status === 'Completed').length;

    const nextRefill = prescriptions.length > 0 
        ? [...prescriptions].sort((a, b) => new Date(a.nextRefillDate) - new Date(b.nextRefillDate))[0]
        : null;
        
    let nextRefillDays = null;
    if (nextRefill) {
        const diff = new Date(nextRefill.nextRefillDate) - new Date();
        nextRefillDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return (
        <div>
            {/* Professional Welcome Banner */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                color: 'white',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background circle */}
                <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                    </h1>
                    <p style={{ fontSize: '1.1rem', margin: '0 0 2rem 0', opacity: 0.9 }}>
                        Here is your health overview and active medication status.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)' }}>
                            <Clock size={20} />
                            <span style={{ fontWeight: '600' }}>
                                {nextRefillDays !== null ? `Your next refill is in ${nextRefillDays} days` : 'No upcoming refills scheduled'}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)' }}>
                            <Package size={20} />
                            <span style={{ fontWeight: '600' }}>{upcomingRefills} medicines available for refill</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)' }}>
                            <AlertCircle size={20} />
                            <span style={{ fontWeight: '600' }}>New health offers available</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '1rem', color: '#3b82f6' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Active Prescriptions</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{activePrescriptions}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '1rem', color: '#f59e0b' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Upcoming Refills</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{upcomingRefills}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '1rem', color: '#10b981' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Completed Orders</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{completedOrders}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '1rem', color: '#ef4444' }}>
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Pending Requests</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{pendingRequests}</div>
                    </div>
                </div>
            </div>

            <section className="card">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} color="var(--primary)" /> Refill Prediction
                </h3>
                {nextRefill ? (() => {
                    const today = new Date();
                    const nextDate = new Date(nextRefill.nextRefillDate);
                    const diffTime = nextDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const totalDays = nextRefill.refillDays || 30;
                    const progress = Math.max(0, Math.min(100, ((totalDays - diffDays) / totalDays) * 100));

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: 'var(--text)' }}>{nextRefill.medicineName}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Dosage: {nextRefill.dosage}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Estimated Stock Empty In</div>
                                    <div style={{ fontWeight: '800', color: diffDays <= 3 ? '#ef4444' : 'var(--primary)', fontSize: '1.5rem' }}>
                                        {diffDays > 0 ? `${diffDays} Days` : 'Due Now'}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    <span>Usage Frequency: Every {totalDays} days</span>
                                    <span>{Math.round(progress)}% Consumed</span>
                                </div>
                                <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${progress}%`, 
                                        background: progress > 90 ? '#ef4444' : (progress > 70 ? '#f59e0b' : 'var(--primary)'),
                                        transition: 'width 1s ease-in-out'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })() : (
                    <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>No upcoming refills scheduled.</p>
                )}
            </section>

            <section className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={20} color="var(--primary)" /> Suggested Medicines
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {(suggestions || []).slice(0, 3).map((s, i) => (
                        <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: '700' }}>{s.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{s.category}</div>
                            </div>
                            <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => navigate(`/customer/search?q=${encodeURIComponent(s.name)}`)}
                            >
                                View
                            </button>
                        </div>
                    ))}
                    {(!suggestions || suggestions.length === 0) && (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-light)', padding: '1rem' }}>No items suggested yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default DashboardOverview;
