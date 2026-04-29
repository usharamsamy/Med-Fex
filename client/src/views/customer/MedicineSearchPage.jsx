import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertTriangle, ShoppingCart, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const MedicineSearchPage = ({ searchTerm, setSearchTerm, handleSearch, searchResults, isSearching, requestNewMedicine, categories }) => {
    const [alternatives, setAlternatives] = useState({});
    const [loadingAlt, setLoadingAlt] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get('q');
        if (q) {
            setSearchTerm(q);
            // Delay a bit to ensure state is updated if needed, though props update immediately
            setTimeout(() => {
                handleSearch();
            }, 100);
        }
    }, [location.search]);

    const fetchAlternatives = async (category, medId) => {
        if (!category) return;
        setLoadingAlt(medId);
        try {
            const { data } = await axios.get('/api/medicines/alternatives', {
                params: { category, excludeId: medId }
            });
            setAlternatives(prev => ({ ...prev, [medId]: data }));
        } catch (err) {
            console.error('Error fetching alternatives:', err);
        } finally {
            setLoadingAlt(null);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Search Medicines</h1>
            </div>

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Find medicine by name (e.g., Paracetamol, Cetirizine)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isSearching} style={{ padding: '0 2rem' }}>
                        {isSearching ? 'Checking...' : 'Check Availability'}
                    </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: '600' }}>Browse Categories:</span>
                    {(categories && categories.length > 0 ? categories : [{name: 'Antibiotics'}, {name: 'Painkillers'}, {name: 'Diabetic'}, {name: 'Cardiac'}, {name: 'Gastric'}, {name: 'Vitamins'}]).map((cat, idx) => (
                        <button 
                            key={idx}
                            onClick={() => { setSearchTerm(cat.name); setTimeout(handleSearch, 10); }}
                            style={{ 
                                padding: '0.4rem 1rem', 
                                borderRadius: '2rem', 
                                border: '1px solid var(--border)', 
                                background: searchTerm === cat.name ? 'var(--primary)' : 'white',
                                color: searchTerm === cat.name ? 'white' : 'var(--text)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {searchResults.map(m => (
                    <div key={m._id} className="card" style={{ border: m.stock > 0 ? '1px solid #dcfce7' : '1px solid #fee2e2', transition: 'transform 0.2s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text)' }}>{m.name}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>{m.category}</p>
                            </div>
                            {m.retailer?.location && (
                                <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={12} /> {m.retailer.location}
                                </span>
                            )}
                        </div>

                        <div style={{ padding: '1rem', background: m.stock > 0 ? '#f0fdf4' : '#fff1f2', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                            {m.stock > 0 ? (
                                <div>
                                    <div style={{ color: 'var(--success)', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.25rem' }}>In Stock</div>
                                    <div style={{ fontSize: '0.85rem', color: '#166534' }}>Currently available at {m.retailer?.name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid #dcfce7', paddingTop: '0.75rem' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>Rs. {m.price}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#166534', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '0.4rem' }}>{m.stock} units left</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ color: '#ef4444', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Out of Stock</div>
                                    <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>This medicine is temporarily unavailable at {m.retailer?.name}.</div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button 
                                className={m.stock > 0 ? "btn-primary" : "btn-secondary"}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                onClick={() => m.stock === 0 ? requestNewMedicine(m.name) : null}
                            >
                                {m.stock > 0 ? (
                                    <><ShoppingCart size={18} /> Order Now</>
                                ) : (
                                    <><AlertTriangle size={18} /> Notify Me When Available</>
                                )}
                            </button>

                            {m.stock === 0 && (
                                <button 
                                    onClick={() => fetchAlternatives(m.category, m._id)} 
                                    className="btn-secondary" 
                                    style={{ width: '100%', fontSize: '0.8rem', border: 'none', background: '#f8fafc' }}
                                    disabled={loadingAlt === m._id}
                                >
                                    <RefreshCcw size={14} className={loadingAlt === m._id ? 'animate-spin' : ''} style={{ marginRight: '0.5rem' }} /> 
                                    {loadingAlt === m._id ? 'Searching...' : 'Try Alternatives'}
                                </button>
                            )}

                            {alternatives[m._id] && (
                                <div style={{ marginTop: '0.5rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>GENERIC ALTERNATIVES:</div>
                                    {alternatives[m._id].length > 0 ? alternatives[m._id].map(alt => (
                                        <div key={alt._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid #e2e8f0' }}>
                                            <span>{alt.name}</span>
                                            <span style={{ fontWeight: 'bold' }}>Rs. {alt.price}</span>
                                        </div>
                                    )) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No results.</span>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {searchTerm && searchResults.length === 0 && !isSearching && (
                    <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#64748b' }}>
                            <Search size={32} />
                        </div>
                        <h3 style={{ color: 'var(--text)' }}>Medicine Not Found</h3>
                        <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>We couldn't find "{searchTerm}" in our current inventory. We can arrange it for you from our partner network.</p>
                        <button
                            onClick={() => requestNewMedicine(searchTerm)}
                            className="btn-primary"
                            style={{ padding: '0.75rem 2rem' }}
                        >
                            Send Arrangement Request
                        </button>
                    </div>
                )}

                {!searchTerm && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-light)' }}>
                        <p>Enter a medicine name above to check availability and prices.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicineSearchPage;
