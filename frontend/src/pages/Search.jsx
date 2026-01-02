import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // Assuming this exists or using api directly

const Search = () => {
    // Search State
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState(''); // Added missing state
    const [results, setResults] = useState({
        faculty: [], publications: [], research_works: [], experts: [], // Added experts default
        meta: {
            page: 1, limit: 20,
            total_faculty: 0, total_publications: 0, total_research: 0,
            pages_faculty: 1, pages_publications: 1
        }
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('faculty');
    const [page, setPage] = useState(1);

    // Filter & Sort State
    const [filterOptions, setFilterOptions] = useState({ departments: [], domains: [], institutions: [] });
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedInstitutions, setSelectedInstitutions] = useState([]);
    const [yearRange, setYearRange] = useState({ min: '', max: '' });
    const [selectedDomains, setSelectedDomains] = useState([]); 
    const [sortBy, setSortBy] = useState('relevance');
    const [sortOrder, setSortOrder] = useState('desc');

    // Debounce query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(handler);
    }, [query]);

    // Fetch initial options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await api.get('/search/filter-options');
                setFilterOptions(res.data);
            } catch (err) {
                console.error("Failed to fetch filter options", err);
            }
        };
        fetchOptions();
    }, []);

    // Trigger search when critical params change
    useEffect(() => {
        if (debouncedQuery || activeTab) {
            handleSearch(1);
        }
    }, [debouncedQuery, selectedDepartments, selectedInstitutions, selectedDomains, sortBy, sortOrder, activeTab]); 
    // removed yearRange to avoid excessive re-renders on typing, usually trigger on blur or button, but for now ok.

    const handleSearch = async (pageNum = 1) => {
        setLoading(true);
        setPage(pageNum);
        try {
            if (activeTab === 'topics' && debouncedQuery) {
                // AI Search
                const res = await api.post('/ai/recommend', { query: debouncedQuery });
                setResults(prev => ({ ...prev, experts: res.data })); 
            } else {
                // Normal Search
                const response = await api.get('/search/all', {
                    params: {
                        q: debouncedQuery,
                        page: pageNum,
                        limit: 20,
                        year_min: yearRange.min,
                        year_max: yearRange.max,
                        institutions: selectedInstitutions.join(','),
                        departments: selectedDepartments.join(','),
                        domains: selectedDomains.join(','),
                        sort_by: sortBy,
                        sort_order: sortOrder
                    }
                });
                setResults(prev => ({
                    ...prev,
                    faculty: response.data.faculty || [],
                    publications: response.data.publications || [],
                    research_works: response.data.research_works || [],
                    meta: response.data.meta || prev.meta
                }));
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (type, value) => {
        if (type === 'dept') {
            setSelectedDepartments(prev =>
                prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
            );
        } else if (type === 'inst') {
            setSelectedInstitutions(prev =>
                prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
            );
        } else if (type === 'domain') {
            setSelectedDomains(prev =>
                prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
            );
        }
    };

    const tabStyle = (tabName) => ({
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        borderBottom: activeTab === tabName ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === tabName ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: activeTab === tabName ? '600' : '400',
        transition: 'all 0.3s'
    });

    const getMeta = () => {
        if (activeTab === 'faculty') return { total: results.meta?.total_faculty, pages: results.meta?.pages_faculty };
        if (activeTab === 'publications') return { total: results.meta?.total_publications, pages: results.meta?.pages_publications };
        return { total: results.meta?.total_research, pages: 1 };
    };

    return (
        <div className="fade-in container">
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Search ScholarSphere</h2>

            {/* Search Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(1); }} style={{ maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search for faculty, publications, or research..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Search</button>
                </div>
            </form>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* SIDEBAR FILTERS */}
                <aside style={{ width: '250px', flexShrink: 0, background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Filters</h4>

                    <div style={{ marginBottom: '2rem' }}>
                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Departments</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filterOptions.departments?.map(dept => (
                                <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDepartments.includes(dept)}
                                        onChange={() => handleFilterChange('dept', dept)}
                                    />
                                    {dept}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Institutions</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filterOptions.institutions?.map(inst => (
                                <label key={inst} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedInstitutions.includes(inst)}
                                        onChange={() => handleFilterChange('inst', inst)}
                                    />
                                    {inst}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Year Range</h5>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="number"
                                placeholder="Min"
                                className="input-field"
                                style={{ width: '45%', padding: '0.3rem', fontSize: '0.8rem' }}
                                value={yearRange.min}
                                onChange={(e) => setYearRange(prev => ({ ...prev, min: e.target.value }))}
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                className="input-field"
                                style={{ width: '45%', padding: '0.3rem', fontSize: '0.8rem' }}
                                value={yearRange.max}
                                onChange={(e) => setYearRange(prev => ({ ...prev, max: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Research Domains</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filterOptions.domains?.map(domain => (
                                <label key={domain} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDomains.includes(domain)}
                                        onChange={() => handleFilterChange('domain', domain)}
                                    />
                                    {domain}
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <div style={{ flex: 1 }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div onClick={() => setActiveTab('faculty')} style={tabStyle('faculty')}>
                                Faculty ({results.meta?.total_faculty || 0})
                            </div>
                            <div onClick={() => setActiveTab('publications')} style={tabStyle('publications')}>
                                Publications ({results.meta?.total_publications || 0})
                            </div>
                            <div onClick={() => setActiveTab('research')} style={tabStyle('research')}>
                                Research Works
                            </div>
                            <div onClick={() => setActiveTab('topics')} style={tabStyle('topics')}>
                                Expert Finder 🤖
                            </div>
                        </div>

                        {/* Sort */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="input-field"
                                style={{ padding: '0.4rem', width: 'auto' }}
                            >
                                <option value="relevance">Relevance</option>
                                <option value="name">Name / Title</option>
                                <option value="year">Year (Pubs)</option>
                                <option value="citations">Citations</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.8rem' }}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>

                    {/* Results Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', color: 'var(--accent-secondary)', padding: '2rem' }}>Looking for results...</div>
                    ) : (
                        <div className="results-container">
                            {/* FACULTY TAB */}
                            {activeTab === 'faculty' && (
                                results.faculty.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No faculty found matching criteria.</p> : results.faculty.map(f => (
                                    <Link to={`/faculty/${f.id}`} key={f.id} style={{ textDecoration: 'none' }}>
                                        <div className="card" style={{ height: '100%', padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', transition: 'transform 0.2s', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-primary)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                                                {f.profile_image ? (
                                                    <img
                                                        src={f.profile_image}
                                                        alt={f.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                    />
                                                ) : (
                                                    <span>{f.name.charAt(0)}</span>
                                                )}
                                                <span style={{ display: 'none' }}>{f.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '1.1rem' }}>{f.name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{f.title || 'Faculty Member'}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{f.department}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}

                            {/* PUBLICATIONS TAB */}
                            {activeTab === 'publications' && (
                                results.publications.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No publications found matching criteria.</p> :
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {results.publications.map(p => (
                                            <div key={p.id} className="card" style={{ height: '100%', padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.4' }}>{p.title}</h4>
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px' }}>{p.year || 'N/A'}</span>
                                                </div>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: p.expanded ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {p.abstract ? (p.summary ? <><strong style={{ color: 'var(--accent-secondary)' }}>AI Summary:</strong> {p.summary}</> : p.abstract) : 'No abstract available.'}
                                                </p>
                                                <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                                                    <span>Citations: {p.citations || 0}</span>
                                                    {p.abstract && !p.summary && (
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    const res = await api.post('/ai/summarize', { text: p.abstract });
                                                                    setResults(prev => ({
                                                                        ...prev,
                                                                        publications: prev.publications.map(pub => pub.id === p.id ? { ...pub, summary: res.data.summary, expanded: true } : pub)
                                                                    }));
                                                                } catch (err) { alert("Failed to summarize"); }
                                                            }}
                                                        >
                                                            ✨ AI Summarize
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            )}

                            {/* RESEARCH WORKS TAB */}
                            {activeTab === 'research' && (
                                results.research_works.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No research works found matching criteria.</p> :
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {results.research_works.map(r => (
                                            <div key={r.id} className="card" style={{ height: '100%', padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>{r.title}</h4>
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '12px' }}>{r.year || 'N/A'}</span>
                                                </div>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{r.description}</p>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'rgba(139, 92, 246, 0.1)',
                                                    color: 'var(--accent-primary)',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {r.domain}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                            )}

                            {/* EXPERT FINDER TAB (AI) */}
                            {activeTab === 'topics' && (
                                results.experts && results.experts.length > 0 ? results.experts.map(f => (
                                    <Link to={`/faculty/${f.id}`} key={f.id} style={{ textDecoration: 'none' }}>
                                        <div className="card" style={{ height: '100%', padding: '1.5rem', background: 'rgba(76, 29, 149, 0.2)', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', overflow: 'hidden', marginBottom: '1rem' }}>
                                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent-primary)', color: 'white', padding: '2px 8px', fontSize: '0.7rem', borderBottomLeftRadius: '8px' }}>
                                                {f.score}% Match
                                            </div>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>
                                                {f.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 style={{ color: 'white', marginBottom: '0.2rem', fontSize: '1.1rem' }}>{f.name}</h4>
                                                <div style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>{f.department}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                                    {f.interests.join(", ")}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )) : <p style={{ color: 'var(--text-secondary)' }}>Type a query to find experts (e.g. "Machine Learning").</p>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {getMeta() && getMeta().pages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                className="btn btn-secondary"
                                disabled={page === 1}
                                onClick={() => handleSearch(page - 1)}
                            >
                                Previous
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                                Page {page} of {getMeta().pages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={page === getMeta().pages}
                                onClick={() => handleSearch(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;
