import { useState } from 'react';
import Sidebar from './components/Sidebar';
import NowPlaying from './components/NowPlaying';
import PlayerBar from './components/PlayerBar';
import SearchModal from './components/SearchModal';
import AddUrlModal from './components/AddUrlModal';
import { usePlayer } from './hooks/usePlayer';
import { useStore } from './store/useStore';

export default function App() {
  const [showSearch, setShowSearch] = useState(false);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const player = usePlayer();
  const { playlist, currentIndex } = useStore();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', gap: 24, padding: 24, overflow: 'hidden', position: 'relative' }}>
        <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          onSearch={() => { setShowSearch(true); setIsSidebarOpen(false); }}
          onAddUrl={() => { setShowAddUrl(true); setIsSidebarOpen(false); }}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative', zIndex: 1 }}>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: 'fixed', top: 20, left: 20, zIndex: 100,
            background: 'var(--brand-gradient)', color: 'white',
            border: 'none', borderRadius: '50%', width: 44, height: 44,
            display: isSidebarOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-md)', cursor: 'pointer',
          }}
          className="show-mobile-only"
        >
          ☰
        </button>
        
        {/* Main Song Area Container */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <NowPlaying player={player} />
          
          {/* Play Buttons Bar - Centered ONLY in this Area */}
          <div className="player-bar-container" style={{ 
            position: 'absolute', 
            bottom: 32, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: 'calc(100% - 48px)',
            maxWidth: 1000,
            zIndex: 10
          }}>
            <div className="glass-2" style={{ borderRadius: 'var(--radius-lg)', padding: '0 12px', boxShadow: 'var(--shadow-lg)' }}>
              <PlayerBar player={player} />
            </div>
          </div>
        </div>
      </div>
      </div>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showAddUrl && <AddUrlModal onClose={() => setShowAddUrl(false)} />}
    </div>
  );
}