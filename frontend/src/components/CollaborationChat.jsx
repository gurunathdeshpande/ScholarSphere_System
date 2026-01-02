import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CollaborationChat = ({ requestId, initialMessage, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/collaboration/${requestId}/messages`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to load messages", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
        // Poll every 5 seconds for new messages
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [requestId]);

    useEffect(() => {
        // Scroll to bottom on new messages
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await api.post(`/collaboration/${requestId}/reply`, { message: newMessage });
            setMessages([...messages, res.data.data]);
            setNewMessage('');
        } catch (err) {
            console.error("Failed to send reply", err);
            alert("Failed to send message");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '500px', background: '#1e293b', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Conversation History</h3>
                {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>}
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {loading && <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading chat...</div>}

                {/* Initial Request Message (if passed) - Optional, but good context */}
                {initialMessage && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: 'rgba(255, 255, 255, 0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 'bold', marginBottom: '0.3rem' }}>Original Request:</p>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{initialMessage}</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        alignSelf: msg.is_me ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        background: msg.is_me ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)' : 'rgba(255, 255, 255, 0.1)',
                        padding: '0.8rem 1rem',
                        borderRadius: msg.is_me ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {!msg.is_me && <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.2rem' }}>{msg.sender_name}</div>}
                        <div style={{ wordBreak: 'break-word' }}>{msg.message}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.4rem', textAlign: 'right' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
                <button type="submit" disabled={!newMessage.trim()} className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default CollaborationChat;
