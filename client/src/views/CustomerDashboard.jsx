import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    LayoutDashboard, 
    FileText, 
    MessageSquare, 
    Search, 
    History, 
    Bell, 
    Settings,
    Plus,
    X,
    Loader2,
    Image as ImageIcon,
    Heart
} from 'lucide-react';

// Sub-page components
import DashboardOverview from './customer/DashboardOverview';
import PrescriptionsPage from './customer/PrescriptionsPage';
import RequestsPage from './customer/RequestsPage';
import MedicineSearchPage from './customer/MedicineSearchPage';
import OrderHistoryPage from './customer/OrderHistoryPage';
import NotificationsPage from './customer/NotificationsPage';
import ProfilePage from './customer/ProfilePage';
import HealthRecordsPage from './customer/HealthRecordsPage';

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
    const [prescriptionImage, setPrescriptionImage] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchData = () => {
        fetchPrescriptions();
        fetchRequests();
        fetchNotifications();
        fetchSuggestions();
        fetchCategories();
    };

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/categories');
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

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
        try {
            const { data } = await axios.get('/api/prescriptions', { headers: { Authorization: `Bearer ${user.token}` } });
            setPrescriptions(data);
        } catch (err) {
            console.error('Prescriptions fetch error:', err);
        }
    };

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get('/api/requests', { headers: { Authorization: `Bearer ${user.token}` } });
            setRequests(data);
        } catch (err) {
            console.error('Requests fetch error:', err);
        }
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

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPrescriptionImage(file);

        setIsScanning(true);
        try {
            const result = await Tesseract.recognize(file, 'eng');
            const text = result.data.text;
            
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
            let extractedName = '';
            for (let line of lines) {
                if (line.toLowerCase().includes('tab') || line.toLowerCase().includes('cap') || line.toLowerCase().includes('syr') || line.toLowerCase().includes('inj')) {
                    extractedName = line;
                    break;
                }
            }
            if (!extractedName && lines.length > 0) {
                extractedName = lines[0];
            }

            if (extractedName && !newPrescription.medicineName) {
                setNewPrescription(prev => ({ ...prev, medicineName: extractedName.substring(0, 40) }));
            }
        } catch (err) {
            console.error('OCR Error:', err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleAddPrescription = async (e) => {
        e.preventDefault();
        try {
            if (!newPrescription.medicineName || !newPrescription.dosage || !newPrescription.refillDuration || !prescriptionImage) {
                alert('Please fill in all fields (including prescription image)');
                return;
            }

            const formData = new FormData();
            formData.append('medicineName', newPrescription.medicineName);
            formData.append('dosage', newPrescription.dosage);
            formData.append('refillDays', newPrescription.refillDuration);
            if (newPrescription.isEmergency) {
                formData.append('isEmergency', 'true');
            }

            if (prescriptionImage) {
                formData.append('image', prescriptionImage);
            }

            await axios.post('/api/prescriptions', formData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setShowAddModal(false);
            setNewPrescription({ medicineName: '', dosage: '', refillDuration: '' });
            setPrescriptionImage(null);
            fetchPrescriptions();
            fetchNotifications();
        } catch (err) {
            console.error('Error adding prescription:', err.response?.data || err);
            alert('Failed to add prescription.');
        }
    };

    const deletePrescription = async (id) => {
        try {
            await axios.delete(`/api/prescriptions/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchPrescriptions();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const { data } = await axios.get('/api/medicines/search', {
                params: { name: searchTerm.trim() },
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSearchResults(data);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const requestRefill = async (presc, isEmergency = false) => {
        if (!presc || !presc._id) {
            alert('Invalid prescription selected.');
            return;
        }

        try {
            await axios.post('/api/requests', {
                medicineName: presc.medicineName,
                type: 'refill',
                prescriptionId: presc._id,
                dosage: presc.dosage,
                refillDays: presc.refillDays,
                isEmergency: isEmergency
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            
            await fetchRequests();
            alert(isEmergency ? '🚨 URGENT refill request submitted successfully!' : '✅ Refill request submitted successfully!');
            // Redirect to requests page optionally or just let stay?
            // User says "Stay on same page, Update UI instantly"
        } catch (err) {
            console.error('Refill Error:', err);
            alert(err.response?.data?.message || 'Failed to send request. Please try again.');
        }
    };

    const requestNewMedicine = async (name, isEmergency = false) => {
        try {
            await axios.post('/api/requests', {
                medicineName: name,
                type: 'new',
                isEmergency: isEmergency
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            fetchRequests();
            alert(isEmergency ? `URGENT request for ${name} received!` : `Request for ${name} received!`);
        } catch (err) {
            alert('Failed to send request.');
        }
    };

    const handleReRequest = async (requestId) => {
        try {
            await axios.post(`/api/requests/re-request/${requestId}`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Re-request submitted!');
            fetchRequests();
            fetchNotifications();
        } catch (err) {
            alert('Failed to process re-request.');
        }
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-nav">
                    <NavLink to="/customer/dashboard" className="sidebar-link">
                        <LayoutDashboard size={20} /> <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/customer/prescriptions" className="sidebar-link">
                        <FileText size={20} /> <span>Prescriptions</span>
                    </NavLink>
                    <NavLink to="/customer/requests" className="sidebar-link">
                        <MessageSquare size={20} /> <span>Requests</span>
                    </NavLink>
                    <NavLink to="/customer/search" className="sidebar-link">
                        <Search size={20} /> <span>Medicine Search</span>
                    </NavLink>
                    <NavLink to="/customer/history" className="sidebar-link">
                        <History size={20} /> <span>Order History</span>
                    </NavLink>
                    <NavLink to="/customer/notifications" className="sidebar-link">
                        <Bell size={20} /> <span>Notifications</span>
                    </NavLink>
                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <NavLink to="/customer/settings" className="sidebar-link">
                            <Settings size={20} /> <span>Profile / Settings</span>
                        </NavLink>
                        <NavLink to="/customer/health" className="sidebar-link">
                            <Heart size={20} /> <span>Health Records</span>
                        </NavLink>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Routes>
                    <Route path="dashboard" element={<DashboardOverview prescriptions={prescriptions} requests={requests} suggestions={suggestions} />} />
                    <Route path="prescriptions" element={<PrescriptionsPage prescriptions={prescriptions} setShowAddModal={setShowAddModal} requestRefill={requestRefill} deletePrescription={deletePrescription} />} />
                    <Route path="requests" element={<RequestsPage requests={requests} handleReRequest={handleReRequest} />} />
                    <Route path="search" element={<MedicineSearchPage searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={handleSearch} searchResults={searchResults} isSearching={isSearching} requestNewMedicine={requestNewMedicine} categories={categories} />} />
                    <Route path="history" element={<OrderHistoryPage requests={requests.filter(r => r.status === 'Completed')} />} />
                    <Route path="notifications" element={<NotificationsPage notifications={notifications} markNotificationAsRead={markNotificationAsRead} />} />
                    <Route path="settings" element={<ProfilePage user={user} />} />
                    <Route path="health" element={<HealthRecordsPage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
            </main>

            {/* Global Modals */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '450px', position: 'relative' }}>
                        <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                        <h3 style={{ marginBottom: '1.5rem' }}>Upload New Prescription</h3>
                        <form onSubmit={handleAddPrescription}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.4rem', color: '#64748b' }}>MEDICINE NAME</label>
                                    <input required type="text" value={newPrescription.medicineName} onChange={e => setNewPrescription({ ...newPrescription, medicineName: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }} placeholder="e.g. Amoxicillin 500mg" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.4rem', color: '#64748b' }}>DOSAGE INSTRUCTIONS</label>
                                    <input required type="text" value={newPrescription.dosage} onChange={e => setNewPrescription({ ...newPrescription, dosage: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }} placeholder="e.g. 1-0-1 after food" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.4rem', color: '#64748b' }}>REFILL GAP (DAYS)</label>
                                    <input required type="number" min="1" value={newPrescription.refillDuration} onChange={e => setNewPrescription({ ...newPrescription, refillDuration: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.4rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                        PRESCRIPTION IMAGE (REQUIRED)
                                        {isScanning && <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Loader2 size={12} className="animate-spin" /> Scanning...</span>}
                                    </label>
                                    <div style={{ border: '2px dashed var(--border)', borderRadius: '0.6rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        <div style={{ color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <ImageIcon size={24} />
                                            <span style={{ fontSize: '0.85rem' }}>{prescriptionImage ? prescriptionImage.name : 'Click to upload image'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                                    <input 
                                        type="checkbox" 
                                        id="urgent-check"
                                        checked={newPrescription.isEmergency || false} 
                                        onChange={e => setNewPrescription({ ...newPrescription, isEmergency: e.target.checked })} 
                                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="urgent-check" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ef4444', cursor: 'pointer' }}>Mark as Emergency / Urgent Request</label>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Prescription</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
