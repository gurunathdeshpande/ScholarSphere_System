import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CollaborationChat from '../components/CollaborationChat';

const StudentCollaborationDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [availableFaculty, setAvailableFaculty] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Chat State
    const [activeChatRequest, setActiveChatRequest] = useState(null);
    const [reqForm, setReqForm] = useState({ faculty_id: '', project_interest: '', message: '' });
    const [showRequestModal, setShowRequestModal] = useState(false);

    useEffect(() => {
        if (user && user.role !== 'student') {
            navigate('/dashboard'); // Redirect if not student
            return;
        }
        fetchData();
    }, [user, navigate]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            // Corrected template literal without backslashes
            const res = await api.get(`/collaboration/available-faculty?q=${searchQuery}`);
            setAvailableFaculty(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    const fetchData = async () => {
        setLoading(true);
        try {
            const [facRes, reqRes] = await Promise.all([
                api.get('/collaboration/available-faculty'),
                api.get('/collaboration/student/requests')
            ]);
            setAvailableFaculty(facRes.data);
            setMyRequests(reqRes.data);
        } catch (error) {
            console.error("Failed to load collaboration data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async () => {
        if (!reqForm.project_interest || !reqForm.message) {
            alert("Please fill all fields.");
            return;
        }
        try {
            await api.post('/collaboration/request', {
                faculty_id: reqForm.faculty_id,
                project_interest: reqForm.project_interest,
                message: reqForm.message
            });
            alert("Request sent successfully!");
            setShowRequestModal(false);
            setReqForm({ faculty_id: '', project_interest: '', message: '' });
            fetchData(); // Refresh lists
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || "Failed to send request.");
        }
    };

    const initiateRequest = (facultyId) => {
        const existing = myRequests.find(r => r.faculty_id === facultyId);
        if (existing) {
            setActiveChatRequest(existing);
        } else {
            setReqForm(prev => ({ ...prev, faculty_id: facultyId }));
            setShowRequestModal(true);
        }
    };

    if (loading && !availableFaculty.length && !myRequests.length) return <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Student Collaboration Center 🎓</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('available')}
                    className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Available Faculty ({availableFaculty.length})
                </button>
                <button
                    onClick={() => setActiveTab('my_requests')}
                    className={`btn ${activeTab === 'my_requests' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    My Conversations ({myRequests.length})
                </button>
            </div>

            {/* TAB: AVAILABLE FACULTY */}
            {activeTab === 'available' && (
                <div>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by Name or Department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button onClick={handleSearch} className="btn btn-primary">Search</button>
                    </div>

                    <div className="grid-responsive">
                        {availableFaculty.length === 0 ? (
                            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No faculty are currently accepting new collaborations.
                            </p>
                        ) : (
                            availableFaculty.map(fac => (
                                <div key={fac.id} className="card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                            {fac.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{fac.name}</h4>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {fac.department}
                                                {fac.user_id ? (
                                                    <span style={{ marginLeft: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                        ✓ Registered
                                                    </span>
                                                ) : (
                                                    <span style={{ marginLeft: '10px', background: 'rgba(255, 255, 255, 0.1)', color: '#9CA3AF', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                        Ghost Profile
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => initiateRequest(fac.id)}
                                        className="btn btn-primary"
                                        style={{ width: '100%', fontSize: '0.9rem' }}
                                    >
                                        {myRequests.find(r => r.faculty_id === fac.id) ? 'View Conversation' : 'Request Collaboration'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB: MY REQUESTS */}
            {activeTab === 'my_requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {myRequests.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>You haven't started any collaborations yet.</p>
                    ) : (
                        myRequests.map(req => (
                            <div key={req.id} className="card" style={{
                                padding: '1.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderLeft: `4px solid ${req.status === 'Pending' ? '#F59E0B' : req.status === 'Accepted' ? '#10B981' : '#EF4444'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{req.faculty_name}</h4>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{req.project_interest}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last updated: {new Date(req.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', color: req.status === 'Pending' ? '#F59E0B' : req.status === 'Accepted' ? '#10B981' : '#EF4444', marginBottom: '0.5rem' }}>
                                            {req.status}
                                        </div>
                                        <button
                                            onClick={() => setActiveChatRequest(req)}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                                        >
                                            Open Chat 💬
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Request Modal */}
            {showRequestModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card fade-in" style={{ width: '500px', maxWidth: '90%', padding: '2rem', background: '#1e293b' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Start Collaboration</h3>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Project Interest</label>
                            <input
                                type="text" className="input-field"
                                value={reqForm.project_interest} onChange={e => setReqForm({ ...reqForm, project_interest: e.target.value })}
                                placeholder="e.g. Research in AI"
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Message</label>
                            <textarea
                                className="input-field" rows="4"
                                value={reqForm.message} onChange={e => setReqForm({ ...reqForm, message: e.target.value })}
                                placeholder="Introduce yourself..."
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setShowRequestModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleRequestSubmit} className="btn btn-primary">Send Request</button>
                        </div>
                    </div>
                </div>
            )}

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
                            initialMessage={activeChatRequest.message}
                            onClose={() => setActiveChatRequest(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCollaborationDashboard;
