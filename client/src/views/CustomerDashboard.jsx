import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Bell, Search, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

const CustomerDashboard = () => {
    const { user } = useContext(AuthContext);
    const [prescriptions, setPrescriptions] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPrescription, setNewPrescription] = useState({ medicineName: '', dosage: '', refillDuration: '' });
    const [suggestions, setSuggestions] = useState([]);

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchPrescriptions();
        fetchRequests();
        fetchNotifications();
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            const { data } = await axios.get('/api/suggestions', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSuggestions(data);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        }
    };

    const fetchPrescriptions = async () => {
        const { data } = await axios.get('/api/prescriptions', { headers: { Authorization: `Bearer ${user.token}` } });
        setPrescriptions(data);
    };

    const fetchRequests = async () => {
        const { data } = await axios.get('/api/requests', { headers: { Authorization: `Bearer ${user.token}` } });
        setRequests(data);
    };

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setNotifications(data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const markNotificationAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const [prescriptionImage, setPrescriptionImage] = useState(null);

    const handleAddPrescription = async (e) => {
        e.preventDefault();
        try {
            // Validation
            if (!newPrescription.medicineName || !newPrescription.dosage || !newPrescription.refillDuration) {
                alert('Please fill in all fields');
                return;
            }

            const formData = new FormData();
            formData.append('medicineName', newPrescription.medicineName.toString());
            formData.append('dosage', newPrescription.dosage.toString());
            formData.append('refillDuration', newPrescription.refillDuration.toString());

            if (prescriptionImage) {
                formData.append('image', prescriptionImage);
            }

            await axios.post('/api/prescriptions', formData, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });

            setShowAddModal(false);
            setNewPrescription({ medicineName: '', dosage: '', refillDuration: '' });
            setPrescriptionImage(null);
            fetchPrescriptions();
            fetchNotifications();
        } catch (err) {
            console.error('Error adding prescription:', err.response?.data || err);
            const errMsg = err.response?.data?.message || 'Failed to add prescription.';
            const errDetail = err.response?.data?.error || '';
            alert(`${errMsg}\n${errDetail ? 'Detail: ' + errDetail : 'Check console for full error.'}`);
        }
    };

    // Helper for request timeline
    const RequestTimeline = ({ status }) => {
        const steps = ['Pending', 'Accepted', 'Ready for Pickup', 'Completed'];
        const currentIdx = steps.indexOf(status);

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', left: '0', height: '2px', width: '100%', background: '#e2e8f0', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: '10px', left: '0', height: '2px', width: `${(currentIdx / (steps.length - 1)) * 100}%`, background: 'var(--primary)', zIndex: 0, transition: 'width 0.3s ease' }}></div>
                {steps.map((step, idx) => (
                    <div key={step} style={{ zIndex: 1, textAlign: 'center' }}>
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: idx <= currentIdx ? 'var(--primary)' : 'white',
                            border: '2px solid ' + (idx <= currentIdx ? 'var(--primary)' : '#cbd5e1'),
                            margin: '0 auto 0.2rem'
                        }}></div>
                        <span style={{ fontSize: '0.65rem', color: idx <= currentIdx ? 'var(--text-dark)' : 'var(--text-light)', fontWeight: idx === currentIdx ? 'bold' : 'normal' }}>{step}</span>
                    </div>
                ))}
            </div>
        );
    };

    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) {
            alert('Please enter a medicine name to search');
            return;
        }

        setIsSearching(true);
        const query = searchTerm.trim();

        try {
            const { data } = await axios.get('/api/medicines/search', {
                params: { name: query },
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSearchResults(data);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
            alert('Search failed. Please ensure the server is running.');
        } finally {
            setIsSearching(false);
        }
    };

    const requestRefill = async (presc) => {
        try {
            await axios.post('/api/requests', {
                medicineName: presc.medicineName,
                type: 'refill',
                prescriptionId: presc._id
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            fetchRequests();
            alert('Your refill request has been sent successfully!');
        } catch (err) {
            alert('Failed to send request. Please try again.');
        }
    };

    const requestNewMedicine = async (name) => {
        try {
            await axios.post('/api/requests', {
                medicineName: name,
                type: 'new'
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            fetchRequests();
            alert(`We have received your request for ${name}. We will try our best to arrange it for you!`);
        } catch (err) {
            console.error('Request error:', err);
            alert(`Failed to send request: ${err.response?.data?.message || 'Please try again.'}`);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', position: 'relative' }}>
            <div>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1>My Health Dashboard</h1>
                        {/* Notification Bell */}
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifications(!showNotifications)}>
                            <Bell size={24} color={notifications.some(n => !n.isRead) ? 'var(--primary)' : '#64748b'} />
                            {notifications.some(n => !n.isRead) && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent)', color: 'white', fontSize: '0.65rem', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {notifications.filter(n => !n.isRead).length}
                                </span>
                            )}

                            {showNotifications && (
                                <div className="card" style={{ position: 'absolute', top: '35px', right: '0', width: '300px', zIndex: 1001, maxHeight: '400px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #efefef', paddingBottom: '0.5rem' }}>Notifications</h4>
                                    {notifications.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>No notifications</p>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n._id} onClick={(e) => { e.stopPropagation(); markNotificationAsRead(n._id); }} style={{ padding: '0.8rem 0', borderBottom: '1px solid #f1f5f9', opacity: n.isRead ? 0.6 : 1, cursor: 'pointer' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: `var(--${n.type})` }}>{n.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#444' }}>{n.message}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.2rem' }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Plus size={20} /> Add Prescription
                    </button>
                </header>

                <section style={{ marginBottom: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock color="var(--primary)" /> Regular Refills
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {prescriptions.map(p => (
                            <div key={p._id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: 'var(--primary)' }}></div>
                                <h4>{p.medicineName}</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0.5rem 0' }}>Dosage: {p.dosage}</p>
                                <div style={{ margin: '1rem 0', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.4rem' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Next Refill Date:</p>
                                    <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{new Date(p.nextRefillDate).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => requestRefill(p)}
                                    className="btn-primary"
                                    style={{ width: '100%', fontSize: '0.9rem' }}
                                    disabled={requests.some(r => r.prescriptionId === p._id && r.status === 'Pending')}
                                >
                                    Request Refill
                                </button>
                            </div>
                        ))}
                        {prescriptions.length === 0 && <p style={{ color: 'var(--text-light)' }}>No prescriptions added yet.</p>}
                    </div>
                </section>

                <section>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Search color="var(--primary)" /> Check Availability
                    </h3>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Search medicine name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}
                            />
                            <button type="submit" className="btn-primary" disabled={isSearching}>
                                {isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </form>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {searchResults.map(m => (
                            <div key={m._id} className="card" style={{ border: m.stock > 0 ? '1px solid var(--success)' : '1px solid var(--border)' }}>
                                <h4>{m.name}</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{m.category}</p>
                                <div style={{ marginTop: '1rem' }}>
                                    {m.stock > 0 ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Available in stock</span>
                                            <span style={{ fontSize: '0.9rem' }}>Qty: {m.stock}</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>Currently unavailable. You can request arrangement.</p>
                                            <button
                                                onClick={() => requestNewMedicine(m.name)}
                                                className="btn-secondary"
                                                style={{ width: '100%', fontSize: '0.8rem' }}
                                            >
                                                Request Medicine
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {searchTerm && searchResults.length === 0 && (
                            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: 'var(--text-light)' }}>We couldn't find "{searchTerm}" in our current list.</p>
                                <p style={{ margin: '0.5rem 0' }}>Would you like us to arrange it for you?</p>
                                <button
                                    onClick={() => requestNewMedicine(searchTerm)}
                                    className="btn-primary"
                                    style={{ marginTop: '1rem' }}
                                >
                                    Send Arrangement Request
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <aside>
                <div className="card" style={{ minHeight: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Bell size={20} color="var(--primary)" /> My Requests
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {requests.map(r => (
                            <div key={r._id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <h5 style={{ margin: 0 }}>{r.medicineName}</h5>
                                    <span className={`status-badge status-${r.status.toLowerCase().replace(/ /g, '-')}`}>{r.status}</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Type: {r.type}</p>

                                {/* Timeline Enhancement */}
                                <RequestTimeline status={r.status} />

                                {r.retailerMessage && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.4rem', fontSize: '0.8rem', borderLeft: '3px solid var(--primary)' }}>
                                        <strong>Note:</strong> {r.retailerMessage}
                                    </div>
                                )}
                            </div>
                        ))}
                        {requests.length === 0 && <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No recent requests.</p>}
                    </div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '2rem' }}>
                        <Clock size={20} color="var(--primary)" /> Suggested for You
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {suggestions.map(s => (
                            <div key={s._id} className="card" style={{ padding: '0.8rem', border: '1px dashed var(--primary)' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{s.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{s.category}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Rs. {s.price}</span>
                                    <button onClick={() => { setSearchTerm(s.name); handleSearch(); }} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>View</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3>Add New Prescription</h3>
                        <form onSubmit={handleAddPrescription} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Medicine Name</label>
                                <input required type="text" value={newPrescription.medicineName} onChange={e => setNewPrescription({ ...newPrescription, medicineName: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Dosage (e.g., 1-0-1)</label>
                                <input required type="text" value={newPrescription.dosage} onChange={e => setNewPrescription({ ...newPrescription, dosage: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Refill Every (Days)</label>
                                <input required type="number" value={newPrescription.refillDuration} onChange={e => setNewPrescription({ ...newPrescription, refillDuration: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Upload Prescription (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setPrescriptionImage(e.target.files[0])}
                                    style={{ width: '100%', fontSize: '0.8rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#f1f5f9' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
