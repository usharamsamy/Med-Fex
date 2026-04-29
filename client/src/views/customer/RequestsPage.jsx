import React from 'react';
import { Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

const RequestTimeline = ({ status, rejectReason, pharmacistNote }) => {
    const steps = ['Pending', 'Accepted', 'Ready for Pickup', 'Completed'];
    const currentIdx = steps.indexOf(status);

    if (status === 'Rejected') {
        return (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fee2e2' }}>
                    <XCircle size={18} /> <div><strong>Rejected:</strong> {rejectReason || 'No reason provided'}</div>
                </div>
                {pharmacistNote && (
                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', color: '#64748b', fontSize: '0.85rem', borderLeft: '3px solid #cbd5e1' }}>
                        <strong>Pharmacist Note:</strong> {pharmacistNote}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', left: '0', height: '2px', width: '100%', background: '#e2e8f0', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', top: '10px', left: '0', height: '2px', width: `${(currentIdx / (steps.length - 1)) * 100}%`, background: 'var(--primary)', zIndex: 0, transition: 'width 0.3s ease' }}></div>
            {steps.map((step, idx) => (
                <div key={step} style={{ zIndex: 1, textAlign: 'center' }}>
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: idx <= currentIdx ? 'var(--primary)' : 'white',
                        border: '2px solid ' + (idx <= currentIdx ? 'var(--primary)' : '#cbd5e1'),
                        margin: '0 auto 0.4rem',
                        boxShadow: idx === currentIdx ? '0 0 0 4px #ccfbf1' : 'none'
                    }}></div>
                    <span style={{ fontSize: '0.65rem', color: idx <= currentIdx ? 'var(--text-dark)' : 'var(--text-light)', fontWeight: idx === currentIdx ? 'bold' : 'normal' }}>{step}</span>
                </div>
            ))}
        </div>
    );
};

const RequestsPage = ({ requests, handleReRequest }) => {
    // Filter out completed requests for this page, or show all? 
    // User asked for "Order History" separately, so maybe only active ones here?
    // Actually, user said "Requests Page should show medicine requests... status tracking".
    // I'll show all and maybe separate them.
    const activeRequests = requests.filter(r => r.status !== 'Completed');

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Request Status</h1>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {activeRequests.map(r => (
                    <div key={r._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0 }}>{r.medicineName}</h3>
                                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{r.type}</span>
                                    {(r.isUrgent || r.isEmergency) && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#fee2e2', color: '#ef4444', fontWeight: 'bold' }}>EMERGENCY</span>}
                                </div>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    Requested on {new Date(r.createdAt).toLocaleDateString()}
                                    {r.totalTablets > 0 && ` • Qty: ${r.totalTablets}`}
                                </p>
                            </div>
                            <span className={`status-badge status-${r.status.toLowerCase().replace(/ /g, '-')}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                {r.status}
                            </span>
                        </div>

                        <RequestTimeline status={r.status} rejectReason={r.rejectReason} pharmacistNote={r.pharmacistNote} />

                        {r.retailerMessage && !r.pharmacistNote && (
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid var(--primary)', fontSize: '0.9rem' }}>
                                <strong>Message:</strong> {r.retailerMessage}
                            </div>
                        )}

                        {r.status === 'Rejected' && r.notified && (
                            <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
                                <p style={{ margin: '0 0 0.75rem 0', color: '#166534', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <strong>Back in stock!</strong> This medicine was previously out of stock but is now available.
                                </p>
                                <button
                                    onClick={() => handleReRequest(r._id)}
                                    className="btn-primary"
                                    style={{ background: '#22c55e', border: 'none', width: '100%', fontSize: '0.9rem' }}
                                >
                                    Resubmit Request Now
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {activeRequests.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ background: '#f1f5f9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#64748b' }}>
                            <Clock size={30} />
                        </div>
                        <h3 style={{ color: 'var(--text)' }}>No Active Requests</h3>
                        <p style={{ color: 'var(--text-light)' }}>When you request a refill or search for new medicine, it will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestsPage;
