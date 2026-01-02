import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RequestVerification = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', department: '', message: ''
    });
    const [status, setStatus] = useState('idle');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/verification/request', formData);
            setStatus('success');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || "Failed to submit request");
        }
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Request Faculty Verification 🏛️</h1>

            {status === 'success' ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981' }}>
                    <h3 style={{ color: '#10B981' }}>Request Submitted Successfully!</h3>
                    <p>Our administrators will review your details. You will be notified once your profile is verified and ready for registration.</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Return Home</Link>
                </div>
            ) : (
                <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                        If you are a faculty member but cannot register, your details may be missing from our institution records. Please submit a verification request.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" name="name" className="input-field" required onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Institutional Email</label>
                            <input type="email" name="email" className="input-field" required onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Department</label>
                            <input type="text" name="department" className="input-field" required onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Message / Additional Info (Optional)</label>
                            <textarea name="message" className="input-field" rows="3" onChange={handleChange}></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary">Submit Request</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RequestVerification;
