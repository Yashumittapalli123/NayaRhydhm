import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { saveSong, deleteSong } from '../utils/indexedDB';

function fmt(s) {
  if (!s) return '--:--';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const { addSong, playlist, downloadedSongs, addDownloadedSong, removeDownloadedSong } = useStore();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isRender = window.location.hostname.endsWith('onrender.com');
      const envUrl = import.meta.env.VITE_API_URL;
      const apiUrl = (envUrl?.startsWith('http')) ? envUrl : ((isLocal || isRender) ? '/api' : (envUrl || '/api'));
      const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}`);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error('Server returned malformed response'); }
      
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'API not available');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === 'Enter') search(); if (e.key === 'Escape') onClose(); };
  const isAdded = id => playlist.some(s => s.id === id);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
    }}>
      <div onClick={e => e.stopPropagation()} className="glass-2 fade-up" style={{
        width: '100%', maxWidth: 640, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Search Input Area */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
               <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search songs, artists, or albums..."
                style={{
                  width: '100%', padding: '14px 20px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)', color: 'white',
                  fontSize: 15, fontWeight: 500, outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              />
            </div>
            <button className="btn-primary" onClick={search} style={{ padding: '0 16px', height: 44 }}>
              <span className="hide-mobile">Search</span>
              <span className="show-mobile-only">🔍</span>
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', 
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 24,
              transition: 'color 0.2s', padding: '0 8px',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >×</button>
          </div>
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div className="spin" style={{ fontSize: 40, width: 44, height: 44, border: '4px solid var(--glass-border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600 }}>Curating results...</div>
            </div>
          )}
          
          {error && <div style={{ padding: 20, background: 'rgba(255,101,132,0.1)', borderRadius: 'var(--radius-md)', color: '#ff6584', fontSize: 14, fontWeight: 600 }}>⚠ {error}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.isArray(results) && results.map((song, i) => (
              <div key={song.id} className="fade-up" style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                animationDelay: `${i * 0.05}s`,
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <img src={song.thumbnail} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{fmt(song.duration)}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <DownloadBtn song={song} downloadedSongs={downloadedSongs} addDownloadedSong={addDownloadedSong} removeDownloadedSong={removeDownloadedSong} />
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); addSong(song); }}
                    disabled={isAdded(song.id)}
                    style={{
                      padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
                      background: isAdded(song.id) ? 'var(--glass)' : 'var(--brand-gradient)',
                      color: isAdded(song.id) ? 'var(--text-muted)' : 'white',
                      fontWeight: 700, fontSize: 13,
                      cursor: isAdded(song.id) ? 'default' : 'pointer', flexShrink: 0,
                      transition: 'all 0.2s',
                      boxShadow: isAdded(song.id) ? 'none' : '0 4px 10px rgba(108,99,255,0.2)',
                    }}
                  >
                    {isAdded(song.id) ? '✓ In Queue' : 'Add to Queue'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && results.length === 0 && query && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.2 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>We couldn't find that track</div>
              <p style={{ fontSize: 12, marginTop: 4 }}>Try searching for the artist or a specific song title.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadBtn({ song, downloadedSongs, addDownloadedSong, removeDownloadedSong }) {
  const [downloading, setDownloading] = useState(false);
  const isDownloaded = downloadedSongs.some(s => s.id === song.id);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (isDownloaded) {
      await deleteSong(song.id);
      removeDownloadedSong(song.id);
      return;
    }

    setDownloading(true);
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isRender = window.location.hostname.endsWith('onrender.com');
      const envUrl = import.meta.env.VITE_API_URL;
      const apiUrl = (envUrl?.startsWith('http')) ? envUrl : ((isLocal || isRender) ? '/api' : (envUrl || '/api'));
      const streamUrl = `${apiUrl}/stream?url=${encodeURIComponent(song.url)}`;
      
      const res = await fetch(streamUrl);
      const blob = await res.blob();
      await saveSong(song.id, blob);
      addDownloadedSong(song);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      style={{
        background: isDownloaded ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer',
        width: 36, height: 36, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, transition: 'all 0.2s',
      }}
      title={isDownloaded ? "Remove Offline" : "Download Offline"}
    >
      {downloading ? (
        <div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
      ) : isDownloaded ? (
        "✓"
      ) : (
        "↓"
      )}
    </button>
  );
}
