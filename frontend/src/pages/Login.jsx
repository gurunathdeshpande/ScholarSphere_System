import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // Default role
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Pass role to login function (need to update AuthContext too!)
            // Actually, better to pass it in helper or check if logic allows
            // Wait, standard login usually doesn't need role if username is unique.
            // BUT, user requirement says "User must select role... Incorrect role selection must be rejected".
            // So we MUST pass role to backend.
            await login(username, password, role);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid credentials or role');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }} className="fade-in">
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Welcome Back</h2>
                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Login As</label>
                        <select
                            className="input-field"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={{ background: 'var(--bg-secondary)' }}
                        >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty Member</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Sign In
                    </button>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Don't have an account? <br />
                        <span onClick={() => navigate('/register')} style={{ color: '#60A5FA', cursor: 'pointer', textDecoration: 'underline' }}>Register Here</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
