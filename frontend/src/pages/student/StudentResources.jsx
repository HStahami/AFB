import React, { useState, useEffect } from 'react';
import { resourcesApi } from '../../api';

export function StudentResources() {
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resourcesApi.getAll();
      setResources(data || []);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load study resources.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || res.resource_type === typeFilter || res.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎧';
      case 'link':
        return '🔗';
      default:
        return '📁';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          Learning Resources & Materials
        </h1>
        <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
          Reference worksheets, audio recordings, study guides, and readings provided for your course.
        </p>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search study materials by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              minWidth: '160px',
            }}
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF Documents</option>
            <option value="audio">Audio Files</option>
            <option value="video">Video Recordings</option>
            <option value="link">Web Links</option>
            <option value="document">General Documents</option>
          </select>
        </div>

        <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>
          Showing {filtered.length} of {resources.length} materials
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          Loading course materials...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Resources Available</h3>
          <p style={{ color: '#8892b0', margin: 0 }}>
            No study materials have been published for your enrolled courses yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filtered.map((res) => {
            const resType = res.resource_type || res.type || 'document';
            return (
              <div
                key={res.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                      }}
                    >
                      <span>{getTypeIcon(resType)}</span>
                      {resType}
                    </span>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#8892b0',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {res.module_title || 'Course Material'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                    {res.title}
                  </h3>

                  <p
                    style={{
                      color: '#b0c4c6',
                      fontSize: '0.85rem',
                      lineHeight: '1.45',
                      marginBottom: '1.25rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {res.description || 'Study reference material for your lessons.'}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      padding: '0.45rem 1rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    Open Material ↗
                  </a>

                  <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>
                    {res.created_at ? new Date(res.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
