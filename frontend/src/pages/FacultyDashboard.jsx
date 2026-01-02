import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CollaborationChat from '../components/CollaborationChat';

const FacultyDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [facultyProfile, setFacultyProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeChatRequestId, setActiveChatRequestId] = useState(null);

    // Manual Pub State
    const [showPubModal, setShowPubModal] = useState(false);
    const [pubForm, setPubForm] = useState({
        title: '', year: new Date().getFullYear(), venue: '', abstract: '', domain: 'General'
    });

    const handlePubSubmit = async () => {
        if (!pubForm.title || !pubForm.year) {
            alert("Title and Year are required.");
            return;
        }
        try {
            await api.post('/faculty/publications/manual', pubForm);
            alert("Publication added successfully!");
            setShowPubModal(false);
            setPubForm({ title: '', year: new Date().getFullYear(), venue: '', abstract: '', domain: 'General' });
            // Optionally refresh simple stats if we had them displayed
        } catch (err) {
            console.error("Failed to add publication", err);
            alert("Failed to add publication.");
        }
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        department: '',
        institution: '',
        research_interests: '',
        bio: '' // Note: Bio wasn't in original Faculty model, purely hypothetical or needs schema update? 
        // Checking Faculty model: name, title, department, institution, email, research_interests (JSON), profile_image...
    });



    // Requests State
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (user?.role !== 'faculty') {
            navigate('/');
            return;
        }

        const fetchProfile = async () => {
            if (user.faculty_id) {
                try {
                    const res = await api.get(`/faculty/${user.faculty_id}`);
                    setFacultyProfile(res.data);
                    setFormData({
                        name: res.data.name || '',
                        title: res.data.title || '',
                        department: res.data.department || '',
                        institution: res.data.institution || '',
                        research_interests: res.data.research_interests?.join(', ') || '',
                    });

                    // Fetch Requests
                    const reqRes = await api.get('/collaboration/faculty/requests');
                    setRequests(reqRes.data);
                } catch (err) {
                    console.error("Failed to load profile or requests", err);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user, navigate]);

    const handleRequestAction = async (id, status) => {
        try {
            await api.put(`/collaboration/request/${id}`, { status });
            // Update local state
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (err) {
            console.error("Failed to update request", err);
            alert("Failed to update status.");
        }
    };

    const handleSave = async () => {
        // TODO: Implement update API
        alert("Profile update feature coming next!");
        setIsEditing(false);
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading dashboard...</div>;

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <div style={{ background: 'orange', color: 'black', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                DEBUG DASHBOARD: Role: <b>{user ? user.role : 'N/A'}</b> | Requests: {requests.length}
            </div>
            <h1 style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
                Faculty Dashboard
            </h1>

            {/* Profile Management Card */}
            <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>My Profile</h2>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="btn btn-primary">Edit Profile</button>
                    )}
                </div>

                {!user.faculty_id ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid var(--error)' }}>
                        <h3 style={{ color: 'var(--error)' }}>Profile Not Linked</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Your account is not currently linked to a public Faculty Profile.
                        </p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Create / Claim Profile</button>
                    </div>
                ) : (
                    <div className="row">
                        <div className="col">
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Title</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.title}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Department</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.department}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="col">
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Institution</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.institution}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Research Interests (comma separated)</label>
                                <textarea
                                    className="input-field"
                                    rows="4"
                                    value={formData.research_interests}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, research_interests: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {isEditing && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleSave} className="btn btn-success" style={{ background: 'var(--success)', color: 'white', border: 'none' }}>Save Changes</button>
                    </div>
                )}
            </div>

            {/* Incoming Requests */}
            <div className="card" style={{ padding: '2rem', marginTop: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0' }}>Incoming Collaboration Requests</h2>
                    {/* Availability Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="availabilitySwitch"
                            checked={facultyProfile?.is_available_for_collaboration || false}
                            onChange={async (e) => {
                                try {
                                    const checked = e.target.checked;
                                    await api.put('/collaboration/faculty/availability', { is_available: checked });
                                    setFacultyProfile(prev => ({ ...prev, is_available_for_collaboration: checked }));
                                } catch (err) { alert("Failed to update availability"); }
                            }}
                        />
                        <label htmlFor="availabilitySwitch" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Accepting New Students
                        </label>
                    </div>
                </div>
                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                {requests.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No pending requests.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {requests.map(req => (
                            <div key={req.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${req.status === 'Pending' ? '#F59E0B' : req.status === 'Accepted' ? '#10B981' : '#EF4444'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{req.student_name}</h4>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '0.25rem' }}>{req.project_interest}</div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{req.message}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(req.created_at).toLocaleDateString()}</span>
                                        <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: req.status === 'Pending' ? '#F59E0B' : req.status === 'Accepted' ? '#10B981' : '#EF4444' }}>
                                            {req.status}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {req.status === 'Pending' && (
                                        <>
                                            <button onClick={() => handleRequestAction(req.id, 'Rejected')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>Reject</button>
                                            <button onClick={() => handleRequestAction(req.id, 'Accepted')} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>Accept</button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setActiveChatRequestId(req.id)}
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none' }}
                                    >
                                        Message Student
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            {activeChatRequestId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card fade-in" style={{ width: '600px', maxWidth: '95%', padding: '0', background: 'transparent', border: 'none' }}>
                        <CollaborationChat
                            requestId={activeChatRequestId}
                            initialMessage={requests.find(r => r.id === activeChatRequestId)?.message}
                            onClose={() => setActiveChatRequestId(null)}
                        />
                    </div>
                </div>
            )}

            {/* Manual Publication Entry */}
            <div className="card" style={{ padding: '2rem', marginTop: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Manage Research</h2>
                    <button onClick={() => setShowPubModal(true)} className="btn btn-primary">+ Add Missing Work</button>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Manually add publications, books, or projects that involve you but were not automatically scraped.
                    These will appear in your profile and search results immediately.
                </p>
            </div>

            {/* Modal */}
            {showPubModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card fade-in" style={{ width: '500px', maxWidth: '90%', padding: '2rem', background: '#1e293b' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Add Manual Publication</h3>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Title *</label>
                            <input
                                type="text" className="input-field"
                                value={pubForm.title} onChange={e => setPubForm({ ...pubForm, title: e.target.value })}
                            />
                        </div>

                        <div className="row">
                            <div className="col">
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Year *</label>
                                    <input
                                        type="number" className="input-field"
                                        value={pubForm.year} onChange={e => setPubForm({ ...pubForm, year: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="col">
                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Venue / Journal</label>
                                    <input
                                        type="text" className="input-field"
                                        value={pubForm.venue} onChange={e => setPubForm({ ...pubForm, venue: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Research Domain</label>
                            <select
                                className="input-field"
                                value={pubForm.domain} onChange={e => setPubForm({ ...pubForm, domain: e.target.value })}
                            >
                                <option value="General">General</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="AI & ML">AI & ML</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Biotech">Biotech</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Abstract</label>
                            <textarea
                                className="input-field" rows="3"
                                value={pubForm.abstract} onChange={e => setPubForm({ ...pubForm, abstract: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setShowPubModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handlePubSubmit} className="btn btn-primary">Add Work</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboard;
