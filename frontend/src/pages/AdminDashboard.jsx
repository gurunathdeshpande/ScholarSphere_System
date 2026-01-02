import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ScraperControl = () => {
    const [status, setStatus] = useState({ is_running: false, processed_faculty: 0, total_faculty: 0, current_faculty: '' });

    useEffect(() => {
        let interval;
        if (status.is_running) {
            interval = setInterval(checkStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [status.is_running]);

    const checkStatus = async () => {
        try {
            const res = await api.get('/faculty/scrape/status');
            setStatus(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const startScrape = async () => {
        if (!window.confirm("This will start a long-running background scraping process. Continue?")) return;
        try {
            await api.post('/faculty/scrape');
            setStatus(prev => ({ ...prev, is_running: true }));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to start scraper");
        }
    };

    const stopScrape = async () => {
        try {
            await api.post('/faculty/scrape/stop');
            // Optimistic update, but polling will confirm
            alert("Stopping scraper... Please wait a moment.");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ textAlign: 'right' }}>
            {status.is_running ? (
                <div>
                    <div style={{ color: '#F59E0B', fontWeight: 'bold', marginBottom: '0.5rem' }}>Scraping in progress...</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Processed: {status.processed_faculty} / {status.total_faculty || '?'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.5rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Current: {status.current_faculty}
                    </div>
                    <button
                        onClick={stopScrape}
                        style={{
                            background: 'transparent', border: '1px solid #EF4444', color: '#EF4444',
                            padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
                        }}
                    >
                        Stop Scraper ⏹️
                    </button>
                </div>
            ) : (
                <button
                    onClick={startScrape}
                    style={{
                        background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
                        color: 'white', border: 'none', padding: '0.8rem 1.5rem',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Start Scraper
                </button>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending'); // 'Pending', 'Approved', 'Rejected', 'All'

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchRequests();
    }, [user, navigate, filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Corrected template literal without backslashes
            const res = await api.get(`/verification/admin/requests?status=${filter}`);
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.post(`/verification/admin/requests/${id}/approve`);
            alert("Faculty Approved!");
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.msg || "Approval failed");
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this request?")) return;
        try {
            await api.post(`/verification/admin/requests/${id}/reject`);
            alert("Request Rejected.");
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.msg || "Rejection failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this request permanently?")) return;
        try {
            await api.delete(`/verification/admin/requests/${id}`);
            alert("Request Deleted.");
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.msg || "Deletion failed");
        }
    };

    if (loading && requests.length === 0) return <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>Loading admin panel...</div>;

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center', color: '#F87171' }}>Admin Dashboard 🛡️</h1>

            {/* Scraper Section */}
            <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Data Scraper 🕷️</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Auto-populate faculty data from IRINS.</p>
                    </div>
                    <ScraperControl />
                </div>
            </div>

            <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Faculty Verifications</h2>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    background: filter === f ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {requests.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No {filter.toLowerCase()} verification requests.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {requests.map(req => (
                            <div key={req.id} style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                padding: '1rem',
                                borderLeft: `4px solid ${req.status === 'Approved' ? '#10B981' : req.status === 'Rejected' ? '#EF4444' : '#F59E0B'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{req.name}</h4>
                                            {filter === 'All' && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{req.status}</span>}
                                        </div>

                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{req.email}</div>
                                        <div style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Dept: {req.department}</div>
                                        {req.message && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                                "{req.message}"
                                            </div>
                                        )}
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Submitted: {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                                        {req.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="btn"
                                                    style={{ background: '#10B981', color: 'white', padding: '0.5rem 1rem', fontSize: '0.9rem', border: 'none' }}
                                                >
                                                    Approve ✅
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="btn"
                                                    style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                >
                                                    Reject ❌
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(req.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0.2rem', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
                                        >
                                            Delete 🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
