import React, { useState } from 'react';
import { ShoppingBag, Download, Calendar, DollarSign, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const OrderHistoryPage = ({ requests }) => {
    const completedOrders = requests.filter(r => r.status === 'Completed');
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

    const downloadInvoice = async (order) => {
        if (downloadingInvoiceId) return;
        setDownloadingInvoiceId(order._id);
        
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo ? userInfo.token : '';
            
            const response = await axios.get(`/api/requests/${order._id}/invoice`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const dateStr = new Date(order.createdAt).toLocaleDateString().replace(/\//g, '-');
            const filename = `MedFex_Invoice_${order._id.substring(0, 8)}_${dateStr}.pdf`;

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            link.remove();
        } catch (error) {
            console.error('Download Error:', error);
            if (error.response?.status === 404) {
                alert('Invoice not found or order not completed.');
            } else {
                alert('Unable to generate invoice. Please try again.');
            }
        } finally {
            setDownloadingInvoiceId(null);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Order History</h1>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>MEDICINE</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>DATE</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>QTY</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>STATUS</th>
                            <th style={{ textAlign: 'right', padding: '1.25rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {completedOrders.map((order) => (
                            <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>{order.medicineName}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Type: {order.type}</div>
                                </td>
                                <td style={{ padding: '1.25rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                    {new Date(order.updatedAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1.25rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                    {order.totalTablets || '-'}
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    <span className="status-badge status-completed" style={{ fontSize: '0.75rem' }}>Completed</span>
                                </td>
                                <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                    <button 
                                        onClick={() => downloadInvoice(order)}
                                        disabled={downloadingInvoiceId === order._id}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: downloadingInvoiceId === order._id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', fontWeight: 'bold', fontSize: '0.85rem', opacity: downloadingInvoiceId === order._id ? 0.5 : 1 }}
                                    >
                                        {downloadingInvoiceId === order._id ? (
                                            <><Loader2 size={16} className="spinner" /> Generating...</>
                                        ) : (
                                            <><Download size={16} /> Invoice</>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {completedOrders.length === 0 && (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{ background: '#f1f5f9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#64748b' }}>
                            <ShoppingBag size={30} />
                        </div>
                        <h3 style={{ color: 'var(--text)' }}>No Orders Yet</h3>
                        <p style={{ color: 'var(--text-light)' }}>Your completed medicine purchases will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistoryPage;
