import { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function LyricsPanel({ position = 0, seek = () => {}, song = null }) {
  const { syncedLyrics, lyrics, lyricsLoading } = useStore();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Determine active line based on current song position
  useEffect(() => {
    if (!syncedLyrics || syncedLyrics.length === 0) return;
    
    // Find the current line (the one where position is >= line.time and < nextLine.time)
    let idx = -1;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (position >= syncedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    
    if (idx !== activeIndex) {
      setActiveIndex(idx);
    }
  }, [position, syncedLyrics, activeIndex]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeIndex !== -1 && scrollRef.current) {
      const parent = scrollRef.current;
      const activeEl = parent.children[activeIndex];
      if (activeEl) {
        // Smooth scroll to center the active line
        const top = activeEl.offsetTop - parent.offsetHeight / 2 + activeEl.offsetHeight / 2;
        parent.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  if (lyricsLoading) {
    return (
      <div style={{ padding: '100px 20px', color: 'var(--text-muted)', textAlign: 'center' }}>
        <div className="spin" style={{ width: 40, height: 40, margin: '0 auto 20px', border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--accent)' }} />
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>SYNCING LYRICS...</div>
      </div>
    );
  }

  // Fallback to plain lyrics if no synced ones found
  if (!syncedLyrics && lyrics) {
    return (
      <div className="fade-up" style={{
        borderRadius: 'var(--radius-lg)',
        padding: '80px 40px',
        maxHeight: '550px',
        overflowY: 'auto',
        textAlign: 'center',
        lineHeight: '2.2',
        fontSize: '28px',
        fontWeight: 800,
        color: 'rgba(255,255,255,0.95)',
        whiteSpace: 'pre-line',
        fontFamily: 'var(--font-display)',
        maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
      }}>
        {lyrics}
      </div>
    );
  }

  if (!syncedLyrics) return (
     <div style={{ padding: '100px 20px', color: 'var(--text-muted)', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🚫</div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>LYRICS UNAVAILABLE</div>
      </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '70vh', overflow: 'hidden' }}>

      <div 
        ref={scrollRef}
        className="fade-up lyrics-container" 
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '240px 40px', // Large padding to keep one line in center
          textAlign: 'left', // Apple music is usually left-aligned for synced lyrics
          fontFamily: 'var(--font-display)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
          userSelect: 'none',
          maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
        }}
      >
        <style>{`
          .lyrics-container::-webkit-scrollbar { display: none; }
          .lyric-line:hover {
             color: white !important;
             transform: scale(1.02) !important;
             filter: blur(0) !important;
          }
        `}</style>
        {syncedLyrics.map((line, i) => {
          const isActive = activeIndex === i;
          const isPassed = activeIndex > i;
          const isUpcoming = activeIndex < i;
          
          return (
            <div
              key={i}
              onClick={() => seek(line.time)}
              className="lyric-line"
              style={{
                minHeight: '60px',
                padding: '16px 0',
                fontSize: isActive ? '38px' : '28px',
                fontWeight: 800,
                color: isActive ? 'white' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'left center',
                transform: isActive ? 'translateX(0) scale(1.05)' : 'translateX(-10px) scale(1)',
                filter: isActive ? 'blur(0)' : 'blur(1px)',
                opacity: Math.abs(activeIndex - i) > 5 ? 0 : 1, 
                cursor: 'pointer',
                lineHeight: '1.2',
                textShadow: isActive ? '0 0 20px rgba(255,255,255,0.2)' : 'none',
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
