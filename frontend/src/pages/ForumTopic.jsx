import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ForumTopic = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');

    const fetchTopic = async () => {
        try {
            const res = await api.get(`/forum/topic/${id}`);
            setTopic(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopic();
    }, [id]);

    const handleReply = async () => {
        if (!reply) return;
        try {
            await api.post(`/forum/topic/${id}/reply`, { content: reply });
            setReply('');
            fetchTopic(); // Refresh
        } catch (err) {
            alert("Failed to post reply. Ensure you are logged in.");
        }
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading discussion...</div>;
    if (!topic) return <div className="container">Topic not found.</div>;

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <button onClick={() => navigate('/forum')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>&larr; Back to Forum</button>

            {/* Main Post */}
            <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>{topic.title}</h1>
                    <span style={{ fontSize: '0.9rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '12px', height: 'fit-content' }}>{topic.category}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    Posted by <strong style={{ color: 'white' }}>{topic.author}</strong> on {new Date(topic.created_at).toLocaleString()}
                </div>
                <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {topic.content}
                </div>
            </div>

            {/* Replies */}
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Replies ({topic.replies.length})</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                {topic.replies.map(r => (
                    <div key={r.id} style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', borderLeft: '3px solid var(--accent-secondary)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            <strong style={{ color: 'var(--accent-secondary)' }}>{r.author}</strong> &bull; {new Date(r.created_at).toLocaleString()}
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{r.content}</p>
                    </div>
                ))}
            </div>

            {/* Reply Input */}
            {user ? (
                <div className="card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'white' }}>Leave a Reply</h4>
                    <textarea
                        className="input-field" rows="4"
                        placeholder="Join the discussion..."
                        value={reply} onChange={e => setReply(e.target.value)}
                    />
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button onClick={handleReply} className="btn btn-primary">Post Reply</button>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <p>Please <Link to="/login" style={{ color: 'var(--accent-primary)' }}>login</Link> to reply.</p>
                </div>
            )}
        </div>
    );
};

export default ForumTopic;
