import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [activeTab, setActiveTab] = useState('student'); // 'student' or 'faculty'

    // Common State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Faculty Specific State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    // Handlers
    const handleFacultySearch = async () => {
        if (!searchQuery || searchQuery.length < 3) return;
        setIsSearching(true);
        try {
            const res = await api.get(`/faculty/search-public?name=${searchQuery}`);
            setSearchResults(res.data);
            if (res.data.length === 0) setError("No faculty found with that name.");
            else setError('');
        } catch (err) {
            console.error(err);
            setError("Search failed.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectFaculty = (faculty) => {
        if (faculty.user_id) {
            alert("This faculty profile is already registered!");
            return;
        }
        setSelectedFaculty(faculty);
        setEmail(faculty.email); // Auto-fill
        setUsername(faculty.name); // Auto-fill suggestion
        setSearchResults([]); // Clear results
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (activeTab === 'faculty' && !selectedFaculty) {
            setError("You must find and select your faculty profile first.");
            return;
        }

        // Final sanity check for Faculty email match (handled by backend mostly, but good UX)
        if (activeTab === 'faculty' && selectedFaculty && email !== selectedFaculty.email) {
            setError("Email must match your institution record.");
            return;
        }

        try {
            await register(username, email, password, activeTab);
            navigate('/');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.msg || 'Registration failed.';

            // Handle Strict Block
            if (err.response?.status === 403 && err.response?.data?.code === 'FACULTY_NOT_FOUND') {
                setError(
                    <span>
                        {msg} <br />
                        <Link to="/request-verification" style={{ color: '#60A5FA', fontWeight: 'bold' }}>
                            Click here to request verification.
                        </Link>
                    </span>
                );
            } else {
                setError(msg);
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }} className="fade-in">
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '0' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={() => { setActiveTab('student'); setError(''); setSelectedFaculty(null); }}
                        style={{ flex: 1, padding: '1rem', background: activeTab === 'student' ? 'rgba(139, 92, 246, 0.1)' : 'transparent', border: 'none', color: activeTab === 'student' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Student Registration
                    </button>
                    <button
                        onClick={() => { setActiveTab('faculty'); setError(''); }}
                        style={{ flex: 1, padding: '1rem', background: activeTab === 'faculty' ? 'rgba(139, 92, 246, 0.1)' : 'transparent', border: 'none', color: activeTab === 'faculty' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Faculty Registration
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        {activeTab === 'student' ? 'Student Sign Up 🎓' : 'Faculty Access 🏛️'}
                    </h2>

                    {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                    {activeTab === 'faculty' && !selectedFaculty && (
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Find your institution profile to register.
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Search your name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button onClick={handleFacultySearch} className="btn btn-secondary" disabled={isSearching}>
                                    {isSearching ? '...' : 'Search'}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                    {searchResults.map(f => (
                                        <div key={f.id} style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: f.user_id ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{f.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.department}</div>
                                                </div>
                                                {f.user_id ? (
                                                    <span style={{ fontSize: '0.8rem', color: '#F87171' }}>Registered</span>
                                                ) : (
                                                    <button onClick={() => handleSelectFaculty(f)} className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Select</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Not found? </span>
                                <Link to="/request-verification" style={{ color: '#60A5FA', fontSize: '0.9rem' }}>Request Verification</Link>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'student' || selectedFaculty) && (
                        <form onSubmit={handleSubmit} className="fade-in">
                            {selectedFaculty && (
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #10B981', fontSize: '0.9rem', textAlign: 'center' }}>
                                    ✅ Linking to: <strong>{selectedFaculty.name}</strong>
                                    <button type="button" onClick={() => setSelectedFaculty(null)} style={{ background: 'none', border: 'none', color: '#F87171', marginLeft: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
                                </div>
                            )}

                            <div className="input-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Email {activeTab === 'faculty' && '(Institutional)'}</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    readOnly={activeTab === 'faculty' && !!selectedFaculty} // Lock email for faculty
                                    style={{ opacity: activeTab === 'faculty' && selectedFaculty ? 0.7 : 1 }}
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                {activeTab === 'student' ? 'Register as Student' : 'Complete Registration'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
