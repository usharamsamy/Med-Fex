import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Edit2, AlertCircle, Package, TrendingUp, Bell, ClipboardList } from 'lucide-react';

const RetailerDashboard = () => {
    const { user } = useContext(AuthContext);
    const [medicines, setMedicines] = useState([]);
    const [requests, setRequests] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [newMed, setNewMed] = useState({ name: '', category: '', price: '', stock: '', description: '' });

    useEffect(() => {
        fetchMedicines();
        fetchRequests();
    }, []);

    const fetchMedicines = async () => {
        try {
            const { data } = await axios.get('/api/medicines', { headers: { Authorization: `Bearer ${user.token}` } });
            setMedicines(data);
        } catch (err) {
            console.error('Error fetching medicines:', err);
        }
    };

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get('/api/requests/retailer', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setRequests(data);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editingMedicine) {
                await axios.put(`/api/medicines/${editingMedicine._id}`, newMed, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            } else {
                await axios.post('/api/medicines', newMed, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            }
            setShowAddModal(false);
            setNewMed({ name: '', category: '', price: '', stock: '', description: '' });
            setEditingMedicine(null);
            fetchMedicines();
        } catch (err) {
            console.error('Error saving medicine:', err);
        }
    };

    const deleteMedicine = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await axios.delete(`/api/medicines/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
                fetchMedicines();
            } catch (err) {
                console.error('Error deleting medicine:', err);
            }
        }
    };

    const updateRequestStatus = async (id, status, politeMessage) => {
        try {
            await axios.put(`/api/requests/${id}/status`,
                { status, retailerMessage: politeMessage },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            fetchRequests();
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.message || 'Error updating status. Please try again.');
        }
    };

    const politeAccept = "Your request has been accepted. We are preparing your medicine.";
    const politeReady = "Your medicines are ready for pickup! Visit us at your convenience.";
    const politeReject = "We apologize, but this medicine is currently out of stock. We will notify you once it arrives.";

    return (
        <div style={{ padding: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Retailer Command Center</h1>
                    <p style={{ color: 'var(--text-light)' }}>Manage inventory and customer requests</p>
                </div>
                <button className="btn-primary" onClick={() => { setShowAddModal(true); setEditingMedicine(null); setNewMed({ name: '', category: '', price: '', stock: '', description: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={20} /> Add New Medicine
                </button>
            </header>

            {/* Alerts Section */}
            {medicines.some(m => m.stock < 10) && (
                <div className="card" style={{ borderLeft: '5px solid var(--danger)', marginBottom: '2rem', background: '#fff1f2' }}>
                    <h4 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AlertCircle size={20} /> Low Stock Alerts
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {medicines.filter(m => m.stock < 10).map(m => (
                            <div key={m._id} style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                                <strong>{m.name}</strong>: {m.stock} left
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package color="var(--primary)" /> Inventory Management
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {medicines.map(m => (
                                <div key={m._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{m.name}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '0.2rem 0' }}>{m.category} | Rs. {m.price}</p>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            color: m.stock < 10 ? 'var(--danger)' : 'var(--success)'
                                        }}>
                                            Stock: {m.stock}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => { setEditingMedicine(m); setNewMed(m); setShowAddModal(true); }} style={{ padding: '0.4rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                        <button onClick={() => deleteMedicine(m._id)} style={{ padding: '0.4rem', background: '#fff1f2', color: 'var(--danger)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {medicines.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>No items in inventory.</p>}
                        </div>
                    </section>

                    <section>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp color="var(--primary)" /> Demand Insights
                        </h3>
                        <div className="card">
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>Frequently requested medicines (all states)</p>
                            {/* Simple demand bars */}
                            {[...new Set(requests.map(r => r.medicineName))].slice(0, 5).map(name => {
                                const count = requests.filter(r => r.medicineName === name).length;
                                const max = Math.max(...[...new Set(requests.map(r => r.medicineName))].map(n => requests.filter(r => r.medicineName === n).length), 1);
                                return (
                                    <div key={name} style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '500' }}>{name}</span>
                                            <span style={{ color: 'var(--primary)' }}>{count} total requests</span>
                                        </div>
                                        <div style={{ height: '8px', width: '100%', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: 'var(--primary)', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {requests.length === 0 && <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No requests to analyze yet.</p>}
                        </div>
                    </section>
                </div>

                <aside>
                    <div className="card" style={{ position: 'sticky', top: '2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <ClipboardList size={22} color="var(--primary)" /> Customer Requests
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {requests.map(r => (
                                <div key={r._id} style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '0.8rem', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{r.type}</span>
                                        <span className={`status-badge status-${r.status.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '0.7rem' }}>{r.status}</span>
                                    </div>
                                    <h4 style={{ margin: '0 0 0.4rem 0' }}>{r.medicineName}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>
                                        From: <strong>{r.customer?.name}</strong><br />
                                        <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{r.customer?.email}</span>
                                    </p>

                                    {r.status === 'Pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => updateRequestStatus(r._id, 'Accepted', politeAccept)} className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}>Accept</button>
                                            <button onClick={() => updateRequestStatus(r._id, 'Rejected', politeReject)} style={{ flex: 1, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>Reject</button>
                                        </div>
                                    )}
                                    {r.status === 'Accepted' && (
                                        <button onClick={() => updateRequestStatus(r._id, 'Ready for Pickup', politeReady)} className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', background: 'var(--success)' }}>Mark as Ready</button>
                                    )}
                                    {r.status === 'Ready for Pickup' && (
                                        <button onClick={() => updateRequestStatus(r._id, 'Completed', "Thank you for visiting us!")} className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', background: 'var(--primary)' }}>Mark as Collected</button>
                                    )}
                                </div>
                            ))}
                            {requests.length === 0 && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1rem' }}>No pending requests.</p>}
                        </div>
                    </div>
                </aside>
            </div>

            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px', padding: '2rem' }}>
                        <h3>{editingMedicine ? 'Update Medicine' : 'Add New Medicine'}</h3>
                        <form onSubmit={handleCreateOrUpdate} style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Name</label>
                                    <input required value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Category</label>
                                    <input value={newMed.category} onChange={e => setNewMed({ ...newMed, category: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Price (Rs)</label>
                                    <input required type="number" value={newMed.price} onChange={e => setNewMed({ ...newMed, price: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Stock Qty</label>
                                    <input required type="number" value={newMed.stock} onChange={e => setNewMed({ ...newMed, stock: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem' }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Description</label>
                                <textarea value={newMed.description} onChange={e => setNewMed({ ...newMed, description: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem', height: '80px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingMedicine ? 'Update' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetailerDashboard;
