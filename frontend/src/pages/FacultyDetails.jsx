import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CollaborationChat from '../components/CollaborationChat';

const FacultyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Collaboration Request State
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [reqForm, setReqForm] = useState({ project_interest: '', message: '' });
    const [myRequest, setMyRequest] = useState(null);
    const [showChat, setShowChat] = useState(false);

    const handleRequestSubmit = async () => {
        if (!reqForm.project_interest) {
            alert("Project interest is required.");
            return;
        }
        try {
            const res = await api.post('/collaboration/request', {
                faculty_id: id,
                project_interest: reqForm.project_interest,
                message: reqForm.message
            });
            alert("Request sent successfully!");
            setShowRequestModal(false);
            setReqForm({ project_interest: '', message: '' });
            // Set myRequest immediately so UI updates
            setMyRequest({
                id: res.data.id,
                status: 'Pending',
                message: reqForm.message // Optimistic
            });
        } catch (err) {
            console.error("Failed to send request", err);
            // Handle if user is not logged in or not a student
            if (err.response?.status === 403) {
                alert("Only Students can send requests. Please login as a student.");
            } else if (err.response?.status === 401) {
                alert("Please login to send a request.");
                navigate('/login');
            } else if (err.response?.data?.msg) {
                alert(err.response.data.msg);
            } else {
                alert("Failed to send request.");
            }
        }
    };

    useEffect(() => {
        const fetchFacultyAndStatus = async () => {
            try {
                const response = await api.get(`/faculty/${id}`);
                setFaculty(response.data);

                // If student, check if we have a request with this faculty
                if (user && user.role === 'student') {
                    const reqRes = await api.get('/collaboration/student/requests');
                    const existing = reqRes.data.find(r => r.faculty_id === id); // String comparison? id from params is string. faculty_id is string.
                    if (existing) setMyRequest(existing);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load details.');
            } finally {
                setLoading(false);
            }
        };
        fetchFacultyAndStatus();
    }, [id, user]);

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading profile...</div>;
    if (error) return <div className="container" style={{ textAlign: 'center', color: 'red', marginTop: '4rem' }}>{error}</div>;
    if (!faculty) return <div className="container">Faculty not found.</div>;

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <div style={{ background: 'yellow', color: 'black', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                DEBUG: Logged in as: <b>{user ? user.username : 'GUEST'}</b> | Role: <b>{user ? user.role : 'N/A'}</b> | ID: {id}
            </div>
            <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>&larr; Back</button>

            <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                    {faculty.profile_image ? (
                        <img
                            src={faculty.profile_image}
                            alt={faculty.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.children[1].style.display = 'block'; }}
                        />
                    ) : (
                        <span>{faculty.name.charAt(0)}</span>
                    )}
                    <span style={{ display: 'none' }}>{faculty.name.charAt(0)}</span>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #ccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {faculty.name}
                        </h1>
                        {user && user.role === 'student' && (
                            <div>
                                {myRequest ? (
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: myRequest.status === 'Pending' ? '#F59E0B' : myRequest.status === 'Accepted' ? '#10B981' : '#EF4444' }}>
                                            Status: {myRequest.status}
                                        </div>
                                        <button
                                            onClick={() => setShowChat(true)}
                                            className="btn btn-primary"
                                            style={{ background: '#3b82f6', border: 'none' }}
                                        >
                                            View Conversation 💬
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowRequestModal(true)}
                                        className="btn btn-primary"
                                        style={{ padding: '0.5rem 1.5rem', background: 'linear-gradient(to right, #8B5CF6, #EC4899)' }}
                                    >
                                        Request Collaboration
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--accent-secondary)', marginBottom: '1rem' }}>
                        {faculty.title || 'Faculty Member'} &bull; {faculty.department}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                        {faculty.institution}
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Citations</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{faculty.citations || 0}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>H-Index</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{faculty.h_index || 0}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Publications</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{faculty.publications?.length || 0}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Research Interests */}
            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Research Interests</h3>
                {faculty.research_interests && faculty.research_interests.length > 0 ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {faculty.research_interests.map((interest, idx) => (
                            <span key={idx} style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                                {interest}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No research interests listed.</p>
                )}
            </div>

            {/* Publications List */}
            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Publications</h2>
                {faculty.publications && faculty.publications.length > 0 ? (
                    <div className="row">
                        {faculty.publications.map(pub => (
                            <div key={pub.id} className="col" style={{ width: '100%', marginBottom: '1rem' }}>
                                <div className="card" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)', borderLeft: '4px solid var(--accent-secondary)' }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{pub.title}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <span>{pub.venue || 'Journal/Conference'}</span>
                                        <span>{pub.year}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No publications found.</p>
                )}
            </div>
            {/* Request Modal */}
            {showRequestModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card fade-in" style={{ width: '500px', maxWidth: '90%', padding: '2rem', background: '#1e293b' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Request Collaboration</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Express your interest in working with Prof. {faculty.name}.
                        </p>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Project Interest</label>
                            <input
                                type="text" className="input-field"
                                placeholder="e.g. Machine Learning research, Final Year Project"
                                value={reqForm.project_interest} onChange={e => setReqForm({ ...reqForm, project_interest: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Message</label>
                            <textarea
                                className="input-field" rows="4"
                                placeholder="Briefly describe your background and why you want to join..."
                                value={reqForm.message} onChange={e => setReqForm({ ...reqForm, message: e.target.value })}
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
            {showChat && myRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card fade-in" style={{ width: '600px', maxWidth: '95%', padding: '0', background: 'transparent', border: 'none' }}>
                        <CollaborationChat
                            requestId={myRequest.id}
                            initialMessage={myRequest.message}
                            onClose={() => setShowChat(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyDetails;
