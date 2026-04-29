import React, { useState, useEffect, useContext } from 'react';
import { Heart, Plus, Trash2, Calendar, Activity, AlertCircle, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const HealthRecordsPage = () => {
    const { user } = useContext(AuthContext);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRecord, setNewRecord] = useState({ type: 'Vital', metric: 'Weight', value: '', notes: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const { data } = await axios.get('/api/health-records', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setRecords(data);
        } catch (err) {
            console.error('Error fetching health records:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRecord = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/health-records', newRecord, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setShowAddModal(false);
            setNewRecord({ type: 'Vital', metric: 'Weight', value: '', notes: '', date: new Date().toISOString().split('T')[0] });
            fetchRecords();
        } catch (err) {
            alert('Failed to add record');
        }
    };

    const deleteRecord = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await axios.delete(`/api/health-records/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchRecords();
        } catch (err) {
            alert('Failed to delete record');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Vital': return <Activity size={20} className="text-primary" />;
            case 'Condition': return <AlertCircle size={20} className="text-danger" style={{color: '#ef4444'}} />;
            case 'Allergy': return <Heart size={20} className="text-warning" style={{color: '#f59e0b'}} />;
            default: return <FileText size={20} />;
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Personal Health Records</h1>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={20} /> Add Record
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {records.map(record => (
                        <div key={record._id} className="card" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '0.75rem' }}>
                                        {getIcon(record.type)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{record.type}</div>
                                        <div style={{ fontWeight: '700' }}>{record.metric}</div>
                                    </div>
                                </div>
                                <button onClick={() => deleteRecord(record._id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--primary)' }}>
                                {record.value}
                            </div>
                            
                            {record.notes && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0.5rem 0' }}>{record.notes}</p>
                            )}
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
                                <Calendar size={14} /> {new Date(record.date).toLocaleDateString()}
                            </div>
                        </div>
                    ))}

                    {records.length === 0 && (
                        <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
                            <Heart size={48} color="#e2e8f0" style={{ marginBottom: '1.5rem' }} />
                            <h3>No Health Records Yet</h3>
                            <p style={{ color: 'var(--text-light)' }}>Start tracking your vitals and medical history today.</p>
                            <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => setShowAddModal(true)}>Add Your First Record</button>
                        </div>
                    ) }
                </div>
            )}

            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px', padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Add New Health Record</h3>
                        <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>RECORD TYPE</label>
                                <select 
                                    className="inventory-input" 
                                    value={newRecord.type} 
                                    onChange={e => setNewRecord({...newRecord, type: e.target.value, metric: e.target.value === 'Vital' ? 'Weight' : (e.target.value === 'Allergy' ? 'Medication' : 'General Condition')})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                >
                                    <option value="Vital">Vital Sign (Weight, BP, etc.)</option>
                                    <option value="Condition">Chronic Condition</option>
                                    <option value="Allergy">Allergy</option>
                                    <option value="Note">Medical Note</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>METRIC / NAME</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newRecord.metric} 
                                    onChange={e => setNewRecord({...newRecord, metric: e.target.value})}
                                    placeholder="e.g. Blood Pressure, Heart Rate"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>VALUE</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newRecord.value} 
                                    onChange={e => setNewRecord({...newRecord, value: e.target.value})}
                                    placeholder="e.g. 120/80, 75kg"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>DATE</label>
                                <input 
                                    type="date" 
                                    value={newRecord.date} 
                                    onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>NOTES (OPTIONAL)</label>
                                <textarea 
                                    value={newRecord.notes} 
                                    onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', minHeight: '80px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthRecordsPage;
