import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'

function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function ControlBtn({ children, active, onClick, title, size = 18, color = 'var(--text-secondary)', className = '' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? 'var(--accent)' : hovered ? 'white' : color,
        fontSize: size, padding: '8px', borderRadius: '50%',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}
      className={className}
    >
      {children}
      {active && (
        <span style={{
          position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
          width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent)',
        }} />
      )}
    </button>
  )
}

export default function PlayerBar({ player = {} }) {
  const { loading: isLoading, position, duration, playPause: togglePlay, seek, fastForward, rewind } = player || {};
  const { shuffle, loop, toggleShuffle, toggleLoop, nextSong, prevSong, playlist, currentIndex, volume, setVolume, isPlaying } = useStore();
  const [dragging, setDragging] = useState(false)
  const [dragVal, setDragVal] = useState(0)
  const progressRef = useRef()
  const song = playlist[currentIndex] || null;

  const displayPosition = dragging ? dragVal : position;
  const progress = duration > 0 ? displayPosition / duration : 0;

  const handleProgressClick = (e) => {
    if (!duration || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(ratio * duration)
  }

  return (
    <div className="player-bar-root" style={{
      height: 100,
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 20, flexShrink: 0,
      position: 'relative',
    }}>
      {/* Song Info (Pinned Left, Hidden on Mobile for better space) */}
      <div className="hide-mobile" style={{ width: 220, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {song ? (
          <>
            <img src={song.thumbnail} alt="" style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                {song.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>YouTube Music</div>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No track playing</div>
        )}
      </div>

      {/* Centre: Main Playback Controls (Always Centered) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        
        {/* Progress Bar Area */}
        <div style={{ width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right', fontWeight: 700, opacity: 0.8 }}>{fmt(position)}</span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer', position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${progress * 100}%`,
              borderRadius: 2,
              background: 'var(--brand-gradient)',
              boxShadow: '0 0 10px rgba(108, 99, 255, 0.4)',
              transition: dragging ? 'none' : 'width 0.3s linear',
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 28, fontWeight: 700, opacity: 0.8 }}>{fmt(duration)}</span>
        </div>

        {/* Buttons (Centred) */}
        <div className="player-controls" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ControlBtn active={shuffle} onClick={toggleShuffle} title="Shuffle" size={14}>⇄</ControlBtn>
          <ControlBtn onClick={rewind} title="Rewind 10s" size={14}>⏮</ControlBtn>
          
          <button
            onClick={togglePlay}
            disabled={!song || isLoading}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              border: 'none', cursor: song ? 'pointer' : 'default',
              background: 'var(--brand-gradient)',
              color: 'white', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(108, 99, 255, 0.4)',
              transition: 'all 0.2s',
              opacity: song ? 1 : 0.4,
            }}
            onMouseEnter={e => { if (song) e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isLoading
              ? <div className="spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff' }} />
              : isPlaying ? '⏸' : '▶'
            }
          </button>

          <ControlBtn onClick={fastForward} title="Forward 10s" size={14}>⏭</ControlBtn>
          <ControlBtn onClick={() => seek(0)} title="Restart" size={14}>↻</ControlBtn>
        </div>
      </div>

      {/* Right Column: Volume (Visible on Mobile) */}
      <div className="player-volume-section" style={{ width: 140, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 12, opacity: 0.6 }}>🔊</span>
        <div style={{ position: 'relative', width: 70, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
           <input
            type="range" min={0} max={1} step={0.01}
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              appearance: 'none', background: 'transparent', cursor: 'pointer', zIndex: 2,
            }}
          />
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%', 
            width: `${volume * 100}%`, background: 'white', borderRadius: 2,
            pointerEvents: 'none', opacity: 0.5,
          }} />
        </div>
      </div>
    </div>
  )
}
