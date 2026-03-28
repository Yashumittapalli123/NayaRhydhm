import { useState } from 'react';
import { useStore } from '../store/useStore';
import Logo from './Logo';
import AIVibeSearch from './AIVibeSearch';
import { saveSong, deleteSong } from '../utils/indexedDB';

function fmt(s) {
  if (!s) return '--:--';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Sidebar({ onSearch, onAddUrl, onClose }) {
  const { 
    playlist, currentIndex, setCurrentIndex, removeSong, clearPlaylist, 
    vibeHistory, addSong, removeVibeFromHistory, 
    recentSongs, removeRecentSong,
    downloadedSongs, addDownloadedSong, removeDownloadedSong 
  } = useStore();
  const [hoveredId, setHoveredId] = useState(null);
  const [isAiVibeOpen, setIsAiVibeOpen] = useState(false);

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column',
      gap: 20, position: 'relative', height: '100%',
    }}>
      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none',
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer'
        }}
        className="show-mobile-only"
      >
        ✕
      </button>
      {/* Header Section */}
      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="sidebar-logo">
            <Logo size={44} />
          </div>
          <div className="sidebar-text">
            <h1 className="text-gradient" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>NayaRhydhm</h1>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Premium Audio</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsAiVibeOpen(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14,
              background: 'linear-gradient(135deg, #FF0080, #7928CA)', // Hyper-modern AI gradient
              boxShadow: '0 0 15px rgba(255,0,128,0.3)'
            }}>
            <span>✨</span> <span className="sidebar-text">AI-Vibe Discovery</span>
          </button>
          
          <button className="btn-primary" onClick={onSearch} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14,
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white'
          }}>
            <span>🔍</span> <span className="sidebar-text">Search YouTube</span>
          </button>
          <button onClick={onAddUrl} style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span style={{ marginRight: 4 }}>＋</span> <span className="sidebar-text">Add Custom URL</span>
          </button>
        </div>
      </div>
      {/* AI Curation History */}
      {vibeHistory.length > 0 && (
        <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Discovery History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
            {vibeHistory.map((vibe) => (
              <div 
                key={vibe.id}
                onClick={() => {
                  clearPlaylist();
                  vibe.songs.forEach(s => addSong(s));
                }}
                style={{ 
                  padding: '8px 12px', background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <span style={{ fontSize: 16 }}>📁</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                    {vibe.prompt}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {vibe.songs.length} tracks curation
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeVibeFromHistory(vibe.id); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 14, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ff6584'; e.currentTarget.style.background = 'rgba(255,101,132,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Offline Library Section */}
      <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: 'var(--accent)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>💾</span> Offline Library
        </div>
        
        {downloadedSongs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
            {downloadedSongs.map((song) => (
              <div 
                key={song.id}
                onClick={() => addSong(song)}
                style={{ 
                  padding: '8px 10px', background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <img src={song.thumbnail} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700 }}>READY OFFLINE</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeDownloadedSong(song.id); deleteSong(song.id); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 14, cursor: 'pointer', padding: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff6584'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Remove Download"
                >✕</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--glass-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
              No tracks downloaded yet.<br/>
              Click <span style={{ color: 'var(--accent)', fontWeight: 700 }}>↓</span> on any song to save it!
            </div>
          </div>
        )}
      </div>

      {/* Recently Played History */}
      {recentSongs.length > 0 && (
        <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Recently Played
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
            {recentSongs.map((song) => (
              <div 
                key={song.id}
                onClick={() => addSong(song)}
                style={{ 
                  padding: '6px 10px', background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <img src={song.thumbnail} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                  {song.title}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeRecentSong(song.id); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 12, cursor: 'pointer', padding: '2px 4px', borderRadius: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff6584'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Section */}
      <div className="glass" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Queue · {playlist.length}
          </span>
          {playlist.length > 0 && (
            <button onClick={clearPlaylist} style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              padding: '4px 8px', borderRadius: '4px',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff6584'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              CLEAR ALL
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {playlist.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.3 }}>🎧</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Your queue is empty</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Search for a track to get started</div>
            </div>
          )}

          {playlist.map((song, i) => {
            const isActive = i === currentIndex;
            return (
              <div
                key={song.id}
                onClick={() => setCurrentIndex(i)}
                onMouseEnter={() => setHoveredId(song.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="fade-up"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: isActive ? 'var(--accent-soft)' : hoveredId === song.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isActive ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={song.thumbnail} alt="" style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover',
                  }} />
                  {isActive && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div className="spin" style={{ fontSize: 16 }}>◌</div>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: isActive ? 'var(--accent-2)' : 'white',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{song.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{fmt(song.duration)}</div>
                </div>

                <div style={{ display: 'flex', gap: 6, opacity: hoveredId === song.id ? 1 : 0.4 }}>
                  <DownloadBtn song={song} downloadedSongs={downloadedSongs} addDownloadedSong={addDownloadedSong} removeDownloadedSong={removeDownloadedSong} />
                  {hoveredId === song.id && (
                    <button onClick={e => { e.stopPropagation(); removeSong(song.id); }}
                      style={{
                        background: 'rgba(255,101,132,0.1)', border: 'none',
                        color: '#ff6584', cursor: 'pointer',
                        width: 28, height: 28, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ff6584'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,101,132,0.1)'; e.currentTarget.style.color = '#ff6584'; }}
                    >×</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isAiVibeOpen && <AIVibeSearch onClose={() => setIsAiVibeOpen(false)} />}
    </aside>
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
        border: 'none', color: 'white', cursor: 'pointer',
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, transition: 'all 0.2s',
      }}
      title={isDownloaded ? "Remove Offline" : "Download Offline"}
    >
      {downloading ? (
        <div className="spin" style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
      ) : isDownloaded ? (
        "✓"
      ) : (
        "↓"
      )}
    </button>
  );
}