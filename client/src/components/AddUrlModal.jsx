import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function AddUrlModal({ onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const { addSong } = useStore();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const add = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true); setError('');
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isRender = window.location.hostname.endsWith('onrender.com');
      const envUrl = import.meta.env.VITE_API_URL;
      const apiUrl = (envUrl?.startsWith('http')) ? envUrl : ((isLocal || isRender) ? '/api' : (envUrl || '/api'));
      
      const res = await fetch(`${apiUrl}/metadata?url=${encodeURIComponent(trimmed)}`);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error('Server returned invalid data'); }

      if (!res.ok) throw new Error(data.error || 'Failed to fetch metadata');
      addSong(data);
      setUrl('');
      onClose();
    } catch (e) {
      setError(e.message || 'Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') onClose(); };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} className="glass-2 fade-up" style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
        padding: '32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
           <div className="pulse-glow" style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--brand-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'white', margin: '0 auto 16px',
            boxShadow: '0 0 24px rgba(108,99,255,0.4)',
          }}>🔗</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Import Track</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Paste any YouTube URL to add it to your queue</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKey}
              placeholder="https://youtube.com/watch?v=..."
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', color: 'white',
                fontSize: 14, fontWeight: 500, outline: 'none',
              }}
            />
          </div>

          {error && <div style={{ padding: '12px 16px', background: 'rgba(255,101,132,0.1)', borderRadius: 'var(--radius-sm)', color: '#ff6584', fontSize: 13, fontWeight: 600 }}>⚠ {error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button onClick={onClose} style={{ 
              flex: 1, padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={add} disabled={loading} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? <div className="spin" style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white' }} /> : 'Add Track'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
