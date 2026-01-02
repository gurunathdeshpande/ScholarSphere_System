import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import api from '../services/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                const res = await api.get('/notifications/');
                setNotifications(res.data);
                setUnreadCount(res.data.filter(n => !n.is_read).length);
            } catch (err) {
                console.error("Failed to load notifications");
            }
        };
        fetchNotifs();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const handleNotificationClick = async (notification) => {
        await markRead(notification.id);
        setShowNotifs(false);

        // Simple logic to redirect based on keyword
        const msg = notification.message.toLowerCase();
        if (msg.includes('collaboration')) {
            if (user.role === 'faculty') navigate('/dashboard'); // Faculty goes to dashboard to see request
            else navigate('/faculty/1'); // Student goes to... generic? or just stays. 
            // Better: Faculty -> Dashboard (Incoming Requests)
            // Student -> Dashboard (My Requests - if implemented). For now, just Dashboard.
        } else if (msg.includes('forum') || msg.includes('reply')) {
            navigate('/forum');
        } else {
            // General
            navigate('/dashboard');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navStyle = {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid var(--glass-border)',
        padding: '1rem 0'
    };

    const flexStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    const linkStyle = {
        color: 'var(--text-secondary)',
        marginRight: '2rem',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'color 0.3s'
    };

    const brandStyle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        background: 'linear-gradient(to right, #8B5CF6, #06B6D4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textDecoration: 'none'
    };

    return (
        <nav style={navStyle}>
            <div className="container" style={flexStyle}>
                <Link to="/" style={brandStyle}>ScholarSphere</Link>

                <Link to="/" style={linkStyle}>Home</Link>
                <Link to="/analytics" style={linkStyle}>Analytics</Link>
                {user && user.role === 'student' && (
                    <Link to="/student/collaboration" style={{ ...linkStyle, color: 'var(--accent-primary)', fontWeight: 'bold' }}>Collaborate 🤝</Link>
                )}
                <Link to="/search" style={linkStyle}>Search</Link>
                <Link to="/forum" style={linkStyle}>Forum</Link>

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {user.role === 'faculty' && (
                            <>
                                <Link to="/dashboard" style={linkStyle}>My Dashboard</Link>
                                <Link to="/faculty/collaboration" style={{ ...linkStyle, color: 'var(--accent-primary)', fontWeight: 'bold' }}>Collaborations 📬</Link>
                            </>
                        )}
                        {user.role === 'admin' && (
                            <Link to="/admin" style={{ ...linkStyle, color: '#F87171', fontWeight: 'bold' }}>Admin Panel 🛡️</Link>
                        )}

                        {/* Notification Bell */}
                        <div style={{ position: 'relative', marginRight: '1.5rem', cursor: 'pointer' }} onClick={() => setShowNotifs(!showNotifs)}>
                            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>🔔</span>
                            {unreadCount > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', fontSize: '0.7rem', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}

                            {showNotifs && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, width: '300px', background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'white' }}>Notifications</h4>
                                    {notifications.length === 0 ? <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No notifications.</p> : (
                                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {notifications.map(n => (
                                                <div key={n.id} onClick={() => handleNotificationClick(n)} style={{ padding: '0.5rem', background: n.is_read ? 'transparent' : 'rgba(139, 92, 246, 0.1)', borderRadius: '4px', cursor: 'pointer' }}>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{n.message}</p>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <span style={{ color: 'var(--text-primary)' }}>
                            {user.username} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{user.role}</span>
                        </span>
                        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/login" style={linkStyle}>Login</Link>
                        <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1.5rem' }}>
                            Get Started
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
