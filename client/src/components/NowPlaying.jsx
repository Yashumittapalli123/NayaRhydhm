import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import Visualizer from './Visualizer';
import LyricsPanel from './LyricsPanel';

function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Memoized Song Card ──────────────────────────────────────────────────────
const SongCard = React.memo(({ item, type, index, onSelect, hoveredCard, setHoveredCard }) => (
  <div
    onClick={() => onSelect(item, index)}
    onMouseEnter={() => setHoveredCard(`${type}-${index}`)}
    onMouseLeave={() => setHoveredCard(null)}
    className="song-card-glass"
    style={{
      animationDelay: `${index * 0.05}s`,
    }}
  >
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
      <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }} />
      {hoveredCard === `${type}-${index}` && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '8px', background: 'var(--accent)', borderRadius: '50%', color: 'white' }}>▶</div>
        </div>
      )}
    </div>
    <div style={{ minWidth: 0 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{item.title}</h4>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, margin: '4px 0 0' }}>YouTube · {fmt(item.duration)}</p>
    </div>
  </div>
));

// ── Centerpiece Section (Handles high-freq updates) ─────────────────────────
const Centerpiece = React.memo(({ 
  song, isPlaying, analyser, showLyrics, setShowLyrics, position, seek 
}) => {
  return (
    <section style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', marginBottom: showLyrics ? '0' : '60px', position: 'relative'
    }}>
      {/* Immersive Background */}
      {showLyrics && song && (
        <div className="fade-up" style={{
          position: 'fixed', inset: 0, zIndex: -1,
          backgroundImage: `url(${song.thumbnail})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(100px) saturate(2.8) brightness(0.6)',
          opacity: 0.9,
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'scale(1.1)',
        }} />
      )}

      {/* Decorative Atmosphere (Only when no lyrics) */}
      {!showLyrics && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '120%', height: '120%', background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
          opacity: isPlaying ? 0.3 : 0.1, zIndex: 0, transition: 'opacity 1s ease', pointerEvents: 'none',
        }} />
      )}

      {/* Visualizer Background */}
      {song && !showLyrics && (
        <div style={{ position: 'absolute', bottom: '20%', width: '100%', maxWidth: 800, opacity: isPlaying ? 1 : 0.2, transition: 'opacity 0.5s', zIndex: 0 }}>
          <Visualizer analyser={analyser} isPlaying={isPlaying} />
        </div>
      )}

      {song ? (
        <div className="fade-up" style={{ zIndex: 1, textAlign: 'center', width: '100%', maxWidth: 1000 }}>
          {!showLyrics ? (
            <>
              <div className="vinyl-wrapper" style={{ position: 'relative', margin: '0 auto 48px', width: 280, height: 280 }}>
                <div style={{
                  position: 'absolute', inset: -20, borderRadius: '50%',
                  background: 'var(--accent)', filter: 'blur(60px)',
                  opacity: isPlaying ? 0.25 : 0.1, transition: 'opacity 0.5s',
                }} />
                <div className={isPlaying ? "vinyl" : ""} style={{
                  width: '100%', height: '100%', position: 'relative',
                  borderRadius: '50%', overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg), 0 0 0 10px rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 2px, rgba(0,0,0,0.1) 3px)', opacity: 0.5 }} />
                </div>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 50, height: 50, borderRadius: '50%', background: 'rgba(0,0,0,0.8)',
                  border: '4px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                </div>
              </div>
              <h2 className="title-large" style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>{song.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 24 }}>YouTube Audio Stream</p>
            </>
          ) : (
            <div style={{ width: '100%' }}>
              <LyricsPanel position={position} seek={seek} song={song} />
            </div>
          )}

          <button 
            onClick={() => setShowLyrics(!showLyrics)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              color: showLyrics ? 'var(--accent)' : 'white',
              padding: '8px 24px',
              borderRadius: '24px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
              marginTop: 16,
            }}
          >
            {showLyrics ? 'Close Lyrics' : 'Show Lyrics'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', zIndex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎵</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Ready for Rhydhm</h2>
          <p style={{ fontSize: 14, marginTop: 8 }}>Select a track to start the experience.</p>
        </div>
      )}
    </section>
  );
});

// ── Main Page Component ───────────────────────────────────────────────────────
export default function NowPlaying({ player }) {
  const { analyser, isPlaying, loading, position, seek } = player;
  const { 
    playlist, currentIndex, recentSongs, 
    setCurrentIndex, addSong, fetchLyrics 
  } = useStore();
  
  const song = useMemo(() => playlist[currentIndex] || null, [playlist, currentIndex]);
  const [showLyrics, setShowLyrics] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (song && showLyrics) {
      fetchLyrics(song.title);
    }
  }, [song?.id, showLyrics, fetchLyrics]);

  const onSelectSong = (item, index) => {
    if (playlist.find(s => s.id === item.id)) {
       const idx = playlist.findIndex(s => s.id === item.id);
       if (idx !== -1) setCurrentIndex(idx);
    } else {
       addSong(item);
       const currentPlaylist = useStore.getState().playlist;
       const newIdx = currentPlaylist.findIndex(s => s.id === item.id);
       if (newIdx !== -1) setCurrentIndex(newIdx);
    }
  };

  return (
    <main className="glass" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      borderRadius: 'var(--radius-lg)',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        .song-card-item { animation: fadeIn 0.4s ease-out forwards; }
        .grid-section { position: relative; z-index: 10; padding: 24px 0; }
      `}</style>

      <div className="now-playing-scroll-area">
        
        <Centerpiece 
           song={song}
           isPlaying={isPlaying}
           analyser={analyser}
           showLyrics={showLyrics}
           setShowLyrics={setShowLyrics}
           position={position}
           seek={seek}
        />

        {/* Recently Played */}
        {recentSongs && recentSongs.length > 0 && (
          <section className="grid-section">
            <h3 className="text-gradient" style={{ fontSize: 20, fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 4, height: 20, background: 'var(--accent)', borderRadius: 2 }} />
              Recently Played
            </h3>
            <div className="responsive-grid">
              {recentSongs.slice(0, 6).map((item, i) => (
                <SongCard 
                  key={`recent-${item.id}`} 
                  item={item} 
                  type="recent" 
                  index={i} 
                  hoveredCard={hoveredCard}
                  setHoveredCard={setHoveredCard}
                  onSelect={onSelectSong}
                />
              ))}
            </div>
          </section>
        )}

        {/* Current Queue */}
        {playlist && playlist.length > 0 && (
          <section className="grid-section">
            <h3 className="text-gradient" style={{ fontSize: 20, fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 4, height: 20, background: 'var(--accent-2)', borderRadius: 2 }} />
              Queue Experience
            </h3>
            <div className="responsive-grid">
              {playlist.map((item, i) => (
                <SongCard 
                  key={`queue-${item.id}`} 
                  item={item} 
                  type="queue" 
                  index={i} 
                  hoveredCard={hoveredCard}
                  setHoveredCard={setHoveredCard}
                  onSelect={onSelectSong}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(2,2,5,0.6)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius-lg)', zIndex: 100,
        }}>
          <div className="spin" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--accent-soft)', borderTop: '4px solid var(--accent)' }} />
        </div>
      )}
    </main>
  );
}
