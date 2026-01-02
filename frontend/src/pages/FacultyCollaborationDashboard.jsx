import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CollaborationChat from '../components/CollaborationChat';

const FacultyCollaborationDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeChatRequest, setActiveChatRequest] = useState(null);

    useEffect(() => {
        if (user && user.role !== 'faculty') {
            navigate('/dashboard');
            return;
        }
        fetchRequests();
    }, [user, navigate]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/collaboration/faculty/requests');
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // Corrected template literal without backslashes
            await api.put(`/collaboration/request/${id}`, { status: newStatus });
            // Update local state
            setRequests(prev => prev.map(req =>
                req.id === id ? { ...req, status: newStatus } : req
            ));
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>Loading collaboration requests...</div>;

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Collaboration Requests 📬</h1>

            <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', border: '1px solid var(--glass-border)' }}>
                {requests.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No collaboration requests yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {requests.map(req => (
                            <div key={req.id} style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${req.status === 'Pending' ? '#F59E0B' : req.status === 'Accepted' ? '#10B981' : '#EF4444'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{req.student_name}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Student</span>
                                        </div>
                                        <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>{req.project_interest}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                                            "{req.message}"
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Received: {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', textAlign: 'right', color: req.status === 'Pending' ? '#F59E0B' : req.status === 'Accepted' ? '#10B981' : '#EF4444' }}>
                                            Status: {req.status}
                                        </div>

                                        {req.status === 'Pending' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <button onClick={() => handleStatusUpdate(req.id, 'Accepted')} className="btn" style={{ flex: 1, background: '#10B981', border: 'none', color: 'white', padding: '0.4rem', fontSize: '0.9rem' }}>Accept</button>
                                                <button onClick={() => handleStatusUpdate(req.id, 'Rejected')} className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', padding: '0.4rem', fontSize: '0.9rem' }}>Reject</button>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setActiveChatRequest(req)}
                                            className="btn btn-primary"
                                            style={{ width: '100%', fontSize: '0.9rem' }}
                                        >
                                            {req.status === 'Pending' ? 'Reply / Chat' : 'View Conversation'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            {activeChatRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card fade-in" style={{ width: '600px', maxWidth: '95%', padding: '0', background: 'transparent', border: 'none' }}>
                        <CollaborationChat
                            requestId={activeChatRequest.id}
                            initialMessage={activeChatRequest.message} // Pass initial message context
                            onClose={() => setActiveChatRequest(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyCollaborationDashboard;
