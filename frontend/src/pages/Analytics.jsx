import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const Analytics = () => {
    const [metrics, setMetrics] = useState(null);
    const [deptData, setDeptData] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Overview Metrics and Trends
                const res1 = await api.get('/analytics/research');
                setMetrics(res1.data.metrics);
                setTrends(res1.data.publicationTrends);

                // Fetch Department Data
                const res2 = await api.get('/analytics/department');
                setDeptData(res2.data);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>;

    const StatCard = ({ title, value, sub, icon }) => (
        <div className="card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{title}</span>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</div>
            {sub && <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>{sub}</div>}
        </div>
    );

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem', background: 'linear-gradient(to right, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
                    Research Insights
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Real-time performance metrics and institutional growth analysis.
                </p>
            </div>

            {/* 1. Overview Cards */}
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="Total Faculty" value={metrics?.totalFaculty || 0} icon="👨‍🏫" />
                <StatCard title="Publications" value={metrics?.totalPublications || 0} icon="📚" sub="&uarr; Verified Output" />
                <StatCard title="Total Citations" value={metrics?.totalCitations.toLocaleString() || 0} icon="🌟" sub="Global Impact" />
                <StatCard title="Avg H-Index" value={metrics?.averageHIndex || 0} icon="📈" />
            </div>

            {/* 2. Trends Chart */}
            <div className="row" style={{ marginBottom: '2rem' }}>
                <div className="col" style={{ width: '100%' }}>
                    <div className="card" style={{ padding: '2rem', height: '450px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Research Growth (Publications vs Citations)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPubs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="var(--text-secondary)" />
                                <YAxis yAxisId="left" stroke="var(--text-secondary)" />
                                <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" />
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid var(--glass-border)', color: 'white' }} />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="publications" stroke="#8884d8" fillOpacity={1} fill="url(#colorPubs)" />
                                <Area yAxisId="right" type="monotone" dataKey="citations" stroke="#82ca9d" fillOpacity={1} fill="url(#colorCits)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. Departmental Analysis (Side by Side) */}
            <div className="row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Bar Chart */}
                <div className="card" style={{ padding: '2rem', height: '450px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Contribution by Department</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <XAxis type="number" stroke="var(--text-secondary)" hide />
                            <YAxis dataKey="department" type="category" width={140} stroke="var(--text-secondary)" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid var(--glass-border)', color: 'white' }} />
                            <Bar dataKey="publication_count" name="Pubs" stackId="a" fill="#8884d8" />
                            <Bar dataKey="citations" name="Citations" stackId="a" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Radar Chart (Replaces Pie) */}
                <div className="card" style={{ padding: '2rem', height: '450px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Department Strengths</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={deptData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="department" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                            <Radar name="Publications" dataKey="publication_count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Radar name="Faculty" dataKey="faculty_count" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid var(--glass-border)', color: 'white' }} />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. Detailed Table */}
            <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Department Performance Metrics</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--accent-primary)' }}>Department</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Faculty</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Publications</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Total Citations</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Avg. H-Index</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deptData.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', color: 'white' }}>{row.department}</td>
                                <td style={{ textAlign: 'center', padding: '1rem' }}>{row.faculty_count}</td>
                                <td style={{ textAlign: 'center', padding: '1rem' }}>{row.publication_count}</td>
                                <td style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{row.citations}</td>
                                <td style={{ textAlign: 'center', padding: '1rem' }}>{row.avg_h_index ? row.avg_h_index.toFixed(1) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Analytics;
