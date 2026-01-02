import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Forum = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [category, setCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTopic, setNewTopic] = useState({ title: '', content: '', category: 'General' });

    useEffect(() => {
        const fetchTopics = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/forum/topics?category=${category}`);
                setTopics(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTopics();
    }, [category]);

    const handleCreate = async () => {
        if (!newTopic.title || !newTopic.content) return alert("Title and Content required");
        try {
            await api.post('/forum/topic', newTopic);
            setShowModal(false);
            setNewTopic({ title: '', content: '', category: 'General' });
            // Refresh
            const res = await api.get(`/forum/topics?category=${category}`);
            setTopics(res.data);
        } catch (err) {
            alert("Failed to create topic");
        }
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ background: 'linear-gradient(to right, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
                    Academic Forum
                </h1>
                {user && (
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">+ New Topic</button>
                )}
            </div>

            {/* Categories */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['All', 'General', 'Research', 'Career', 'Help'].map(c => (
                    <button
                        key={c}
                        onClick={() => setCategory(c)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: category === c ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Topics List */}
            {loading ? <div style={{ textAlign: 'center' }}>Loading topics...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {topics.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No topics found in this category.</p> : topics.map(topic => (
                        <Link to={`/forum/topic/${topic.id}`} key={topic.id} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', transition: 'transform 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '12px' }}>{topic.category}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(topic.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{topic.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{topic.preview}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Posted by <span style={{ color: 'var(--accent-primary)' }}>{topic.author}</span></span>
                                    <span>{topic.replies_count} replies</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card fade-in" style={{ width: '600px', maxWidth: '90%', padding: '2rem', background: '#1e293b' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Start a Discussion</h3>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Category</label>
                            <select
                                className="input-field"
                                value={newTopic.category} onChange={e => setNewTopic({ ...newTopic, category: e.target.value })}
                            >
                                <option>General</option>
                                <option>Research</option>
                                <option>Career</option>
                                <option>Help</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Topic Title</label>
                            <input
                                type="text" className="input-field"
                                value={newTopic.title} onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Content</label>
                            <textarea
                                className="input-field" rows="6"
                                value={newTopic.content} onChange={e => setNewTopic({ ...newTopic, content: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleCreate} className="btn btn-primary">Post Topic</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forum;
