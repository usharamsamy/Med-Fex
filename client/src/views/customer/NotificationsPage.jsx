import React from 'react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';

const NotificationsPage = ({ notifications, markNotificationAsRead }) => {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Notifications</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ background: '#f1f5f9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#64748b' }}>
                            <Bell size={30} />
                        </div>
                        <h3 style={{ color: 'var(--text)' }}>All Caught Up!</h3>
                        <p style={{ color: 'var(--text-light)' }}>No new notifications since your last visit.</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div 
                            key={n._id} 
                            onClick={() => !n.isRead && markNotificationAsRead(n._id)}
                            className="card" 
                            style={{ 
                                display: 'flex', 
                                gap: '1.25rem', 
                                alignItems: 'flex-start',
                                background: n.isRead ? 'white' : '#f0fdfa',
                                borderLeft: n.isRead ? '4px solid #e2e8f0' : '4px solid var(--primary)',
                                transition: 'all 0.2s ease',
                                cursor: !n.isRead ? 'pointer' : 'default'
                            }}
                        >
                            <div style={{ 
                                background: n.isRead ? '#f1f5f9' : '#ccfbf1', 
                                color: n.isRead ? '#64748b' : 'var(--primary)',
                                padding: '0.75rem', 
                                borderRadius: '0.75rem' 
                            }}>
                                <Bell size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>{n.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={12} /> {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: '1.5' }}>{n.message}</p>
                            </div>
                            {!n.isRead && (
                                <div style={{ color: 'var(--primary)', alignSelf: 'center' }}>
                                    <Check size={20} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
