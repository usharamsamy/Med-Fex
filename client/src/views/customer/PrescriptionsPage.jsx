import React from 'react';
import { Plus, Trash2, Clock, FileText, Image as ImageIcon } from 'lucide-react';

const PrescriptionsPage = ({ prescriptions, setShowAddModal, requestRefill, deletePrescription }) => {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">My Prescriptions</h1>
                <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> Add New
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {prescriptions.map(p => (
                    <div key={p._id} className="card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: 'var(--primary)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{p.medicineName}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Dosage: {p.dosage}</p>
                            </div>
                            <button 
                                onClick={() => { if(window.confirm('Delete this prescription?')) deletePrescription(p._id) }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {p.prescriptionImage && (
                            <div style={{ margin: '1rem 0', borderRadius: '0.5rem', overflow: 'hidden', height: '120px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={p.prescriptionImage} alt="Prescription" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}

                        <div style={{ margin: '1rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                <Clock size={14} /> Next Refill
                            </div>
                            <div style={{ fontWeight: '700', color: 'var(--primary)' }}>
                                {new Date(p.nextRefillDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                Refill frequency: every {p.refillDays} days
                            </div>
                        </div>

                        <button
                            onClick={() => requestRefill(p)}
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '0.9rem' }}
                        >
                            Request Refill
                        </button>
                    </div>
                ))}

                {prescriptions.length === 0 && (
                    <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ background: '#f1f5f9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#64748b' }}>
                            <FileText size={30} />
                        </div>
                        <h3 style={{ color: 'var(--text)' }}>No Prescriptions Found</h3>
                        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Upload your first prescription to start receiving refill reminders.</p>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>Add Your First Prescription</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrescriptionsPage;
