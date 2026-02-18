import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Package, ClipboardList, Edit, Trash, Check, X, AlertCircle } from 'lucide-react';

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
        const { data } = await axios.get('/api/medicines', { headers: { Authorization: `Bearer ${user.token}` } });
        setMedicines(data);
    };

    const fetchRequests = async () => {
        const { data } = await axios.get('/api/requests/retailer', { headers: { Authorization: `Bearer ${user.token}` } });
        setRequests(data);
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (editingMedicine) {
            await axios.put(`/api/medicines/${editingMedicine._id}`, newMed, { headers: { Authorization: `Bearer ${user.token}` } });
        } else {
            await axios.post('/api/medicines', newMed, { headers: { Authorization: `Bearer ${user.token}` } });
        }
        setShowAddModal(false);
        setNewMed({ name: '', category: '', price: '', stock: '', description: '' });
        setEditingMedicine(null);
        fetchMedicines();
    };

    const deleteMedicine = async (id) => {
        if (window.confirm('Are you sure?')) {
            await axios.delete(`/api/medicines/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            fetchMedicines();
        }
    };

    const updateRequestStatus = async (id, status, politeMessage) => {
        await axios.put(`/api/requests/${id}/status`, { status, retailerMessage: politeMessage }, { headers: { Authorization: `Bearer ${user.token}` } });
        fetchRequests();
    };

    const politeAccept = "Your request has been accepted. We are preparing your medicine.";
    const politeReady = "Your medicines are ready for pickup! Visit us at your convenience.";
    const politeReject = "We apologize, but this medicine is currently out of stock. We will notify you once it arrives.";

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
            <div>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Inventory Management</h1>
                    <button className="btn-primary" onClick={() => { setShowAddModal(true); setEditingMedicine(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Package size={20} /> Add New Medicine
                    </button>
                </header>

                <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Medicine Name</th>
                                <th style={{ padding: '1rem' }}>Category</th>
                                <th style={{ padding: '1rem' }}>Stock</th>
                                <th style={{ padding: '1rem' }}>Price</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.map(m => (
                                <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{m.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{m.category}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ color: m.stock < 10 ? 'var(--accent)' : 'inherit', fontWeight: m.stock < 10 ? 'bold' : 'normal' }}>
                                            {m.stock}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>Rs. {m.price}</td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => { setEditingMedicine(m); setNewMed(m); setShowAddModal(true); }} style={{ padding: '0.4rem', background: '#f1f5f9' }}><Edit size={16} /></button>
                                        <button onClick={() => deleteMedicine(m._id)} style={{ padding: '0.4rem', background: '#fee2e2', color: '#991b1b' }}><Trash size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {medicines.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No items in inventory.</td></tr>}
                        </tbody>
                    </table>
                </section>
            </div>

            <aside>
                <div className="card" style={{ minHeight: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <ClipboardList size={20} color="var(--primary)" /> Customer Requests
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {requests.map(r => (
                            <div key={r._id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.6rem', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{r.type.toUpperCase()}</span>
                                    <span className={`status-badge status-${r.status.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '0.7rem' }}>{r.status}</span>
                                </div>
                                <h4 style={{ margin: '0.2rem 0' }}>{r.medicineName}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>From: {r.customer.name}</p>

                                {r.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button onClick={() => updateRequestStatus(r._id, 'Accepted', politeAccept)} className="btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>Accept</button>
                                        <button onClick={() => updateRequestStatus(r._id, 'Rejected', politeReject)} style={{ flex: 1, background: '#fee2e2', color: '#991b1b', fontSize: '0.8rem' }}>Reject</button>
                                    </div>
                                )}
                                {r.status === 'Accepted' && (
                                    <button onClick={() => updateRequestStatus(r._id, 'Ready for Pickup', politeReady)} className="btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', background: 'var(--secondary)' }}>Mark as Ready</button>
                                )}
                            </div>
                        ))}
                        {requests.length === 0 && <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No pending requests.</p>}
                    </div>
                </div>
            </aside>

            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
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
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#f1f5f9' }}>Cancel</button>
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
