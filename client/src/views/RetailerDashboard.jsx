// MedFex Retailer Dashboard - Enhanced Request & Restock System
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';
import { 
    Plus, Trash2, Edit2, AlertCircle, Package, TrendingUp, 
    ClipboardList, CheckCircle, Clock, XCircle, Search, 
    Filter, Download, ArrowUpRight, Activity, Bell,
    MoreVertical, ChevronRight, Calendar, DollarSign, History, RefreshCcw,
    AlertTriangle, X
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';


const RetailerDashboard = () => {
    const { user, setUser } = useContext(AuthContext);
    const [medicines, setMedicines] = useState([]);
    const [requests, setRequests] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [activities, setActivities] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [newMed, setNewMed] = useState({ name: '', category: '', price: '', stock: '', description: '', batchNumber: '', mfgDate: '', expiryDate: '' });
    const [categories, setCategories] = useState([]);
    const [activityFilters, setActivityFilters] = useState({ role: '', actionType: '', startDate: '', endDate: '' });
    const [profile, setProfile] = useState({ 
        name: user?.name || '', 
        email: user?.email || '', 
        location: user?.location || '' 
    });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    
    // Filters and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [requestFilter, setRequestFilter] = useState('All');
    const [inventoryFilter, setInventoryFilter] = useState('All');
    
    // Request Viewing Logic
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [viewedRequests, setViewedRequests] = useState(new Set());
    const [processingRequest, setProcessingRequest] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectData, setRejectData] = useState({ id: null, medicineName: '', reason: 'Out of stock', note: '' });
    const [restockAlerts, setRestockAlerts] = useState([]);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [restockData, setRestockData] = useState({ medicineName: '', quantity: '' });

    // Section Refs for Quick Actions
    const reportsRef = useRef(null);
    const predictionRef = useRef(null);
    const demandMapRef = useRef(null);
    const requestsRef = useRef(null);

    const [dbStats, setDbStats] = useState(null);

    useEffect(() => {
        fetchMedicines();
        fetchRequests();
        fetchPredictions();
        fetchActivities();
        fetchDbStats();
        fetchCategories();
        fetchRestockAlerts();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/categories');
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchDbStats = async () => {
        try {
            const { data } = await axios.get('/api/analytics/dashboard-stats', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setDbStats(data);
        } catch (err) {
            console.error('Error fetching db stats:', err);
        }
    };

    const fetchActivities = async (page = 1, search = '', filters = activityFilters) => {
        try {
            const { data } = await axios.get('/api/analytics/activity', {
                params: { page, search, ...filters },
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setActivities(data.activities || []);
        } catch (err) {
            console.error('Error fetching activities:', err);
        }
    };

    const fetchPredictions = async () => {
        try {
            const { data } = await axios.get('/api/analytics/inventory-prediction', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setPredictions(data);
        } catch (err) {
            console.error('Error fetching predictions:', err);
        }
    };

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

    const fetchRestockAlerts = async () => {
        try {
            const { data } = await axios.get('/api/requests/restock-alerts', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setRestockAlerts(data);
        } catch (err) {
            console.error('Error fetching restock alerts:', err);
        }
    };

    const handleRestockSubmit = async () => {
        if (!restockData.quantity || restockData.quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        setProcessingRequest(true);
        try {
            await axios.post('/api/requests/restock', restockData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setShowRestockModal(false);
            fetchRestockAlerts();
            fetchMedicines();
            alert(`Stock updated and customers notified for ${restockData.medicineName}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating stock');
        } finally {
            setProcessingRequest(false);
        }
    };

    const createCategory = async (name) => {
        try {
            const { data } = await axios.post('/api/categories', { name }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCategories([...categories, data]);
            setNewMed({ ...newMed, category: data.name });
            alert('Category added successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding category');
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Are you sure? Medicines in this category will NOT be deleted, but the category tag will be gone.')) return;
        try {
            await axios.delete(`/api/categories/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCategories(categories.filter(c => c._id !== id));
        } catch (err) {
            alert('Error deleting category');
        }
    };

    // Dashboard Statistics
    const statsCards = useMemo(() => {
        if (!dbStats) return [];
        return [
            { label: 'Total Medicines', value: dbStats.totalMedicines, icon: <Package size={20} />, color: '#1e7f73', bg: '#f0fdfa' },
            { label: 'Low Stock Alerts', value: dbStats.lowStockCount, icon: <AlertCircle size={20} />, color: '#ef4444', bg: '#fef2f2' },
            { label: 'Marketplace Pending', value: dbStats.pendingRequests, icon: <Clock size={20} />, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Your Active Orders', value: dbStats.myActiveOrders, icon: <ClipboardList size={20} />, color: '#8b5cf6', bg: '#f5f3ff' },
            { label: "Today's Revenue", value: `Rs. ${dbStats.todayRevenue}`, icon: <DollarSign size={20} />, color: '#10b981', bg: '#f0fdf4' },
            { label: "New Requests", value: dbStats.todayRequests, icon: <Activity size={20} />, color: '#0ea5e9', bg: '#f0f9ff' }
        ];
    }, [dbStats]);

    // Chart Data
    const demandData = useMemo(() => {
        const counts = {};
        requests.forEach(r => {
            counts[r.medicineName] = (counts[r.medicineName] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [requests]);

    const weeklyRequestsData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyCounts = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        requests.filter(r => new Date(r.createdAt) >= oneWeekAgo).forEach(req => {
            const day = days[new Date(req.createdAt).getDay()];
            weeklyCounts[day]++;
        });

        const sortedDays = [];
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            sortedDays.push(days[d.getDay()]);
        }

        return sortedDays.map(day => ({
            name: day,
            requests: weeklyCounts[day]
        }));
    }, [requests]);

    const revenueData = useMemo(() => {
        const monthlyRevenue = {};
        const completedRequests = requests.filter(r => r.status === 'Completed');
        
        completedRequests.forEach(req => {
            const date = new Date(req.updatedAt);
            const month = date.toLocaleString('default', { month: 'short' });
            
            const medicine = medicines.find(m => m.name.toLowerCase() === req.medicineName.toLowerCase());
            const price = medicine ? medicine.price : 0;
            const qty = req.requiredStock || 1;
            const revenue = price * qty;

            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue;
        });

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toLocaleString('default', { month: 'short' }));
        }

        return months.map(m => ({
            name: m,
            revenue: monthlyRevenue[m] || 0
        }));
    }, [requests, medicines]);

    const statusData = useMemo(() => {
        const statusCounts = {
            'Pending': 0,
            'Accepted': 0,
            'Ready for Pickup': 0,
            'Completed': 0,
            'Rejected': 0
        };
        requests.forEach(r => {
            if (statusCounts[r.status] !== undefined) {
                statusCounts[r.status]++;
            }
        });
        return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    }, [requests]);

    const categoryData = useMemo(() => {
        const counts = {};
        medicines.forEach(m => {
            const cat = m.category || 'General';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [medicines]);

    const COLORS = ['#f59e0b', '#1e7f73', '#0ea5e9', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

    const filterCategories = useMemo(() => {
        const cats = new Set(medicines.map(m => m.category).filter(Boolean));
        return ['All', ...Array.from(cats)];
    }, [medicines]);

    const filteredMedicines = medicines.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              m.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesInventoryFilter = inventoryFilter === 'All' || 
                              (inventoryFilter === 'Low Stock' && m.stock < 10) ||
                              (inventoryFilter === 'In Stock' && m.stock >= 10);
        const matchesCategory = searchTerm || inventoryFilter !== 'All' ? true : (m.category || 'General').toLowerCase().includes(searchTerm.toLowerCase());
        
        // Let's refine the matchesSearch to be cleaner
        return matchesSearch && matchesInventoryFilter;
    });

    const filteredRequests = requests.filter(r => {
        const matchesSearch = r.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (r.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = requestFilter === 'All' || r.status === requestFilter;
        return matchesSearch && matchesFilter;
    });

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!newMed.name || !newMed.category || !newMed.price || !newMed.stock || !newMed.expiryDate) {
            alert('Please fill in all required fields.');
            return;
        }
        try {
            const payload = { ...newMed, batches: [] };
            if (newMed.batchNumber || newMed.expiryDate) {
                payload.batches.push({
                    batchNumber: newMed.batchNumber || `B-${Date.now()}`,
                    mfgDate: newMed.mfgDate || undefined,
                    expiryDate: newMed.expiryDate,
                    stock: newMed.stock || 0
                });
            }

            if (editingMedicine) {
                await axios.put(`/api/medicines/${editingMedicine._id}`, payload, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            } else {
                await axios.post('/api/medicines', payload, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            }
            setShowAddModal(false);
            setNewMed({ name: '', category: '', price: '', stock: '', description: '', batchNumber: '', mfgDate: '', expiryDate: '' });
            setEditingMedicine(null);
            fetchMedicines();
        } catch (err) {
            console.error('Error saving medicine:', err);
        }
    };

    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) return alert('CSV must contain a header and at least one data row');

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const newMedicines = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 2) {
                    const med = { stock: 0, price: 0, category: 'General' };
                    headers.forEach((h, index) => {
                        const val = values[index];
                        if (h === 'medicine' || h === 'name') med.name = val;
                        if (h === 'category' && val) med.category = val;
                        if (h === 'price') med.price = Number(val) || 0;
                        if (h === 'stock') med.stock = Number(val) || 0;
                    });
                    if (med.name) newMedicines.push(med);
                }
            }

            if (newMedicines.length > 0) {
                if (window.confirm(`Ready to bulk upload ${newMedicines.length} medicines. Proceed?`)) {
                    try {
                        await axios.post('/api/medicines/bulk', { medicines: newMedicines }, {
                            headers: { Authorization: `Bearer ${user.token}` }
                        });
                        fetchMedicines();
                        alert('Bulk upload successful!');
                    } catch (err) {
                        console.error('Bulk upload error', err);
                        alert(err.response?.data?.message || 'Failed to upload bulk medicines');
                    }
                }
            } else {
                alert('No valid medicines found in the CSV file.');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const exportToCSV = () => {
        const headers = ['Medicine Name', 'Category', 'Price', 'Stock', 'Status'];
        const rows = filteredMedicines.map(m => {
            const status = m.stock === 0 ? 'Out of Stock' : (m.stock < 10 ? 'Low Stock' : 'In Stock');
            return [`"${m.name}"`, `"${m.category}"`, m.price, m.stock, status];
        });
        
        downloadCSV(`medfex_inventory_${new Date().toISOString().split('T')[0]}`, headers, rows);
    };

    const exportDemandInsights = async () => {
        try {
            const { data } = await axios.get('/api/analytics/demand-insights', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const headers = ['Medicine Name', 'Request Count'];
            const rows = data.map(item => [`"${item._id}"`, item.count]);
            downloadCSV(`medfex_demand_insights_${new Date().toISOString().split('T')[0]}`, headers, rows);
        } catch (err) {
            alert('Failed to export demand insights');
        }
    };

    const exportSalesReport = async () => {
        try {
            const { data } = await axios.get('/api/analytics/sales-report', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const headers = ['Date', 'Customer', 'Medicine', 'Price', 'Qty', 'Total'];
            const rows = data.map(sale => {
                const price = sale.medicinePrice || 0;
                const qty = sale.requiredStock || 1;
                return [
                    new Date(sale.updatedAt).toLocaleDateString(),
                    `"${sale.customer?.name || 'Walk-in'}"`,
                    `"${sale.medicineName}"`,
                    price,
                    qty,
                    price * qty
                ];
            });
            downloadCSV(`medfex_sales_report_${new Date().toISOString().split('T')[0]}`, headers, rows);
        } catch (err) {
            alert('Failed to export sales report');
        }
    };

    const downloadCSV = (filename, headers, rows) => {
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const deleteMedicine = async (id) => {
        if (window.confirm('Are you sure you want to delete this medicine?')) {
            try {
                await axios.delete(`/api/medicines/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
                fetchMedicines();
            } catch (err) {
                console.error('Error deleting medicine:', err);
            }
        }
    };

    const handleNotifyAll = async () => {
        try {
            const { data } = await axios.post('/api/requests/notify-restocked', {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert(data.message);
            fetchActivities();
        } catch (err) {
            console.error('Error in Notify All:', err);
            alert('Failed to send notifications.');
        }
    };

    const handleQuickRestock = async (medicineId, qty) => {
        try {
            const med = medicines.find(m => m._id === medicineId);
            if (!med) return;
            
            const newStock = med.stock + qty;
            await axios.put(`/api/medicines/${medicineId}`, 
                { stock: newStock }, 
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            alert(`Stock successfully updated for ${med.name}.`);
            fetchMedicines();
            fetchPredictions();
            fetchActivities();
        } catch (err) {
            console.error('Restock Error:', err);
            alert('Failed to update stock.');
        }
    };

    const openRequestDetails = async (requestId) => {
        try {
            const { data } = await axios.get(`/api/requests/${requestId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSelectedRequest(data);
            setShowDetailsModal(true);
            
            // Mark as viewed
            setViewedRequests(prev => new Set([...prev, requestId]));
        } catch (err) {
            console.error('View Details Error:', err);
            alert('Failed to load request details.');
        }
    };

    const scrollToSection = (ref) => {
        if (ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const { data } = await axios.put('/api/auth/profile', profile, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUser({ ...user, ...data });
            alert('Settings updated successfully!');
        } catch (err) {
            console.error('Profile Update Error:', err);
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const updateRequestStatus = async (id, status, politeMessage, rejectionReason, pharmacistNote) => {
        if (processingRequest === id) return;
        setProcessingRequest(id);
        console.log(`[Status Update Attempt] ID: ${id}, New Status: ${status}`);

        // Frontend Stock Validation Before Accept
        if (status === 'Accepted') {
            const reqData = requests.find(r => r._id === id);
            if (reqData) {
                const reqQty = reqData.requiredStock || (reqData.totalTablets ? Math.ceil(reqData.totalTablets / 10) : 1);
                const cleanName = reqData.medicineName.trim().toLowerCase();
                // Check inventory
                const inventoryMatch = medicines.find(m => m.name.toLowerCase() === cleanName);
                if (!inventoryMatch || inventoryMatch.stock < reqQty) {
                    alert('Insufficient stock');
                    setProcessingRequest(null);
                    return;
                }
            }
        }

        try {
            await axios.put(`/api/requests/${id}/status`,
                { 
                    status, 
                    retailerMessage: politeMessage, 
                    rejectReason: rejectionReason, // Backend uses rejectReason
                    pharmacistNote // Added for detailed feedback
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            console.log(`[Status Update Success] Request ${id} successfully updated to ${status}`);
            
            // Check for restock fetch if rejected out of stock
            if (status === 'Rejected' && rejectionReason === 'Out of stock') {
                fetchRestockAlerts();
            }
            
            // Optimistic UI state update
            setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
            
            // Re-fetch to guarantee accuracy and update other stats
            fetchRequests();
            fetchActivities();
        } catch (err) {
            console.error(`[Status Update Failure] Failed to update request ${id} to ${status}:`, err);
            const msg = err.response?.data?.message || '';
            if (msg.includes('Insufficient stock') || msg.includes('Cannot accept')) {
                alert('Insufficient stock');
            } else if (msg === 'Request not found') {
                alert('Request not found');
            } else {
                alert('Unable to update request. Please try again.');
            }
        } finally {
            setProcessingRequest(null);
        }
    };

    const submitReject = async () => {
        if (!rejectData.id) return;
        await updateRequestStatus(rejectData.id, 'Rejected', '', rejectData.reason, rejectData.note);
        setShowRejectModal(false);
        setRejectData({ id: null, medicineName: '', reason: 'Out of stock', note: '' });
    };

    const completeRequest = async (id, politeMessage) => {
        try {
            await axios.put(`/api/requests/${id}/complete`,
                { retailerMessage: politeMessage },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            fetchRequests();
        } catch (err) {
            console.error('Error completing request:', err);
            alert(err.response?.data?.message || 'Error completing request.');
        }
    };

    const generateInvoice = async (requestId) => {
        if (processingRequest === requestId) return;
        setProcessingRequest(requestId);
        try {
            const response = await axios.get(`/api/requests/${requestId}/invoice`, {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob'
            });
            
            const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
            const filename = `MedFex_Invoice_${requestId.substring(0, 8)}_${dateStr}.pdf`;

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            link.remove();
            
            fetchActivities();
        } catch (error) {
            console.error('Invoicing Error:', error);
            alert('Unable to generate invoice. Please try again.');
        } finally {
            setProcessingRequest(null);
        }
    };


    return (
        <div className="dashboard-layout">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-nav">
                    <NavLink to="/retailer/dashboard" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <Activity size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/retailer/inventory" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <Package size={20} />
                        <span>Inventory</span>
                    </NavLink>
                    <NavLink to="/retailer/requests" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <ClipboardList size={20} />
                        <span>Requests</span>
                    </NavLink>
                    <NavLink to="/retailer/analytics" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <TrendingUp size={20} />
                        <span>Analytics</span>
                    </NavLink>
                    <NavLink to="/retailer/history" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <History size={20} />
                        <span>Activity Logs</span>
                    </NavLink>
                    <NavLink to="/retailer/reports" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <Download size={20} />
                        <span>Reports</span>
                    </NavLink>
                    <NavLink to="/retailer/notifications" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <Bell size={20} />
                        <span>Notifications</span>
                    </NavLink>
                    <NavLink to="/retailer/settings" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <MoreVertical size={20} />
                        <span>Settings</span>
                    </NavLink>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Navigate to="dashboard" replace />} />
                    
                    {/* DASHBOARD OVERVIEW */}
                    <Route path="dashboard" element={
                        <div>
                            {/* Professional Welcome Banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                borderRadius: '1.5rem',
                                padding: '2.5rem',
                                color: 'white',
                                marginBottom: '2rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                                
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
                                        Welcome back, {user?.name?.split(' ')[0] || 'Retailer'}! 🏪
                                    </h1>
                                    <p style={{ fontSize: '1.1rem', margin: '0 0 2rem 0', opacity: 0.9 }}>
                                        Here is your real-time pharmacy and sales overview.
                                    </p>
                                    
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <AlertCircle size={20} color="#f87171" />
                                            <span style={{ fontWeight: '600' }}>{medicines.filter(m => m.stock < 10).length} medicines low in stock</span>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <ClipboardList size={20} color="#fbbf24" />
                                            <span style={{ fontWeight: '600' }}>{requests.filter(r => r.status === 'Pending').length} pending requests</span>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <DollarSign size={20} color="#34d399" />
                                            <span style={{ fontWeight: '600' }}>Today sales ₹{dbStats?.todayRevenue || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="dashboard-grid">
                                {statsCards.map((stat, i) => (
                                    <div key={i} className="stats-card" style={{ borderLeftColor: stat.color }}>
                                        <div className="stats-icon" style={{ background: stat.bg, color: stat.color }}>
                                            {stat.icon}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '600' }}>{stat.label}</span>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>{stat.value}</h2>
                                    </div>
                                ))}
                            </div>

                            <div className="card" style={{ marginTop: '2rem' }}>
                                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
                                    <AlertTriangle size={22} /> Restock Needed (Rejected Requests)
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>These medicines were requested by customers but rejected because they were out of stock.</p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                                <th style={{ padding: '0.75rem' }}>Medicine</th>
                                                <th style={{ padding: '0.75rem' }}>Times Rejected</th>
                                                <th style={{ padding: '0.75rem' }}>Current Stock</th>
                                                <th style={{ padding: '0.75rem' }}>Last Requested</th>
                                                <th style={{ padding: '0.75rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {restockAlerts.map((alert, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{alert.medicineName}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>
                                                            Suggestion: Restock {alert.rejectCount * 20} units
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{ background: '#fee2e2', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                            {alert.rejectCount} Times
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>{alert.currentStock || 0} units</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                                        {new Date(alert.lastRequested).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <button 
                                                            onClick={() => {
                                                                setRestockData({ medicineName: alert.medicineName, quantity: (alert.rejectCount * 20).toString() });
                                                                setShowRestockModal(true);
                                                            }}
                                                            className="btn-primary" 
                                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', background: 'var(--success)', border: 'none' }}
                                                        >
                                                            Add Stock
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {restockAlerts.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No restock alerts at the moment.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card" style={{ marginTop: '2rem' }}>
                                <h3 className="card-title"><Activity size={20} color="var(--primary)" /> Recent Activity Overview</h3>
                                <div style={{ marginTop: '1rem' }}>
                                    {activities.slice(0, 5).map((a) => (
                                        <div key={a._id} className="timeline-item" style={{ paddingBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{a.action}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{a.details}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(a.createdAt).toLocaleTimeString()}</div>
                                        </div>
                                    ))}
                                    {activities.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>No active records.</p>}
                                </div>
                            </div>
                        </div>
                    } />

                    {/* INVENTORY MANAGEMENT */}
                    <Route path="inventory" element={
                        <div>
                            <div className="page-header">
                                <h1 className="page-title">Inventory Management</h1>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                                    <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}><Activity size={18} /> Bulk Upload</button>
                                    <button className="btn-secondary" onClick={exportToCSV}><Download size={18} /> Export CSV</button>
                                    <button className="btn-primary" onClick={() => { setShowAddModal(true); setEditingMedicine(null); setNewMed({ name: '', category: '', price: '', stock: '', description: '', batchNumber: '', mfgDate: '', expiryDate: '' }); }}>
                                        <Plus size={20} /> Add Medicine
                                    </button>
                                </div>
                            </div>

                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Search inventory..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', width: '300px' }}
                                        />
                                    </div>
                                    <select 
                                        value={inventoryFilter}
                                        onChange={(e) => setInventoryFilter(e.target.value)}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    >
                                        <option value="All">Stock Status: All</option>
                                        <option value="In Stock">In Stock</option>
                                        <option value="Low Stock">Low Stock</option>
                                    </select>
                                    <select 
                                        onChange={(e) => setSearchTerm(e.target.value === 'All' ? '' : e.target.value)}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    >
                                        <option value="All">Category: All</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table className="inventory-table">
                                        <thead>
                                            <tr>
                                                <th>Medicine Name</th>
                                                <th>Category</th>
                                                <th>Stock Level</th>
                                                <th>Price (Rs)</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMedicines.map(m => (
                                                <tr key={m._id} style={{ 
                                                    background: m.batches?.some(b => new Date(b.expiryDate) < new Date()) ? '#fff1f2' : 'inherit'
                                                }}>
                                                    <td>
                                                        <strong>{m.name}</strong>
                                                        {m.batches?.some(b => new Date(b.expiryDate) < new Date()) && 
                                                            <div style={{ color: '#e11d48', fontSize: '0.7rem', fontWeight: 'bold' }}>EXPIRED</div>
                                                        }
                                                    </td>
                                                    <td>{m.category}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span>{m.stock}</span>
                                                            <div className="progress-bar" style={{ width: '60px' }}>
                                                                <div className="progress-fill" style={{ width: `${Math.min(100, (m.stock/50)*100)}%`, background: m.stock < 10 ? '#ef4444' : 'var(--primary)' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{m.price}</td>
                                                    <td>
                                                        <span className={`status-badge status-${m.stock === 0 ? 'out-of-stock' : (m.stock < 10 ? 'low-stock' : 'in-stock')}`}>
                                                            {m.stock === 0 ? 'Out of Stock' : (m.stock < 10 ? 'Low Stock' : 'In Stock')}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => { setEditingMedicine(m); setShowAddModal(true); }} className="btn-secondary" style={{ padding: '0.4rem' }}><Edit2 size={14} color="var(--primary)"/></button>
                                                            <button onClick={() => deleteMedicine(m._id)} className="btn-secondary" style={{ padding: '0.4rem' }}><Trash2 size={14} color="var(--danger)"/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    } />

                    {/* CUSTOMER REQUESTS */}
                    <Route path="requests" element={
                        <div>
                            <div className="page-header">
                                <h1 className="page-title">Customer Requests</h1>
                                <select 
                                    value={requestFilter}
                                    onChange={(e) => setRequestFilter(e.target.value)}
                                    style={{ padding: '0.6rem 1.25rem', borderRadius: '0.6rem', border: '1px solid var(--border)' }}
                                >
                                    <option value="All">All Requests</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Ready for Pickup">Ready</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {filteredRequests.map(r => {
                                    const isEmergency = r.isEmergency || r.isUrgent;
                                    return (
                                        <div key={r._id} className="card" style={{ 
                                            position: 'relative', 
                                            borderLeft: isEmergency ? '6px solid #ef4444' : `4px solid ${r.status === 'Pending' ? '#f59e0b' : (r.status === 'Completed' ? '#10b981' : '#1e7f73')}`,
                                            background: isEmergency ? '#fff1f2' : 'white',
                                            boxShadow: isEmergency ? '0 0 15px rgba(239, 68, 68, 0.15)' : 'var(--shadow)'
                                        }}>
                                            {isEmergency && (
                                                <div style={{ position: 'absolute', top: '-10px', right: '10px', background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '900', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}>
                                                    🚨 EMERGENCY
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isEmergency ? '#ef4444' : 'var(--primary)' }}>{r.type.toUpperCase()}</span>
                                                <span className={`status-badge status-${r.status.toLowerCase().replace(/ /g, '-')}`}>{r.status}</span>
                                            </div>
                                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{r.medicineName}</h3>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                                                Ordered by: <strong>{r.customer?.name}</strong><br/>
                                                Required: {r.totalTablets || 0} tablets<br/>
                                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: isEmergency ? 'rgba(255,255,255,0.5)' : '#f8fafc', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                                                    Requested: <strong>{new Date(r.createdAt).toLocaleDateString('en-GB')} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                                </div>
                                            </div>
                                            {r.status !== 'Rejected' && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0', position: 'relative' }}>
                                                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '3px', background: '#e2e8f0', transform: 'translateY(-50%)', zIndex: 0 }}></div>
                                                    {['Pending', 'Accepted', 'Ready for Pickup', 'Completed'].map((step, idx, arr) => {
                                                        const currentIndex = arr.indexOf(r.status) === -1 ? 0 : arr.indexOf(r.status);
                                                        return (
                                                            <div key={idx} style={{ 
                                                                background: idx <= currentIndex ? (isEmergency ? '#ef4444' : 'var(--primary)') : '#cbd5e1', 
                                                                width: '12px', height: '12px', 
                                                                borderRadius: '50%', zIndex: 1,
                                                                border: '2px solid white',
                                                                boxShadow: idx === currentIndex ? `0 0 0 3px ${isEmergency ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` : 'none'
                                                            }} title={step} />
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                                <button 
                                                    onClick={() => openRequestDetails(r._id)} 
                                                    className="btn-secondary" 
                                                    style={{ width: '100%', fontSize: '0.85rem', borderColor: viewedRequests.has(r._id) ? 'var(--border)' : (isEmergency ? '#ef4444' : 'var(--primary)'), color: viewedRequests.has(r._id) ? 'var(--text)' : (isEmergency ? '#ef4444' : 'var(--primary)') }}
                                                >
                                                    {viewedRequests.has(r._id) ? 'Review Details' : '🔍 View Detailed Request'}
                                                </button>

                                                {r.status === 'Pending' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button 
                                                            onClick={() => updateRequestStatus(r._id, 'Accepted', "Ready for processing")} 
                                                            className="btn-primary" 
                                                            disabled={!viewedRequests.has(r._id) || processingRequest === r._id}
                                                            style={{ flex: 1, fontSize: '0.8rem', background: isEmergency ? '#ef4444' : 'var(--primary)', opacity: (!viewedRequests.has(r._id) || processingRequest === r._id) ? 0.5 : 1 }}
                                                        >
                                                            {processingRequest === r._id ? 'Processing...' : 'Accept'}
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setRejectData({ id: r._id, medicineName: r.medicineName, reason: 'Out of stock', note: '' });
                                                                setShowRejectModal(true);
                                                            }} 
                                                            className="btn-secondary" 
                                                            disabled={processingRequest === r._id}
                                                            style={{ flex: 1, fontSize: '0.8rem', color: 'var(--danger)', opacity: processingRequest === r._id ? 0.5 : 1 }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {r.status === 'Accepted' && <button onClick={() => updateRequestStatus(r._id, 'Ready for Pickup', "Ready for pickup")} disabled={processingRequest === r._id} className="btn-primary" style={{ width: '100%', background: isEmergency ? '#ef4444' : 'var(--primary)' }}>{processingRequest === r._id ? 'Processing...' : 'Mark Ready'}</button>}
                                                {r.status === 'Ready for Pickup' && <button onClick={() => completeRequest(r._id, "Collected")} className="btn-primary" style={{ width: '100%', background: isEmergency ? '#ef4444' : 'var(--primary)' }}>Mark Collected</button>}
                                                {r.status === 'Completed' && <button disabled={processingRequest === r._id} onClick={() => generateInvoice(r._id)} className="btn-secondary" style={{ width: '100%', color: 'var(--success)', borderColor: 'var(--success)' }}><Download size={14}/> Invoice</button>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredRequests.length === 0 && <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No requests found.</div>}
                            </div>
                        </div>
                    } />

                    {/* ANALYTICS */}
                    <Route path="analytics" element={
                        <div>
                            <div className="page-header">
                                <h1 className="page-title">Demand Analytics</h1>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="card">
                                    <h3 className="card-title">Top 5 Demanded Medicines</h3>
                                    <div style={{ height: '350px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={demandData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" fontSize={12} />
                                                <YAxis fontSize={12} />
                                                <Tooltip cursor={{fill: '#f8fafc'}} />
                                                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="card">
                                    <h3 className="card-title">Order Status Distribution</h3>
                                    <div style={{ height: '350px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={statusData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                                    {statusData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <h3 className="card-title">6-Month Revenue Trend</h3>
                                <div style={{ height: '350px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="revenue" stroke="var(--success)" fill="#ecfdf5" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="card-title"><TrendingUp size={20} color="var(--primary)" /> Smart Restock Recommendations</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>AI-driven suggestions based on your current burn rate and predicted stock-out dates.</p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                                <th style={{ padding: '0.75rem' }}>Medicine</th>
                                                <th style={{ padding: '0.75rem' }}>Current Stock</th>
                                                <th style={{ padding: '0.75rem' }}>Daily Burn</th>
                                                <th style={{ padding: '0.75rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem' }}>Suggested Restock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {predictions.filter(p => p.suggestedRestock > 0).map(p => (
                                                <tr key={p.medicineId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.name}</td>
                                                    <td style={{ padding: '0.75rem' }}>{p.stock} units</td>
                                                    <td style={{ padding: '0.75rem' }}>{p.dailyBurnRate} u/day</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{ 
                                                            fontSize: '0.75rem', 
                                                            padding: '0.2rem 0.6rem', 
                                                            borderRadius: '1rem', 
                                                            background: p.status === 'Critical' ? '#fee2e2' : '#fffbeb', 
                                                            color: p.status === 'Critical' ? '#ef4444' : '#f59e0b',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                                        + {p.suggestedRestock} units
                                                        <button 
                                                            onClick={() => handleQuickRestock(p.medicineId, p.suggestedRestock)}
                                                            style={{ marginLeft: '1rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} 
                                                            className="btn-primary"
                                                        >
                                                            Execute
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {predictions.filter(p => p.suggestedRestock > 0).length === 0 && (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Stock levels are healthy. No restock needed yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card" style={{ marginTop: '2rem' }}>
                                <h3 className="card-title"><Calendar size={20} color="var(--primary)" /> Near-Expiry Watchlist</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>Medicine batches expiring within 90 days.</p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                                <th style={{ padding: '0.75rem' }}>Medicine</th>
                                                <th style={{ padding: '0.75rem' }}>Batch #</th>
                                                <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                                                <th style={{ padding: '0.75rem' }}>Days Left</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {medicines.flatMap(m => (m.batches || []).map(b => ({ ...b, medName: m.name })))
                                                .filter(b => {
                                                    const days = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                    return days > 0 && days <= 90;
                                                })
                                                .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                                                .map((b, i) => {
                                                    const daysLeft = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                    return (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{b.medName}</td>
                                                            <td style={{ padding: '0.75rem' }}>{b.batchNumber}</td>
                                                            <td style={{ padding: '0.75rem' }}>{new Date(b.expiryDate).toLocaleDateString()}</td>
                                                            <td style={{ padding: '0.75rem' }}>
                                                                <span style={{ color: daysLeft <= 30 ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>
                                                                    {daysLeft} Days
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {medicines.every(m => !(m.batches || []).some(b => {
                                                const days = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                return days > 0 && days <= 90;
                                            })) && (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No batches expiring within 90 days.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    } />

                    {/* REPORTS */}
                    <Route path="reports" element={
                        <div>
                            <div className="page-header">
                                <h1 className="page-title">System Reports</h1>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="card">
                                    <h3 className="card-title">Inventory by Category</h3>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={categoryData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                                                    {categoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Quick Exports</h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <button className="btn-secondary" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Package size={20} color="var(--primary)"/> Inventory Report (CSV)</span>
                                            <Download size={18} />
                                        </button>
                                        <button className="btn-secondary" onClick={exportDemandInsights} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><TrendingUp size={20} color="var(--secondary)"/> Demand Analysis (CSV)</span>
                                            <Download size={18} />
                                        </button>
                                        <button className="btn-secondary" onClick={exportSalesReport} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><DollarSign size={20} color="var(--success)"/> Financial Sales Report (CSV)</span>
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="card-title">Performance Summary</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.25rem' }}>TOTAL SALES</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{requests.filter(r => r.status === 'Completed').length}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.25rem' }}>ACCEPTED RATE</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                                            {requests.length > 0 ? Math.round((requests.filter(r => r.status !== 'Rejected' && r.status !== 'Pending').length / requests.length) * 100) : 0}%
                                        </div>
                                    </div>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.25rem' }}>AVG. DAILY REQS</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{Math.round(requests.length / 30)}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.25rem' }}>STOCK COVERAGE</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{Math.round((medicines.filter(m => m.stock > 0).length / medicines.length) * 100)}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    } />

                    {/* NOTIFICATIONS */}
                    <Route path="notifications" element={
                        <div>
                            <div className="page-header">
                                <h1 className="page-title">Alerts & Warnings</h1>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Urgent Requests */}
                                {requests.filter(r => r.isUrgent && r.status === 'Pending').map(r => (
                                    <div key={r._id} className="card" style={{ borderLeft: '5px solid #ef4444', background: '#fef2f2', animation: 'pulse 2s infinite' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <AlertCircle color="#ef4444" size={24} />
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, color: '#ef4444' }}>🚨 EMERGENCY REQUEST</h4>
                                                <p style={{ fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>{r.customer?.name} needs <strong>{r.medicineName}</strong> urgently.</p>
                                            </div>
                                            <NavLink to="/retailer/requests" className="btn-primary" style={{ background: '#ef4444', fontSize: '0.8rem' }}>Process Now</NavLink>
                                        </div>
                                    </div>
                                ))}

                                {/* Expiring Medicines */}
                                {medicines.filter(m => m.batches?.some(b => new Date(b.expiryDate) < new Date(Date.now() + 30*24*60*60*1000))).map(m => (
                                    <div key={m._id} className="card" style={{ borderLeft: '5px solid #f59e0b', background: '#fffbeb' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <AlertCircle color="#b45309" size={24} />
                                            <div>
                                                <h4 style={{ margin: 0, color: '#b45309' }}>Expiry Warning</h4>
                                                <p style={{ fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>{m.name} is expiring within 30 days. Please review batch details.</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Low Stock */}
                                {medicines.filter(m => m.stock < 10).map(m => (
                                    <div key={m._id} className="card" style={{ borderLeft: '5px solid #ef4444', background: '#fef2f2' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Package color="#991b1b" size={24} />
                                            <div>
                                                <h4 style={{ margin: 0, color: '#991b1b' }}>Low Stock Alert</h4>
                                                <p style={{ fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>{m.name} has only {m.stock} units left.</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* AI Prediction Notifications */}
                                {predictions.filter(p => p.daysUntilEmpty !== null && p.daysUntilEmpty <= 7).map(p => (
                                    <div key={p.medicineId} className="card" style={{ borderLeft: '5px solid #8b5cf6', background: '#f5f3ff' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Activity color="#5b21b6" size={24} />
                                            <div>
                                                <h4 style={{ margin: 0, color: '#5b21b6' }}>Predictive Stock Out</h4>
                                                <p style={{ fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>{p.name} is predicted to run out in {p.daysUntilEmpty} days based on demand.</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {medicines.filter(m => m.stock < 10).length === 0 && <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)', padding: '3rem' }}>No critical alerts at this time.</div>}
                            </div>
                        </div>
                    } />

                    {/* SETTINGS */}
                    <Route path="settings" element={
                        <div>
                            <div className="page-header">
                                <h1 className="page-title">Retailer Settings</h1>
                            </div>
                            <div className="card" style={{ maxWidth: '600px' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Pharmacy Profile</h3>
                                <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem' }}>Shop Name</label>
                                        <input 
                                            type="text" 
                                            value={profile.name} 
                                            onChange={e => setProfile({...profile, name: e.target.value})}
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem' }}>Contact Email</label>
                                        <input 
                                            type="email" 
                                            value={profile.email} 
                                            disabled
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#f1f5f9', cursor: 'not-allowed' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem' }}>Location / Address</label>
                                        <input 
                                            type="text" 
                                            value={profile.location || ''} 
                                            onChange={e => setProfile({...profile, location: e.target.value})}
                                            placeholder="Enter your pharmacy location"
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }} 
                                        />
                                    </div>
                                    <button 
                                        disabled={isUpdatingProfile}
                                        className="btn-primary" 
                                        style={{ marginTop: '1rem' }}
                                    >
                                        {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </form>
                            </div>

                            <div className="card" style={{ maxWidth: '600px', marginTop: '2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Manage Categories</h3>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {categories.map(c => (
                                        <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                            <span style={{ fontWeight: '600' }}>{c.name}</span>
                                            <button onClick={() => deleteCategory(c._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const name = prompt('Enter new category name:');
                                            if (name) createCategory(name);
                                        }} 
                                        className="btn-secondary" 
                                        style={{ width: '100%', marginTop: '0.5rem', borderStyle: 'dashed' }}
                                    >
                                        + Add New Category
                                    </button>
                                </div>
                            </div>
                        </div>
                    } />
                    {/* ACTIVITY LOGS */}
                    <Route path="history" element={
                        <div>
                            <div className="page-header">
                                <h1 className="page-title">Activity Logs</h1>
                                <button className="btn-secondary" onClick={() => { setActivityFilters({ role: '', actionType: '', startDate: '', endDate: '' }); fetchActivities(1, '', { role: '', actionType: '', startDate: '', endDate: '' }); }}>
                                    <RefreshCcw size={16} style={{marginRight: '0.5rem'}} /> Refresh
                                </button>
                            </div>

                            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Search logs..." 
                                            onChange={(e) => fetchActivities(1, e.target.value)}
                                            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                        />
                                    </div>
                                    <select 
                                        className="inventory-input"
                                        value={activityFilters.role}
                                        onChange={(e) => { const f = {...activityFilters, role: e.target.value}; setActivityFilters(f); fetchActivities(1, '', f); }}
                                    >
                                        <option value="">All Roles</option>
                                        <option value="customer">Customer</option>
                                        <option value="retailer">Retailer</option>
                                    </select>
                                    <select 
                                        className="inventory-input"
                                        value={activityFilters.actionType}
                                        onChange={(e) => { const f = {...activityFilters, actionType: e.target.value}; setActivityFilters(f); fetchActivities(1, '', f); }}
                                    >
                                        <option value="">All Actions</option>
                                        <option value="Added Medicine">Added Medicine</option>
                                        <option value="Update stock">Update stock</option>
                                        <option value="Delete medicine">Delete medicine</option>
                                        <option value="Request refill">Request refill</option>
                                        <option value="Request Accepted">Request Accepted</option>
                                        <option value="Request Rejected">Request Rejected</option>
                                        <option value="Marked as Ready">Marked as Ready</option>
                                        <option value="Marked as Collected">Marked as Collected</option>
                                        <option value="Add Prescription">Add Prescription</option>
                                        <option value="Search medicine">Search medicine</option>
                                        <option value="Download invoice">Download invoice</option>
                                        <option value="User Login">User Login</option>
                                    </select>
                                    <input 
                                        type="date" 
                                        className="inventory-input"
                                        value={activityFilters.startDate}
                                        onChange={(e) => { const f = {...activityFilters, startDate: e.target.value}; setActivityFilters(f); fetchActivities(1, '', f); }}
                                    />
                                </div>
                            </div>

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>ACTION</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>DETAILS</th>
                                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>USER</th>
                                            <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>TIMESTAMP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.map(a => (
                                            <tr key={a._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', display: 'block' }}>{a.action}</span>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text)', fontSize: '0.9rem' }}>{a.details}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{a.userName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{a.userRole}</div>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'right' }}>
                                                    {new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                        {activities.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    <Activity size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                                    <p style={{ fontWeight: 600 }}>No activity logs found.</p>
                                                    <p style={{ fontSize: '0.9rem' }}>Actions will appear here once the system is used.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    } />
                </Routes>
            </main>

            {/* Medicine Modal (Shared across dashboard if needed, or primarily used in Inventory) */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ width: '500px', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '800' }}>{editingMedicine ? 'Update Medicine' : 'Add New Inventory'}</h3>
                        <form onSubmit={handleCreateOrUpdate}>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-light)' }}>Medicine Name</label>
                                    <input required value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-light)' }}>Category</label>
                                        <select 
                                            required 
                                            value={newMed.category} 
                                            onChange={e => {
                                                if (e.target.value === 'NEW') {
                                                    const name = prompt('Enter new category name:');
                                                    if (name) createCategory(name);
                                                } else {
                                                    setNewMed({ ...newMed, category: e.target.value });
                                                }
                                            }} 
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                            <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add New Category</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-light)' }}>Price (Rs)</label>
                                        <input type="number" required min="0" value={newMed.price} onChange={e => setNewMed({ ...newMed, price: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-light)' }}>Initial Stock</label>
                                    <input type="number" required min="0" value={newMed.stock} onChange={e => setNewMed({ ...newMed, stock: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-light)' }}>Expiry Date</label>
                                    <input type="date" required value={newMed.expiryDate} onChange={e => setNewMed({ ...newMed, expiryDate: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.6rem' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingMedicine ? 'Save Changes' : 'Create Entry'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REQUEST DETAILS MODAL (Real Pharmacy Workflow) */}
            {showDetailsModal && selectedRequest && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px' }}>
                    <div className="card" style={{ width: '900px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', borderRadius: '1.5rem', position: 'relative' }}>
                        <button 
                            onClick={() => setShowDetailsModal(false)} 
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        >
                            <XCircle size={28} />
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
                            {/* Left Side: Prescription Image & Logic */}
                            <div>
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                    <ClipboardList size={22} /> Prescription Review
                                </h3>
                                
                                {selectedRequest.prescriptionId?.prescriptionImage ? (
                                    <div style={{ background: '#f8fafc', borderRadius: '1rem', border: '2px dashed var(--border)', padding: '0.5rem' }}>
                                        <img 
                                            src={selectedRequest.prescriptionId.prescriptionImage} 
                                            alt="Prescription" 
                                            style={{ width: '100%', borderRadius: '0.5rem', cursor: 'zoom-in' }} 
                                            onClick={() => window.open(selectedRequest.prescriptionId.prescriptionImage, '_blank')}
                                        />
                                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Click image to view full scale</p>
                                    </div>
                                ) : (
                                    <div style={{ height: '300px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', color: '#94a3b8', textAlign: 'center' }}>
                                        <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                                        <p>No prescription image attached.<br/>Verify details manually or reject.</p>
                                    </div>
                                )}

                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0f9ff', borderRadius: '1rem', border: '1px solid #bae6fd' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={18} /> Pharmacist Verification Checklist
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                        <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" /> Patient name matches ID
                                        </label>
                                        <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" /> Medicine name matches prescription
                                        </label>
                                        <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" /> Dosage instruction is clear
                                        </label>
                                        <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" /> Prescription is within valid date range
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Order Details & Actions */}
                            <div>
                                <h3 style={{ marginBottom: '1.5rem' }}>Order Details</h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="stats-card" style={{ padding: '1.25rem', background: '#f8fafc', border: 'none' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>CUSTOMER</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.2rem' }}>{selectedRequest.customer?.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>{selectedRequest.customer?.phone || 'No phone provided'}</div>
                                    </div>

                                    <div className="stats-card" style={{ padding: '1.25rem', background: '#f8fafc', border: 'none' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>MEDICINE & DOSAGE</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.2rem', color: 'var(--primary)' }}>{selectedRequest.medicineName}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.3rem' }}>Dosage: <strong>{selectedRequest.dosage || 'Not specified'}</strong></div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>Duration: <strong>{selectedRequest.refillDays || 0} Days</strong></div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #dcfce7' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 'bold' }}>QTY REQUIRED</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#166534' }}>{selectedRequest.totalTablets || 0}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#15803d' }}>Unit: Tablets/Capsules</div>
                                        </div>
                                        <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: '0.75rem', border: '1px solid #fee2e2' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 'bold' }}>STOCK STATUS</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#991b1b' }}>{selectedRequest.medicineId ? 'IN STOCK' : 'OUT STOCK'}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>{selectedRequest.medicinePrice ? `Price: Rs. ${selectedRequest.medicinePrice}` : 'Price not set'}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.5rem' }}>QUICK ACTION</div>
                                        {selectedRequest.status === 'Pending' && (
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button 
                                                    onClick={() => { updateRequestStatus(selectedRequest._id, 'Accepted', "Verified & Processing"); setShowDetailsModal(false); }}
                                                    className="btn-primary" 
                                                    style={{ flex: 1, padding: '1rem' }}
                                                >
                                                    Accept & Process
                                                </button>
                                                <button 
                                                    onClick={() => { 
                                                        setRejectData({ id: selectedRequest._id, medicineName: selectedRequest.medicineName, reason: 'Out of stock', note: '' });
                                                        setShowRejectModal(true);
                                                        setShowDetailsModal(false);
                                                    }}
                                                    className="btn-secondary" 
                                                    style={{ flex: 1, color: 'var(--danger)', padding: '1rem' }}
                                                >
                                                    Reject Order
                                                </button>
                                            </div>
                                        )}
                                        {selectedRequest.status !== 'Pending' && (
                                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center', fontWeight: '700' }}>
                                                Current Status: <span style={{ color: 'var(--primary)' }}>{selectedRequest.status}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* REJECTION MODAL */}
            {showRejectModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '500px', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                                <AlertTriangle color="#ef4444" size={24} /> Reject Request
                            </h2>
                            <button onClick={() => setShowRejectModal(false)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }}><X size={20} /></button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                                You are about to reject the request for <strong>{rejectData.medicineName}</strong>. 
                                Please provide a reason to help the customer understand.
                            </p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Rejection Reason</label>
                                <select 
                                    className="form-control"
                                    value={rejectData.reason}
                                    onChange={e => setRejectData({ ...rejectData, reason: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}
                                >
                                    <option value="Out of stock">Out of stock</option>
                                    <option value="Invalid prescription">Invalid prescription</option>
                                    <option value="Expired prescription">Expired prescription</option>
                                    <option value="Incorrect dosage">Incorrect dosage</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Pharmacist Note (Optional)</label>
                                <textarea 
                                    className="form-control"
                                    placeholder="Add more details for the customer..."
                                    value={rejectData.note}
                                    onChange={e => setRejectData({ ...rejectData, note: e.target.value })}
                                    style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', resize: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowRejectModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                            <button 
                                onClick={submitReject} 
                                className="btn-primary" 
                                style={{ flex: 2, background: '#ef4444', border: 'none' }}
                                disabled={processingRequest !== null}
                            >
                                {processingRequest ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* RESTOCK MODAL */}
            {showRestockModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Add Stock</h2>
                            <button onClick={() => setShowRestockModal(false)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }}><X size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Enter quantity to add for <strong>{restockData.medicineName}</strong></p>
                            <input 
                                type="number" 
                                className="form-control"
                                placeholder="Quantity (e.g. 50)"
                                value={restockData.quantity}
                                onChange={e => setRestockData({ ...restockData, quantity: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowRestockModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                            <button 
                                onClick={handleRestockSubmit} 
                                className="btn-primary" 
                                style={{ flex: 1, background: 'var(--success)', border: 'none' }}
                                disabled={processingRequest}
                            >
                                {processingRequest ? 'Updating...' : 'Update & Notify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetailerDashboard;
