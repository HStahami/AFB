import React, { useState, useEffect } from 'react';
import { resourcesApi, modulesApi } from '../../api';

export function InstructorResources() {
  const [resources, setResources] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'pdf',
    url: '',
    module_id: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedModule]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resData, modData] = await Promise.all([
        resourcesApi.getAll(selectedModule || null),
        modulesApi.getAll(),
      ]);
      setResources(resData || []);
      setModules(modData || []);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load educational resources.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) {
      setError('Title and resource URL are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await resourcesApi.create({
        ...formData,
        module_id: formData.module_id || (modules[0]?.id ?? null),
      });
      setSuccess('Resource successfully shared with your students!');
      setModalOpen(false);
      setFormData({
        title: '',
        description: '',
        resource_type: 'pdf',
        url: '',
        module_id: '',
      });
      await loadData();
    } catch (err) {
      console.error('Error creating resource:', err);
      setError(err.message || 'Failed to create resource.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await resourcesApi.delete(id);
      setSuccess('Resource removed successfully.');
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError(err.message || 'Failed to delete resource.');
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = !selectedModule || res.module_id === selectedModule;
    return matchesSearch && matchesModule;
  });

  const getModuleTitle = (moduleId) => {
    const mod = modules.find((m) => m.id === moduleId);
    return mod ? mod.title : 'General';
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Learning Resources
          </h1>
          <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
            Manage course materials, readings, audio recordings, and guides for your classes.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary"
          style={{
            padding: '0.65rem 1.4rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>+</span> Upload Resource
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            borderLeft: '4px solid #10b981',
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
          }}
        >
          {success}
        </div>
      )}
      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            borderLeft: '4px solid #ef4444',
            color: '#f87171',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
          }}
        >
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
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search resources by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}
          />

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              minWidth: '200px',
            }}
          >
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m.id || m._id} value={m.id || m._id}>
                {m.title || m.name || 'Module'}
              </option>
            ))}
          </select>
        </div>

        <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>
          Showing {filteredResources.length} of {resources.length} resources
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          Loading resources...
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Resources Found</h3>
          <p style={{ color: '#8892b0', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            You haven't uploaded any resources matching this query yet. Share reference materials, study guides, and recordings with your students.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
            style={{ padding: '0.6rem 1.2rem', border: 'none', cursor: 'pointer' }}
          >
            Upload First Resource
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                    }}
                  >
                    <span>{getTypeIcon(res.resource_type)}</span>
                    {res.resource_type || 'PDF'}
                  </span>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#8892b0',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    {getModuleTitle(res.module_id)}
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
                  {res.description || 'No description provided.'}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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
                  style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  View Material ↗
                </a>

                <button
                  onClick={() => handleDeleteResource(res.id, res.title)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: '0.2rem 0.5rem',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Resource Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                Upload Learning Resource
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arabic Grammar Summary - Lesson 4"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                    Resource Type *
                  </label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video Recording</option>
                    <option value="audio">Audio File</option>
                    <option value="link">Web Reference / Link</option>
                    <option value="document">Spreadsheet / Document</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                    Associated Module
                  </label>
                  <select
                    value={formData.module_id}
                    onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">General / Shared</option>
                    {modules.map((m) => (
                      <option key={m.id || m._id} value={m.id || m._id}>
                        {m.title || m.name || 'Module'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                  Resource URL / Cloudinary Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://res.cloudinary.com/... or Google Drive link"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                  Description / Study Guidelines
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief note or instructions on how to use this resource..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="glass-panel"
                  style={{
                    padding: '0.65rem 1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#8892b0',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.5rem',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Uploading...' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
