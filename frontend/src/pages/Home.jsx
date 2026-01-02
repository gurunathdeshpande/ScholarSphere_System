import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Determine which endpoint to use. 
            // Currently analytics/research gives the full dashboard payload.
            const response = await api.get('/analytics/research');
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const heroStyle = {
        textAlign: 'center',
        padding: '3rem 1rem',
        marginBottom: '2rem'
    };

    const gradientText = {
        background: 'linear-gradient(to right, #8B5CF6, #06B6D4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '3rem',
        fontWeight: '700',
        marginBottom: '0.5rem'
    };

    // Helper for CSS Chart
    const maxPubs = stats?.publicationTrends?.reduce((max, t) => Math.max(max, t.publications), 0) || 1;

    return (
        <div className="container fade-in">
            {/* HERO SECTION */}
            <div style={heroStyle}>
                <h1 style={gradientText}>ScholarSphere</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Visualizing academic excellence. Explore faculty research, citations, and trends.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', margin: '4rem', color: 'var(--accent-secondary)' }}>Loading analytics...</div>
            ) : error ? (
                <div style={{ textAlign: 'center', color: 'var(--error)', margin: '4rem' }}>{error}</div>
            ) : (
                <>
                    {/* 1. GLOBAL METRICS */}
                    <div className="row" style={{ marginBottom: '2.5rem' }}>
                        {[
                            { label: 'Total Faculty', value: stats.metrics.totalFaculty, color: 'var(--accent-primary)' },
                            { label: 'Total Publications', value: stats.metrics.totalPublications, color: 'var(--accent-secondary)' },
                            { label: 'Total Citations', value: stats.metrics.totalCitations, color: '#10B981' }, // Success Green
                            { label: 'Avg H-Index', value: stats.metrics.averageHIndex, color: '#F59E0B' } // Amber
                        ].map((stat, idx) => (
                            <div key={idx} className="col" style={{ minWidth: '200px', marginBottom: '1rem' }}>
                                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <button onClick={fetchAnalytics} className="btn btn-secondary" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🔄 Refresh Data
                        </button>
                    </div>

                    <div className="row" style={{ alignItems: 'stretch' }}>
                        {/* 2. PUBLICATION TRENDS (CSS CHART) */}
                        <div className="col" style={{ flex: '2', minWidth: '400px', marginBottom: '2rem' }}>
                            <div className="card" style={{ height: '100%', padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Research Output History</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '10px', paddingTop: '1rem' }}>
                                    {stats.publicationTrends.length > 0 ? stats.publicationTrends.slice(-15).map((trend) => (
                                        <div key={trend.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                            <div className="bar" style={{
                                                width: '100%',
                                                background: 'linear-gradient(to top, var(--accent-primary), var(--accent-secondary))',
                                                opacity: 0.8,
                                                borderRadius: '4px 4px 0 0',
                                                height: `${(trend.publications / maxPubs) * 100}%`,
                                                minHeight: '4px',
                                                transition: 'height 1s ease',
                                                position: 'relative'
                                            }} title={`${trend.publications} Publications in ${trend.year}`}>
                                                <span style={{
                                                    position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                                                    fontSize: '0.7rem', color: 'var(--text-primary)', opacity: 0, transition: 'opacity 0.2s',
                                                    pointerEvents: 'none'
                                                }} className="bar-label">{trend.publications}</span>
                                            </div>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{trend.year}</div>
                                        </div>
                                    )) : <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>No trend data available</div>}
                                </div>
                            </div>
                        </div>

                        {/* 3. TOP RESEARCH AREAS (TABLE) */}
                        <div className="col" style={{ flex: '1', minWidth: '300px', marginBottom: '2rem' }}>
                            <div className="card" style={{ height: '100%', padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Top Research Areas</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {stats.topResearchAreas.length > 0 ? stats.topResearchAreas.slice(0, 5).map((area, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{area.topic}</span>
                                            <span style={{
                                                background: area.growth_rate > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.1)',
                                                color: area.growth_rate > 0 ? 'var(--success)' : 'var(--text-secondary)',
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem'
                                            }}>
                                                {area.trending_score} Pubs
                                            </span>
                                        </div>
                                    )) : <div style={{ color: 'var(--text-secondary)' }}>No research areas found</div>}
                                </div>
                                <button onClick={() => navigate('/search')} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', fontSize: '0.9rem' }}>Explore All Domains</button>
                            </div>
                        </div>
                    </div>

                    {/* 4. RECENT ACTIVITY */}
                    <div className="row">
                        {/* Recent Faculty */}
                        <div className="col" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Newest Faculty</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.recentActivity?.faculty.map(f => (
                                    <div key={f.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            {f.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{f.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.department}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Publications */}
                        <div className="col" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Recent Publications</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.recentActivity?.publications.map(p => (
                                    <div key={p.id} className="card" style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.3rem', fontSize: '0.95rem' }}>
                                            {p.title.length > 50 ? p.title.substring(0, 50) + '...' : p.title}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <span>{p.year}</span>
                                            <span style={{ color: 'var(--accent-secondary)' }}>{p.citations || 0} Citations</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
